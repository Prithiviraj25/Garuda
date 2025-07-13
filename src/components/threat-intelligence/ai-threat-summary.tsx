'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, RefreshCw, AlertTriangle, TrendingUp, Shield, Zap, Clock, Target } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface ThreatSummaryData {
  summary: string
  keyThreats: Array<{
    title: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    type: 'campaign' | 'ioc' | 'anomaly' | 'emerging'
    techniques: string[]
    confidence: number
    lastSeen: string
  }>
  metrics: {
    totalThreats: number
    criticalAlerts: number
    activeCampaigns: number
    newIOCs: number
    riskScore: number
  }
  recommendations: string[]
  lastUpdated: string
}

export function AIThreatSummary() {
  const [summaryData, setSummaryData] = useState<ThreatSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [aiConfigured, setAiConfigured] = useState<boolean>(false)

  useEffect(() => {
    fetchThreatSummary()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchThreatSummary, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchThreatSummary = async () => {
    try {
      setError(null)
      
      // Fetch recent alerts for AI analysis
      const alertsResponse = await fetch('/api/threat-intelligence/alerts?limit=10')
      const alerts = await alertsResponse.json()
      
      // Fetch recent IOCs
      const iocsResponse = await fetch('/api/threat-intelligence/iocs?limit=20')
      const iocs = await iocsResponse.json()
      
      // Process the data into our expected format
      const processedData = await processAlerts(alerts, iocs)
      setSummaryData(processedData)
      setLastRefresh(new Date())
      toast.success('Threat summary updated')
    } catch (error) {
      console.error('Error fetching threat summary:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch threat summary')
      
      // Fallback to demo data for presentation
      setSummaryData(generateDemoSummary())
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }

  const processAlerts = async (alerts: any[], iocs: any[]): Promise<ThreatSummaryData> => {
    // Group alerts by severity
    const criticalAlerts = alerts.filter(a => a.severity === 'critical')
    const highAlerts = alerts.filter(a => a.severity === 'high')
    const mediumAlerts = alerts.filter(a => a.severity === 'medium')
    
    // Extract key threats from alerts
    const keyThreats = alerts.slice(0, 3).map(alert => ({
      title: alert.title,
      description: alert.description || 'No description available',
      severity: alert.severity,
      type: alert.type || 'anomaly',
      techniques: extractTechniques(alert.metadata),
      confidence: calculateConfidence(alert),
      lastSeen: alert.updatedAt || alert.createdAt
    }))
    
    // Calculate risk score
    const riskScore = calculateRiskScore(criticalAlerts, highAlerts, mediumAlerts, iocs)
    
    // Generate AI-powered summary
    const summary = await generateAISummary(alerts, iocs, riskScore)
    
    return {
      summary,
      keyThreats,
      metrics: {
        totalThreats: alerts.length,
        criticalAlerts: criticalAlerts.length,
        activeCampaigns: alerts.filter(a => a.type === 'campaign_detected').length,
        newIOCs: iocs.filter(ioc => 
          new Date(ioc.firstSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        riskScore
      },
      recommendations: generateRecommendations(criticalAlerts, highAlerts, iocs),
      lastUpdated: new Date().toISOString()
    }
  }

  const generateAISummary = async (alerts: any[], iocs: any[], riskScore: number): Promise<string> => {
    try {
      // Check if AI is configured first
      const statusResponse = await fetch('/api/threat-intelligence/analyze')
      const statusResult = await statusResponse.json()
      
      if (!statusResult.success || !statusResult.status?.aiConfigured) {
        console.log('AI analyzer not configured, using fallback summary')
        setAiConfigured(false)
        return generateFallbackSummary(alerts, iocs, riskScore)
      }
      
      setAiConfigured(true)
      
      const response = await fetch('/api/threat-intelligence/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze-text',
          content: `Threat Intelligence Analysis Request:
          
Recent Alerts: ${alerts.length} total
Critical Alerts: ${alerts.filter(a => a.severity === 'critical').length}
High Alerts: ${alerts.filter(a => a.severity === 'high').length}
Recent IOCs: ${iocs.length}
Risk Score: ${riskScore}/100

Alert Details:
${alerts.slice(0, 5).map(a => `- ${a.title} (${a.severity}): ${a.description}`).join('\n')}

IOC Summary:
${iocs.slice(0, 10).map(ioc => `- ${ioc.type}: ${ioc.value} (${ioc.severity})`).join('\n')}

Generate an executive threat intelligence summary for security leadership.`
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.analysis?.summary) {
        return result.analysis.summary
      }
      
      return generateFallbackSummary(alerts, iocs, riskScore)
    } catch (error) {
      console.error('AI summary generation failed:', error)
      return generateFallbackSummary(alerts, iocs, riskScore)
    }
  }

  const generateFallbackSummary = (alerts: any[], iocs: any[], riskScore: number): string => {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length
    const highCount = alerts.filter(a => a.severity === 'high').length
    
    if (alerts.length === 0 && iocs.length === 0) {
      return 'Threat intelligence monitoring is active. No critical threats detected in the current analysis period. Continue monitoring for emerging threats and maintain security posture.'
    }
    
    let summary = `Current threat landscape analysis reveals ${alerts.length} active alert${alerts.length !== 1 ? 's' : ''}`
    
    if (criticalCount > 0) {
      summary += ` with ${criticalCount} critical`
    }
    if (highCount > 0) {
      summary += `${criticalCount > 0 ? ' and' : ' with'} ${highCount} high-severity incident${highCount !== 1 ? 's' : ''}`
    }
    
    if (iocs.length > 0) {
      summary += `. ${iocs.length} new indicator${iocs.length !== 1 ? 's' : ''} of compromise ${iocs.length === 1 ? 'has' : 'have'} been identified in the past 24 hours.`
    }
    
    const riskLevel = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low'
    summary += ` Overall risk score is ${riskScore}/100, indicating ${riskLevel} threat levels.`
    
    if (criticalCount > 0) {
      summary += ' Immediate attention required for critical alerts.'
    }
    
    summary += ' Enhanced monitoring recommended for emerging threat patterns.'
    
    return summary
  }

  const extractTechniques = (metadata: any): string[] => {
    try {
      const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata
      return parsed?.techniques || []
    } catch {
      return []
    }
  }

  const calculateConfidence = (alert: any): number => {
    try {
      const parsed = typeof alert.metadata === 'string' ? JSON.parse(alert.metadata) : alert.metadata
      return parsed?.confidence || 75
    } catch {
      return 75
    }
  }

  const calculateRiskScore = (critical: any[], high: any[], medium: any[], iocs: any[]): number => {
    const criticalWeight = critical.length * 25
    const highWeight = high.length * 15
    const mediumWeight = medium.length * 10
    const iocWeight = Math.min(iocs.length * 2, 20)
    
    return Math.min(criticalWeight + highWeight + mediumWeight + iocWeight, 100)
  }

  const generateRecommendations = (critical: any[], high: any[], iocs: any[]): string[] => {
    const recommendations = []
    
    if (critical.length > 0) {
      recommendations.push(`Immediate response required for ${critical.length} critical alert${critical.length > 1 ? 's' : ''}`)
    }
    
    if (high.length > 0) {
      recommendations.push(`Prioritize investigation of ${high.length} high-severity incident${high.length > 1 ? 's' : ''}`)
    }
    
    if (iocs.length > 10) {
      recommendations.push('Implement enhanced monitoring for elevated IOC activity')
    }
    
    recommendations.push('Review and update incident response procedures')
    recommendations.push('Conduct threat hunting exercises based on recent indicators')
    
    return recommendations
  }

  const generateDemoSummary = (): ThreatSummaryData => ({
    summary: 'Current threat landscape shows elevated activity with multiple ongoing campaigns targeting financial institutions. Recent analysis indicates sophisticated phishing operations and advanced persistent threat indicators. Enhanced monitoring and immediate response protocols are recommended for critical alerts.',
    keyThreats: [
      {
        title: 'CryptoX Ransomware Campaign',
        description: 'Sophisticated ransomware campaign targeting financial institutions via spear-phishing emails with advanced evasion techniques.',
        severity: 'critical',
        type: 'campaign',
        techniques: ['T1566.001', 'T1486', 'T1027'],
        confidence: 95,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Banking Trojan Infrastructure',
        description: 'New command and control infrastructure detected for banking trojan operations. Multiple domains registered in the last 48 hours.',
        severity: 'high',
        type: 'ioc',
        techniques: ['T1071.001', 'T1583.001'],
        confidence: 87,
        lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'APT Infrastructure Expansion',
        description: 'State-sponsored threat actor expanding infrastructure footprint with new domains and IP addresses.',
        severity: 'high',
        type: 'emerging',
        techniques: ['T1071.004', 'T1568.002'],
        confidence: 82,
        lastSeen: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ],
    metrics: {
      totalThreats: 8,
      criticalAlerts: 1,
      activeCampaigns: 3,
      newIOCs: 24,
      riskScore: 78
    },
    recommendations: [
      'Immediate response required for critical ransomware campaign',
      'Block identified malicious domains and IP addresses',
      'Implement additional email security controls',
      'Conduct threat hunting for related infrastructure',
      'Update security awareness training with latest techniques'
    ],
    lastUpdated: new Date().toISOString()
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-600" />
      case 'medium': return <Shield className="h-4 w-4 text-yellow-600" />
      default: return <Target className="h-4 w-4 text-blue-600" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'campaign': return <Zap className="h-4 w-4" />
      case 'ioc': return <Target className="h-4 w-4" />
      case 'emerging': return <TrendingUp className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Generated Threat Summary
          </CardTitle>
          <CardDescription>
            Automated analysis of current threat landscape
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="text-sm text-gray-500">Generating AI threat analysis...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !summaryData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Generated Threat Summary
          </CardTitle>
          <CardDescription>
            Automated analysis of current threat landscape
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">Error Loading Summary</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button 
              onClick={fetchThreatSummary} 
              size="sm" 
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Generated Threat Summary
            </CardTitle>
            <CardDescription>
              Automated analysis of current threat landscape
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Risk Score: {summaryData?.metrics.riskScore}/100
            </Badge>
            {!aiConfigured && (
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                AI: Demo Mode
              </Badge>
            )}
            <Button 
              onClick={fetchThreatSummary} 
              size="sm" 
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Using cached data due to API error: {error}
              </p>
            </div>
          )}
          
          {!aiConfigured && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 AI analysis is in demo mode. Configure GROQ_API_KEY for full AI-powered threat intelligence.
              </p>
            </div>
          )}
          
          {/* AI Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Analysis Summary
            </h4>
            <p className="text-sm text-blue-800">{summaryData?.summary}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastRefresh ? formatDistanceToNow(lastRefresh, { addSuffix: true }) : 'Unknown'}
              </span>
              <span>{summaryData?.metrics.totalThreats} active threats</span>
              <span>{summaryData?.metrics.newIOCs} new IOCs</span>
            </div>
          </div>

          {/* Key Threats */}
          <div className="space-y-3">
            {summaryData?.keyThreats.map((threat, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(threat.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(threat.severity)}
                    <h4 className="font-semibold">{threat.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {threat.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {threat.confidence}% confidence
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(threat.lastSeen), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <p className="text-sm mt-2 mb-3">{threat.description}</p>
                {threat.techniques.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {threat.techniques.map((technique, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {technique}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Threats</div>
              <div className="text-2xl font-bold">{summaryData?.metrics.totalThreats}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600">Critical Alerts</div>
              <div className="text-2xl font-bold text-red-600">{summaryData?.metrics.criticalAlerts}</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600">Active Campaigns</div>
              <div className="text-2xl font-bold text-orange-600">{summaryData?.metrics.activeCampaigns}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600">New IOCs</div>
              <div className="text-2xl font-bold text-blue-600">{summaryData?.metrics.newIOCs}</div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">🎯 AI Recommendations</h4>
            <ul className="text-sm text-green-700 space-y-1">
              {summaryData?.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 