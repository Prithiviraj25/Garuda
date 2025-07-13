'use client'

import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Download, Network, Activity, AlertTriangle, Shield } from 'lucide-react'

interface IOCNode {
  id: string
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email'
  value: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  group: number
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface IOCLink {
  source: string | IOCNode
  target: string | IOCNode
  relationship: 'communicates_with' | 'resolves_to' | 'downloads_from' | 'same_campaign' | 'similar_hash'
  strength: number
}

interface IOCCorrelationData {
  nodes: IOCNode[]
  links: IOCLink[]
}

export function IOCCorrelationGraph() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<IOCCorrelationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<IOCNode | null>(null)
  const [activeTab, setActiveTab] = useState('graph')
  const [stats, setStats] = useState({
    totalNodes: 0,
    totalLinks: 0,
    criticalNodes: 0,
    activeRelationships: 0
  })

  useEffect(() => {
    fetchCorrelationData()
    
    // Set up interval to update every 2 minutes
    const interval = setInterval(fetchCorrelationData, 2 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchCorrelationData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/threat-intelligence/correlations')
      if (response.ok) {
        const correlationData = await response.json()
        console.log('Fetched correlation data:', correlationData)
        
        // Check if we have valid data
        if (correlationData.nodes && correlationData.nodes.length > 0) {
          setData(correlationData)
          
          // Update stats
          setStats({
            totalNodes: correlationData.nodes.length,
            totalLinks: correlationData.links.length,
            criticalNodes: correlationData.nodes.filter((n: IOCNode) => n.severity === 'critical').length,
            activeRelationships: correlationData.links.filter((l: IOCLink) => l.strength > 0.7).length
          })
        } else {
          console.warn('API returned empty data, using mock data')
          generateMockData()
        }
      } else {
        console.warn('Failed to fetch correlation data, using mock data')
        generateMockData()
      }
    } catch (error) {
      console.error('Failed to fetch correlation data:', error)
      setError('Failed to load correlation data')
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const mockData: IOCCorrelationData = {
      nodes: [
        { id: 'node1', type: 'ip', value: '185.220.101.32', severity: 'high', confidence: 85, group: 1 },
        { id: 'node2', type: 'domain', value: 'malicious-site.com', severity: 'critical', confidence: 95, group: 1 },
        { id: 'node3', type: 'url', value: 'https://malicious-site.com/payload.exe', severity: 'critical', confidence: 90, group: 1 },
        { id: 'node4', type: 'hash', value: 'a1b2c3d4e5f6...', severity: 'high', confidence: 80, group: 1 },
        { id: 'node5', type: 'ip', value: '45.142.214.48', severity: 'medium', confidence: 75, group: 2 },
        { id: 'node6', type: 'domain', value: 'phishing-bank.net', severity: 'high', confidence: 88, group: 2 },
        { id: 'node7', type: 'email', value: 'admin@malicious-site.com', severity: 'medium', confidence: 70, group: 1 }
      ],
      links: [
        { source: 'node1', target: 'node2', relationship: 'resolves_to', strength: 0.9 },
        { source: 'node2', target: 'node3', relationship: 'downloads_from', strength: 0.8 },
        { source: 'node3', target: 'node4', relationship: 'same_campaign', strength: 0.7 },
        { source: 'node5', target: 'node6', relationship: 'resolves_to', strength: 0.85 },
        { source: 'node2', target: 'node7', relationship: 'communicates_with', strength: 0.75 }
      ]
    }
    console.log('Generated mock data:', mockData)
    setData(mockData)
    setStats({
      totalNodes: mockData.nodes.length,
      totalLinks: mockData.links.length,
      criticalNodes: mockData.nodes.filter(n => n.severity === 'critical').length,
      activeRelationships: mockData.links.filter(l => l.strength > 0.7).length
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff0080' // Neon pink
      case 'high': return '#ff4500' // Neon orange-red
      case 'medium': return '#ffff00' // Neon yellow
      case 'low': return '#00ffff' // Neon cyan
      default: return '#00ffff'
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'ip': return '#00f5ff' // Neon blue
      case 'domain': return '#00ff41' // Neon green
      case 'url': return '#ffff00' // Neon yellow
      case 'hash': return '#ff073a' // Neon red
      case 'email': return '#bf00ff' // Neon purple
      default: return '#00ffff'
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'ip': return '🌐'
      case 'domain': return '🔗'
      case 'url': return '📄'
      case 'hash': return '#️⃣'
      case 'email': return '📧'
      default: return '❓'
    }
  }

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'resolves_to': return '#00ff41' // Neon green
      case 'downloads_from': return '#ffff00' // Neon yellow
      case 'same_campaign': return '#ff073a' // Neon red
      case 'similar_hash': return '#bf00ff' // Neon purple
      case 'communicates_with': return '#00f5ff' // Neon blue
      default: return '#00ffff'
    }
  }

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return

    console.log('Rendering graph with data:', data)

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const containerRect = containerRef.current.getBoundingClientRect()
    const width = Math.max(800, containerRect.width - 40)
    const height = 500

    svg.attr('width', width).attr('height', height)

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'absolute invisible bg-black border border-gray-600 text-white p-3 rounded-lg shadow-lg text-sm max-w-xs z-50')
      .style('pointer-events', 'none')
      .style('backdrop-filter', 'blur(10px)')
      .style('background', 'rgba(0,0,0,0.95)')

