import cron from 'node-cron'
import axios from 'axios'
import { db } from '@/db'
import { threatFeeds, iocs, alerts, feedData, threatCampaigns } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { AIThreatAnalyzer } from './ai-analyzer'
import { Web2MDThreatIntelService } from './web2md-service'
import { OSINTCollector } from './osint-collector'
import { ThreatFeedAggregator } from './feed-aggregator'

export class RealTimeThreatProcessor {
  private static instance: RealTimeThreatProcessor
  private isRunning = false
  private aiAnalyzer: AIThreatAnalyzer
  private webService: Web2MDThreatIntelService
  private osintCollector: OSINTCollector
  private feedAggregator: ThreatFeedAggregator

  private constructor() {
    this.aiAnalyzer = AIThreatAnalyzer.getInstance()
    this.webService = Web2MDThreatIntelService.getInstance()
    this.osintCollector = OSINTCollector.getInstance()
    this.feedAggregator = ThreatFeedAggregator.getInstance()
  }

  static getInstance(): RealTimeThreatProcessor {
    if (!RealTimeThreatProcessor.instance) {
      RealTimeThreatProcessor.instance = new RealTimeThreatProcessor()
    }
    return RealTimeThreatProcessor.instance
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true

    console.log('🚀 Starting Real-Time Threat Intelligence Processor')

    // Process feeds every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.processThreatFeeds()
    })

    // Scrape web sources every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.processWebSources()
    })

    // Collect OSINT data every 45 minutes
    cron.schedule('*/45 * * * *', async () => {
      await this.processOSINTSources()
    })

    // Generate executive summaries every hour
    cron.schedule('0 * * * *', async () => {
      await this.generateExecutiveSummary()
    })

    // Correlate threats every 2 hours
    cron.schedule('0 */2 * * *', async () => {
      await this.correlateThreatData()
    })

    console.log('✅ Real-Time Threat Processor Started')
  }

  stop() {
    this.isRunning = false
    console.log('🛑 Real-Time Threat Processor Stopped')
  }

  private async processThreatFeeds() {
    try {
      console.log('🔍 Processing threat feeds...')
      
      // Use the comprehensive feed aggregator
      const result = await this.feedAggregator.processAllFeeds()
      
      if (result.success) {
        console.log(`✅ Feed processing completed: ${result.results.length} feeds processed`)
      } else {
        console.log('⚠️ Feed processing completed with errors')
      }
    } catch (error) {
      console.error('Error processing threat feeds:', error)
    }
  }

  private async processSingleFeed(feed: any) {
    try {
      console.log(`📡 Processing feed: ${feed.name}`)

      let feedContent = null

      switch (feed.type) {
        case 'urlhaus':
          feedContent = await this.fetchURLhausFeed()
          break
        case 'custom':
          feedContent = await this.fetchCustomFeed(feed.url)
          break
        default:
          console.log(`Feed type ${feed.type} not implemented`)
          return
      }

      if (!feedContent) return

      // Use AI to parse and analyze the feed
      const analysis = await this.aiAnalyzer.parseSecurityFeed(
        JSON.stringify(feedContent), 
        feed.type
      )

      // Store the analysis
      await this.storeFeedAnalysis(feed, feedContent, analysis)

      // Update feed last sync time
      await db
        .update(threatFeeds)
        .set({ lastSync: new Date() })
        .where(eq(threatFeeds.id, feed.id))

      console.log(`✅ Processed ${feed.name}: ${(analysis as any).iocs?.length || 0} IOCs, ${(analysis as any).threats?.length || 0} threats`)

    } catch (error) {
      console.error(`Error processing feed ${feed.name}:`, error)
    }
  }

  private async fetchURLhausFeed() {
    try {
      const response = await axios.post('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
        format: 'json'
      }, { timeout: 30000 })

      return response.data
    } catch (error) {
      console.error('URLhaus API error:', error)
      return null
    }
  }

  private async fetchCustomFeed(url: string) {
    try {
      const response = await axios.get(url, { timeout: 30000 })
      return response.data
    } catch (error) {
      console.error(`Custom feed error for ${url}:`, error)
      return null
    }
  }

  private async storeFeedAnalysis(feed: any, rawData: any, analysis: any) {
    try {
      // Store raw feed data
      await db.insert(feedData).values({
        feedId: feed.id,
        rawData,
        extractedIocs: analysis.iocs?.map((ioc: any) => ioc.value) || [],
        aiSummary: analysis.summary || 'No summary available',
        confidence: analysis.feedQuality?.toString() || '0.5'
      })

      // Store IOCs
      for (const ioc of analysis.iocs || []) {
        await this.storeIOC(ioc, feed.name)
      }

      // Store threats as campaigns
      for (const threat of analysis.threats || []) {
        await this.storeThreatCampaign(threat, feed.name)
      }

      // Generate alerts for high-severity threats
      await this.generateAlertsFromAnalysis(analysis, feed.name)

    } catch (error) {
      console.error('Error storing feed analysis:', error)
    }
  }

  private async storeIOC(ioc: any, source: string) {
    try {
      // Check if IOC already exists
      const existing = await db
        .select()
        .from(iocs)
        .where(eq(iocs.value, ioc.value))
        .limit(1)

      const now = new Date()

      if (existing.length > 0) {
        // Update existing IOC
        await db
          .update(iocs)
          .set({
            lastSeen: now,
            confidence: ioc.confidence?.toString() || '0.5',
            updatedAt: now
          })
          .where(eq(iocs.id, existing[0].id))
      } else {
        // Create new IOC
        await db.insert(iocs).values({
          type: ioc.type,
          value: ioc.value,
          description: ioc.description || `Detected from ${source}`,
          confidence: ioc.confidence?.toString() || '0.5',
          severity: 'medium',
          tags: ['automated', 'feed-analysis'],
          sources: [source],
          firstSeen: now,
          lastSeen: now,
          metadata: { source, automated: true },
          isActive: true
        })
      }
    } catch (error) {
      console.error('Error storing IOC:', error)
    }
  }

  private async storeThreatCampaign(threat: any, source: string) {
    try {
      await db.insert(threatCampaigns).values({
        name: threat.name,
        description: threat.description,
        actor: threat.actor,
        family: threat.family,
        severity: threat.severity,
        confidence: threat.confidence?.toString() || '0.5',
        status: 'active',
        firstSeen: new Date(),
        lastSeen: new Date(),
        techniques: threat.techniques || [],
        targetSectors: threat.targetSectors || [],
        metadata: { source, automated: true }
      })
    } catch (error) {
      console.error('Error storing threat campaign:', error)
    }
  }

  private async generateAlertsFromAnalysis(analysis: any, source: string) {
    try {
      const highSeverityThreats = analysis.threats?.filter((t: any) => 
        t.severity === 'critical' || t.severity === 'high'
      ) || []

      for (const threat of highSeverityThreats) {
        await db.insert(alerts).values({
          title: `${threat.severity.toUpperCase()}: ${threat.name}`,
          description: `${threat.description} - Detected from ${source}`,
          severity: threat.severity,
          type: 'campaign_detected',
          sourceType: 'feed',
          relatedIocs: analysis.iocs?.map((ioc: any) => ioc.value) || [],
          metadata: {
            source,
            confidence: threat.confidence || 0.5,
            automated: true,
            analysisTime: new Date().toISOString()
          },
          status: 'open',
          priority: threat.severity === 'critical' ? 1 : 2
        })
      }
    } catch (error) {
      console.error('Error generating alerts:', error)
    }
  }

  private async processWebSources() {
    try {
      console.log('🌐 Processing web intelligence sources...')
      await this.webService.scrapeAllSources()
    } catch (error) {
      console.error('Error processing web sources:', error)
    }
  }

  private async processOSINTSources() {
    try {
      console.log('🔍 Collecting OSINT data...')
      const result = await this.osintCollector.collectFromAllSources()
      
      if (result.success) {
        console.log(`✅ OSINT collection completed: ${result.results.length} sources processed`)
      } else {
        console.log('⚠️ OSINT collection completed with errors')
      }
    } catch (error) {
      console.error('Error processing OSINT sources:', error)
    }
  }

  private async generateExecutiveSummary() {
    try {
      console.log('📊 Generating executive threat summary...')

      // Get recent alerts
      const recentAlerts = await db
        .select()
        .from(alerts)
        .limit(20)

      if (recentAlerts.length === 0) return

      // Generate AI-powered summary
      const summary = await this.aiAnalyzer.generateThreatSummary(recentAlerts)

      // Store summary as a special alert
      await db.insert(alerts).values({
        title: 'Executive Threat Intelligence Summary',
        description: summary,
        severity: 'medium',
        type: 'custom',
        sourceType: 'ai',
        metadata: {
          type: 'executive-summary',
          alertCount: recentAlerts.length,
          generatedAt: new Date().toISOString()
        },
        status: 'open',
        priority: 3
      })

      console.log('✅ Executive summary generated')
    } catch (error) {
      console.error('Error generating executive summary:', error)
    }
  }

  private async correlateThreatData() {
    try {
      console.log('🔗 Correlating threat data...')

      // Get recent threats
      const recentThreats = await db
        .select()
        .from(threatCampaigns)
        .limit(10)

      if (recentThreats.length < 2) return

      // This would use AI to correlate threats, but for now we'll skip
      // to avoid complex implementation
      console.log('✅ Threat correlation completed (placeholder)')
    } catch (error) {
      console.error('Error correlating threats:', error)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Manual trigger methods for testing
  async manualFeedProcessing() {
    await this.processThreatFeeds()
  }

  async manualWebScraping() {
    await this.processWebSources()
  }

  async manualSummaryGeneration() {
    await this.generateExecutiveSummary()
  }
} 