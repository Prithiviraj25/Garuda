import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { iocs, alerts } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Fetch recent IOCs for correlation analysis
    const recentIOCs = await db
      .select()
      .from(iocs)
      .orderBy(sql`${iocs.lastSeen} DESC`)
      .limit(30) // Limit to 30 from the start to prevent ID mismatches

    // Fetch recent alerts for campaign correlation
    const recentAlerts = await db
      .select()
      .from(alerts)
      .orderBy(sql`${alerts.createdAt} DESC`)
      .limit(20)

    // Build correlation graph data
    const nodes = []
    const links = []
    const nodeMap = new Map()
    const nodeIdSet = new Set() // Track valid node IDs

    // Process IOCs into nodes
    recentIOCs.forEach((ioc, index) => {
      const nodeId = `ioc-${index}`
      const node = {
        id: nodeId,
        type: ioc.type,
        value: ioc.value,
        severity: ioc.severity,
        confidence: parseFloat(ioc.confidence) || 50,
        group: Math.floor(index / 10) + 1 // Group related IOCs
      }
      
      nodes.push(node)
      nodeMap.set(ioc.value, nodeId)
      nodeIdSet.add(nodeId) // Track this as a valid node ID
    })

    // Helper function to validate link references
    const isValidLink = (source: string, target: string): boolean => {
      return nodeIdSet.has(source) && nodeIdSet.has(target) && source !== target
    }

    // Create correlations based on various factors
    const correlations = []

    // 1. Domain-IP correlations (DNS resolution)
    const ipNodes = nodes.filter(n => n.type === 'ip')
    const domainNodes = nodes.filter(n => n.type === 'domain')
    
    domainNodes.forEach(domain => {
      // Simulate DNS resolution correlations
      const relatedIPs = ipNodes.filter(ip => 
        Math.random() > 0.7 && // 30% chance of correlation
        domain.group === ip.group // Same threat group
      )
      
      relatedIPs.forEach(ip => {
        if (isValidLink(domain.id, ip.id)) {
          correlations.push({
            source: domain.id,
            target: ip.id,
            relationship: 'resolves_to',
            strength: 0.8 + Math.random() * 0.2
          })
        }
      })
    })

    // 2. URL-Domain correlations
    const urlNodes = nodes.filter(n => n.type === 'url')
    
    urlNodes.forEach(url => {
      // Extract domain from URL and find matching domain nodes
      try {
        const urlObj = new URL(url.value)
        const urlDomain = urlObj.hostname
        
        const matchingDomains = domainNodes.filter(domain => 
          domain.value === urlDomain || domain.value.includes(urlDomain.split('.').slice(-2).join('.'))
        )
        
        matchingDomains.forEach(domain => {
          if (isValidLink(url.id, domain.id)) {
            correlations.push({
              source: url.id,
              target: domain.id,
              relationship: 'downloads_from',
              strength: 0.9
            })
          }
        })
      } catch (error) {
        // Invalid URL, skip
      }
    })

    // 3. Same campaign correlations (based on tags, sources, timing)
    const campaignGroups = new Map()
    
    nodes.forEach(node => {
      const ioc = recentIOCs.find(i => i.value === node.value)
      if (ioc && ioc.tags) {
        // Parse tags properly - they're stored as strings, not arrays
        let parsedTags: string[] = []
        
        try {
          // Try to parse as JSON first
          if (typeof ioc.tags === 'string') {
            if (ioc.tags.startsWith('[') || ioc.tags.startsWith('{')) {
              parsedTags = JSON.parse(ioc.tags)
            } else {
              // If not JSON, treat as comma-separated string
              parsedTags = ioc.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
            }
          } else if (Array.isArray(ioc.tags)) {
            parsedTags = ioc.tags
          }
        } catch (error) {
          // If parsing fails, treat as comma-separated string
          parsedTags = typeof ioc.tags === 'string' ? 
            ioc.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
        }
        
        const campaignTags = parsedTags.filter(tag => 
          tag.toLowerCase().includes('campaign') || 
          tag.toLowerCase().includes('apt') || 
          tag.toLowerCase().includes('group')
        )
        
        campaignTags.forEach(tag => {
          if (!campaignGroups.has(tag)) {
            campaignGroups.set(tag, [])
          }
          campaignGroups.get(tag).push(node.id)
        })
      }
    })

    // Create campaign-based correlations
    campaignGroups.forEach(nodeIds => {
      if (nodeIds.length > 1) {
        for (let i = 0; i < nodeIds.length; i++) {
          for (let j = i + 1; j < nodeIds.length; j++) {
            if (isValidLink(nodeIds[i], nodeIds[j])) {
              correlations.push({
                source: nodeIds[i],
                target: nodeIds[j],
                relationship: 'same_campaign',
                strength: 0.6 + Math.random() * 0.3
              })
            }
          }
        }
      }
    })

    // 4. Hash similarity correlations
    const hashNodes = nodes.filter(n => n.type === 'hash')
    
    hashNodes.forEach((hash1, i) => {
      hashNodes.slice(i + 1).forEach(hash2 => {
        // Simulate hash similarity (in real implementation, use fuzzy hashing)
        const similarity = calculateHashSimilarity(hash1.value, hash2.value)
        if (similarity > 0.7 && isValidLink(hash1.id, hash2.id)) {
          correlations.push({
            source: hash1.id,
            target: hash2.id,
            relationship: 'similar_hash',
            strength: similarity
          })
        }
      })
    })

    // 5. Email-Domain correlations
    const emailNodes = nodes.filter(n => n.type === 'email')
    
    emailNodes.forEach(email => {
      const emailDomain = email.value.split('@')[1]
      const matchingDomains = domainNodes.filter(domain => 
        domain.value === emailDomain
      )
      
      matchingDomains.forEach(domain => {
        if (isValidLink(email.id, domain.id)) {
          correlations.push({
            source: email.id,
            target: domain.id,
            relationship: 'communicates_with',
            strength: 0.7 + Math.random() * 0.2
          })
        }
      })
    })

    // 6. Temporal correlations (IOCs seen around the same time)
    const timeGroups = new Map()
    
    recentIOCs.forEach(ioc => {
      const timeKey = Math.floor(new Date(ioc.lastSeen).getTime() / (1000 * 60 * 60 * 6)) // 6-hour windows
      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, [])
      }
      const nodeId = nodeMap.get(ioc.value)
      if (nodeId && nodeIdSet.has(nodeId)) {
        timeGroups.get(timeKey).push(nodeId)
      }
    })

    // Create temporal correlations
    timeGroups.forEach(nodeIds => {
      if (nodeIds.length > 1 && nodeIds.length < 6) { // Avoid too many connections
        for (let i = 0; i < nodeIds.length; i++) {
          for (let j = i + 1; j < nodeIds.length; j++) {
            // Only add if not already correlated and both nodes exist
            const existingCorrelation = correlations.find(c => 
              (c.source === nodeIds[i] && c.target === nodeIds[j]) ||
              (c.source === nodeIds[j] && c.target === nodeIds[i])
            )
            
            if (!existingCorrelation && Math.random() > 0.5 && isValidLink(nodeIds[i], nodeIds[j])) {
              correlations.push({
                source: nodeIds[i],
                target: nodeIds[j],
                relationship: 'same_campaign',
                strength: 0.4 + Math.random() * 0.3
              })
            }
          }
        }
      }
    })

    // Filter out weak correlations and limit total connections
    const strongCorrelations = correlations
      .filter(c => c.strength > 0.5)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 50) // Reduced to 50 for better performance

    // Final validation: ensure all links reference existing nodes
    const validatedLinks = strongCorrelations.filter(link => 
      isValidLink(link.source, link.target)
    )

    return NextResponse.json({
      nodes: nodes, // Return all nodes (already limited to 30)
      links: validatedLinks,
      metadata: {
        totalIOCs: recentIOCs.length,
        totalAlerts: recentAlerts.length,
        totalNodes: nodes.length,
        totalLinks: validatedLinks.length,
        correlationStrength: validatedLinks.length > 0 ? 
          validatedLinks.reduce((sum, c) => sum + c.strength, 0) / validatedLinks.length : 0,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Correlation analysis error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate correlations',
      nodes: [],
      links: [],
      metadata: {
        totalIOCs: 0,
        totalAlerts: 0,
        totalNodes: 0,
        totalLinks: 0,
        correlationStrength: 0,
        lastUpdated: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

// Helper function to calculate hash similarity
function calculateHashSimilarity(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 0
  
  let matches = 0
  const minLength = Math.min(hash1.length, hash2.length)
  
  for (let i = 0; i < minLength; i++) {
    if (hash1[i] === hash2[i]) {
      matches++
    }
  }
  
  return matches / minLength
} 