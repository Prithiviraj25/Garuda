import { NextResponse } from 'next/server'
import { db } from '@/db'
import { iocs, alerts, threatCampaigns } from '@/db/schema'
import { eq, or, like, sql } from 'drizzle-orm'
import { AIThreatAnalyzer } from '@/lib/threat-intelligence/ai-analyzer'

// External enrichment sources
const enrichFromVirusTotal = async (ioc: string, type: string) => {
  // Mock VirusTotal enrichment (would use real API)
  return {
    source: 'VirusTotal',
    reputation: type === 'ip' ? 'Malicious' : 'Suspicious',
    detections: Math.floor(Math.random() * 50),
    scanDate: new Date().toISOString(),
    engines: 67
  }
}

const enrichFromAbuseIPDB = async (ip: string) => {
  // Mock AbuseIPDB enrichment (would use real API)
  return {
    source: 'AbuseIPDB',
    abuseConfidence: Math.floor(Math.random() * 100),
    country: 'US',
    isp: 'Example ISP',
    lastReported: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}

const enrichFromPassiveDNS = async (domain: string) => {
  // Mock Passive DNS enrichment
  return {
    source: 'PassiveDNS',
    firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastSeen: new Date().toISOString(),
    resolutions: [
      { ip: '192.168.1.100', firstSeen: new Date().toISOString() },
      { ip: '10.0.0.50', firstSeen: new Date().toISOString() }
    ]
  }
}

const detectIOCType = (query: string): string => {
  // IP address detection
  if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(query)) {
    return 'ip'
  }
  
  // Domain detection
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(query)) {
    return 'domain'
  }
  
  // URL detection
  if (/^https?:\/\//.test(query)) {
    return 'url'
  }
  
  // Hash detection
  if (/^[a-fA-F0-9]{32}$/.test(query)) return 'md5'
  if (/^[a-fA-F0-9]{40}$/.test(query)) return 'sha1'
  if (/^[a-fA-F0-9]{64}$/.test(query)) return 'sha256'
  if (/^[a-fA-F0-9]{128}$/.test(query)) return 'sha512'
  
  // Email detection
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) {
    return 'email'
  }
  
  // CVE detection
  if (/^CVE-\d{4}-\d{4,}$/i.test(query)) {
    return 'cve'
  }
  
  return 'unknown'
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    
    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      )
    }
    
    const searchQuery = query.trim().toLowerCase()
    const iocType = detectIOCType(searchQuery)
    
    // Search in local database
    const localResults = await db
      .select()
      .from(iocs)
      .where(
        or(
          eq(iocs.value, searchQuery),
          like(iocs.value, `%${searchQuery}%`)
        )
      )
      .limit(10)
    
    // Search related alerts
    const relatedAlerts = await db
      .select()
      .from(alerts)
      .where(
        or(
          like(alerts.title, `%${searchQuery}%`),
          like(alerts.description, `%${searchQuery}%`)
        )
      )
      .limit(5)
    
    // Search related campaigns
    const relatedCampaigns = await db
      .select()
      .from(threatCampaigns)
      .where(
        or(
          like(threatCampaigns.name, `%${searchQuery}%`),
          like(threatCampaigns.description, `%${searchQuery}%`)
        )
      )
      .limit(5)
    
    // External enrichment based on IOC type
    let enrichment: any = {}
    
    if (iocType === 'ip') {
      const [vtData, abuseData] = await Promise.all([
        enrichFromVirusTotal(searchQuery, 'ip'),
        enrichFromAbuseIPDB(searchQuery)
      ])
      enrichment = { virusTotal: vtData, abuseIPDB: abuseData }
    } else if (iocType === 'domain') {
      const [vtData, dnsData] = await Promise.all([
        enrichFromVirusTotal(searchQuery, 'domain'),
        enrichFromPassiveDNS(searchQuery)
      ])
      enrichment = { virusTotal: vtData, passiveDNS: dnsData }
    } else if (['md5', 'sha1', 'sha256', 'sha512'].includes(iocType)) {
      enrichment.virusTotal = await enrichFromVirusTotal(searchQuery, 'hash')
    }
    
    // AI-powered analysis
    let aiAnalysis = null
    try {
      const analyzer = AIThreatAnalyzer.getInstance()
      if (analyzer.isConfigured()) {
        aiAnalysis = await analyzer.enrichIOC(searchQuery, iocType === 'unknown' ? 'domain' : iocType)
      }
    } catch (error) {
      console.error('AI analysis failed:', error)
    }
    
    // Calculate risk score
    let riskScore = 0
    if (localResults.length > 0) {
      const severityScores = { low: 25, medium: 50, high: 75, critical: 100 }
      riskScore = Math.max(...localResults.map(ioc => severityScores[ioc.severity as keyof typeof severityScores] || 0))
    }
    
    // Add external reputation scores
    if (enrichment.virusTotal?.detections) {
      riskScore = Math.max(riskScore, Math.min(enrichment.virusTotal.detections * 2, 100))
    }
    
    if (enrichment.abuseIPDB?.abuseConfidence) {
      riskScore = Math.max(riskScore, enrichment.abuseIPDB.abuseConfidence)
    }
    
    // Generate recommendations
    const recommendations = []
    if (riskScore >= 80) {
      recommendations.push('🚨 BLOCK IMMEDIATELY - High risk indicator')
      recommendations.push('📊 Add to threat intelligence feeds')
      recommendations.push('🔍 Investigate related infrastructure')
    } else if (riskScore >= 50) {
      recommendations.push('⚠️ Monitor closely - Potential threat')
      recommendations.push('🔍 Correlate with other indicators')
      recommendations.push('📝 Document for future reference')
    } else if (riskScore >= 25) {
      recommendations.push('👀 Low risk - Continue monitoring')
      recommendations.push('📋 Add to watchlist')
    } else {
      recommendations.push('✅ No immediate threat detected')
      recommendations.push('📊 Consider for baseline analysis')
    }
    
    // MITRE ATT&CK mapping
    const mitreTechniques = []
    if (iocType === 'ip' && riskScore >= 50) {
      mitreTechniques.push('T1071.001', 'T1041', 'T1095')
    }
    if (iocType === 'domain' && riskScore >= 50) {
      mitreTechniques.push('T1071.004', 'T1568', 'T1583.001')
    }
    if (['md5', 'sha1', 'sha256', 'sha512'].includes(iocType)) {
      mitreTechniques.push('T1027', 'T1055', 'T1105')
    }
    
    const result = {
      success: true,
      query: searchQuery,
      type: iocType,
      riskScore,
      riskLevel: riskScore >= 80 ? 'critical' : 
                 riskScore >= 50 ? 'high' : 
                 riskScore >= 25 ? 'medium' : 'low',
      localResults: localResults.map(ioc => ({
        id: ioc.id,
        type: ioc.type,
        value: ioc.value,
        description: ioc.description,
        severity: ioc.severity,
        confidence: ioc.confidence,
        sources: ioc.sources,
        firstSeen: ioc.firstSeen,
        lastSeen: ioc.lastSeen,
        tags: ioc.tags
      })),
      enrichment,
      aiAnalysis,
      relatedAlerts: relatedAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        status: alert.status,
        createdAt: alert.createdAt
      })),
      relatedCampaigns: relatedCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        severity: campaign.severity,
        actor: campaign.actor,
        family: campaign.family
      })),
      recommendations,
      mitreTechniques,
      searchMetadata: {
        searchTime: new Date().toISOString(),
        resultsCount: localResults.length,
        enrichmentSources: Object.keys(enrichment),
        hasAiAnalysis: !!aiAnalysis
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 