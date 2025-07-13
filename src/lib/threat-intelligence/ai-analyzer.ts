import { z } from 'zod'
import * as cheerio from 'cheerio'
import { generateObject } from 'ai'
import { createGroq } from '@ai-sdk/groq'

// Removed Groq API dependency to avoid API key issues
// Using fallback responses instead

// Strict validation functions
const validateIP = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
  
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) return false
  
  // Exclude private/reserved ranges
  const privateRanges = [
    /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./, /^127\./, /^169\.254\./, /^224\./, /^240\./
  ]
  
  return !privateRanges.some(range => range.test(ip))
}

const validateDomain = (domain: string): boolean => {
  // Normalize to lowercase
  domain = domain.toLowerCase().trim()
  
  // Basic format validation
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/
  if (!domainRegex.test(domain)) return false
  
  // Must have at least one dot
  if (!domain.includes('.')) return false
  
  // Check for valid TLD
  const validTLDs = [
    'com', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name', 'pro', 'museum',
    'us', 'uk', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk',
    'fi', 'pl', 'cz', 'hu', 'ru', 'ua', 'by', 'lt', 'lv', 'ee', 'jp', 'kr', 'cn', 'hk', 'tw',
    'sg', 'my', 'th', 'ph', 'id', 'vn', 'in', 'pk', 'bd', 'lk', 'np', 'bt', 'mv', 'af', 'ir',
    'za', 'eg', 'br', 'ar', 'cl', 'pe', 'ec', 'co', 've', 'mx', 'gt', 'bz', 'sv', 'hn', 'ni'
  ]
  
  const parts = domain.split('.')
  const tld = parts[parts.length - 1]
  
  // Check if TLD is valid
  if (!validTLDs.includes(tld)) return false
  
  // Reject suspicious patterns
  const suspiciousPatterns = [
    /^[a-z]\./, // Single letter subdomains like "i.rs", "d.nr"
    /^[0-9]+\./, // Pure numeric subdomains
    /[0-9]{8,}/, // Long numeric strings
    /[a-z0-9]{20,}/, // Very long random strings
  ]
  
  // Flag suspicious domains
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(domain))
  
  // Reject if too suspicious
  if (isSuspicious && parts.length < 3) return false // Single letter + TLD
  if (domain.length < 4) return false // Too short
  if (parts.some(part => part.length === 0)) return false // Empty parts
  
  return true
}

const validateURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    
    // Must be HTTP/HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) return false
    
    // Validate the hostname
    if (!validateDomain(urlObj.hostname) && !validateIP(urlObj.hostname)) return false
    
    return true
  } catch {
    return false
  }
}

const validateHash = (hash: string): boolean => {
  const hashPatterns = {
    md5: /^[a-f0-9]{32}$/i,
    sha1: /^[a-f0-9]{40}$/i,
    sha256: /^[a-f0-9]{64}$/i,
    sha512: /^[a-f0-9]{128}$/i
  }
  
  return Object.values(hashPatterns).some(pattern => pattern.test(hash))
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) return false
  
  const domain = email.split('@')[1]
  return validateDomain(domain)
}

// Zod schemas for structured outputs
const IOCSchema = z.object({
  type: z.enum(['ip', 'domain', 'url', 'hash', 'email', 'file']),
  value: z.string(),
  confidence: z.number().min(0).max(1),
  description: z.string().optional(),
  context: z.string().optional()
})

const ThreatSchema = z.object({
  name: z.string(),
  family: z.string().optional(),
  actor: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  techniques: z.array(z.string()).optional(),
  targetSectors: z.array(z.string()).optional(),
  indicators: z.array(z.string()).optional()
})

const ThreatAnalysisSchema = z.object({
  summary: z.string(),
  iocs: z.array(IOCSchema),
  threats: z.array(ThreatSchema),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
  mitreTechniques: z.array(z.string()),
  recommendations: z.array(z.string())
})

