import axios from 'axios'
import { db } from '@/db'
import { iocs, alerts, threatCampaigns, feedData } from '@/db/schema'
import { AIThreatAnalyzer } from './ai-analyzer'

interface Web2MDResponse {
  markdown: string
  title: string
}

interface ThreatIntelSource {
  name: string
  url: string
  selector?: string
  type: 'blog' | 'feed' | 'report'
}

const THREAT_INTEL_SOURCES: ThreatIntelSource[] = [
  {
    name: 'Krebs on Security',
    url: 'https://krebsonsecurity.com',
    type: 'blog'
  },
  {
    name: 'Bleeping Computer',
    url: 'https://www.bleepingcomputer.com/news/security/',
    type: 'blog'
  },
  {
    name: 'The Hacker News',
    url: 'https://thehackernews.com',
    type: 'blog'
  },
  {
    name: 'Threat Post',
    url: 'https://threatpost.com',
    type: 'blog'
  },
  {
    name: 'SANS Internet Storm Center',
    url: 'https://isc.sans.edu',
    type: 'feed'
  }
]

export class Web2MDThreatIntelService {
  private static instance: Web2MDThreatIntelService
  private apiBaseUrl = 'https://www.web2md.site/api'

  static getInstance(): Web2MDThreatIntelService {
    if (!Web2MDThreatIntelService.instance) {
      Web2MDThreatIntelService.instance = new Web2MDThreatIntelService()
    }
    return Web2MDThreatIntelService.instance
  }

