import { db } from '@/db'
import { iocs, alerts, threatCampaigns, threatFeeds } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { AIThreatAnalyzer } from './ai-analyzer'

export interface ReportData {
  title: string
  type: 'executive' | 'technical' | 'ioc' | 'campaign'
  timeframe: string
  generatedAt: string
  summary: string
  keyFindings: string[]
  recommendations: string[]
  metrics: any
  details: any
  charts?: any[]
}

export class ThreatReportGenerator {
  private static instance: ThreatReportGenerator
  private aiAnalyzer: AIThreatAnalyzer

  constructor() {
    this.aiAnalyzer = AIThreatAnalyzer.getInstance()
  }

  static getInstance(): ThreatReportGenerator {
    if (!ThreatReportGenerator.instance) {
      ThreatReportGenerator.instance = new ThreatReportGenerator()
    }
    return ThreatReportGenerator.instance
  }

  async generateExecutiveReport(timeframe: string = '7 days'): Promise<ReportData> {
    try {
      // Fetch data for the specified timeframe
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(timeframe.split(' ')[0]))

      const [recentIOCs, recentAlerts, activeCampaigns, feedStatus] = await Promise.all([
        db.select().from(iocs).where(sql`${iocs.lastSeen} >= ${startDate.toISOString()}`),
        db.select().from(alerts).where(sql`${alerts.createdAt} >= ${startDate.toISOString()}`),
        db.select().from(threatCampaigns).where(sql`${threatCampaigns.lastSeen} >= ${startDate.toISOString()}`),
        db.select().from(threatFeeds)
      ])

      // Calculate key metrics
      const metrics = {
        totalIOCs: recentIOCs.length,
        criticalAlerts: recentAlerts.filter(a => a.severity === 'critical').length,
        highAlerts: recentAlerts.filter(a => a.severity === 'high').length,
        activeCampaigns: activeCampaigns.length,
        activeFeedSources: feedStatus.filter(f => f.isActive).length,
        totalFeedSources: feedStatus.length,
        threatScore: this.calculateThreatScore(recentAlerts),
        topThreatTypes: this.getTopThreatTypes(recentIOCs),
        riskTrend: this.calculateRiskTrend(recentAlerts)
      }

      // Generate AI-powered executive summary
      const summary = await this.aiAnalyzer.generateThreatSummary(recentAlerts, timeframe)

      const keyFindings = [
        `${metrics.totalIOCs} new indicators of compromise identified`,
        `${metrics.criticalAlerts} critical alerts requiring immediate attention`,
        `${metrics.activeCampaigns} active threat campaigns detected`,
        `${metrics.activeFeedSources}/${metrics.totalFeedSources} threat intelligence feeds operational`,
        `Overall threat score: ${metrics.threatScore}/100`,
        `Top threat types: ${metrics.topThreatTypes.join(', ')}`
      ]

      const recommendations = [
        'Prioritize response to critical alerts within 4 hours',
        'Enhance monitoring for identified threat campaigns',
        'Review and update threat intelligence feed configurations',
        'Implement additional controls for high-risk IOCs',
        'Conduct threat hunting exercises based on recent TTPs',
        'Update security awareness training with latest threat trends'
      ]

      return {
        title: `Executive Threat Intelligence Report - ${timeframe}`,
        type: 'executive',
        timeframe,
        generatedAt: new Date().toISOString(),
        summary,
        keyFindings,
        recommendations,
        metrics,
        details: {
          alertsByType: this.groupAlertsByType(recentAlerts),
          iocsByType: this.groupIOCsByType(recentIOCs),
          campaignActivity: activeCampaigns.map(c => ({
            name: c.name,
            severity: c.severity,
            techniques: c.techniques,
            lastSeen: c.lastSeen
          }))
        }
      }

    } catch (error) {
      console.error('Executive report generation error:', error)
      throw new Error('Failed to generate executive report')
    }
  }

  async generateTechnicalReport(timeframe: string = '7 days'): Promise<ReportData> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(timeframe.split(' ')[0]))

      const [recentIOCs, recentAlerts, activeCampaigns] = await Promise.all([
        db.select().from(iocs).where(sql`${iocs.lastSeen} >= ${startDate.toISOString()}`),
        db.select().from(alerts).where(sql`${alerts.createdAt} >= ${startDate.toISOString()}`),
        db.select().from(threatCampaigns).where(sql`${threatCampaigns.lastSeen} >= ${startDate.toISOString()}`)
      ])

      const technicalDetails = {
        iocAnalysis: await this.performIOCAnalysis(recentIOCs),
        alertAnalysis: this.performAlertAnalysis(recentAlerts),
        campaignAnalysis: this.performCampaignAnalysis(activeCampaigns),
        mitreTechniques: this.extractMitreTechniques(recentAlerts, activeCampaigns),
        networkIndicators: this.extractNetworkIndicators(recentIOCs),
        fileIndicators: this.extractFileIndicators(recentIOCs)
      }

      const summary = `Technical analysis of ${recentIOCs.length} IOCs, ${recentAlerts.length} alerts, and ${activeCampaigns.length} campaigns over the past ${timeframe}.`

      return {
        title: `Technical Threat Intelligence Report - ${timeframe}`,
        type: 'technical',
        timeframe,
        generatedAt: new Date().toISOString(),
        summary,
        keyFindings: technicalDetails.iocAnalysis.keyFindings,
        recommendations: technicalDetails.iocAnalysis.recommendations,
        metrics: {
          totalIOCs: recentIOCs.length,
          networkIOCs: technicalDetails.networkIndicators.length,
          fileIOCs: technicalDetails.fileIndicators.length,
          uniqueTechniques: technicalDetails.mitreTechniques.length
        },
        details: technicalDetails
      }

    } catch (error) {
      console.error('Technical report generation error:', error)
      throw new Error('Failed to generate technical report')
    }
  }

  async generateIOCReport(timeframe: string = '7 days'): Promise<ReportData> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(timeframe.split(' ')[0]))

      const recentIOCs = await db.select().from(iocs).where(sql`${iocs.lastSeen} >= ${startDate.toISOString()}`)

      const iocDetails = {
        byType: this.groupIOCsByType(recentIOCs),
        bySeverity: this.groupIOCsBySeverity(recentIOCs),
        bySource: this.groupIOCsBySource(recentIOCs),
        byConfidence: this.groupIOCsByConfidence(recentIOCs),
        topDomains: this.getTopDomains(recentIOCs),
        topIPs: this.getTopIPs(recentIOCs),
        suspiciousPatterns: this.identifySuspiciousPatterns(recentIOCs)
      }

      const summary = `IOC analysis report covering ${recentIOCs.length} indicators across ${Object.keys(iocDetails.byType).length} different types.`

      return {
        title: `IOC Intelligence Report - ${timeframe}`,
        type: 'ioc',
        timeframe,
        generatedAt: new Date().toISOString(),
        summary,
        keyFindings: [
          `${recentIOCs.length} total IOCs identified`,
          `${iocDetails.bySeverity.critical || 0} critical severity indicators`,
          `${iocDetails.byType.domain || 0} malicious domains detected`,
          `${iocDetails.byType.ip || 0} suspicious IP addresses identified`,
          `${iocDetails.suspiciousPatterns.length} suspicious patterns detected`
        ],
        recommendations: [
          'Block all critical and high-severity IOCs at network perimeter',
          'Implement DNS sinkholing for malicious domains',
          'Monitor for lateral movement using IP indicators',
          'Update threat hunting rules with new IOC patterns',
          'Correlate IOCs with internal security logs'
        ],
        metrics: {
          totalIOCs: recentIOCs.length,
          ...iocDetails.bySeverity,
          ...iocDetails.byType
        },
        details: iocDetails
      }

    } catch (error) {
      console.error('IOC report generation error:', error)
      throw new Error('Failed to generate IOC report')
    }
  }

  async generateCampaignReport(campaignId?: string): Promise<ReportData> {
    try {
      let campaigns
      if (campaignId) {
        campaigns = await db.select().from(threatCampaigns).where(sql`${threatCampaigns.id} = ${campaignId}`)
      } else {
        campaigns = await db.select().from(threatCampaigns).orderBy(sql`${threatCampaigns.lastSeen} DESC`).limit(10)
      }

      const campaignDetails = {
        campaigns: campaigns.map(c => ({
          name: c.name,
          actor: c.actor,
          family: c.family,
          severity: c.severity,
          confidence: c.confidence,
          techniques: c.techniques,
          targetSectors: c.targetSectors,
          timeline: {
            firstSeen: c.firstSeen,
            lastSeen: c.lastSeen
          }
        })),
        techniqueAnalysis: this.analyzeCampaignTechniques(campaigns),
        targetAnalysis: this.analyzeCampaignTargets(campaigns),
        actorProfiles: this.buildActorProfiles(campaigns)
      }

      const summary = campaignId ? 
        `Detailed analysis of campaign: ${campaigns[0]?.name || 'Unknown'}` :
        `Campaign intelligence report covering ${campaigns.length} active threat campaigns.`

      return {
        title: campaignId ? `Campaign Analysis: ${campaigns[0]?.name}` : 'Campaign Intelligence Report',
        type: 'campaign',
        timeframe: 'Current',
        generatedAt: new Date().toISOString(),
        summary,
        keyFindings: [
          `${campaigns.length} active campaigns analyzed`,
          `${campaignDetails.techniqueAnalysis.uniqueTechniques} unique MITRE techniques identified`,
          `${campaignDetails.targetAnalysis.sectors.length} target sectors identified`,
          `${campaignDetails.actorProfiles.length} distinct threat actors profiled`
        ],
        recommendations: [
          'Implement detection rules for identified techniques',
          'Enhance monitoring for targeted sectors',
          'Update threat actor attribution models',
          'Coordinate with industry partners on campaign intelligence',
          'Develop specific countermeasures for high-confidence campaigns'
        ],
        metrics: {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter(c => c.status === 'active').length,
          criticalCampaigns: campaigns.filter(c => c.severity === 'critical').length
        },
        details: campaignDetails
      }

    } catch (error) {
      console.error('Campaign report generation error:', error)
      throw new Error('Failed to generate campaign report')
    }
  }

  // Helper methods for data analysis
  private calculateThreatScore(alerts: any[]): number {
    if (alerts.length === 0) return 0
    
    const severityWeights = { critical: 4, high: 3, medium: 2, low: 1 }
    const totalWeight = alerts.reduce((sum, alert) => sum + (severityWeights[alert.severity as keyof typeof severityWeights] || 1), 0)
    const maxPossibleWeight = alerts.length * 4
    
    return Math.round((totalWeight / maxPossibleWeight) * 100)
  }

  private getTopThreatTypes(iocs: any[]): string[] {
    const typeCount = iocs.reduce((acc, ioc) => {
      acc[ioc.type] = (acc[ioc.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)
  }

  private calculateRiskTrend(alerts: any[]): 'increasing' | 'stable' | 'decreasing' {
    // Simple trend calculation based on recent vs older alerts
    const now = new Date()
    const midpoint = new Date(now.getTime() - (3.5 * 24 * 60 * 60 * 1000))
    
    const recentAlerts = alerts.filter(a => new Date(a.createdAt) > midpoint)
    const olderAlerts = alerts.filter(a => new Date(a.createdAt) <= midpoint)
    
    if (recentAlerts.length > olderAlerts.length * 1.2) return 'increasing'
    if (recentAlerts.length < olderAlerts.length * 0.8) return 'decreasing'
    return 'stable'
  }

  private groupAlertsByType(alerts: any[]): Record<string, number> {
    return alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private groupIOCsByType(iocs: any[]): Record<string, number> {
    return iocs.reduce((acc, ioc) => {
      acc[ioc.type] = (acc[ioc.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private groupIOCsBySeverity(iocs: any[]): Record<string, number> {
    return iocs.reduce((acc, ioc) => {
      acc[ioc.severity] = (acc[ioc.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private groupIOCsBySource(iocs: any[]): Record<string, number> {
    const sourceCount: Record<string, number> = {}
    iocs.forEach(ioc => {
      if (ioc.sources && Array.isArray(ioc.sources)) {
        ioc.sources.forEach((source: string) => {
          sourceCount[source] = (sourceCount[source] || 0) + 1
        })
      }
    })
    return sourceCount
  }

  private groupIOCsByConfidence(iocs: any[]): Record<string, number> {
    return iocs.reduce((acc, ioc) => {
      const confidence = parseFloat(ioc.confidence)
      const range = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low'
      acc[range] = (acc[range] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private getTopDomains(iocs: any[]): string[] {
    return iocs
      .filter(ioc => ioc.type === 'domain')
      .map(ioc => ioc.value)
      .slice(0, 10)
  }

  private getTopIPs(iocs: any[]): string[] {
    return iocs
      .filter(ioc => ioc.type === 'ip')
      .map(ioc => ioc.value)
      .slice(0, 10)
  }

  private identifySuspiciousPatterns(iocs: any[]): string[] {
    const patterns = []
    
    // Check for domain generation algorithm patterns
    const domains = iocs.filter(ioc => ioc.type === 'domain')
    const shortDomains = domains.filter(d => d.value.length < 8)
    if (shortDomains.length > 5) {
      patterns.push('Multiple short domains detected (possible DGA)')
    }
    
    // Check for IP clustering
    const ips = iocs.filter(ioc => ioc.type === 'ip')
    const ipRanges = new Set(ips.map(ip => ip.value.split('.').slice(0, 3).join('.')))
    if (ipRanges.size < ips.length * 0.5) {
      patterns.push('IP clustering detected (possible botnet infrastructure)')
    }
    
    return patterns
  }

  private async performIOCAnalysis(iocs: any[]): Promise<any> {
    const analysis = {
      keyFindings: [],
      recommendations: [],
      patterns: this.identifySuspiciousPatterns(iocs),
      riskAssessment: this.assessIOCRisk(iocs)
    }

    // Generate AI-powered insights if available
    if (this.aiAnalyzer.isConfigured() && iocs.length > 0) {
      try {
        const sampleIOCs = iocs.slice(0, 10).map(ioc => `${ioc.type}: ${ioc.value}`).join('\n')
        const aiInsights = await this.aiAnalyzer.analyzeContent(
          `IOC Analysis Request:\n${sampleIOCs}`,
          'IOC Analysis'
        )
        analysis.keyFindings.push(...aiInsights.recommendations.slice(0, 3))
      } catch (error) {
        console.error('AI IOC analysis error:', error)
      }
    }

    return analysis
  }

  private performAlertAnalysis(alerts: any[]): any {
    return {
      severityDistribution: this.groupAlertsByType(alerts),
      timelineAnalysis: this.analyzeAlertTimeline(alerts),
      correlationAnalysis: this.analyzeAlertCorrelations(alerts)
    }
  }

  private performCampaignAnalysis(campaigns: any[]): any {
    return {
      techniqueFrequency: this.analyzeCampaignTechniques(campaigns),
      targetAnalysis: this.analyzeCampaignTargets(campaigns),
      actorAttribution: this.buildActorProfiles(campaigns)
    }
  }

  private extractMitreTechniques(alerts: any[], campaigns: any[]): string[] {
    const techniques = new Set<string>()
    
    campaigns.forEach(campaign => {
      if (campaign.techniques && Array.isArray(campaign.techniques)) {
        campaign.techniques.forEach((technique: string) => techniques.add(technique))
      }
    })
    
    return Array.from(techniques)
  }

  private extractNetworkIndicators(iocs: any[]): any[] {
    return iocs.filter(ioc => ['ip', 'domain', 'url'].includes(ioc.type))
  }

  private extractFileIndicators(iocs: any[]): any[] {
    return iocs.filter(ioc => ['hash', 'file'].includes(ioc.type))
  }

  private analyzeCampaignTechniques(campaigns: any[]): any {
    const techniqueCount: Record<string, number> = {}
    let uniqueTechniques = 0
    
    campaigns.forEach(campaign => {
      if (campaign.techniques && Array.isArray(campaign.techniques)) {
        campaign.techniques.forEach((technique: string) => {
          techniqueCount[technique] = (techniqueCount[technique] || 0) + 1
        })
      }
    })
    
    uniqueTechniques = Object.keys(techniqueCount).length
    
    return { techniqueCount, uniqueTechniques }
  }

  private analyzeCampaignTargets(campaigns: any[]): any {
    const sectors = new Set<string>()
    
    campaigns.forEach(campaign => {
      if (campaign.targetSectors && Array.isArray(campaign.targetSectors)) {
        campaign.targetSectors.forEach((sector: string) => sectors.add(sector))
      }
    })
    
    return { sectors: Array.from(sectors) }
  }

  private buildActorProfiles(campaigns: any[]): any[] {
    const actors = new Map<string, any>()
    
    campaigns.forEach(campaign => {
      if (campaign.actor) {
        if (!actors.has(campaign.actor)) {
          actors.set(campaign.actor, {
            name: campaign.actor,
            campaigns: [],
            techniques: new Set(),
            targets: new Set()
          })
        }
        
        const actor = actors.get(campaign.actor)
        actor.campaigns.push(campaign.name)
        
        if (campaign.techniques) {
          campaign.techniques.forEach((technique: string) => actor.techniques.add(technique))
        }
        
        if (campaign.targetSectors) {
          campaign.targetSectors.forEach((sector: string) => actor.targets.add(sector))
        }
      }
    })
    
    return Array.from(actors.values()).map(actor => ({
      ...actor,
      techniques: Array.from(actor.techniques),
      targets: Array.from(actor.targets)
    }))
  }

  private assessIOCRisk(iocs: any[]): any {
    const totalIOCs = iocs.length
    const criticalIOCs = iocs.filter(ioc => ioc.severity === 'critical').length
    const highIOCs = iocs.filter(ioc => ioc.severity === 'high').length
    
    const riskScore = totalIOCs > 0 ? 
      Math.round(((criticalIOCs * 4 + highIOCs * 3) / (totalIOCs * 4)) * 100) : 0
    
    return {
      riskScore,
      riskLevel: riskScore >= 75 ? 'Critical' : riskScore >= 50 ? 'High' : riskScore >= 25 ? 'Medium' : 'Low',
      criticalCount: criticalIOCs,
      highCount: highIOCs
    }
  }

  private analyzeAlertTimeline(alerts: any[]): any {
    const timeline: Record<string, number> = {}
    
    alerts.forEach(alert => {
      const date = new Date(alert.createdAt).toISOString().split('T')[0]
      timeline[date] = (timeline[date] || 0) + 1
    })
    
    return timeline
  }

  private analyzeAlertCorrelations(alerts: any[]): any {
    // Simple correlation analysis
    const correlations: Record<string, string[]> = {}
    
    alerts.forEach(alert => {
      if (alert.relatedIocs && Array.isArray(alert.relatedIocs)) {
        alert.relatedIocs.forEach((ioc: string) => {
          if (!correlations[ioc]) {
            correlations[ioc] = []
          }
          correlations[ioc].push(alert.id)
        })
      }
    })
    
    return correlations
  }

  // Report formatting methods
  formatAsMarkdown(report: ReportData): string {
    let markdown = `# ${report.title}\n\n`
    markdown += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n`
    markdown += `**Timeframe:** ${report.timeframe}\n\n`
    
    markdown += `## Executive Summary\n\n${report.summary}\n\n`
    
    markdown += `## Key Findings\n\n`
    report.keyFindings.forEach(finding => {
      markdown += `- ${finding}\n`
    })
    
    markdown += `\n## Recommendations\n\n`
    report.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`
    })
    
    markdown += `\n## Metrics\n\n`
    Object.entries(report.metrics).forEach(([key, value]) => {
      markdown += `- **${key}**: ${value}\n`
    })
    
    return markdown
  }

  formatAsHTML(report: ReportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; }
        ul { list-style-type: disc; margin-left: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
        <p><strong>Timeframe:</strong> ${report.timeframe}</p>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <p>${report.summary}</p>
    </div>
    
    <div class="section">
        <h2>Key Findings</h2>
        <ul>
            ${report.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    
    <div class="section">
        <h2>Metrics</h2>
        ${Object.entries(report.metrics).map(([key, value]) => 
          `<div class="metric"><strong>${key}:</strong> ${value}</div>`
        ).join('')}
    </div>
</body>
</html>
    `
  }
} 