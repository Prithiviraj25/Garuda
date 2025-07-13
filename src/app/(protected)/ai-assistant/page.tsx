'use client'

import { useState, useEffect } from 'react'
import { ThreatChatbot } from '@/components/threat-intelligence/threat-chatbot'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Activity, Shield, AlertTriangle, TrendingUp, RefreshCw, Zap, Network, Search, Target, BarChart3, Download, Eye } from 'lucide-react'

interface AIAssistantMetrics {
  totalQueries: number
  activeContext: number
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  lastUpdated: string
  responseTime: number
  accuracy: number
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  prompt: string
  category: 'analysis' | 'research' | 'response'
}

export default function AIAssistantPage() {
  const [metrics, setMetrics] = useState<AIAssistantMetrics>({
    totalQueries: 74,
    activeContext: 13,
    threatLevel: 'high',
    lastUpdated: new Date().toISOString(),
    responseTime: 1.2,
    accuracy: 98
  })
  
  const [quickActions] = useState<QuickAction[]>([
    {
      id: '1',
      title: 'Threat Summary',
      description: 'Get current threat landscape overview',
      icon: Shield,
      prompt: 'Give me a comprehensive summary of the current threat landscape based on our latest intelligence',
      category: 'analysis'
    },
    {
      id: '2',
      title: 'IOC Analysis',
      description: 'Analyze recent indicators',
      icon: Search,
      prompt: 'Analyze our most recent IOCs and explain their significance and potential impact',
      category: 'analysis'
    },
    {
      id: '3',
      title: 'MITRE Mapping',
      description: 'Map threats to ATT&CK framework',
      icon: Network,
      prompt: 'Map our current threats to the MITRE ATT&CK framework and explain the tactics being used',
      category: 'research'
    },
    {
      id: '4',
      title: 'Risk Assessment',
      description: 'Evaluate current risk levels',
      icon: BarChart3,
      prompt: 'Assess our current risk levels and recommend priority actions based on threat intelligence',
      category: 'response'
    },
    {
      id: '5',
      title: 'Threat Campaigns',
      description: 'Break down attack patterns and TTPs',
      icon: Target,
      prompt: 'Analyze current threat campaigns and break down their attack patterns and TTPs',
      category: 'research'
    },
    {
      id: '6',
      title: 'Mitigation Strategies',
      description: 'Provide actionable defense recommendations',
      icon: Shield,
      prompt: 'Provide specific mitigation strategies and actionable defense recommendations for current threats',
      category: 'response'
    }
  ])

  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  useEffect(() => {
    // Update metrics periodically
    const updateMetrics = () => {
      setMetrics(prev => ({
        ...prev,
        totalQueries: prev.totalQueries + Math.floor(Math.random() * 3),
        activeContext: Math.floor(Math.random() * 8) + 10,
        lastUpdated: new Date().toISOString()
      }))
    }
    
    // Update every 2 minutes to match user preference
    const interval = setInterval(updateMetrics, 2 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getIconColor = (category: string) => {
    switch (category) {
      case 'analysis': return 'text-blue-500'
      case 'research': return 'text-purple-500'
      case 'response': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Threat Assistant</h2>
          <p className="text-muted-foreground">
            Expert cybersecurity analyst powered by advanced AI
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="text-white" variant={getThreatLevelColor(metrics.threatLevel)}>
            Threat Level: {metrics.threatLevel.toUpperCase()}
          </Badge>
          <Badge variant="outline">
            <Zap className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Context</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeContext}</div>
            <p className="text-xs text-muted-foreground">
              IOCs & Alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queries Today</CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              AI Interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime}s</div>
            <p className="text-xs text-muted-foreground">
              Avg. Response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Analysis Accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Pre-configured threat analysis queries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <div
                key={action.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedAction === action.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedAction(action.id)}
              >
                <div className="flex items-start gap-3">
                  <action.icon className={`h-5 w-5 mt-1 ${getIconColor(action.category)}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {action.category}
                    </Badge>
                  </div>
                  {selectedAction === action.id && (
                    <Eye className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Threat Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Threat Assistant
          </CardTitle>
          <CardDescription>
            Expert cybersecurity analyst powered by advanced AI
          </CardDescription>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {metrics.activeContext} IOCs
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              4 Alerts
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              Live Context
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ThreatChatbot 
            selectedAction={selectedAction ? quickActions.find(a => a.id === selectedAction) : null}
            onClearSelection={() => setSelectedAction(null)}
          />
        </CardContent>
      </Card>
    </div>
  )
} 