"use client"

import * as THREE from 'three'
import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { TrackballControls, Html } from '@react-three/drei'
import { useQuery } from '@tanstack/react-query'
import { Loader2, MapPin, AlertTriangle, Clock, Globe as GlobeIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ThreatLocation {
  country: string
  city: string
  lat: number
  lng: number
  count: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  threatLevel: number
  recentActivity: boolean
  lastSeen: string
  topIOCs: Array<{
    value: string
    severity: string
    lastSeen: string
    description: string | null
  }>
}

interface ThreatMapResponse {
  success: boolean
  threats: ThreatLocation[]
  metadata: {
    totalLocations: number
    highestThreatCount: number
    criticalThreats: number
    highThreats: number
    mediumThreats: number
    lowThreats: number
    recentActivity: boolean
    lastUpdated: string
    avgThreatLevel: number
    totalIOCs: number
    dataSource: string
    cacheHitRate: number
    message?: string // Added for error messages
  }
}

const SEVERITY_COLORS = {
  low: '#60a5fa', // blue-400
  medium: '#fbbf24', // amber-400
  high: '#fb923c', // orange-400
  critical: '#f87171', // red-400
}

function ThreatTooltip({ threat }: { threat: ThreatLocation }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm text-white px-2 py-1.5 rounded-md border border-gray-600 shadow-lg min-w-[120px] max-w-[160px] animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="space-y-0.5">
        {/* Location - compact */}
        <div className="flex items-center gap-1">
          <MapPin className="h-2.5 w-2.5 text-blue-400" />
          <span className="font-medium text-xs text-white truncate">{threat.city}, {threat.country}</span>
        </div>
        
        {/* Threat count and severity - compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
            <span className="text-xs font-medium">{threat.count}</span>
          </div>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getSeverityColor(threat.severity)} bg-gray-800`}>
            {threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1)}
          </span>
        </div>
        
        {/* Recent activity indicator - compact */}
        {threat.recentActivity && (
          <div className="flex items-center gap-1 text-xs text-yellow-400">
            <div className="h-1 w-1 bg-yellow-400 rounded-full animate-pulse"></div>
            <span>Recent activity</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ThreatPoint({ position, color, severity, threat, onHover }: { 
  position: THREE.Vector3
  color: string
  severity: string
  threat: ThreatLocation
  onHover: (threat: ThreatLocation | null, position?: THREE.Vector3) => void
}) {
  const ref = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (ref.current && glowRef.current) {
      const time = state.clock.elapsedTime
      
      // Pulsing effect for all threats
      const baseScale = hovered ? 1.2 : 1
      const scale = severity === 'critical' 
        ? baseScale + Math.sin(time * 6) * 0.4
        : baseScale + Math.sin(time * 3) * 0.2
      
      ref.current.scale.setScalar(scale)
      glowRef.current.scale.setScalar(scale * 1.5)
    }
  })

  return (
    <group 
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        onHover(threat, position)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        onHover(null)
      }}
      onPointerLeave={(e) => {
        e.stopPropagation()
        setHovered(false)
        onHover(null)
      }}
    >
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={hovered ? 0.4 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Main threat point */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.3}
        />
      </mesh>
      {/* Bright center */}
      <mesh>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={hovered ? 0.8 : 0.5}
        />
      </mesh>
    </group>
  )
}

