'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface FeedStatus {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'error' | 'syncing'
  lastSync: string | null
  syncInterval: number
  isActive: boolean
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'inactive':
      return <XCircle className="h-4 w-4 text-gray-500" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'syncing':
      return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant="secondary" className="text-green-700 bg-green-50 border-green-200">Active</Badge>
    case 'inactive':
      return <Badge variant="secondary" className="text-gray-700 bg-gray-50 border-gray-200">Inactive</Badge>
    case 'error':
      return <Badge variant="destructive">Error</Badge>
    case 'syncing':
      return <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200">Syncing</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

export function ThreatFeedStatus() {
  const [feeds, setFeeds] = useState<FeedStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch real data from our API
        const response = await fetch('/api/threat-intelligence/feeds')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const feedsData = await response.json()
        console.log('Fetched feeds:', feedsData)
        
        // Transform the API data to match our interface
        const transformedFeeds = feedsData.map((feed: any) => ({
          id: feed.id,
          name: feed.name,
          type: feed.type,
          status: feed.isActive ? 'active' : 'inactive',
          lastSync: feed.lastSync,
          syncInterval: feed.syncInterval || 3600,
          isActive: feed.isActive
        }))
        
        setFeeds(transformedFeeds)
      } catch (error) {
        console.error('Failed to fetch feeds:', error)
        setError('Failed to load feeds')
        
        // Fallback to sample data if API fails
        setFeeds([
          {
            id: '1',
            name: 'URLhaus',
            type: 'urlhaus',
            status: 'error',
            lastSync: new Date().toISOString(),
            syncInterval: 300,
            isActive: false
          },
          {
            id: '2',
            name: 'API Error',
            type: 'system',
            status: 'error',
            lastSync: null,
            syncInterval: 0,
            isActive: false
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchFeeds()
    // Update every 2 minutes [[memory:2516569]]
    const interval = setInterval(fetchFeeds, 120000)

    return () => clearInterval(interval)
  }, [])

  const getNextSyncTime = (lastSync: string | null, interval: number) => {
    if (!lastSync) return 'Never synced'
    const lastSyncDate = new Date(lastSync)
    const nextSync = new Date(lastSyncDate.getTime() + interval * 1000)
    const now = new Date()
    if (nextSync <= now) return 'Syncing...'
    return formatDistanceToNow(nextSync, { addSuffix: true })
  }

  const getFeedStatus = (feed: FeedStatus): 'active' | 'inactive' | 'error' | 'syncing' => {
    if (!feed.isActive) return 'inactive'
    if (!feed.lastSync) return 'error'
    
    const now = new Date()
    const lastSyncDate = new Date(feed.lastSync)
    const timeSinceLastSync = now.getTime() - lastSyncDate.getTime()
    const expectedInterval = feed.syncInterval * 1000
    
    if (timeSinceLastSync > expectedInterval * 2) return 'error'
    if (timeSinceLastSync > expectedInterval * 1.5) return 'syncing'
    return 'active'
  }

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

  if (error && feeds.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50 text-orange-500" />
        <p>Error loading feeds</p>
        <p className="text-xs">{error}</p>
      </div>
    )
  }

  const activeFeeds = feeds.filter(feed => feed.isActive)
  const totalFeeds = feeds.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Feed Status</p>
          <p className="text-xs text-muted-foreground">
            {activeFeeds.length}/{totalFeeds} feeds active
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {feeds.some(f => getFeedStatus(f) === 'syncing') ? 'Syncing' : 'Up to date'}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {feeds.map((feed) => {
          const status = getFeedStatus(feed)
          return (
            <div key={feed.id} className="p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status)}
                  <div>
                    <p className="text-sm font-medium">{feed.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {feed.lastSync 
                        ? `Last sync: ${formatDistanceToNow(new Date(feed.lastSync), { addSuffix: true })}`
                        : 'Never synced'
                      }
                    </p>
                  </div>
                </div>
                {getStatusBadge(status)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Next sync: {getNextSyncTime(feed.lastSync, feed.syncInterval)}
              </div>
            </div>
          )
        })}
      </div>
      
      {error && (
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <p className="text-sm text-orange-800">
            ⚠️ Some feeds may not be showing current data due to connectivity issues.
          </p>
        </div>
      )}
    </div>
  )
} 