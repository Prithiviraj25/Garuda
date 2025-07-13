'use client'

import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { feature } from 'topojson-client'

interface ThreatLocation {
  lat: number
  lng: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  count: number
  country: string
  city?: string
}

interface WorldMapProps {
  threats: ThreatLocation[]
}

function WorldMap({ threats }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [worldData, setWorldData] = useState<any>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    content: string
  }>({ visible: false, x: 0, y: 0, content: '' })

  // Load world map data
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        // Using a public world map JSON
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/world-110m.json')
        const world = await response.json()
        setWorldData(world)
      } catch (error) {
        console.error('Failed to load world map data:', error)
        // Fallback to simple world outline
        setWorldData(null)
      }
    }
    loadWorldData()
  }, [])

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 800
    const height = 400
    
    // Set up projection
    const projection = d3.geoNaturalEarth1()
      .scale(130)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    // Create main group
    const g = svg.append('g')

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Draw world map if data is available
    if (worldData) {
      const countries = feature(worldData, worldData.objects.countries) as any
      
      g.selectAll('.country')
        .data(countries.features)
        .enter().append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', '#f8fafc')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('fill', '#e2e8f0')
        })
        .on('mouseout', function(event, d) {
          d3.select(this).attr('fill', '#f8fafc')
        })
    } else {
      // Fallback: simple world outline
      g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#f8fafc')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1)
        .attr('rx', 8)
    }

    // Add graticule (grid lines)
    const graticule = d3.geoGraticule()
    g.append('path')
      .datum(graticule())
      .attr('class', 'graticule')
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 0.3)
      .attr('opacity', 0.5)

    // Add threat points
    const threatGroups = g.selectAll('.threat-point')
      .data(threats)
      .enter().append('g')
      .attr('class', 'threat-point')
      .attr('transform', d => {
        const coords = projection([d.lng, d.lat])
        return coords ? `translate(${coords[0]}, ${coords[1]})` : 'translate(0,0)'
      })

    // Add threat circles with pulsing animation
    threatGroups.each(function(d) {
      const group = d3.select(this)
      
      // Get color and size based on severity
      const getColor = (severity: string) => {
        switch (severity) {
          case 'critical': return '#dc2626'
          case 'high': return '#ea580c'
          case 'medium': return '#ca8a04'
          case 'low': return '#2563eb'
          default: return '#6b7280'
        }
      }

      const getSize = (severity: string) => {
        switch (severity) {
          case 'critical': return 8
          case 'high': return 6
          case 'medium': return 4
          case 'low': return 3
          default: return 2
        }
      }

      const color = getColor(d.severity)
      const size = getSize(d.severity)

      // Add outer pulsing circle
      group.append('circle')
        .attr('r', size * 2)
        .attr('fill', color)
        .attr('opacity', 0.2)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('r', size * 3)
        .attr('opacity', 0)
        .on('end', function() {
          d3.select(this).attr('r', size * 2).attr('opacity', 0.2)
        })

      // Add main circle
      group.append('circle')
        .attr('r', size)
        .attr('fill', color)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1)
        .attr('opacity', 0.9)

      // Add hover effects
      group
        .on('mouseover', function(event) {
          d3.select(this).select('circle:last-child')
            .transition()
            .duration(200)
            .attr('r', size * 1.5)
            .attr('opacity', 1)

          const [x, y] = d3.pointer(event, svg.node())
          setTooltip({
            visible: true,
            x: x + 10,
            y: y - 10,
            content: `
              <div class="font-medium">${d.country}${d.city ? ` - ${d.city}` : ''}</div>
              <div class="text-sm">Threats: ${d.count}</div>
              <div class="text-sm">Severity: ${d.severity}</div>
              <div class="text-xs text-gray-400">Lat: ${d.lat.toFixed(2)}, Lng: ${d.lng.toFixed(2)}</div>
            `
          })
        })
        .on('mouseout', function() {
          d3.select(this).select('circle:last-child')
            .transition()
            .duration(200)
            .attr('r', size)
            .attr('opacity', 0.9)

          setTooltip(prev => ({ ...prev, visible: false }))
        })
    })

         // Restart pulsing animation
     const restartPulse = () => {
       g.selectAll('.threat-point circle:first-child')
         .transition()
         .duration(2000)
         .ease(d3.easeLinear)
         .attr('r', function(this: SVGCircleElement) {
           const parentGroup = this.parentNode as SVGGElement
           const severity = d3.select(parentGroup).datum() as ThreatLocation
           return getSize(severity.severity) * 3
         })
         .attr('opacity', 0)
         .on('end', function(this: SVGCircleElement) {
           const parentGroup = this.parentNode as SVGGElement
           const severity = d3.select(parentGroup).datum() as ThreatLocation
           d3.select(this)
             .attr('r', getSize(severity.severity) * 2)
             .attr('opacity', 0.2)
         })
     }

    const pulseInterval = setInterval(restartPulse, 2000)

    return () => {
      clearInterval(pulseInterval)
    }

  }, [worldData, threats])

  const getSize = (severity: string) => {
    switch (severity) {
      case 'critical': return 8
      case 'high': return 6
      case 'medium': return 4
      case 'low': return 3
      default: return 2
    }
  }

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        width="100%"
        height="400"
        viewBox="0 0 800 400"
        className="border rounded-lg bg-slate-50"
      />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none z-10 bg-black/90 text-white p-2 rounded text-xs whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border">
        <div className="text-xs font-medium mb-2">Threat Severity</div>
        {[
          { severity: 'critical', color: '#dc2626', label: 'Critical' },
          { severity: 'high', color: '#ea580c', label: 'High' },
          { severity: 'medium', color: '#ca8a04', label: 'Medium' },
          { severity: 'low', color: '#2563eb', label: 'Low' }
        ].map(({ severity, color, label }) => (
          <div key={severity} className="flex items-center gap-2 text-xs mb-1">
            <div
              className="w-3 h-3 rounded-full border border-white"
              style={{ backgroundColor: color }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border">
        <div className="text-xs text-gray-600">
          Scroll to zoom • Drag to pan
        </div>
      </div>
    </div>
  )
}

export function ThreatMap() {
  const [threats, setThreats] = useState<ThreatLocation[]>([])
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const fetchThreatData = async () => {
      try {
        setError(null)
        const response = await fetch('/api/threat-intelligence/map-data')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          setThreats(data.threats || [])
          setMetadata(data.metadata || null)
          setLastFetch(new Date())
        } else {
          throw new Error(data.error || 'Failed to fetch threat data')
        }
      } catch (error) {
        console.error('Failed to fetch threat data:', error)
        setError(error instanceof Error ? error.message : 'Network error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchThreatData()
    const interval = setInterval(fetchThreatData, 60000) // Update every minute (reduced frequency)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center border rounded-lg bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-sm text-gray-500">Analyzing global threat patterns...</div>
          <div className="text-xs text-gray-400">Processing geolocation data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center border rounded-lg bg-red-50 border-red-200">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-red-600 text-lg">⚠️</div>
          <div className="text-sm font-medium text-red-800">Failed to load threat map</div>
          <div className="text-xs text-red-600 max-w-md">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Global Threat Intelligence Map</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Active locations: {metadata?.totalLocations || threats.length}</span>
            <span>Critical threats: {metadata?.criticalThreats || 0}</span>
            <span>Peak activity: {metadata?.highestThreatCount || 0} incidents</span>
            {metadata?.recentActivity && (
              <span className="text-red-600 font-medium">🔴 High activity period</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Last updated: {mounted && lastFetch ? formatLastUpdated(lastFetch.toISOString()) : 'Unknown'}
          </div>
          <div className="text-xs text-gray-400">
            {metadata?.cacheHitRate ? `Cache hit rate: ${metadata.cacheHitRate}%` : 'Processing geolocation data...'}
          </div>
          <div className="text-xs text-gray-400">
            Based on {threats.length > 0 ? 'real-time analysis' : 'historical patterns'}
          </div>
        </div>
      </div>
      <WorldMap threats={threats} />
      
      {/* Threat Summary */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm font-medium text-red-800">Critical</div>
          <div className="text-2xl font-bold text-red-600">
            {threats.filter(t => t.severity === 'critical').length}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="text-sm font-medium text-orange-800">High</div>
          <div className="text-2xl font-bold text-orange-600">
            {threats.filter(t => t.severity === 'high').length}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm font-medium text-yellow-800">Medium</div>
          <div className="text-2xl font-bold text-yellow-600">
            {threats.filter(t => t.severity === 'medium').length}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800">Low</div>
          <div className="text-2xl font-bold text-blue-600">
            {threats.filter(t => t.severity === 'low').length}
          </div>
        </div>
      </div>
    </div>
  )
} 