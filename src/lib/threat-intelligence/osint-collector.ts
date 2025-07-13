import { db } from '@/db'
import { iocs, alerts, threatCampaigns, enrichmentData } from '@/db/schema'
import { AIThreatAnalyzer } from './ai-analyzer'
import { Web2MDThreatIntelService } from './web2md-service'
import { eq } from 'drizzle-orm'

interface OSINTSource {
  name: string
  type: 'twitter' | 'github' | 'pastebin' | 'reddit' | 'blog' | 'rss' | 'telegram'
  url: string
  searchTerms: string[]
  apiKey?: string
  enabled: boolean
  lastCheck?: string
  category: 'social' | 'code' | 'paste' | 'forum' | 'news' | 'messaging'
}

interface OSINTResult {
  source: string
  type: string
  content: string
  url: string
  timestamp: string
  author?: string
  relevanceScore: number
  extractedIOCs: any[]
  tags: string[]
}

export class OSINTCollector {
  private static instance: OSINTCollector
  private aiAnalyzer: AIThreatAnalyzer
  private web2md: Web2MDThreatIntelService

  // OSINT Sources Configuration
  private sources: OSINTSource[] = [
    // Twitter/X Security Accounts
    {
      name: 'VX Underground',
      type: 'twitter',
      url: 'https://api.twitter.com/2/users/by/username/vxunderground',
      searchTerms: ['malware', 'apt', 'ransomware', 'ioc', 'threat'],
      enabled: false, // Requires API key
      category: 'social'
    },
    {
      name: 'Malware Hunter Team',
      type: 'twitter',
      url: 'https://api.twitter.com/2/users/by/username/malwrhunterteam',
      searchTerms: ['malware', 'sample', 'analysis', 'ioc'],
      enabled: false, // Requires API key
      category: 'social'
    },
    {
      name: 'Cyber Know',
      type: 'twitter',
      url: 'https://api.twitter.com/2/users/by/username/cyberknow20',
      searchTerms: ['cybersecurity', 'threat', 'vulnerability', 'exploit'],
      enabled: false, // Requires API key
      category: 'social'
    },

    // GitHub Repositories
    {
      name: 'Awesome Threat Intelligence',
      type: 'github',
      url: 'https://api.github.com/repos/hslatman/awesome-threat-intelligence',
      searchTerms: ['ioc', 'threat', 'intelligence', 'malware'],
      enabled: true,
      category: 'code'
    },
    {
      name: 'Malware Samples',
      type: 'github',
      url: 'https://api.github.com/search/repositories?q=malware+samples',
      searchTerms: ['malware', 'samples', 'analysis'],
      enabled: true,
      category: 'code'
    },
    {
      name: 'IOC Feeds',
      type: 'github',
      url: 'https://api.github.com/search/repositories?q=ioc+feeds',
      searchTerms: ['ioc', 'feeds', 'threat', 'intelligence'],
      enabled: true,
      category: 'code'
    },

    // Security Blogs & News
    {
      name: 'Krebs on Security',
      type: 'blog',
      url: 'https://krebsonsecurity.com/feed/',
      searchTerms: ['cybercrime', 'fraud', 'breach', 'malware'],
      enabled: true,
      category: 'news'
    },
    {
      name: 'Bleeping Computer',
      type: 'blog',
      url: 'https://www.bleepingcomputer.com/feed/',
      searchTerms: ['malware', 'ransomware', 'vulnerability', 'exploit'],
      enabled: true,
      category: 'news'
    },
    {
      name: 'SANS ISC',
      type: 'blog',
      url: 'https://isc.sans.edu/rssfeed.xml',
      searchTerms: ['security', 'incident', 'threat', 'analysis'],
      enabled: true,
      category: 'news'
    },
    {
      name: 'Schneier on Security',
      type: 'blog',
      url: 'https://www.schneier.com/blog/atom.xml',
      searchTerms: ['security', 'cryptography', 'privacy', 'threat'],
      enabled: true,
      category: 'news'
    },
    {
      name: 'Talos Intelligence',
      type: 'blog',
      url: 'https://blog.talosintelligence.com/feeds/posts/default',
      searchTerms: ['threat', 'malware', 'apt', 'vulnerability'],
      enabled: true,
      category: 'news'
    },

    // Reddit Communities
    {
      name: 'r/netsec',
      type: 'reddit',
      url: 'https://www.reddit.com/r/netsec.json',
      searchTerms: ['vulnerability', 'exploit', 'security', 'malware'],
      enabled: true,
      category: 'forum'
    },
    {
      name: 'r/cybersecurity',
      type: 'reddit',
      url: 'https://www.reddit.com/r/cybersecurity.json',
      searchTerms: ['threat', 'incident', 'breach', 'analysis'],
      enabled: true,
      category: 'forum'
    },
    {
      name: 'r/malware',
      type: 'reddit',
      url: 'https://www.reddit.com/r/malware.json',
      searchTerms: ['malware', 'analysis', 'sample', 'reverse'],
      enabled: true,
      category: 'forum'
    },

    // Pastebin-like Services
    {
      name: 'Pastebin',
      type: 'pastebin',
      url: 'https://scrape.pastebin.com/api_scraping.php',
      searchTerms: ['password', 'leak', 'dump', 'breach', 'hack'],
      enabled: false, // Requires API key
      category: 'paste'
    },
    {
      name: 'Ghostbin',
      type: 'pastebin',
      url: 'https://ghostbin.co/browse',
      searchTerms: ['credentials', 'database', 'leak', 'dump'],
      enabled: true,
      category: 'paste'
    }
  ]