function GlobePoints({ data, onHover }: { 
  data: ThreatLocation[]
  onHover: (threat: ThreatLocation | null, position?: THREE.Vector3) => void
}) {
  const points = useMemo(() => {
    if (!Array.isArray(data)) return []
    const pts = []
    const sphereRadius = 2.02 // Just above Earth surface
    
    for (const threat of data) {
      // Convert lat/lng to 3D coordinates
      const phi = (90 - threat.lat) * (Math.PI / 180)
      const theta = (threat.lng + 180) * (Math.PI / 180)

      const x = -(sphereRadius * Math.sin(phi) * Math.cos(theta))
      const y = sphereRadius * Math.cos(phi)
      const z = sphereRadius * Math.sin(phi) * Math.sin(theta)
      
      pts.push({ 
        position: new THREE.Vector3(x, y, z), 
        color: SEVERITY_COLORS[threat.severity] || '#ffffff',
        severity: threat.severity,
        threat: threat
      })
    }
    return pts
  }, [data])

  return (
    <group>
      {points.map((point, i) => (
        <ThreatPoint 
          key={i} 
          position={point.position} 
          color={point.color} 
          severity={point.severity}
          threat={point.threat}
          onHover={onHover}
        />
      ))}
    </group>
  )
}

function EarthGlobe({ children }: { children?: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!)
  
  // Load real Earth texture
  const earthTexture = useMemo(() => {
    // Create a high-quality Earth texture using NASA's Blue Marble image
    const loader = new THREE.TextureLoader()
    
    // Using a publicly available Earth texture (NASA Blue Marble style)
    const texture = loader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      undefined,
      undefined,
      // Fallback to a simple procedural texture if the image fails to load
      () => {
        console.log('Loading fallback Earth texture...')
        const canvas = document.createElement('canvas')
        canvas.width = 1024
        canvas.height = 512
        const ctx = canvas.getContext('2d')!
        
        // Ocean base
        ctx.fillStyle = '#1a365d'
        ctx.fillRect(0, 0, 1024, 512)
        
        // Continents (simplified but recognizable)
        ctx.fillStyle = '#2d5016'
        
        // North America
        ctx.beginPath()
        ctx.ellipse(200, 150, 70, 90, -0.2, 0, Math.PI * 2)
        ctx.fill()
        
        // South America  
        ctx.beginPath()
        ctx.ellipse(250, 320, 35, 70, 0.1, 0, Math.PI * 2)
        ctx.fill()
        
        // Europe
        ctx.beginPath()
        ctx.ellipse(450, 120, 30, 35, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // Africa
        ctx.beginPath()
        ctx.ellipse(480, 230, 45, 80, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // Asia
        ctx.beginPath()
        ctx.ellipse(650, 130, 100, 70, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // Australia
        ctx.beginPath()
        ctx.ellipse(750, 340, 35, 20, 0, 0, Math.PI * 2)
        ctx.fill()
        
        return new THREE.CanvasTexture(canvas)
      }
    )
    
    return texture
  }, [])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[2, 128, 64]} />
        <meshPhongMaterial 
          map={earthTexture} 
          shininess={5}
          specular={new THREE.Color(0x222222)}
        />
      </mesh>
      {children}
    </group>
  )
}