    // Create simulation
    const simulation = d3.forceSimulation<IOCNode>(data.nodes)
      .force('link', d3.forceLink<IOCNode, IOCLink>(data.links)
        .id(d => d.id)
        .strength(d => d.strength * 0.8)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20))

    // Create gradient definitions for links
    const defs = svg.append('defs')
    data.links.forEach((link, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `linkGradient${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', getRelationshipColor(link.relationship))
        .attr('stop-opacity', 0.8)
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', getRelationshipColor(link.relationship))
        .attr('stop-opacity', 0.3)
    })

    // Create links
    const linkGroup = svg.append('g').attr('class', 'links')
    const link = linkGroup.selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', (d, i) => `url(#linkGradient${i})`)
      .attr('stroke-width', d => Math.max(1, d.strength * 4))
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .style('filter', d => `drop-shadow(0 0 8px ${getRelationshipColor(d.relationship)})`)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1)
        tooltip.classed('invisible', false)
          .html(`
            <div class="font-semibold text-white">${d.relationship.replace('_', ' ').toUpperCase()}</div>
            <div class="text-xs text-gray-300">Strength: <span class="text-gray-200">${(d.strength * 100).toFixed(1)}%</span></div>
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`)
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('opacity', 0.7)
        tooltip.classed('invisible', true)
      })

    // Create node groups
    const nodeGroup = svg.append('g').attr('class', 'nodes')
    const node = nodeGroup.selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')

    // Add outer glow circle
    node.append('circle')
      .attr('r', 18)
      .attr('fill', 'none')
      .attr('stroke', d => getSeverityColor(d.severity))
      .attr('stroke-width', 2)
      .attr('opacity', 0.4)
      .style('filter', 'drop-shadow(0 0 8px currentColor)')

    // Add main node circle
    node.append('circle')
      .attr('r', 12)
      .attr('fill', d => getNodeColor(d.type))
      .attr('stroke', d => getSeverityColor(d.severity))
      .attr('stroke-width', 2)
      .attr('opacity', 0.9)
      .style('filter', d => `drop-shadow(0 0 12px ${getNodeColor(d.type)})`)

    // Add confidence ring
    node.append('circle')
      .attr('r', 15)
      .attr('fill', 'none')
      .attr('stroke', d => getNodeColor(d.type))
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', d => {
        const circumference = 2 * Math.PI * 15
        const dashLength = (d.confidence / 100) * circumference
        return `${dashLength} ${circumference - dashLength}`
      })
      .attr('opacity', 0.6)

    // Add node labels
    node.append('text')
      .text(d => d.value.length > 6 ? d.value.substring(0, 6) + '...' : d.value)
      .attr('font-size', '7px')
      .attr('font-weight', 'bold')
      .attr('fill', '#e5e7eb')
      .attr('text-anchor', 'middle')
      .attr('dy', 25)
      .style('font-family', 'monospace')

    // Add node type badges
    node.append('text')
      .text(d => getNodeIcon(d.type))
      .attr('font-size', '8px')
      .attr('text-anchor', 'middle')
      .attr('dy', 3)

    // Node interactions
    node
      .on('mouseover', function(event, d) {
        // Highlight connected nodes and links
        const connectedLinks = data.links.filter(l => 
          (typeof l.source === 'string' ? l.source === d.id : l.source.id === d.id) ||
          (typeof l.target === 'string' ? l.target === d.id : l.target.id === d.id)
        )
        
        // Fade non-connected elements
        node.style('opacity', 0.3)
        link.style('opacity', 0.1)
        
        // Highlight this node and connected elements
        d3.select(this).style('opacity', 1)
        connectedLinks.forEach(linkData => {
          link.filter(l => l === linkData).style('opacity', 1)
        })
        
        // Show tooltip
        tooltip.classed('invisible', false)
          .html(`
            <div class="font-semibold text-white">${d.type.toUpperCase()}</div>
            <div class="text-xs text-gray-300 mb-1 font-mono">${d.value}</div>
            <div class="flex items-center gap-2 text-xs">
              <span class="px-2 py-1 rounded text-black font-bold" style="background-color: ${getSeverityColor(d.severity)};">${d.severity.toUpperCase()}</span>
              <span class="text-gray-300">${d.confidence}% confidence</span>
            </div>
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`)
        
        setSelectedNode(d)
      })
      .on('mouseout', function() {
        node.style('opacity', 1)
        link.style('opacity', 0.7)
        tooltip.classed('invisible', true)
        setSelectedNode(null)
      })
      .on('click', function(event, d) {
        setSelectedNode(d)
        setActiveTab('details')
      })

    // Add zoom and pan functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        const { transform } = event
        linkGroup.attr('transform', transform)
        nodeGroup.attr('transform', transform)
      })

    svg.call(zoom)

    // Update positions on simulation tick with boundary constraints
    simulation.on('tick', () => {
      // Constrain nodes within boundaries
      data.nodes.forEach(d => {
        const radius = 20 // Account for node size
        d.x = Math.max(radius, Math.min(width - radius, d.x || width/2))
        d.y = Math.max(radius, Math.min(height - radius, d.y || height/2))
      })

      // Update link positions
      link
        .attr('x1', d => (typeof d.source === 'string' ? 0 : d.source.x) || 0)
        .attr('y1', d => (typeof d.source === 'string' ? 0 : d.source.y) || 0)
        .attr('x2', d => (typeof d.target === 'string' ? 0 : d.target.x) || 0)
        .attr('y2', d => (typeof d.target === 'string' ? 0 : d.target.y) || 0)

      // Update node positions
      node.attr('transform', d => `translate(${d.x || width/2}, ${d.y || height/2})`)
    })

    // Start the simulation
    simulation.alpha(1).restart()

    // Add zoom controls
    const zoomControls = svg.append('g')
      .attr('class', 'zoom-controls')
      .attr('transform', `translate(${width - 80}, 20)`)

    // Zoom in button
    const zoomInBtn = zoomControls.append('g')
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.5)
      })

    zoomInBtn.append('rect')
      .attr('width', 25)
      .attr('height', 25)
      .attr('fill', 'rgba(0,255,255,0.2)')
      .attr('stroke', '#00ffff')
      .attr('stroke-width', 1)
      .attr('rx', 3)

    zoomInBtn.append('text')
      .attr('x', 12.5)
      .attr('y', 17)
        .attr('text-anchor', 'middle')
      .attr('fill', '#00ffff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('+')

    // Zoom out button
    const zoomOutBtn = zoomControls.append('g')
      .attr('transform', 'translate(30, 0)')
        .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.67)
      })

    zoomOutBtn.append('rect')
      .attr('width', 25)
      .attr('height', 25)
      .attr('fill', 'rgba(0,255,255,0.2)')
      .attr('stroke', '#00ffff')
      .attr('stroke-width', 1)
      .attr('rx', 3)

    zoomOutBtn.append('text')
      .attr('x', 12.5)
      .attr('y', 17)
      .attr('text-anchor', 'middle')
      .attr('fill', '#00ffff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('−')

    // Add drag behavior
    const drag = d3.drag<SVGGElement, IOCNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
      })

    node.call(drag)

    // Cleanup function
      return () => {
        tooltip.remove()
        simulation.stop()
    }
  }, [data])

  const exportData = () => {
    if (!data) return
    
    const exportData = {
      nodes: data.nodes,
      links: data.links,
      exported_at: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `ioc-correlations-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (loading) {
    return (
      <Card className="bg-black border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-white text-sm">
            <Network className="h-4 w-4" />
            IOC Correlation Graph
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Analyzing relationships between indicators of compromise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sm text-gray-300">Loading correlation data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-black border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-white text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            IOC Correlation Graph
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Error loading correlation data
          </CardDescription>
        </CardHeader>
        <CardContent>
      <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <Button onClick={fetchCorrelationData} variant="outline">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
      </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Network className="h-6 w-6" />
              IOC Correlation Graph
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Real-time visualization of threat intelligence relationships
            </CardDescription>
          </div>
        <div className="flex items-center gap-2">
            <Button onClick={fetchCorrelationData} variant="outline" size="sm" className="h-10 px-4 text-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
            <Button onClick={exportData} variant="outline" size="sm" className="h-10 px-4 text-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        </div>
        
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center bg-muted rounded-lg p-4 border">
            <div className="text-2xl font-bold text-cyan-500">{stats.totalNodes}</div>
            <div className="text-sm text-muted-foreground mt-1">Total IOCs</div>
          </div>
          <div className="text-center bg-muted rounded-lg p-4 border">
            <div className="text-2xl font-bold text-green-500">{stats.totalLinks}</div>
            <div className="text-sm text-muted-foreground mt-1">Correlations</div>
          </div>
          <div className="text-center bg-muted rounded-lg p-4 border">
            <div className="text-2xl font-bold text-red-500">{stats.criticalNodes}</div>
            <div className="text-sm text-muted-foreground mt-1">Critical</div>
          </div>
          <div className="text-center bg-muted rounded-lg p-4 border">
            <div className="text-2xl font-bold text-purple-500">{stats.activeRelationships}</div>
            <div className="text-sm text-muted-foreground mt-1">Strong Links</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="graph" className="text-base">Network Graph</TabsTrigger>
            <TabsTrigger value="details" className="text-base">Node Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="graph" className="mt-6">
            <div className="border rounded-lg bg-muted/30 p-4 shadow-sm">
              <div ref={containerRef} className="w-full overflow-hidden relative">
                {/* Lighter grid background for better readability */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(hsl(var(--muted-foreground) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground) / 0.3) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}></div>
      </div>
                {/* Subtle border effects */}
                <div className="absolute inset-0 rounded-lg border border-border/50 shadow-inner"></div>
                <div className="absolute top-3 left-3 w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                <div className="absolute top-3 right-3 w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
                <div className="absolute bottom-3 left-3 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <div className="absolute bottom-3 right-3 w-3 h-3 bg-pink-400 rounded-full animate-pulse shadow-lg shadow-pink-400/50"></div>
                
        <svg
          ref={svgRef}
                  className="w-full relative z-10"
                  style={{ minHeight: '600px' }}
                />
              </div>
      </div>

            {/* Enhanced Legend - Now Vertical */}
            <div className="mt-6 space-y-4">
              <Card className="p-4 bg-muted/30 border-border">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5" />
                  Node Types
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { type: 'ip', label: 'IP Address', icon: '🌐' },
                    { type: 'domain', label: 'Domain', icon: '🔗' },
                    { type: 'url', label: 'URL', icon: '📄' },
                    { type: 'hash', label: 'File Hash', icon: '#️⃣' },
                    { type: 'email', label: 'Email', icon: '📧' }
                  ].map(({ type, label, icon }) => (
                    <div key={type} className="flex items-center gap-3 text-sm p-2 bg-background rounded border">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ 
                          backgroundColor: getNodeColor(type)
                        }}
                      ></div>
                      <span className="text-base">{icon}</span>
                      <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
              </Card>

              <Card className="p-4 bg-muted/30 border-border">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5" />
                  Severity Levels
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { severity: 'critical', label: 'Critical' },
                    { severity: 'high', label: 'High' },
                    { severity: 'medium', label: 'Medium' },
                    { severity: 'low', label: 'Low' }
                  ].map(({ severity, label }) => (
                    <div key={severity} className="flex items-center gap-3 text-sm p-2 bg-background rounded border">
                      <div 
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0" 
                        style={{ 
                          borderColor: getSeverityColor(severity)
                        }}
                      ></div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  ))}
        </div>
              </Card>

              <Card className="p-4 bg-muted/30 border-border">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5" />
                  Relationships
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { rel: 'resolves_to', label: 'Resolves To' },
                    { rel: 'downloads_from', label: 'Downloads From' },
                    { rel: 'same_campaign', label: 'Same Campaign' },
                    { rel: 'similar_hash', label: 'Similar Hash' },
                    { rel: 'communicates_with', label: 'Communicates With' }
                  ].map(({ rel, label }) => (
                    <div key={rel} className="flex items-center gap-3 text-sm p-2 bg-background rounded border">
                      <div 
                        className="w-5 h-1.5 rounded flex-shrink-0" 
                        style={{ 
                          backgroundColor: getRelationshipColor(rel)
                        }}
                      ></div>
                      <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="mt-6">
            <div className="space-y-4">
              {selectedNode ? (
                <Card className="bg-muted/30 border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-lg">{getNodeIcon(selectedNode.type)}</span>
                      {selectedNode.type.toUpperCase()} Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Value</label>
                        <p className="font-mono text-sm bg-background border p-3 rounded text-foreground break-all overflow-hidden mt-1">{selectedNode.value}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Severity</label>
                          <Badge 
                            className="ml-2 text-black font-bold text-sm px-3 py-1 mt-1"
                            style={{ 
                              backgroundColor: getSeverityColor(selectedNode.severity)
                            }}
                          >
                            {selectedNode.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Confidence</label>
                          <p className="text-sm font-semibold mt-1">{selectedNode.confidence}%</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Connections</label>
                        <p className="text-sm font-semibold mt-1">{data?.links.filter(l => 
                          (typeof l.source === 'string' ? l.source === selectedNode.id : l.source.id === selectedNode.id) ||
                          (typeof l.target === 'string' ? l.target === selectedNode.id : l.target.id === selectedNode.id)
                        ).length || 0} relationships</p>
        </div>
      </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Network className="h-10 w-10 mx-auto mb-4 opacity-50" />
                  <p className="text-base">Click on a node in the graph to view details</p>
                </div>
              )}
    </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 