  async scrapeAllSources(): Promise<void> {
    console.log('Starting threat intelligence scraping from web sources...')
    
    for (const source of THREAT_INTEL_SOURCES) {
      try {
        await this.scrapeSource(source)
        await this.sleep(2000) // Be respectful with requests
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error)
      }
    }
  }

  private async scrapeSource(source: ThreatIntelSource): Promise<void> {
    console.log(`Scraping ${source.name}...`)

    // First, get the main page content
    const mainContent = await this.convertToMarkdown(source.url)
    if (!mainContent) return

    // Extract links to recent articles
    const articleUrls = await this.extractArticleUrls(source.url)
    
    // Process recent articles
    for (const articleUrl of articleUrls.slice(0, 5)) { // Limit to 5 recent articles
      try {
        await this.processArticle(articleUrl, source)
        await this.sleep(1000)
      } catch (error) {
        console.error(`Error processing article ${articleUrl}:`, error)
      }
    }
  }

  private async convertToMarkdown(url: string): Promise<Web2MDResponse | null> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/convert`, {
        url,
        options: {
          includeTitle: true,
          includeLinks: true,
          improveReadability: true
        }
      }, {
        timeout: 30000
      })

      return response.data
    } catch (error) {
      console.error(`Web2MD conversion error for ${url}:`, error)
      return null
    }
  }

  private async extractArticleUrls(baseUrl: string): Promise<string[]> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/crawler`, {
        url: baseUrl,
        options: {
          maxUrls: 20,
          sameDomain: true,
          timeout: 5000,
          delay: 1000
        }
      }, {
        timeout: 30000
      })

      return response.data.urls || []
    } catch (error) {
      console.error(`Crawler error for ${baseUrl}:`, error)
      return []
    }
  }

  private async processArticle(url: string, source: ThreatIntelSource): Promise<void> {
    const content = await this.convertToMarkdown(url)
    if (!content) return

    // Analyze content for threat intelligence
    const analysis = await this.analyzeContent(content.markdown, content.title)
    
    if (analysis.hasThreats) {
      // Store the processed data
      await this.storeAnalysis(url, source, content, analysis)
    }
  }

  private async analyzeContent(markdown: string, title: string) {
    try {
      const aiAnalyzer = AIThreatAnalyzer.getInstance()
      
      if (!aiAnalyzer.isConfigured()) {
        // Fallback to regex-based analysis if AI is not configured
        return this.fallbackAnalysis(markdown, title)
      }

      const analysis = await aiAnalyzer.analyzeContent(markdown, title) as any
      
      return {
        hasThreats: (analysis.iocs?.length || 0) > 0 || (analysis.threats?.length || 0) > 0,
        iocs: (analysis.iocs || []).map((ioc: any) => ({
          type: ioc.type,
          value: ioc.value,
          confidence: ioc.confidence
        })),
        threats: (analysis.threats || []).map((threat: any) => ({
          name: threat.name,
          type: threat.family || 'unknown',
          severity: threat.severity,
          description: threat.description
        })),
        summary: analysis.summary || 'Analysis completed',
        tags: analysis.tags || ['ai-analysis']
      }
    } catch (error) {
      console.error('AI analysis failed, using fallback:', error)
      return this.fallbackAnalysis(markdown, title)
    }
  }

  private fallbackAnalysis(markdown: string, title: string) {
    const content = markdown.toLowerCase()
    
    // Extract IOCs using regex patterns
    const iocs = [
      ...this.extractIPs(markdown),
      ...this.extractDomains(markdown),
      ...this.extractHashes(markdown),
      ...this.extractURLs(markdown)
    ]

    // Detect threat keywords
    const threatKeywords = [
      'malware', 'ransomware', 'apt', 'backdoor', 'trojan', 'botnet',
      'phishing', 'vulnerability', 'exploit', 'breach', 'attack',
      'cybercrime', 'threat actor', 'campaign', 'zero-day'
    ]

    const detectedThreats = threatKeywords.filter(keyword => 
      content.includes(keyword)
    )

    const hasThreats = iocs.length > 0 || detectedThreats.length > 0

    // Generate threat objects
    const threats = this.generateThreatObjects(content, title, detectedThreats)

    // Generate summary
    const summary = this.generateSummary(title, iocs, threats)

    return {
      hasThreats,
      iocs,
      threats,
      summary,
      tags: [...detectedThreats, 'web-intel', 'osint']
    }
  }

  private extractIPs(text: string): Array<{type: 'ip', value: string, confidence: number}> {
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g
    const matches = text.match(ipRegex) || []
    
    return matches
      .filter(ip => this.isValidIP(ip))
      .map(ip => ({
        type: 'ip' as const,
        value: ip,
        confidence: 0.7
      }))
  }

  private extractDomains(text: string): Array<{type: 'domain', value: string, confidence: number}> {
    const domainRegex = /\b[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.([a-zA-Z]{2,})\b/g
    const matches = text.match(domainRegex) || []
    
    // Filter out common legitimate domains
    const legitimateDomains = ['google.com', 'microsoft.com', 'apple.com', 'github.com']
    
    return matches
      .filter(domain => !legitimateDomains.some(legit => domain.includes(legit)))
      .filter(domain => domain.includes('.'))
      .map(domain => ({
        type: 'domain' as const,
        value: domain,
        confidence: 0.6
      }))
  }

  private extractHashes(text: string): Array<{type: 'hash', value: string, confidence: number}> {
    const hashRegexes = [
      /\b[a-fA-F0-9]{32}\b/g, // MD5
      /\b[a-fA-F0-9]{40}\b/g, // SHA1
      /\b[a-fA-F0-9]{64}\b/g  // SHA256
    ]

    const hashes: string[] = []
    hashRegexes.forEach(regex => {
      const matches = text.match(regex) || []
      hashes.push(...matches)
    })

    return hashes.map(hash => ({
      type: 'hash' as const,
      value: hash,
      confidence: 0.9
    }))
  }

  private extractURLs(text: string): Array<{type: 'url', value: string, confidence: number}> {
    const urlRegex = /https?:\/\/[^\s<>"]+/g
    const matches = text.match(urlRegex) || []
    
    return matches.map(url => ({
      type: 'url' as const,
      value: url,
      confidence: 0.8
    }))
  }

  private isValidIP(ip: string): boolean {
    const parts = ip.split('.')
    return parts.length === 4 && parts.every(part => {
      const num = parseInt(part)
      return num >= 0 && num <= 255
    })
  }

  private generateThreatObjects(content: string, title: string, keywords: string[]): Array<{
    name: string
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }> {
    const threats = []

    if (keywords.includes('ransomware')) {
      threats.push({
        name: this.extractThreatName(title, 'ransomware'),
        type: 'ransomware',
        severity: 'critical' as const,
        description: `Ransomware threat detected in: ${title}`
      })
    }

    if (keywords.includes('apt')) {
      threats.push({
        name: this.extractThreatName(title, 'apt'),
        type: 'apt',
        severity: 'high' as const,
        description: `Advanced Persistent Threat activity detected in: ${title}`
      })
    }

    if (keywords.includes('vulnerability') || keywords.includes('exploit')) {
      threats.push({
        name: this.extractThreatName(title, 'vulnerability'),
        type: 'vulnerability',
        severity: 'medium' as const,
        description: `Security vulnerability reported in: ${title}`
      })
    }

    return threats
  }

  private extractThreatName(title: string, type: string): string {
    // Simple extraction - in production, use NLP
    const words = title.split(' ')
    const relevantWords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'from'].includes(word.toLowerCase())
    )
    
    return relevantWords.slice(0, 3).join(' ') || `Unknown ${type}`
  }

  private generateSummary(title: string, iocs: any[], threats: any[]): string {
    let summary = `Analysis of "${title}": `
    
    if (iocs.length > 0) {
      summary += `Found ${iocs.length} indicators of compromise. `
    }
    
    if (threats.length > 0) {
      summary += `Identified ${threats.length} potential threats including ${threats.map(t => t.type).join(', ')}. `
    }
    
    summary += 'Source: Web intelligence gathering.'
    
    return summary
  }

  private async storeAnalysis(url: string, source: ThreatIntelSource, content: Web2MDResponse, analysis: any): Promise<void> {
    try {
      // Store feed data
      await db.insert(feedData).values({
        feedId: `web-${source.name.replace(/\s+/g, '-').toLowerCase()}`,
        rawData: { url, title: content.title, markdown: content.markdown },
        extractedIocs: analysis.iocs.map((ioc: any) => ioc.value),
        aiSummary: analysis.summary,
        confidence: '0.7'
      })

      // Store IOCs
      for (const ioc of analysis.iocs) {
        await db.insert(iocs).values({
          type: ioc.type,
          value: ioc.value,
          description: `Found in ${source.name}: ${content.title}`,
          confidence: ioc.confidence.toString(),
          severity: 'medium',
          tags: analysis.tags,
          sources: [source.name],
          firstSeen: new Date(),
          lastSeen: new Date(),
          metadata: { sourceUrl: url, sourceType: 'web-intel' },
          isActive: true
        })
      }

      // Store threat campaigns
      for (const threat of analysis.threats) {
        await db.insert(threatCampaigns).values({
          name: threat.name,
          description: threat.description,
          family: threat.type,
          severity: threat.severity,
          confidence: '0.7',
          status: 'active',
          firstSeen: new Date(),
          lastSeen: new Date(),
          metadata: { sourceUrl: url, source: source.name }
        })
      }

      // Create alerts for high-severity threats
      for (const threat of analysis.threats.filter(t => t.severity === 'critical' || t.severity === 'high')) {
        await db.insert(alerts).values({
          title: `${threat.severity.toUpperCase()}: ${threat.name}`,
          description: `${threat.description} - Source: ${source.name}`,
          severity: threat.severity,
          type: 'campaign_detected',
          sourceType: 'ai',
          relatedIocs: analysis.iocs.map((ioc: any) => ioc.value),
          metadata: { 
            sourceUrl: url, 
            source: source.name,
            confidence: 0.7,
            tags: analysis.tags
          },
          status: 'open',
          priority: threat.severity === 'critical' ? 1 : 2
        })
      }

      console.log(`Stored analysis for ${url}: ${analysis.iocs.length} IOCs, ${analysis.threats.length} threats`)
    } catch (error) {
      console.error('Error storing analysis:', error)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public method to trigger manual scraping
  async manualScrape(url: string): Promise<any> {
    const content = await this.convertToMarkdown(url)
    if (!content) return null

    const analysis = await this.analyzeContent(content.markdown, content.title)
    
    if (analysis.hasThreats) {
      await this.storeAnalysis(url, { name: 'Manual', url, type: 'report' }, content, analysis)
    }

    return { content, analysis }
  }
} 