// Initialize Groq client for AI assistant only
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || ''
})

export class AIThreatAnalyzer {
  private static instance: AIThreatAnalyzer

  static getInstance(): AIThreatAnalyzer {
    if (!AIThreatAnalyzer.instance) {
      AIThreatAnalyzer.instance = new AIThreatAnalyzer()
    }
    return AIThreatAnalyzer.instance
  }

  // Validate IOCs before processing
  private validateIOC(ioc: any): boolean {
    switch (ioc.type) {
      case 'ip':
        return validateIP(ioc.value)
      case 'domain':
        return validateDomain(ioc.value)
      case 'url':
        return validateURL(ioc.value)
      case 'hash':
        return validateHash(ioc.value)
      case 'email':
        return validateEmail(ioc.value)
      default:
        return false
    }
  }

  // Filter and validate IOCs
  private filterValidIOCs(iocs: any[]): any[] {
    return iocs.filter(ioc => {
      const isValid = this.validateIOC(ioc)
      if (!isValid) {
        console.log(`Rejected invalid IOC: ${ioc.type}:${ioc.value}`)
      }
      return isValid
    })
  }

  async analyzeContent(content: string, title?: string) {
    try {
      const { object } = await generateObject({
        model: groq('llama-3.1-70b-versatile'),
        schema: ThreatAnalysisSchema,
        prompt: `
          Analyze the following cybersecurity content for threat intelligence:
          
          Title: ${title || 'Unknown'}
          Content: ${content.substring(0, 6000)}
          
          Extract and analyze:
          1. All indicators of compromise (IOCs) - IPs, domains, URLs, hashes, emails
          2. Threat actors, malware families, and campaigns
          3. MITRE ATT&CK techniques (format: T1234)
          4. Target sectors and geography
          5. Severity assessment and confidence levels
          6. Security recommendations
          
          IMPORTANT: Only include properly formatted, legitimate indicators and threat names. Use JSON output only.
        `
      })
      return object
    } catch (error) {
      // Fallback analysis without external API - extract IOCs using regex
      const extractedIOCs = this.extractIOCsFromContent(content);
      const validatedIOCs = this.filterValidIOCs(extractedIOCs);
      
      const analysis = {
        summary: `Analysis of "${title || 'threat intelligence content'}" - ${validatedIOCs.length} IOCs found`,
        iocs: validatedIOCs,
        threats: this.extractThreatNames(content),
        severity: this.assessSeverity(content) as 'low' | 'medium' | 'high' | 'critical',
        confidence: 0.7,
        tags: this.extractTags(content),
        mitreTechniques: this.extractMITRETechniques(content),
        recommendations: this.generateRecommendations(content)
      };
      return analysis;
    }
  }

  private extractIOCsFromContent(content: string): any[] {
    const iocs = [];
    
    // Extract IPs
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ips = content.match(ipRegex) || [];
    ips.forEach(ip => {
      if (validateIP(ip)) {
        iocs.push({ value: ip, type: 'ip', confidence: 0.8 });
      }
    });
    
    // Extract domains
    const domainRegex = /\b[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}\b/g;
    const domains = content.match(domainRegex) || [];
    domains.forEach(domain => {
      if (validateDomain(domain)) {
        iocs.push({ value: domain, type: 'domain', confidence: 0.7 });
      }
    });
    
    // Extract hashes
    const hashRegex = /\b[a-fA-F0-9]{32,64}\b/g;
    const hashes = content.match(hashRegex) || [];
    hashes.forEach(hash => {
      if (validateHash(hash)) {
        iocs.push({ value: hash, type: 'hash', confidence: 0.9 });
      }
    });
    
    // Extract emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = content.match(emailRegex) || [];
    emails.forEach(email => {
      if (validateEmail(email)) {
        iocs.push({ value: email, type: 'email', confidence: 0.6 });
      }
    });
    
    return iocs;
  }

