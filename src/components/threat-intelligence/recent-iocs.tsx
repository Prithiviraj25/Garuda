'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, ExternalLink, Shield, Globe, Hash, Mail, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface IOC {
  id: string
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'file'
  value: string
  description: string | null
  confidence: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags: string
  sources: string
  firstSeen: string
  lastSeen: string
  isActive: boolean
  metadata: string
  createdAt: string
  updatedAt: string
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'ip':
      return <Globe className="h-4 w-4" />
    case 'domain':
    case 'url':
      return <Globe className="h-4 w-4" />
    case 'hash':
    case 'file':
      return <Hash className="h-4 w-4" />
    case 'email':
      return <Mail className="h-4 w-4" />
    default:
      return <Shield className="h-4 w-4" />
  }
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

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch (err) {
    toast.error('Failed to copy')
  }
}

export function RecentIOCs() {
  const [iocs, setIocs] = useState<IOC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    limit: 10
  })
  const [filtersApplied, setFiltersApplied] = useState(false)

  const fetchIOCs = async (applyFilters = false) => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: filters.limit.toString()
      })
      
      // Add filters if they are not 'all'
      if (applyFilters) {
        if (filters.type !== 'all') {
          params.append('type', filters.type)
        }
        if (filters.severity !== 'all') {
          params.append('severity', filters.severity)
        }
        setFiltersApplied(true)
      } else {
        setFiltersApplied(false)
      }
      
      // Fetch real data from our API
      const response = await fetch(`/api/threat-intelligence/iocs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const iocsData = await response.json()
      console.log('Fetched IOCs:', iocsData)
      
      setIocs(iocsData)
    } catch (error) {
      console.error('Failed to fetch IOCs:', error)
      setError('Failed to load IOCs')
      
      // Fallback to sample data if API fails
      setIocs([
        {
          id: '1',
          type: 'ip',
          value: '192.168.1.100',
          description: 'API connection error - using sample data',
          confidence: 85,
          severity: 'medium',
          tags: '["api-error", "sample"]',
          sources: '["system"]',
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          isActive: true,
          metadata: '{}',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    fetchIOCs(true)
  }

  const clearFilters = () => {
    setFilters({
      type: 'all',
      severity: 'all',
      limit: 10
    })
    setFiltersApplied(false)
    fetchIOCs(false)
  }

  useEffect(() => {
    fetchIOCs()
    // Update every 2 minutes [[memory:2516569]]
    const interval = setInterval(() => fetchIOCs(filtersApplied), 120000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 rounded-lg border bg-card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error && iocs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
        <p>Error loading IOCs</p>
        <p className="text-xs">{error}</p>
      </div>
    )
  }

  if (iocs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>{filtersApplied ? 'No IOCs match the applied filters' : 'No IOCs detected yet'}</p>
        {filtersApplied && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="mt-2"
          >
            Clear Filters
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Latest indicators with filtering options</h3>
          {filtersApplied && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs"
            >
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ip">IP</SelectItem>
              <SelectItem value="domain">Domain</SelectItem>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="hash">Hash</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="file">File</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.severity}
            onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={applyFilters}
            disabled={loading}
            size="sm"
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Apply Filters
          </Button>
        </div>
        
        {filtersApplied && (
          <div className="text-xs text-muted-foreground">
            Showing filtered results
            {filters.type !== 'all' && ` • Type: ${filters.type}`}
            {filters.severity !== 'all' && ` • Severity: ${filters.severity}`}
          </div>
        )}
      </div>
      
      {/* IOCs List */}
      <div className="space-y-3">
        {iocs.map((ioc) => {
        // Parse tags and sources safely
        let tags: string[] = []
        let sources: string[] = []
        try {
          tags = JSON.parse(ioc.tags || '[]')
          sources = JSON.parse(ioc.sources || '[]')
        } catch {
          tags = []
          sources = []
        }

        return (
          <div key={ioc.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="mt-1">
                  {getTypeIcon(ioc.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono truncate">{ioc.value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(ioc.value)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {ioc.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {ioc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getSeverityColor(ioc.severity)}>
                      {ioc.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(ioc.confidence)}% conf.
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ioc.lastSeen), { addSuffix: true })}
                    </span>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  {sources.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs text-muted-foreground">
                        Sources: {sources.slice(0, 2).join(', ')}
                        {sources.length > 2 && ` +${sources.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // Open IOC details in a new tab or copy to clipboard
                  copyToClipboard(ioc.value)
                  toast.success(`IOC ${ioc.value} copied to clipboard`)
                }}
                title="Copy IOC to clipboard"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
} 