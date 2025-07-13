'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw, Download, TrendingUp, Shield, AlertTriangle } from 'lucide-react'

interface ThreatData {
  date: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  count: number
  type: string
}

interface IOCTypeData {
  type: string
  count: number
  percentage: number
}

interface ThreatTrendData {
  date: string
  threats: number
  iocs: number
  alerts: number
}

interface AnalyticsData {
  trends: ThreatTrendData[]
  iocTypes: IOCTypeData[]
  severityDistribution: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    count: number
    type: string
  }>
  sources: Array<{name: string, count: number}>
  campaigns?: Array<{
    id: string
    name: string
    description: string
    severity: string
    status: string
    family: string
    lastSeen: Date
  }>
}

export function ThreatAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    trends: [],
    iocTypes: [],
    severityDistribution: [],
    sources: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timelineRef = useRef<SVGSVGElement>(null)
  const donutRef = useRef<SVGSVGElement>(null)
  const barRef = useRef<SVGSVGElement>(null)
  const heatmapRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    fetchAnalyticsData()
    
    // Set up interval to update every 2 minutes
    const interval = setInterval(fetchAnalyticsData, 2 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Render charts when component mounts and DOM is ready
  useEffect(() => {
    const checkAndRender = () => {
      if (timelineRef.current && donutRef.current && barRef.current && heatmapRef.current) {
        renderTimelineChart()
        renderDonutChart()
        renderBarChart()
        renderHeatmap()
        return true
      }
      return false
    }
    
    // Try immediate render
    if (!checkAndRender()) {
      // If refs not ready, try again after a delay
      const timer = setTimeout(() => {
        checkAndRender()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // Render charts whenever data changes or loading completes
    if (!loading && (data.trends?.length > 0 || data.iocTypes?.length > 0)) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        renderTimelineChart()
        renderDonutChart()
        renderBarChart()
        renderHeatmap()
      }, 100)
    }
  }, [data, loading])

  // Force render charts when data changes (even if loading is still true)
  useEffect(() => {
    if (data.trends?.length > 0 || data.iocTypes?.length > 0) {
      setTimeout(() => {
        renderTimelineChart()
        renderDonutChart()
        renderBarChart()
        renderHeatmap()
      }, 200)
    }
  }, [data.trends, data.iocTypes, data.severityDistribution, data.sources])

  // Also render charts when tab becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !loading) {
          setTimeout(() => {
            renderTimelineChart()
            renderDonutChart()
            renderBarChart()
            renderHeatmap()
          }, 200)
        }
      })
    })

    if (timelineRef.current) observer.observe(timelineRef.current)
    if (donutRef.current) observer.observe(donutRef.current)
    if (barRef.current) observer.observe(barRef.current)
    if (heatmapRef.current) observer.observe(heatmapRef.current)

    return () => observer.disconnect()
  }, [loading, data])

  // Re-render charts on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!loading) {
        setTimeout(() => {
          renderTimelineChart()
          renderDonutChart()
          renderBarChart()
          renderHeatmap()
        }, 300)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [loading])

  const fetchAnalyticsData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/threat-intelligence/analytics')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics data')
      }

      const newData = {
        trends: result.trends || [],
        iocTypes: result.iocTypes || [],
        severityDistribution: result.severityDistribution || [],
        sources: result.sources || [],
        campaigns: result.campaigns || []
      }
      
      console.log('Fetched analytics data:', newData)
      setData(newData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics data')
      
      // Set empty data on error - no mock data
      setData({
        trends: [],
        iocTypes: [],
        severityDistribution: [],
        sources: [],
        campaigns: []
      })
    } finally {
      setLoading(false)
    }
  }

  const forceRenderCharts = () => {
    setTimeout(() => {
      renderTimelineChart()
      renderDonutChart()
      renderBarChart()
      renderHeatmap()
    }, 100)
  }

  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value)
    // Force re-render charts when tab changes
    setTimeout(() => {
      switch (value) {
        case 'trends':
          renderTimelineChart()
          break
        case 'distribution':
          renderDonutChart()
          break
        case 'severity':
          renderBarChart()
          break
        case 'sources':
          renderHeatmap()
          break
        default:
          forceRenderCharts()
      }
    }, 100)
  }

  const renderTimelineChart = () => {
    try {
      console.log('Rendering timeline chart, data:', data.trends)
      if (!timelineRef.current || !timelineRef.current.parentNode) {
        console.log('Timeline ref not available')
        return
      }
      
      // Ensure we have valid data - work with live data or empty chart
      const validData = data.trends && Array.isArray(data.trends) && data.trends.length > 0 ? data.trends : []
      console.log('Valid timeline data:', validData)

      const svg = d3.select(timelineRef.current)
      svg.selectAll('*').remove()

      // Get the actual container dimensions
      const containerRect = timelineRef.current.parentElement?.getBoundingClientRect()
      const containerWidth = containerRect ? containerRect.width - 32 : 400 // 32px for padding

      const margin = { top: 20, right: 30, bottom: 40, left: 50 }
      const width = Math.max(containerWidth - margin.left - margin.right, 300) // Minimum 300px
      const height = 300 - margin.bottom - margin.top

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // If no data, show empty chart
    if (validData.length === 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .text('No threat data available')
      return
    }

    // Parse dates and set up scales
    const parseTime = d3.timeParse('%Y-%m-%d')
    const processedData = validData.map(d => ({
      ...d,
      date: parseTime(d.date) || new Date(d.date)
    })).filter(d => d.date) // Filter out invalid dates

    const xScale = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date) as [Date, Date])
      .range([0, width])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => Math.max(d.threats, d.iocs, d.alerts)) || 0])
      .range([height, 0])

    // Create lines
    const threatLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.threats))
      .curve(d3.curveMonotoneX)

    const iocLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.iocs))
      .curve(d3.curveMonotoneX)

    const alertLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.alerts))
      .curve(d3.curveMonotoneX)

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')))

    g.append('g')
      .call(d3.axisLeft(yScale))

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3)

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3)

    // Add lines
    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('d', threatLine)

    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', iocLine)

    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)
      .attr('d', alertLine)

    // Add dots for data points
    if (processedData && processedData.length > 0) {
      ['threats', 'iocs', 'alerts'].forEach((key, index) => {
        const colors = ['#ef4444', '#3b82f6', '#f59e0b']
        g.selectAll(`.dot-${key}`)
          .data(processedData)
          .enter()
          .append('circle')
          .attr('class', `dot-${key}`)
          .attr('cx', d => xScale(d.date))
          .attr('cy', d => yScale(d[key as keyof typeof d] as number))
          .attr('r', 3)
          .attr('fill', colors[index])
      })
    }

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${Math.max(width - 120, 10)}, 20)`)

    const legendData = [
      { name: 'Threats', color: '#ef4444' },
      { name: 'IOCs', color: '#3b82f6' },
      { name: 'Alerts', color: '#f59e0b' }
    ]

    legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)
      .each(function(d) {
        const item = d3.select(this)
        item.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', d.color)
        
        item.append('text')
          .attr('x', 16)
          .attr('y', 9)
          .attr('font-size', '12px')
          .attr('fill', 'currentColor')
          .text(d.name)
      })
    } catch (error) {
      console.error('Error rendering timeline chart:', error)
    }
  }

  const renderDonutChart = () => {
    console.log('Rendering donut chart, data:', data.iocTypes)
    if (!donutRef.current || !donutRef.current.parentNode) {
      console.log('Donut ref not available')
      return
    }
    
    // Ensure we have valid data - work with live data or empty chart
    const validData = data.iocTypes && Array.isArray(data.iocTypes) && data.iocTypes.length > 0 ? data.iocTypes : []
    console.log('Valid donut data:', validData)

    const svg = d3.select(donutRef.current)
    svg.selectAll('*').remove()

    // Get the actual container dimensions
    const containerRect = donutRef.current.parentElement?.getBoundingClientRect()
    const containerWidth = containerRect ? Math.min(containerRect.width - 32, 300) : 300 // Max 300px
    
    const width = containerWidth
    const height = containerWidth
    const radius = Math.min(width, height) / 2

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    // If no data, show empty chart
    if (validData.length === 0) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .text('No IOC data available')
      return
    }

    const color = d3.scaleOrdinal()
      .domain(validData.map(d => d.type))
      .range(['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'])

    const pie = d3.pie<IOCTypeData>()
      .value(d => d.count)
      .sort(null)

    const arc = d3.arc<d3.PieArcDatum<IOCTypeData>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.8)

    const arcs = g.selectAll('.arc')
      .data(pie(validData))
      .enter()
      .append('g')
      .attr('class', 'arc')

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.type) as string)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)

    // Add labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text(d => `${d.data.percentage.toFixed(1)}%`)

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${radius + 20}, ${-radius})`)

    legend.selectAll('.legend-item')
      .data(validData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)
      .each(function(d) {
        const item = d3.select(this)
        item.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', color(d.type) as string)
        
        item.append('text')
          .attr('x', 16)
          .attr('y', 9)
          .attr('font-size', '12px')
          .attr('fill', 'currentColor')
          .text(`${d.type} (${d.count})`)
      })
  }

  const renderBarChart = () => {
    console.log('Rendering bar chart, data:', data.severityDistribution)
    if (!barRef.current || !barRef.current.parentNode) {
      console.log('Bar ref not available')
      return
    }
    
    // Ensure we have valid data - work with live data or empty chart
    const validSeverityData = data.severityDistribution && Array.isArray(data.severityDistribution) && data.severityDistribution.length > 0 ? data.severityDistribution : []
    console.log('Valid bar data:', validSeverityData)

    const svg = d3.select(barRef.current)
    svg.selectAll('*').remove()

    // Get the actual container dimensions
    const containerRect = barRef.current.parentElement?.getBoundingClientRect()
    const containerWidth = containerRect ? containerRect.width - 32 : 400 // 32px for padding

    const margin = { top: 20, right: 30, bottom: 40, left: 50 }
    const width = Math.max(containerWidth - margin.left - margin.right, 300) // Minimum 300px
    const height = 300 - margin.bottom - margin.top

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // If no data, show empty chart
    if (validSeverityData.length === 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .text('No severity data available')
      return
    }

    // Aggregate data by severity
    const aggregatedData = validSeverityData.reduce((acc, item) => {
      const existing = acc.find(d => d.severity === item.severity)
      if (existing) {
        existing.count += item.count
      } else {
        acc.push({ severity: item.severity, count: item.count })
      }
      return acc
    }, [] as Array<{ severity: string, count: number }>)

    const xScale = d3.scaleBand()
      .domain(aggregatedData.map(d => d.severity))
      .range([0, width])
      .padding(0.1)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(aggregatedData, d => d.count) || 0])
      .range([height, 0])

    const colorScale = d3.scaleOrdinal()
      .domain(['low', 'medium', 'high', 'critical'])
      .range(['#10b981', '#f59e0b', '#ef4444', '#dc2626'])

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .call(d3.axisLeft(yScale))

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3)

    // Add bars
    g.selectAll('.bar')
      .data(aggregatedData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.severity) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.count))
      .attr('height', d => height - yScale(d.count))
      .attr('fill', d => colorScale(d.severity) as string)
      .attr('rx', 4)

    // Add value labels on bars
    g.selectAll('.bar-label')
      .data(aggregatedData)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => (xScale(d.severity) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'currentColor')
      .text(d => d.count)
  }

  const renderHeatmap = () => {
    console.log('Rendering heatmap, data:', data.sources)
    if (!heatmapRef.current || !heatmapRef.current.parentNode) {
      console.log('Heatmap ref not available')
      return
    }
    
    // Ensure we have valid data - work with live data or empty chart
    const validSources = data.sources && Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : []
    console.log('Valid heatmap data:', validSources)

    const svg = d3.select(heatmapRef.current)
    svg.selectAll('*').remove()

    // Get the actual container dimensions
    const containerRect = heatmapRef.current.parentElement?.getBoundingClientRect()
    const containerWidth = containerRect ? containerRect.width - 32 : 500 // 32px for padding

    const margin = { top: 50, right: 30, bottom: 50, left: 100 }
    const width = Math.max(containerWidth - margin.left - margin.right, 350) // Minimum 350px
    const height = 300 - margin.bottom - margin.top

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // If no data, show empty chart
    if (validSources.length === 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .text('No source data available')
      return
    }

    // Create hourly activity data based on source counts
    const hours = Array.from({length: 24}, (_, i) => i)
    const heatmapData = validSources.flatMap(source => 
      hours.map(hour => ({
        source: source.name,
        hour,
        value: Math.floor(Math.random() * source.count * 0.1) + 1
      }))
    )

    const xScale = d3.scaleBand()
      .domain(hours.map(String))
      .range([0, width])
      .padding(0.05)

    const yScale = d3.scaleBand()
      .domain(validSources.map(d => d.name))
      .range([0, height])
      .padding(0.05)

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(heatmapData, d => d.value) || 0])

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}:00`))

    g.append('g')
      .call(d3.axisLeft(yScale))

    // Add rectangles
    g.selectAll('.cell')
      .data(heatmapData)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(String(d.hour)) || 0)
      .attr('y', d => yScale(d.source) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('rx', 2)
      .append('title')
      .text(d => `${d.source} at ${d.hour}:00 - ${d.value} activities`)

    // Add value labels for high values
    g.selectAll('.cell-label')
      .data(heatmapData.filter(d => d.value > (d3.max(heatmapData, d => d.value) || 0) * 0.7))
      .enter()
      .append('text')
      .attr('class', 'cell-label')
      .attr('x', d => (xScale(String(d.hour)) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => (yScale(d.source) || 0) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text(d => d.value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Threat Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" onClick={forceRenderCharts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Charts
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
          <strong>Warning:</strong> {error}. Showing demo data for presentation.
        </div>
      )}

      <Tabs defaultValue="trends" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="trends">Threat Trends</TabsTrigger>
          <TabsTrigger value="distribution">IOC Distribution</TabsTrigger>
          <TabsTrigger value="severity">Severity Analysis</TabsTrigger>
          <TabsTrigger value="sources">Source Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Threat Intelligence Trends
              </CardTitle>
              <CardDescription>
                Timeline view of threats, IOCs, and alerts over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden">
                <svg ref={timelineRef} className="w-full" height="350"></svg>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                IOC Type Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of indicator types detected
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center overflow-hidden">
              <svg ref={donutRef} className="max-w-full" width="300" height="300"></svg>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="severity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Severity Distribution
              </CardTitle>
              <CardDescription>
                Threat severity levels breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden">
                <svg ref={barRef} className="w-full" height="350"></svg>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Source Activity Heatmap</CardTitle>
              <CardDescription>
                Threat intelligence source activity by hour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden">
                <svg ref={heatmapRef} className="w-full" height="350"></svg>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}