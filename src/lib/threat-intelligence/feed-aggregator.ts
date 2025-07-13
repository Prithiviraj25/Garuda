import { db } from '@/db'
import { iocs, threatFeeds, alerts, threatCampaigns } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { AIThreatAnalyzer } from './ai-analyzer'

interface FeedConfig {
  name: string
  url: string
  type: 'json' | 'csv' | 'xml' | 'text'
  apiKey?: string
  format: 'otx' | 'misp' | 'csv' | 'json' | 'threatfox' | 'urlhaus' | 'abuse' | 'phishtank' | 'custom'
  category: 'community' | 'malware' | 'api' | 'osint' | 'vulnerability'
  updateInterval: number // minutes
  enabled: boolean
}

export class ThreatFeedAggregator {
  private static instance: ThreatFeedAggregator
  private aiAnalyzer: AIThreatAnalyzer
  
  // Comprehensive threat intelligence sources
  private feedConfigs: FeedConfig[] = [
    // Community & Open Threat Sharing Platforms
    {
      name: 'AlienVault OTX',
      url: 'https://otx.alienvault.com/api/v1/indicators/export',
      type: 'json',
      format: 'otx',
      category: 'community',
      updateInterval: 30,
      enabled: true
    },
    {
      name: 'ThreatFox (abuse.ch)',
      url: 'https://threatfox.abuse.ch/export/json/recent/',
      type: 'json',
      format: 'threatfox',
      category: 'community',
      updateInterval: 15,
      enabled: true
    },
    {
      name: 'OpenPhish',
      url: 'https://openphish.com/feed.txt',
      type: 'text',
      format: 'custom',
      category: 'community',
      updateInterval: 60,
      enabled: true
    },
    {
      name: 'CyberCrime Tracker',
      url: 'https://cybercrime-tracker.net/all.php',
      type: 'text',
      format: 'custom',
      category: 'community',
      updateInterval: 120,
      enabled: true
    },
    {
      name: 'Feodo Tracker',
      url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.txt',
      type: 'text',
      format: 'custom',
      category: 'community',
      updateInterval: 60,
      enabled: true
    },
    
    // Malware and URL Reputation Feeds
    {
      name: 'URLhaus',
      url: 'https://urlhaus.abuse.ch/downloads/json/',
      type: 'json',
      format: 'urlhaus',
      category: 'malware',
      updateInterval: 30,
      enabled: true
    },
    {
      name: 'MalwareBazaar',
      url: 'https://bazaar.abuse.ch/export/json/recent/',
      type: 'json',
      format: 'json',
      category: 'malware',
      updateInterval: 60,
      enabled: true
    },
    {
      name: 'PhishTank',
      url: 'https://data.phishtank.com/data/online-valid.json',
      type: 'json',
      format: 'phishtank',
      category: 'malware',
      updateInterval: 120,
      enabled: true
    },
    {
      name: 'Spamhaus DROP',
      url: 'https://www.spamhaus.org/drop/drop.txt',
      type: 'text',
      format: 'custom',
      category: 'malware',
      updateInterval: 240,
      enabled: true
    },
    {
      name: 'Spamhaus EDROP',
      url: 'https://www.spamhaus.org/drop/edrop.txt',
      type: 'text',
      format: 'custom',
      category: 'malware',
      updateInterval: 240,
      enabled: true
    },
    
    // API-Accessible Platforms (would need API keys)
    {
      name: 'AbuseIPDB',
      url: 'https://api.abuseipdb.com/api/v2/blacklist',
      type: 'json',
      format: 'abuse',
      category: 'api',
      updateInterval: 60,
      enabled: false, // Requires API key
      apiKey: process.env.ABUSEIPDB_API_KEY
    },
    {
      name: 'VirusTotal',
      url: 'https://www.virustotal.com/vtapi/v2/file/report',
      type: 'json',
      format: 'json',
      category: 'api',
      updateInterval: 120,
      enabled: false, // Requires API key
      apiKey: process.env.VIRUSTOTAL_API_KEY
    },
    {
      name: 'GreyNoise',
      url: 'https://api.greynoise.io/v3/community/timeline',
      type: 'json',
      format: 'json',
      category: 'api',
      updateInterval: 60,
      enabled: false, // Requires API key
      apiKey: process.env.GREYNOISE_API_KEY
    },
    
    // Vulnerability Feeds
    {
      name: 'NVD CVE Feed',
      url: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
      type: 'json',
      format: 'json',
      category: 'vulnerability',
      updateInterval: 360,
      enabled: true
    },
    {
      name: 'Exploit-DB',
      url: 'https://www.exploit-db.com/rss.xml',
      type: 'xml',
      format: 'custom',
      category: 'vulnerability',
      updateInterval: 180,
      enabled: true
    }
  ]

