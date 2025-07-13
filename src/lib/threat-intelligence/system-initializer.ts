import { db } from '@/db'
import { threatFeeds, iocs, alerts, threatCampaigns } from '@/db/schema'
import { ThreatFeedAggregator } from './feed-aggregator'
import { RealTimeThreatProcessor } from './real-time-processor'
import { AIThreatAnalyzer } from './ai-analyzer'

export class ThreatIntelligenceSystemInitializer {
  private static instance: ThreatIntelligenceSystemInitializer
  private feedAggregator: ThreatFeedAggregator
  private processor: RealTimeThreatProcessor
  private aiAnalyzer: AIThreatAnalyzer

  private constructor() {
    this.feedAggregator = ThreatFeedAggregator.getInstance()
    this.processor = RealTimeThreatProcessor.getInstance()
    this.aiAnalyzer = AIThreatAnalyzer.getInstance()
  }

  static getInstance(): ThreatIntelligenceSystemInitializer {
    if (!ThreatIntelligenceSystemInitializer.instance) {
      ThreatIntelligenceSystemInitializer.instance = new ThreatIntelligenceSystemInitializer()
    }
    return ThreatIntelligenceSystemInitializer.instance
  }

  async initializeSystem(): Promise<{ success: boolean; message: string; data: any }> {
    try {
      console.log('🚀 Initializing Threat Intelligence System...')
      
      // Step 1: Initialize database with seed data
      await this.initializeDatabaseWithSeedData()
      
      // Step 2: Process feeds to get real data
      console.log('📡 Processing threat intelligence feeds...')
      const feedResult = await this.feedAggregator.processAllFeeds()
      
      // Step 3: Generate sample alerts and campaigns
      await this.generateSampleAlertsAndCampaigns()
      
      // Step 4: Start real-time processor
      console.log('⚡ Starting real-time processor...')
      this.processor.start()
      
      // Step 5: Get final counts
      const finalCounts = await this.getDatabaseCounts()
      
      console.log('✅ System initialization complete!')
      
      return {
        success: true,
        message: 'Threat Intelligence System initialized successfully',
        data: {
          ...finalCounts,
          feedsProcessed: feedResult.results.length,
          processingStarted: true,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('❌ System initialization failed:', error)
      return {
        success: false,
        message: 'System initialization failed',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  private async initializeDatabaseWithSeedData(): Promise<void> {
    console.log('🌱 Seeding database with initial data...')
    
    // Create initial threat feeds
    const initialFeeds = [
      {
        name: 'URLhaus Malware URLs',
        type: 'urlhaus' as const,
        url: 'https://urlhaus-api.abuse.ch/v1/urls/recent/',
        isActive: true,
        syncInterval: 3600,
        config: { format: 'json', limit: 100 }
      },
      {
        name: 'Malware Bazaar',
        type: 'custom' as const,
        url: 'https://bazaar.abuse.ch/api/v1/',
        isActive: true,
        syncInterval: 3600,
        config: { query: 'get_recent', limit: 100 }
      },
      {
        name: 'Phishing Database',
        type: 'custom' as const,
        url: 'https://phishing.army/download/phishing_army_blocklist.txt',
        isActive: true,
        syncInterval: 14400,
        config: { format: 'txt' }
      },
      {
        name: 'Emerging Threats',
        type: 'custom' as const,
        url: 'https://rules.emergingthreats.net/blockrules/compromised-ips.txt',
        isActive: true,
        syncInterval: 7200,
        config: { format: 'txt' }
      },
      {
        name: 'Feodo Tracker',
        type: 'custom' as const,
        url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.csv',
        isActive: true,
        syncInterval: 3600,
        config: { format: 'csv' }
      }
    ]

    // Insert feeds
    for (const feed of initialFeeds) {
      try {
        await db.insert(threatFeeds).values({
          ...feed,
          lastSync: new Date(),
          apiKey: ''
        }).onConflictDoNothing()
      } catch (error) {
        console.error(`Failed to insert feed ${feed.name}:`, error)
      }
    }

    // Create sample IOCs to populate the map
    const sampleIOCs = [
      // Malicious IPs from different countries
      { value: '185.220.101.32', type: 'ip', country: 'Germany', threat: 'Botnet C2' },
      { value: '45.142.214.48', type: 'ip', country: 'Netherlands', threat: 'Malware Distribution' },
      { value: '103.224.182.245', type: 'ip', country: 'India', threat: 'Phishing Campaign' },
      { value: '198.98.51.189', type: 'ip', country: 'United States', threat: 'Ransomware C2' },
      { value: '91.240.118.172', type: 'ip', country: 'Russia', threat: 'APT Infrastructure' },
      { value: '194.147.85.214', type: 'ip', country: 'France', threat: 'Banking Trojan' },
      { value: '37.139.129.148', type: 'ip', country: 'United Kingdom', threat: 'Cryptomining' },
      { value: '119.28.139.120', type: 'ip', country: 'China', threat: 'Data Exfiltration' },
      { value: '177.54.144.89', type: 'ip', country: 'Brazil', threat: 'Credential Theft' },
      { value: '202.131.246.102', type: 'ip', country: 'Japan', threat: 'Backdoor Access' },
      
      // Malicious domains
      { value: 'malicious-banking-site.com', type: 'domain', threat: 'Banking Phishing' },
      { value: 'fake-microsoft-login.net', type: 'domain', threat: 'Credential Harvesting' },
      { value: 'crypto-stealer-payload.org', type: 'domain', threat: 'Cryptocurrency Theft' },
      { value: 'ransomware-payment-portal.biz', type: 'domain', threat: 'Ransomware Payment' },
      { value: 'corporate-email-phish.info', type: 'domain', threat: 'Business Email Compromise' },
      
      // Malicious URLs
      { value: 'https://suspicious-download.com/malware.exe', type: 'url', threat: 'Malware Download' },
      { value: 'https://fake-bank-login.net/secure/login.php', type: 'url', threat: 'Banking Phishing' },
      { value: 'https://crypto-wallet-stealer.org/wallet.html', type: 'url', threat: 'Crypto Theft' },
      
      // File hashes
      { value: 'a1b2c3d4e5f6789012345678901234567890abcd', type: 'hash', threat: 'Trojan Executable' },
      { value: 'f9e8d7c6b5a4930281746352819048576473829d', type: 'hash', threat: 'Ransomware Binary' },
      { value: '1234567890abcdef1234567890abcdef12345678', type: 'hash', threat: 'Backdoor Payload' }
    ]

    // Insert sample IOCs
    for (const ioc of sampleIOCs) {
      try {
        await db.insert(iocs).values({
          type: ioc.type as any,
          value: ioc.value,
          description: `${ioc.threat} - Detected from threat intelligence feeds`,
          severity: this.getRandomSeverity(),
          confidence: (Math.random() * 40 + 60).toFixed(2), // 60-100% confidence
          sources: ['Initial Seed Data'],
          firstSeen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          lastSeen: new Date(),
          tags: [ioc.threat.toLowerCase().replace(/\s+/g, '-'), 'seed-data'],
          metadata: { 
            country: (ioc as any).country || 'Unknown',
            threatType: ioc.threat,
            automated: false
          }
        }).onConflictDoNothing()
      } catch (error) {
        console.error(`Failed to insert IOC ${ioc.value}:`, error)
      }
    }
  }

  private async generateSampleAlertsAndCampaigns(): Promise<void> {
    console.log('🚨 Generating sample alerts and campaigns...')
    
    // Sample alerts
    const sampleAlerts = [
      {
        title: 'Critical: Banking Trojan Campaign Detected',
        description: 'Multiple IOCs associated with a sophisticated banking trojan campaign targeting financial institutions. Immediate action required.',
        severity: 'critical' as const,
        type: 'campaign_detected' as const,
        status: 'open' as const,
        priority: 1,
        relatedIocs: ['malicious-banking-site.com', '185.220.101.32'],
        sourceType: 'ai' as const,
        metadata: {
          campaign: 'Banking Trojan Q4 2024',
          affectedSectors: ['Financial Services', 'Banking'],
          confidence: 95
        }
      },
      {
        title: 'High: Ransomware Infrastructure Expansion',
        description: 'New ransomware C2 servers identified. Proactive blocking recommended.',
        severity: 'high' as const,
        type: 'campaign_detected' as const,
        status: 'investigating' as const,
        priority: 2,
        relatedIocs: ['198.98.51.189', 'ransomware-payment-portal.biz'],
        sourceType: 'ai' as const,
        metadata: {
          campaign: 'RansomX Campaign',
          techniques: ['T1486', 'T1027', 'T1041'],
          confidence: 87
        }
      },
      {
        title: 'Medium: Phishing Campaign Targeting Employees',
        description: 'Credential harvesting campaign detected targeting corporate employees.',
        severity: 'medium' as const,
        type: 'ioc_detected' as const,
        status: 'open' as const,
        priority: 3,
        relatedIocs: ['fake-microsoft-login.net', 'corporate-email-phish.info'],
        sourceType: 'ai' as const,
        metadata: {
          campaign: 'Corporate Phishing Wave',
          targetedSectors: ['Technology', 'Healthcare'],
          confidence: 78
        }
      },
      {
        title: 'High: APT Infrastructure Identified',
        description: 'Advanced Persistent Threat infrastructure detected with links to state-sponsored actors.',
        severity: 'high' as const,
        type: 'anomaly' as const,
        status: 'investigating' as const,
        priority: 2,
        relatedIocs: ['91.240.118.172', '119.28.139.120'],
        sourceType: 'ai' as const,
        metadata: {
          campaign: 'APT-X Infrastructure',
          actor: 'State-sponsored',
          techniques: ['T1071', 'T1055', 'T1082'],
          confidence: 92
        }
      }
    ]

    // Insert alerts
    for (const alert of sampleAlerts) {
      try {
        await db.insert(alerts).values(alert).onConflictDoNothing()
      } catch (error) {
        console.error(`Failed to insert alert ${alert.title}:`, error)
      }
    }

    // Sample threat campaigns
    const sampleCampaigns = [
      {
        name: 'Banking Trojan Q4 2024',
        description: 'Sophisticated banking trojan campaign targeting financial institutions worldwide',
        actor: 'FIN7',
        family: 'Banking Trojan',
        severity: 'critical' as const,
        confidence: '95.00',
        status: 'active' as const,
        techniques: ['T1566.001', 'T1055', 'T1027', 'T1041'],
        targetSectors: ['Financial Services', 'Banking', 'Credit Unions'],
        metadata: {
          firstObserved: '2024-10-15',
          lastActivity: new Date().toISOString(),
          affectedCountries: ['US', 'UK', 'DE', 'FR', 'CA']
        }
      },
      {
        name: 'RansomX Campaign',
        description: 'Ransomware-as-a-Service operation with advanced evasion techniques',
        actor: 'RansomX Group',
        family: 'Ransomware',
        severity: 'high' as const,
        confidence: '87.00',
        status: 'active' as const,
        techniques: ['T1486', 'T1027', 'T1041', 'T1082'],
        targetSectors: ['Healthcare', 'Manufacturing', 'Education'],
        metadata: {
          firstObserved: '2024-11-01',
          lastActivity: new Date().toISOString(),
          ransomDemand: '$50,000 - $2,000,000'
        }
      },
      {
        name: 'Corporate Phishing Wave',
        description: 'Large-scale phishing campaign targeting corporate credentials',
        actor: 'Unknown',
        family: 'Phishing',
        severity: 'medium' as const,
        confidence: '78.00',
        status: 'active' as const,
        techniques: ['T1566.002', 'T1552.001', 'T1078'],
        targetSectors: ['Technology', 'Healthcare', 'Finance'],
        metadata: {
          firstObserved: '2024-11-20',
          lastActivity: new Date().toISOString(),
          emailsSent: '500,000+'
        }
      }
    ]

    // Insert campaigns
    for (const campaign of sampleCampaigns) {
      try {
        await db.insert(threatCampaigns).values({
          ...campaign,
          firstSeen: new Date(campaign.metadata.firstObserved),
          lastSeen: new Date()
        }).onConflictDoNothing()
      } catch (error) {
        console.error(`Failed to insert campaign ${campaign.name}:`, error)
      }
    }
  }

  private getRandomSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const severities = ['low', 'medium', 'high', 'critical'] as const
    const weights = [0.1, 0.3, 0.4, 0.2] // More medium/high, fewer critical/low
    const random = Math.random()
    let cumulative = 0
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]
      if (random <= cumulative) {
        return severities[i]
      }
    }
    
    return 'medium'
  }

  private async getDatabaseCounts(): Promise<any> {
    const [iocsCount, alertsCount, campaignsCount, feedsCount] = await Promise.all([
      db.select().from(iocs).then(results => results.length),
      db.select().from(alerts).then(results => results.length),
      db.select().from(threatCampaigns).then(results => results.length),
      db.select().from(threatFeeds).then(results => results.length)
    ])

    return {
      iocs: iocsCount,
      alerts: alertsCount,
      campaigns: campaignsCount,
      feeds: feedsCount
    }
  }

  async forceReinitialize(): Promise<{ success: boolean; message: string; data: any }> {
    try {
      console.log('🔄 Force reinitializing system...')
      
      // Clear existing data
      await db.delete(iocs)
      await db.delete(alerts)
      await db.delete(threatCampaigns)
      await db.delete(threatFeeds)
      
      // Reinitialize
      return await this.initializeSystem()
    } catch (error) {
      console.error('❌ Force reinitialization failed:', error)
      return {
        success: false,
        message: 'Force reinitialization failed',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
} 