  private constructor() {
    this.aiAnalyzer = AIThreatAnalyzer.getInstance()
    this.web2md = Web2MDThreatIntelService.getInstance()
  }

  static getInstance(): OSINTCollector {
    if (!OSINTCollector.instance) {
      OSINTCollector.instance = new OSINTCollector()
    }
    return OSINTCollector.instance
  }

  async collectFromAllSources(): Promise<{ success: boolean; results: OSINTResult[] }> {
    const results: OSINTResult[] = []
    
    for (const source of this.sources.filter(s => s.enabled)) {
      try {
        console.log(`Collecting from ${source.name}...`)
        const sourceResults = await this.collectFromSource(source)
        results.push(...sourceResults)
      } catch (error) {
        console.error(`Failed to collect from ${source.name}:`, error)
      }
    }

    // Process and analyze results
    const processedResults = await this.processResults(results)
    
    return {
      success: true,
      results: processedResults
    }
  }

  private async collectFromSource(source: OSINTSource): Promise<OSINTResult[]> {
    const results: OSINTResult[] = []

    switch (source.type) {
      case 'twitter':
        return await this.collectFromTwitter(source)
      case 'github':
        return await this.collectFromGitHub(source)
      case 'reddit':
        return await this.collectFromReddit(source)
      case 'blog':
        return await this.collectFromBlog(source)
      case 'pastebin':
        return await this.collectFromPastebin(source)
      default:
        return []
    }
  }

  private async collectFromTwitter(source: OSINTSource): Promise<OSINTResult[]> {
    // Mock Twitter collection (would use real Twitter API)
    const mockTweets = [
      {
        id: '1',
        text: 'New malware campaign detected targeting financial institutions. IOCs: evil-domain.com, 192.168.1.100',
        author: 'security_researcher',
        timestamp: new Date().toISOString(),
        url: 'https://twitter.com/security_researcher/status/1'
      },
      {
        id: '2',
        text: 'APT29 infrastructure discovered: c2-server.evil.com, hash: a1b2c3d4e5f6789',
        author: 'threat_hunter',
        timestamp: new Date().toISOString(),
        url: 'https://twitter.com/threat_hunter/status/2'
      }
    ]

    const results: OSINTResult[] = []
    
    for (const tweet of mockTweets) {
      // Extract IOCs from tweet text
      const extractedIOCs = await this.extractIOCsFromText(tweet.text)
      
      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(tweet.text, source.searchTerms)
      
      if (relevanceScore > 0.3) { // Only include relevant tweets
        results.push({
          source: source.name,
          type: 'tweet',
          content: tweet.text,
          url: tweet.url,
          timestamp: tweet.timestamp,
          author: tweet.author,
          relevanceScore,
          extractedIOCs,
          tags: this.extractTags(tweet.text)
        })
      }
    }

    return results
  }