function GlobeScene() {
  const [hoveredThreat, setHoveredThreat] = useState<ThreatLocation | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<THREE.Vector3 | null>(null)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data, isLoading, isError } = useQuery<ThreatMapResponse>({
    queryKey: ['threat-map-data'],
    queryFn: async () => {
      console.log('Fetching real-time threat map data from API...')
      
      const response = await fetch('/api/threat-intelligence/map-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      console.log('Real-time threat map data received:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch threat map data')
      }

      return result
    },
    refetchInterval: 120000, // 2 minutes as per user preference
    staleTime: 60000,
    gcTime: 300000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  const handleHover = (threat: ThreatLocation | null, position?: THREE.Vector3) => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = null
    }

    if (threat && position) {
      setHoveredThreat(threat)
      setTooltipPosition(position)
      
      // Auto-dismiss tooltip after 15 seconds to prevent persistent display
      tooltipTimeoutRef.current = setTimeout(() => {
        setHoveredThreat(null)
        setTooltipPosition(null)
      }, 15000)
    } else {
      // Add a small delay before hiding to prevent flickering
      tooltipTimeoutRef.current = setTimeout(() => {
        setHoveredThreat(null)
        setTooltipPosition(null)
      }, 100)
    }
  }

  if (isLoading) {
    return (
      <Html center>
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-400">Loading Real-Time Threat Data...</p>
          <p className="text-xs text-gray-500">Analyzing global threat intelligence...</p>
        </div>
      </Html>
    )
  }

  if (isError) {
    return (
      <Html center>
        <div className="flex flex-col items-center space-y-2 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-red-500">Failed to load real-time threat data.</p>
          <p className="text-xs text-gray-400">
            Check your connection and ensure the threat intelligence system is initialized.
          </p>
        </div>
      </Html>
    )
  }
  
  const threats = (data && data.success && Array.isArray(data.threats)) ? data.threats : []
  
  // Debug logging for real-time data
  console.log('Globe Real-time Data - API Response:', data)
  console.log('Globe Real-time Data - Threats array:', threats)
  console.log('Globe Real-time Data - Threats count:', threats.length)
  console.log('Globe Real-time Data - Data source:', data?.metadata?.dataSource)
  console.log('Globe Real-time Data - Last updated:', data?.metadata?.lastUpdated)
  console.log('Globe Real-time Data - Cache hit rate:', data?.metadata?.cacheHitRate)
  if (threats.length > 0) {
    console.log('Globe Real-time Data - Sample threat:', threats[0])
    console.log('Globe Real-time Data - Recent activity detected:', data?.metadata?.recentActivity)
  }

  if (threats.length === 0) {
    return (
      <Html center>
        <div className="flex flex-col items-center space-y-2 text-center">
          <GlobeIcon className="h-8 w-8 text-gray-500" />
          <p className="text-sm text-gray-500">No real-time threat data available.</p>
          <p className="text-xs text-gray-400">
            {data?.metadata?.message || 'Initialize the system to start collecting live threat intelligence.'}
          </p>
        </div>
      </Html>
    )
  }

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} castShadow />
      <pointLight position={[-5, -3, -5]} intensity={0.4} />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#4f46e5" />
      <EarthGlobe>
        <GlobePoints data={threats} onHover={handleHover} />
      </EarthGlobe>
      <TrackballControls 
        noZoom={false}
        noPan={false} 
        noRotate={false}
        zoomSpeed={0.8}
        panSpeed={0.8} 
        rotateSpeed={0.8}
        minDistance={2.5}
        maxDistance={8}
      />
      
      {/* Tooltip - Only show on hover */}
      {hoveredThreat && tooltipPosition && (
        <Html
          position={[tooltipPosition.x + 0.3, tooltipPosition.y + 0.2, tooltipPosition.z]}
          distanceFactor={8}
          occlude={false}
          transform={false}
          sprite={false}
          style={{ 
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <div className="pointer-events-none z-50" style={{ 
            transform: 'translate(-10px, -10px)',
            position: 'relative'
          }}>
            <ThreatTooltip threat={hoveredThreat} />
          </div>
        </Html>
      )}
      
      {/* Stats overlay - Tiny but visible */}
      {data?.metadata && (
        <Html position={[-2.5, 1.8, 0]} transform={false} occlude={false}>
          <div className="bg-gray-900/90 backdrop-blur-sm text-white p-1 rounded shadow-md border border-gray-700 max-w-[80px] text-center">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <GlobeIcon className="h-2 w-2 text-blue-400" />
              <span className="font-medium text-xs">Live</span>
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="text-xs text-gray-300">{data.metadata.totalLocations} loc</div>
              <div className="flex justify-center gap-1">
                <span className="text-red-400 font-mono text-xs">{data.metadata.criticalThreats}C</span>
                <span className="text-orange-400 font-mono text-xs">{data.metadata.highThreats}H</span>
              </div>
              {data.metadata.recentActivity && (
                <div className="flex items-center justify-center gap-0.5 text-yellow-400">
                  <div className="h-1 w-1 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">●</span>
                </div>
              )}
            </div>
          </div>
        </Html>
      )}
    </>
  )
}

export function Globe() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <GlobeScene />
    </Canvas>
  )
}