'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, Eye, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Alert {
  id: string
  title: string
  description: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  type: 'ioc_detected' | 'campaign_detected' | 'anomaly' | 'custom'
  sourceType: string
  relatedIocs: string
  priority: number
  metadata: string
  createdAt: string
  updatedAt: string
}

interface AlertsOverviewProps {
  setActiveTab?: (tab: string) => void
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'investigating':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'resolved':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'false_positive':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'ioc_detected':
      return <Shield className="h-4 w-4" />
    case 'campaign_detected':
      return <AlertTriangle className="h-4 w-4" />
    case 'anomaly':
      return <Eye className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

export function AlertsOverview(props: AlertsOverviewProps = {}) {
  const { setActiveTab } = props
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch real data from our API
        const response = await fetch('/api/threat-intelligence/alerts?limit=5')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const alertsData = await response.json()
        console.log('Fetched alerts:', alertsData)
        
        setAlerts(alertsData)
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
        setError('Failed to load alerts')
        
        // Fallback to some basic sample data if API fails
        setAlerts([
          {
            id: '1',
            title: 'API Connection Error',
            description: 'Unable to fetch real-time alerts. Using sample data.',
            severity: 'medium',
            status: 'open',
            type: 'anomaly',
            sourceType: 'system',
            relatedIocs: '[]',
            priority: 2,
            metadata: '{}',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
    // Update every 2 minutes [[memory:2516569]]
    const interval = setInterval(fetchAlerts, 120000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error && alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
        <p>Error loading alerts</p>
        <p className="text-xs">{error}</p>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No alerts detected</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 w-full">
      {alerts.map((alert) => {
        // Parse related IOCs safely
        let relatedIocs: string[] = []
        try {
          relatedIocs = JSON.parse(alert.relatedIocs || '[]')
        } catch {
          relatedIocs = []
        }

        // Parse metadata safely
        let metadata: any = {}
        try {
          metadata = JSON.parse(alert.metadata || '{}')
        } catch {
          metadata = {}
        }

        return (
          <div key={alert.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-2 flex-1 min-w-0">
                <div className="mt-0.5 flex-shrink-0">
                  {getTypeIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h4 className="text-sm font-medium truncate pr-2" title={alert.title}>{alert.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words" title={alert.description || ''}>
                    {alert.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <Badge variant="outline" className={`${getSeverityColor(alert.severity)} text-xs px-2 py-0.5`}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={`${getStatusColor(alert.status)} text-xs px-2 py-0.5`}>
                      {alert.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {relatedIocs.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground break-all">
                        IOCs: {relatedIocs.slice(0, 2).join(', ')}
                        {relatedIocs.length > 2 && ` +${relatedIocs.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                  // Simulate opening alert details
                  console.log('Opening alert details for:', alert.id)
                  // Could navigate to detailed view or open modal
                }}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 