  private async collectFromGitHub(source: OSINTSource): Promise<OSINTResult[]> {
    const results: OSINTResult[] = []

    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'OSINT-Collector/1.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Handle different GitHub API responses
      let repositories = []
      if (data.items) {
        repositories = data.items.slice(0, 10) // Limit to 10 repos
      } else if (Array.isArray(data)) {
        repositories = data
      } else if (data.name) {
        repositories = [data]
      }

      for (const repo of repositories) {
        if (repo.description) {
          const extractedIOCs = await this.extractIOCsFromText(repo.description)
          const relevanceScore = this.calculateRelevanceScore(repo.description, source.searchTerms)
          
          if (relevanceScore > 0.2) {
            results.push({
              source: source.name,
              type: 'github_repo',
              content: repo.description,
              url: repo.html_url,
              timestamp: repo.updated_at || new Date().toISOString(),
              author: repo.owner?.login,
              relevanceScore,
              extractedIOCs,
              tags: this.extractTags(repo.description)
            })
          }
        }
      }
    } catch (error) {
      console.error('GitHub collection error:', error)
    }

    return results
  }

  private async collectFromReddit(source: OSINTSource): Promise<OSINTResult[]> {
    const results: OSINTResult[] = []

    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'OSINT-Collector/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.data && data.data.children) {
        for (const post of data.data.children.slice(0, 20)) {
          const postData = post.data
          const content = `${postData.title} ${postData.selftext || ''}`
          
          const extractedIOCs = await this.extractIOCsFromText(content)
          const relevanceScore = this.calculateRelevanceScore(content, source.searchTerms)
          
          if (relevanceScore > 0.3) {
            results.push({
              source: source.name,
              type: 'reddit_post',
              content: content.substring(0, 1000), // Limit content length
              url: `https://reddit.com${postData.permalink}`,
              timestamp: new Date(postData.created_utc * 1000).toISOString(),
              author: postData.author,
              relevanceScore,
              extractedIOCs,
              tags: this.extractTags(content)
            })
          }
        }
      }
    } catch (error) {
      console.error('Reddit collection error:', error)
    }

    return results
  }

  private async collectFromBlog(source: OSINTSource): Promise<OSINTResult[]> {
    const results: OSINTResult[] = []

    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'OSINT-Collector/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Blog RSS error: ${response.status}`)
      }

      const rssText = await response.text()
      
      // Simple RSS parsing (in production, use a proper RSS parser)
      const itemMatches = rssText.match(/<item>[\s\S]*?<\/item>/g) || []
      
      for (const item of itemMatches.slice(0, 10)) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/)
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/)
        const linkMatch = item.match(/<link>(.*?)<\/link>/)
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/)
        
        if (titleMatch && descMatch) {
          const title = titleMatch[1]
          const description = descMatch[1]
          const content = `${title} ${description}`
          
          const extractedIOCs = await this.extractIOCsFromText(content)
          const relevanceScore = this.calculateRelevanceScore(content, source.searchTerms)
          
          if (relevanceScore > 0.4) {
            results.push({
              source: source.name,
              type: 'blog_post',
              content: content.substring(0, 1000),
              url: linkMatch ? linkMatch[1] : source.url,
              timestamp: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
              relevanceScore,
              extractedIOCs,
              tags: this.extractTags(content)
            })
          }
        }
      }
    } catch (error) {
      console.error('Blog collection error:', error)
    }

    return results
  }

  private async collectFromPastebin(source: OSINTSource): Promise<OSINTResult[]> {
    const results: OSINTResult[] = []
    
    // Mock pastebin collection (would use real scraping)
    const mockPastes = [
      {
        id: 'abc123',
        title: 'Database dump - company.com',
        content: 'username:password\nadmin:admin123\nuser@company.com:password123',
        url: 'https://pastebin.com/abc123',
        timestamp: new Date().toISOString()
      },
      {
        id: 'def456',
        title: 'C2 Server List',
        content: 'C2 servers:\n192.168.1.100:8080\nevil-domain.com:443\nmalware.example.com:80',
        url: 'https://pastebin.com/def456',
        timestamp: new Date().toISOString()
      }
    ]

    for (const paste of mockPastes) {
      const extractedIOCs = await this.extractIOCsFromText(paste.content)
      const relevanceScore = this.calculateRelevanceScore(paste.content, source.searchTerms)
      
      if (relevanceScore > 0.2 || extractedIOCs.length > 0) {
        results.push({
          source: source.name,
          type: 'paste',
          content: paste.content.substring(0, 1000),
          url: paste.url,
          timestamp: paste.timestamp,
          relevanceScore,
          extractedIOCs,
          tags: this.extractTags(paste.content)
        })
      }
    }

    return results
  }

  private async extractIOCsFromText(text: string): Promise<any[]> {
    const iocs: any[] = []
    
    // IP addresses
    const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g
    const ipMatches = text.match(ipRegex) || []
    for (const ip of ipMatches) {
      if (this.isValidPublicIP(ip)) {
        iocs.push({
          type: 'ip',
          value: ip,
          confidence: 70,
          source: 'osint_extraction'
        })
      }
    }

    // Domains
    const domainRegex = /\b[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\b/g
    const domainMatches = text.match(domainRegex) || []
    for (const domain of domainMatches) {
      if (this.isValidDomain(domain) && !this.isCommonDomain(domain)) {
        iocs.push({
          type: 'domain',
          value: domain,
          confidence: 60,
          source: 'osint_extraction'
        })
      }
    }

    // URLs
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g
    const urlMatches = text.match(urlRegex) || []
    for (const url of urlMatches) {
      if (!this.isCommonURL(url)) {
        iocs.push({
          type: 'url',
          value: url,
          confidence: 65,
          source: 'osint_extraction'
        })
      }
    }

    // Hashes
    const hashRegex = /\b[a-fA-F0-9]{32}\b|\b[a-fA-F0-9]{40}\b|\b[a-fA-F0-9]{64}\b|\b[a-fA-F0-9]{128}\b/g
    const hashMatches = text.match(hashRegex) || []
    for (const hash of hashMatches) {
      iocs.push({
        type: 'hash',
        value: hash,
        confidence: 80,
        source: 'osint_extraction'
      })
    }

    // Email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const emailMatches = text.match(emailRegex) || []
    for (const email of emailMatches) {
      if (!this.isCommonEmail(email)) {
        iocs.push({
          type: 'email',
          value: email,
          confidence: 50,
          source: 'osint_extraction'
        })
      }
    }

    return iocs
  }

  private calculateRelevanceScore(text: string, searchTerms: string[]): number {
    const lowerText = text.toLowerCase()
    let score = 0
    
    for (const term of searchTerms) {
      const lowerTerm = term.toLowerCase()
      const matches = (lowerText.match(new RegExp(lowerTerm, 'g')) || []).length
      score += matches * 0.1
    }
    
    // Boost score for security-related keywords
    const securityKeywords = ['malware', 'apt', 'ransomware', 'vulnerability', 'exploit', 'breach', 'attack', 'threat', 'ioc', 'c2', 'botnet']
    for (const keyword of securityKeywords) {
      if (lowerText.includes(keyword)) {
        score += 0.2
      }
    }
    
    return Math.min(score, 1.0)
  }

  private extractTags(text: string): string[] {
    const tags: string[] = []
    const lowerText = text.toLowerCase()
    
    const tagKeywords = {
      'malware': ['malware', 'virus', 'trojan', 'ransomware', 'rootkit'],
      'apt': ['apt', 'advanced persistent threat', 'nation state'],
      'phishing': ['phishing', 'phish', 'credential theft'],
      'vulnerability': ['vulnerability', 'exploit', 'cve', 'zero-day'],
      'breach': ['breach', 'leak', 'dump', 'stolen'],
      'c2': ['c2', 'command and control', 'botnet'],
      'financial': ['banking', 'financial', 'payment', 'credit card'],
      'healthcare': ['healthcare', 'medical', 'hospital', 'patient'],
      'government': ['government', 'military', 'classified', 'state']
    }
    
    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.push(tag)
      }
    }
    
    return tags
  }

  private isValidPublicIP(ip: string): boolean {
    const parts = ip.split('.').map(Number)
    
    // Exclude private IP ranges
    if (parts[0] === 10) return false
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false
    if (parts[0] === 192 && parts[1] === 168) return false
    if (parts[0] === 127) return false // localhost
    if (parts[0] === 169 && parts[1] === 254) return false // link-local
    
    return true
  }

  private isValidDomain(domain: string): boolean {
    if (domain.length < 4 || domain.length > 253) return false
    if (domain.includes('..')) return false
    if (domain.startsWith('.') || domain.endsWith('.')) return false
    
    const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name', 'pro', 'museum', 'coop', 'aero', 'xxx', 'travel', 'tel', 'mobi', 'asia', 'cat', 'jobs', 'post', 'eu', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'ru', 'br', 'in', 'it', 'es', 'mx', 'nl', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'at', 'ch', 'be', 'pt', 'gr', 'hu', 'ro', 'bg', 'hr', 'sk', 'si', 'lt', 'lv', 'ee', 'ie', 'lu', 'mt', 'cy', 'is', 'li', 'mc', 'sm', 'va', 'ad', 'gi', 'im', 'je', 'gg', 'fo', 'gl', 'pm', 'wf', 'yt', 'nc', 'pf', 'tf', 're', 'mq', 'gp', 'bl', 'mf', 'gf', 'sr', 'gy', 've', 'co', 'pe', 'ec', 'bo', 'py', 'uy', 'cl', 'ar', 'fk', 'gs']
    
    const parts = domain.split('.')
    const tld = parts[parts.length - 1].toLowerCase()
    
    return validTLDs.includes(tld)
  }

  private isCommonDomain(domain: string): boolean {
    const commonDomains = [
      'google.com', 'facebook.com', 'twitter.com', 'youtube.com', 'instagram.com',
      'linkedin.com', 'github.com', 'stackoverflow.com', 'reddit.com', 'wikipedia.org',
      'amazon.com', 'microsoft.com', 'apple.com', 'netflix.com', 'spotify.com'
    ]
    
    return commonDomains.some(common => domain.includes(common))
  }

  private isCommonURL(url: string): boolean {
    const commonDomains = [
      'google.com', 'facebook.com', 'twitter.com', 'youtube.com', 'instagram.com',
      'linkedin.com', 'github.com', 'stackoverflow.com', 'reddit.com', 'wikipedia.org'
    ]
    
    return commonDomains.some(domain => url.includes(domain))
  }

  private isCommonEmail(email: string): boolean {
    const commonDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'protonmail.com', 'mail.com'
    ]
    
    return commonDomains.some(domain => email.includes(domain))
  }

  private async processResults(results: OSINTResult[]): Promise<OSINTResult[]> {
    const processedResults: OSINTResult[] = []
    
    for (const result of results) {
      try {
        // Store extracted IOCs
        for (const ioc of result.extractedIOCs) {
          await this.storeIOC(ioc, result.source)
        }
        
        // Store enrichment data
        await this.storeEnrichmentData(result)
        
        processedResults.push(result)
      } catch (error) {
        console.error('Failed to process OSINT result:', error)
      }
    }
    
    return processedResults
  }

  private async storeIOC(ioc: any, source: string): Promise<void> {
    try {
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
            lastSeen: new Date().toISOString(),
            sources: [...new Set([...existing[0].sources, source])],
            confidence: Math.max(existing[0].confidence, ioc.confidence)
          })
          .where(eq(iocs.id, existing[0].id))
      } else {
        // Insert new IOC
        await db.insert(iocs).values({
          type: ioc.type,
          value: ioc.value,
          description: `OSINT: ${ioc.type} from ${source}`,
          severity: 'medium',
          confidence: ioc.confidence,
          sources: [source],
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          tags: ['osint'],
          metadata: { osint_source: source }
        })
      }
    } catch (error) {
      console.error('Failed to store OSINT IOC:', error)
    }
  }

  private async storeEnrichmentData(result: OSINTResult): Promise<void> {
    try {
      await db.insert(enrichmentData).values({
        type: 'osint',
        source: result.source,
        data: {
          content: result.content,
          url: result.url,
          author: result.author,
          relevanceScore: result.relevanceScore,
          tags: result.tags,
          extractedIOCs: result.extractedIOCs.length
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to store enrichment data:', error)
    }
  }

  getSources(): OSINTSource[] {
    return this.sources
  }

  async enableSource(name: string): Promise<void> {
    const source = this.sources.find(s => s.name === name)
    if (source) {
      source.enabled = true
    }
  }

  async disableSource(name: string): Promise<void> {
    const source = this.sources.find(s => s.name === name)
    if (source) {
      source.enabled = false
    }
  }
} 