  private constructor() {
    this.aiAnalyzer = AIThreatAnalyzer.getInstance()
  }

  static getInstance(): ThreatFeedAggregator {
    if (!ThreatFeedAggregator.instance) {
      ThreatFeedAggregator.instance = new ThreatFeedAggregator()
    }
    return ThreatFeedAggregator.instance
  }

  async processFeed(feedConfig: FeedConfig): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = []
    let processed = 0

    try {
      console.log(`Processing feed: ${feedConfig.name}`)
      
      // Fetch feed data
      const headers: Record<string, string> = {
        'User-Agent': 'ThreatIntel-Aggregator/1.0'
      }
      
      if (feedConfig.apiKey) {
        headers['X-API-KEY'] = feedConfig.apiKey
      }

      const response = await fetch(feedConfig.url, {
        headers,
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      let data: any
      if (feedConfig.type === 'json') {
        data = await response.json()
      } else if (feedConfig.type === 'text') {
        data = await response.text()
      } else if (feedConfig.type === 'xml') {
        data = await response.text()
      }

      // Parse based on format
      const iocs = await this.parseData(data, feedConfig)
      
      // Process each IOC
      for (const ioc of iocs) {
        try {
          await this.storeIOC(ioc, feedConfig.name)
          processed++
        } catch (error) {
          errors.push(`Failed to store IOC ${ioc.value}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Update feed status
      await this.updateFeedStatus(feedConfig.name, true, new Date(), `Processed ${processed} IOCs`)

      return { success: true, processed, errors }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Feed processing failed: ${errorMessage}`)
      
      await this.updateFeedStatus(feedConfig.name, false, new Date(), errorMessage)
      
      return { success: false, processed, errors }
    }
  }

  private async parseData(data: any, feedConfig: FeedConfig): Promise<any[]> {
    const iocs: any[] = []

    switch (feedConfig.format) {
      case 'otx':
        // AlienVault OTX format
        if (data.results) {
          for (const result of data.results) {
            if (result.indicator) {
              iocs.push({
                value: result.indicator,
                type: this.mapOTXType(result.type),
                description: result.description || 'OTX Indicator',
                severity: 'medium',
                confidence: 75,
                tags: result.tags || [],
                firstSeen: result.created || new Date().toISOString(),
                lastSeen: result.modified || new Date().toISOString()
              })
            }
          }
        }
        break

      case 'threatfox':
        // ThreatFox format
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.ioc) {
              iocs.push({
                value: item.ioc,
                type: this.mapThreatFoxType(item.ioc_type),
                description: item.threat_type || 'ThreatFox IOC',
                severity: this.mapThreatFoxSeverity(item.confidence_level),
                confidence: item.confidence_level || 50,
                tags: item.tags || [],
                firstSeen: item.first_seen || new Date().toISOString(),
                lastSeen: item.last_seen || new Date().toISOString()
              })
            }
          }
        }
        break

      case 'urlhaus':
        // URLhaus format
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.url) {
              iocs.push({
                value: item.url,
                type: 'url',
                description: `URLhaus: ${item.threat || 'Malicious URL'}`,
                severity: item.threat === 'malware' ? 'high' : 'medium',
                confidence: 80,
                tags: item.tags || [],
                firstSeen: item.date_added || new Date().toISOString(),
                lastSeen: new Date().toISOString()
              })
            }
          }
        }
        break

      case 'phishtank':
        // PhishTank format
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.url) {
              iocs.push({
                value: item.url,
                type: 'url',
                description: 'PhishTank: Phishing URL',
                severity: 'high',
                confidence: item.verified === 'yes' ? 90 : 70,
                tags: ['phishing'],
                firstSeen: item.submission_time || new Date().toISOString(),
                lastSeen: new Date().toISOString()
              })
            }
          }
        }
        break

      case 'abuse':
        // AbuseIPDB format
        if (data.data && Array.isArray(data.data)) {
          for (const item of data.data) {
            if (item.ipAddress) {
              iocs.push({
                value: item.ipAddress,
                type: 'ip',
                description: `AbuseIPDB: ${item.usageType || 'Malicious IP'}`,
                severity: item.abuseConfidencePercentage >= 75 ? 'high' : 'medium',
                confidence: item.abuseConfidencePercentage || 50,
                tags: ['abuse'],
                firstSeen: item.lastReportedAt || new Date().toISOString(),
                lastSeen: new Date().toISOString()
              })
            }
          }
        }
        break

      case 'custom':
        // Custom text format parsing
        if (typeof data === 'string') {
          const lines = data.split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith(';')) {
              // Try to extract IOCs from the line
              const extractedIOCs = await this.extractIOCsFromLine(trimmed)
              iocs.push(...extractedIOCs)
            }
          }
        }
        break

      default:
        // Generic JSON parsing
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.ioc || item.indicator || item.value) {
              iocs.push({
                value: item.ioc || item.indicator || item.value,
                type: item.type || 'unknown',
                description: item.description || 'Generic IOC',
                severity: item.severity || 'medium',
                confidence: item.confidence || 50,
                tags: item.tags || [],
                firstSeen: item.firstSeen || new Date().toISOString(),
                lastSeen: item.lastSeen || new Date().toISOString()
              })
            }
          }
        }
        break
    }

    return iocs
  }

  private async extractIOCsFromLine(line: string): Promise<any[]> {
    const iocs: any[] = []
    
    // IP address regex
    const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g
    const ipMatches = line.match(ipRegex)
    if (ipMatches) {
      for (const ip of ipMatches) {
        iocs.push({
          value: ip,
          type: 'ip',
          description: 'Extracted IP from feed',
          severity: 'medium',
          confidence: 60,
          tags: ['extracted'],
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        })
      }
    }

    // Domain regex
    const domainRegex = /\b[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\b/g
    const domainMatches = line.match(domainRegex)
    if (domainMatches) {
      for (const domain of domainMatches) {
        if (this.isValidDomain(domain)) {
          iocs.push({
            value: domain,
            type: 'domain',
            description: 'Extracted domain from feed',
            severity: 'medium',
            confidence: 60,
            tags: ['extracted'],
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          })
        }
      }
    }

    // URL regex
    const urlRegex = /https?:\/\/[^\s]+/g
    const urlMatches = line.match(urlRegex)
    if (urlMatches) {
      for (const url of urlMatches) {
        iocs.push({
          value: url,
          type: 'url',
          description: 'Extracted URL from feed',
          severity: 'medium',
          confidence: 60,
          tags: ['extracted'],
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        })
      }
    }

    return iocs
  }

  private isValidDomain(domain: string): boolean {
    // Basic domain validation
    if (domain.length < 4 || domain.length > 253) return false
    if (domain.includes('..')) return false
    if (domain.startsWith('.') || domain.endsWith('.')) return false
    
    // Check for valid TLD
    const validTLDs = [
      'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name', 'pro',
      'museum', 'coop', 'aero', 'xxx', 'travel', 'tel', 'mobi', 'asia', 'cat', 'jobs',
      'post', 'eu', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'ru', 'br', 'in',
      'it', 'es', 'mx', 'nl', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'at', 'ch', 'be',
      'pt', 'gr', 'hu', 'ro', 'bg', 'hr', 'sk', 'si', 'lt', 'lv', 'ee', 'ie', 'lu',
      'mt', 'cy', 'is', 'li', 'mc', 'sm', 'va', 'ad', 'gi', 'im', 'je', 'gg', 'fo',
      'gl', 'pm', 'wf', 'yt', 'nc', 'pf', 'tf', 're', 'mq', 'gp', 'bl', 'mf', 'gf',
      'sr', 'gy', 've', 'co', 'pe', 'ec', 'bo', 'py', 'uy', 'cl', 'ar', 'fk', 'gs'
    ]
    
    const parts = domain.split('.')
    const tld = parts[parts.length - 1].toLowerCase()
    
    return validTLDs.includes(tld)
  }

  private mapOTXType(type: string): string {
    const mapping: Record<string, string> = {
      'IPv4': 'ip',
      'IPv6': 'ip',
      'domain': 'domain',
      'hostname': 'domain',
      'URL': 'url',
      'FileHash-MD5': 'hash',
      'FileHash-SHA1': 'hash',
      'FileHash-SHA256': 'hash',
      'email': 'email'
    }
    return mapping[type] || 'unknown'
  }

  private mapThreatFoxType(type: string): string {
    const mapping: Record<string, string> = {
      'ip:port': 'ip',
      'domain': 'domain',
      'url': 'url',
      'md5_hash': 'hash',
      'sha1_hash': 'hash',
      'sha256_hash': 'hash'
    }
    return mapping[type] || 'unknown'
  }

  private mapThreatFoxSeverity(confidence: number): string {
    if (confidence >= 75) return 'high'
    if (confidence >= 50) return 'medium'
    return 'low'
  }

  private async storeIOC(ioc: any, source: string): Promise<void> {
    try {
      // Validate IOC before storing
      if (!this.validateIOC(ioc)) {
        throw new Error(`Invalid IOC: ${ioc.value}`)
      }

      // Check if IOC already exists
      const existing = await db
        .select()
        .from(iocs)
        .where(eq(iocs.value, ioc.value))
        .limit(1)

      if (existing.length > 0) {
        // Update existing IOC
        await db
          .update(iocs)
          .set({
            lastSeen: new Date(),
            sources: [...new Set([...existing[0].sources, source])],
            confidence: Math.max(parseFloat(existing[0].confidence), ioc.confidence).toFixed(2)
          })
          .where(eq(iocs.id, existing[0].id))
      } else {
        // Insert new IOC
        await db.insert(iocs).values({
          type: ioc.type,
          value: ioc.value,
          description: ioc.description,
          severity: ioc.severity,
          confidence: ioc.confidence.toFixed(2),
          sources: [source],
          firstSeen: new Date(ioc.firstSeen),
          lastSeen: new Date(ioc.lastSeen),
          tags: ioc.tags,
          metadata: {}
        })
      }
    } catch (error) {
      console.error('Failed to store IOC:', error)
      throw error
    }
  }

  private validateIOC(ioc: any): boolean {
    if (!ioc.value || !ioc.type) return false
    
    // Type-specific validation
    switch (ioc.type) {
      case 'ip':
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ioc.value)
      case 'domain':
        return this.isValidDomain(ioc.value)
      case 'url':
        try {
          new URL(ioc.value)
          return true
        } catch {
          return false
        }
      case 'hash':
        return /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$|^[a-fA-F0-9]{128}$/.test(ioc.value)
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ioc.value)
      default:
        return true
    }
  }

  private async updateFeedStatus(name: string, isActive: boolean, lastUpdate: Date, message: string): Promise<void> {
    try {
      const existing = await db
        .select()
        .from(threatFeeds)
        .where(eq(threatFeeds.name, name))
        .limit(1)

      if (existing.length > 0) {
        await db
          .update(threatFeeds)
          .set({
            isActive,
            lastSync: lastUpdate
          })
          .where(eq(threatFeeds.id, existing[0].id))
      } else {
        await db.insert(threatFeeds).values({
          name,
          url: this.feedConfigs.find(f => f.name === name)?.url || '',
          type: 'custom',
          isActive,
          lastSync: lastUpdate,
          syncInterval: 3600,
          config: { message }
        })
      }
    } catch (error) {
      console.error('Failed to update feed status:', error)
    }
  }

  async processAllFeeds(): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = []
    
    for (const feedConfig of this.feedConfigs.filter(f => f.enabled)) {
      try {
        const result = await this.processFeed(feedConfig)
        results.push({
          feed: feedConfig.name,
          category: feedConfig.category,
          ...result
        })
      } catch (error) {
        results.push({
          feed: feedConfig.name,
          category: feedConfig.category,
          success: false,
          processed: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0)
    
    console.log(`Feed processing complete: ${successCount}/${results.length} feeds successful, ${totalProcessed} IOCs processed`)
    
    return {
      success: successCount > 0,
      results
    }
  }

  getFeedConfigs(): FeedConfig[] {
    return this.feedConfigs
  }

  async enableFeed(name: string): Promise<void> {
    const feed = this.feedConfigs.find(f => f.name === name)
    if (feed) {
      feed.enabled = true
    }
  }

  async disableFeed(name: string): Promise<void> {
    const feed = this.feedConfigs.find(f => f.name === name)
    if (feed) {
      feed.enabled = false
    }
  }
} 