  private extractThreatNames(content: string): string[] {
    const threats = [];
    const lowerContent = content.toLowerCase();
    
    // Common threat patterns
    const threatPatterns = [
      /apt\s*[\d\w]+/gi,
      /lazarus/gi,
      /emotet/gi,
      /trickbot/gi,
      /ryuk/gi,
      /cobaltstrike/gi,
      /mimikatz/gi,
      /powershell empire/gi
    ];
    
    threatPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        threats.push(...matches.slice(0, 2));
      }
    });
    
    return [...new Set(threats)];
  }

  private assessSeverity(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('critical') || lowerContent.includes('zero-day') || lowerContent.includes('ransomware')) {
      return 'critical';
    } else if (lowerContent.includes('high') || lowerContent.includes('exploit') || lowerContent.includes('malware')) {
      return 'high';
    } else if (lowerContent.includes('medium') || lowerContent.includes('vulnerability') || lowerContent.includes('suspicious')) {
      return 'medium';
    }
    
    return 'low';
  }

  private extractTags(content: string): string[] {
    const tags = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('phishing')) tags.push('phishing');
    if (lowerContent.includes('malware')) tags.push('malware');
    if (lowerContent.includes('ransomware')) tags.push('ransomware');
    if (lowerContent.includes('apt')) tags.push('apt');
    if (lowerContent.includes('vulnerability')) tags.push('vulnerability');
    if (lowerContent.includes('exploit')) tags.push('exploit');
    
    return tags;
  }

  private extractMITRETechniques(content: string): string[] {
    const techniques = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('phishing')) techniques.push('T1566');
    if (lowerContent.includes('powershell')) techniques.push('T1059.001');
    if (lowerContent.includes('credential')) techniques.push('T1003');
    if (lowerContent.includes('persistence')) techniques.push('T1547');
    if (lowerContent.includes('lateral movement')) techniques.push('T1021');
    
    return techniques;
  }

  private generateRecommendations(content: string): string[] {
    const recommendations = [];
    const lowerContent = content.toLowerCase();
    
    recommendations.push('Monitor network traffic for suspicious activity');
    recommendations.push('Update threat intelligence feeds');
    
    if (lowerContent.includes('phishing')) {
      recommendations.push('Implement email security controls');
    }
    if (lowerContent.includes('malware')) {
      recommendations.push('Deploy endpoint protection');
    }
    if (lowerContent.includes('vulnerability')) {
      recommendations.push('Apply security patches');
    }
    
    return recommendations;
  }

  async extractIOCsFromText(text: string) {
    try {
      // Use existing extractIOCsFromContent method for consistency
      const extractedIOCs = this.extractIOCsFromContent(text);
      return this.filterValidIOCs(extractedIOCs);
    } catch (error) {
      console.error('IOC extraction error:', error)
      return []
    }
  }

  async generateThreatSummary(alerts: any[], timeframe: string = '24 hours') {
    try {
      const alertsData = alerts.slice(0, 10).map(alert => ({
        title: alert.title,
        severity: alert.severity,
        description: alert.description,
        type: alert.type
      }))

      // Generate fallback summary without external API
      const criticalAlerts = alertsData.filter(alert => alert.severity === 'critical').length;
      const highAlerts = alertsData.filter(alert => alert.severity === 'high').length;
      const mediumAlerts = alertsData.filter(alert => alert.severity === 'medium').length;
      const totalAlerts = alertsData.length;

      const summary = `
**Executive Threat Intelligence Summary - ${timeframe}**

**Key Metrics:**
- Total Alerts: ${totalAlerts}
- Critical: ${criticalAlerts} | High: ${highAlerts} | Medium: ${mediumAlerts}

**Key Threats:**
${alertsData.slice(0, 3).map(alert => `- ${alert.title} (${alert.severity})`).join('\n')}

**Risk Assessment:**
${criticalAlerts > 0 ? 'CRITICAL - Immediate action required' : 
  highAlerts > 0 ? 'HIGH - Urgent response needed' : 
  mediumAlerts > 0 ? 'MEDIUM - Timely response recommended' : 'LOW - Normal monitoring'}

**Recommended Actions:**
- Review and respond to critical and high severity alerts
- Monitor threat intelligence feeds for emerging threats
- Ensure security controls are properly configured
- Consider threat hunting activities for persistent threats
- Update incident response procedures as needed

**Threat Patterns:**
- Monitoring ${totalAlerts} security events across infrastructure
- Focus on ${criticalAlerts + highAlerts} high-priority threats
- Continuous assessment of threat landscape changes
      `.trim();

      return summary;
    } catch (error) {
      console.error('Summary generation error:', error)
      return 'Threat intelligence summary temporarily unavailable. Please check system status.'
    }
  }

  async enrichIOC(ioc: string, type: string) {
    // Validate IOC before enrichment
    const isValid = this.validateIOC({ type, value: ioc })
    if (!isValid) {
      return {
        analysis: `Invalid ${type} format: ${ioc}`,
        riskLevel: 'low' as const,
        recommendations: ['IOC failed validation - verify format and legitimacy'],
        relatedThreats: [],
        geolocation: 'Invalid',
        reputation: 'Invalid format'
      }
    }

    try {
      // REMOVE Groq API imports and client
      // This method will now use local fallback logic
      // For now, it will return a placeholder response
      console.warn('Enrichment functionality is currently unavailable due to missing Groq API.')
      return {
        analysis: 'Enrichment temporarily unavailable',
        riskLevel: 'medium' as const,
        recommendations: ['Monitor for suspicious activity', 'Consider blocking if confirmed malicious'],
        relatedThreats: [],
        geolocation: 'Unknown',
        reputation: 'Unknown'
      }
    } catch (error) {
      console.error('IOC enrichment error:', error)
      return {
        analysis: 'Enrichment temporarily unavailable',
        riskLevel: 'medium' as const,
        recommendations: ['Monitor for suspicious activity', 'Consider blocking if confirmed malicious'],
        relatedThreats: [],
        geolocation: 'Unknown',
        reputation: 'Unknown'
      }
    }
  }

  async parseSecurityFeed(feedContent: string, feedType: string) {
    try {
      // Clean and prepare content
      let cleanContent = feedContent
      
      // If it's HTML, extract text content
      if (feedContent.includes('<html') || feedContent.includes('<!DOCTYPE')) {
        const $ = cheerio.load(feedContent)
        cleanContent = $('body').text() || $('article').text() || $.text()
      }

      // Limit content size for API
      cleanContent = cleanContent.substring(0, 6000)

      // REMOVE Groq API imports and client
      // This method will now use local fallback logic
      // For now, it will return a placeholder response
      console.warn('Feed parsing functionality is currently unavailable due to missing Groq API.')
      return {
        threats: [],
        iocs: [],
        summary: 'Feed parsing temporarily unavailable',
        feedQuality: 0.5,
        relevantItems: 0
      }
    } catch (error) {
      console.error('Feed parsing error:', error)
      return {
        threats: [],
        iocs: [],
        summary: 'Feed parsing temporarily unavailable',
        feedQuality: 0.5,
        relevantItems: 0
      }
    }
  }

  async classifyThreatSeverity(indicators: any[]) {
    try {
      // REMOVE Groq API imports and client
      // This method will now use local fallback logic
      // For now, it will return a placeholder response
      console.warn('Severity classification functionality is currently unavailable due to missing Groq API.')
      return 'medium' as const
    } catch (error) {
      console.error('Severity classification error:', error)
      return 'medium' as const
    }
  }

  // Helper method to check if API key is configured
  isConfigured(): boolean {
    return false // No Groq API key needed for local fallback
  }

  // Export validation functions for external use
  static validateIP = validateIP
  static validateDomain = validateDomain
  static validateURL = validateURL
  static validateHash = validateHash
  static validateEmail = validateEmail
} 