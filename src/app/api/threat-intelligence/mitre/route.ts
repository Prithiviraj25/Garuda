import { NextResponse } from 'next/server'
import { db } from '@/db'
import { iocs, alerts, threatCampaigns } from '@/db/schema'
import { sql } from 'drizzle-orm'

// MITRE ATT&CK technique database
const MITRE_TECHNIQUES = {
  // Initial Access
  'T1566.001': { name: 'Spearphishing Attachment', tactic: 'Initial Access', description: 'Adversaries may send spearphishing emails with a malicious attachment' },
  'T1566.002': { name: 'Spearphishing Link', tactic: 'Initial Access', description: 'Adversaries may send spearphishing emails with a malicious link' },
  'T1190': { name: 'Exploit Public-Facing Application', tactic: 'Initial Access', description: 'Adversaries may exploit internet-facing applications' },
  'T1133': { name: 'External Remote Services', tactic: 'Initial Access', description: 'Adversaries may leverage external-facing remote services' },
  
  // Execution
  'T1059.001': { name: 'PowerShell', tactic: 'Execution', description: 'Adversaries may abuse PowerShell commands and scripts' },
  'T1059.003': { name: 'Windows Command Shell', tactic: 'Execution', description: 'Adversaries may abuse the Windows command shell' },
  'T1569.002': { name: 'Service Execution', tactic: 'Execution', description: 'Adversaries may abuse the Windows service control manager' },
  'T1204.001': { name: 'Malicious Link', tactic: 'Execution', description: 'An adversary may rely upon a user clicking a malicious link' },
  'T1204.002': { name: 'Malicious File', tactic: 'Execution', description: 'An adversary may rely upon a user opening a malicious file' },
  
  // Persistence
  'T1547.001': { name: 'Registry Run Keys / Startup Folder', tactic: 'Persistence', description: 'Adversaries may achieve persistence by adding a program to a startup folder' },
  'T1053.005': { name: 'Scheduled Task', tactic: 'Persistence', description: 'Adversaries may abuse the Windows Task Scheduler' },
  'T1543.003': { name: 'Windows Service', tactic: 'Persistence', description: 'Adversaries may create or modify Windows services' },
  
  // Defense Evasion
  'T1027': { name: 'Obfuscated Files or Information', tactic: 'Defense Evasion', description: 'Adversaries may attempt to make an executable or file difficult to discover' },
  'T1055': { name: 'Process Injection', tactic: 'Defense Evasion', description: 'Adversaries may inject code into processes' },
  'T1070.004': { name: 'File Deletion', tactic: 'Defense Evasion', description: 'Adversaries may delete files left behind by the actions of their intrusion activity' },
  'T1112': { name: 'Modify Registry', tactic: 'Defense Evasion', description: 'Adversaries may interact with the Windows Registry' },
  
  // Credential Access
  'T1110.001': { name: 'Password Guessing', tactic: 'Credential Access', description: 'Adversaries may use password guessing to obtain valid account credentials' },
  'T1555': { name: 'Credentials from Password Stores', tactic: 'Credential Access', description: 'Adversaries may search for common password storage locations' },
  'T1003.001': { name: 'LSASS Memory', tactic: 'Credential Access', description: 'Adversaries may attempt to access credential material stored in the process memory' },
  
  // Discovery
  'T1082': { name: 'System Information Discovery', tactic: 'Discovery', description: 'An adversary may attempt to get detailed information about the operating system' },
  'T1083': { name: 'File and Directory Discovery', tactic: 'Discovery', description: 'Adversaries may enumerate files and directories' },
  'T1057': { name: 'Process Discovery', tactic: 'Discovery', description: 'Adversaries may attempt to get a listing of running processes' },
  'T1016': { name: 'System Network Configuration Discovery', tactic: 'Discovery', description: 'Adversaries may look for details about the network configuration' },
  
  // Command and Control
  'T1071.001': { name: 'Web Protocols', tactic: 'Command and Control', description: 'Adversaries may communicate using application layer protocols' },
  'T1071.004': { name: 'DNS', tactic: 'Command and Control', description: 'Adversaries may communicate using the Domain Name System (DNS)' },
  'T1041': { name: 'Exfiltration Over C2 Channel', tactic: 'Command and Control', description: 'Adversaries may steal data by exfiltrating it over an existing command and control channel' },
  'T1095': { name: 'Non-Application Layer Protocol', tactic: 'Command and Control', description: 'Adversaries may use a non-application layer protocol for communication' },
  
  // Exfiltration
  'T1041': { name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration', description: 'Adversaries may steal data by exfiltrating it over an existing command and control channel' },
  'T1567.002': { name: 'Exfiltration to Cloud Storage', tactic: 'Exfiltration', description: 'Adversaries may exfiltrate data to a cloud storage service' },
  
  // Impact
  'T1486': { name: 'Data Encrypted for Impact', tactic: 'Impact', description: 'Adversaries may encrypt data on target systems or large numbers of systems' },
  'T1490': { name: 'Inhibit System Recovery', tactic: 'Impact', description: 'Adversaries may delete or remove built-in operating system data and turn off services' },
  'T1489': { name: 'Service Stop', tactic: 'Impact', description: 'Adversaries may stop or disable services on a system' },
  'T1491.001': { name: 'Internal Defacement', tactic: 'Impact', description: 'An adversary may deface systems internal to an organization' }
}

export async function GET() {
  try {
    // Get techniques from alerts
    const alertsWithTechniques = await db
      .select()
      .from(alerts)
      .where(sql`${alerts.metadata} IS NOT NULL`)

    // Get techniques from threat campaigns  
    const campaignsWithTechniques = await db
      .select()
      .from(threatCampaigns)
      .where(sql`${threatCampaigns.techniques} IS NOT NULL`)

    // Aggregate technique usage
    const techniqueUsage = new Map()

    // Process alerts
    alertsWithTechniques.forEach(alert => {
      try {
        const metadata = typeof alert.metadata === 'string' ? JSON.parse(alert.metadata) : alert.metadata
        if (metadata?.techniques) {
          metadata.techniques.forEach((technique: string) => {
            const current = techniqueUsage.get(technique) || { count: 0, severity: 'low', sources: [], lastSeen: null }
            current.count += 1
            current.sources.push(`Alert: ${alert.title}`)
            current.lastSeen = alert.createdAt
            if (alert.severity === 'critical' || (alert.severity === 'high' && current.severity !== 'critical')) {
              current.severity = alert.severity
            }
            techniqueUsage.set(technique, current)
          })
        }
      } catch (error) {
        console.error('Error processing alert metadata:', error)
      }
    })

    // Process campaigns
    campaignsWithTechniques.forEach(campaign => {
      try {
        const techniques = typeof campaign.techniques === 'string' ? JSON.parse(campaign.techniques) : campaign.techniques
        if (Array.isArray(techniques)) {
          techniques.forEach((technique: string) => {
            const current = techniqueUsage.get(technique) || { count: 0, severity: 'low', sources: [], lastSeen: null }
            current.count += 1
            current.sources.push(`Campaign: ${campaign.name}`)
            current.lastSeen = campaign.createdAt
            if (campaign.severity === 'critical' || (campaign.severity === 'high' && current.severity !== 'critical')) {
              current.severity = campaign.severity
            }
            techniqueUsage.set(technique, current)
          })
        }
      } catch (error) {
        console.error('Error processing campaign techniques:', error)
      }
    })

    // Add some synthetic data based on IOC patterns for demonstration
    const iocCount = await db.select({ count: sql`count(*)` }).from(iocs)
    const totalIOCs = Number(iocCount[0]?.count) || 0

    // Add common techniques based on IOC types
    if (totalIOCs > 0) {
      const ipCount = await db.select({ count: sql`count(*)` }).from(iocs).where(sql`${iocs.type} = 'ip'`)
      const domainCount = await db.select({ count: sql`count(*)` }).from(iocs).where(sql`${iocs.type} = 'domain'`)
      const hashCount = await db.select({ count: sql`count(*)` }).from(iocs).where(sql`${iocs.type} = 'hash'`)

      // Add C&C techniques for IPs and domains
      if (Number(ipCount[0]?.count) > 0) {
        ['T1071.001', 'T1041', 'T1095'].forEach(technique => {
          const current = techniqueUsage.get(technique) || { count: 0, severity: 'medium', sources: [], lastSeen: new Date().toISOString() }
          current.count += Math.floor(Number(ipCount[0]?.count) / 3)
          current.sources.push('IP IOC Analysis')
          techniqueUsage.set(technique, current)
        })
      }

      if (Number(domainCount[0]?.count) > 0) {
        ['T1071.004', 'T1568', 'T1583.001'].forEach(technique => {
          const current = techniqueUsage.get(technique) || { count: 0, severity: 'medium', sources: [], lastSeen: new Date().toISOString() }
          current.count += Math.floor(Number(domainCount[0]?.count) / 4)
          current.sources.push('Domain IOC Analysis')
          techniqueUsage.set(technique, current)
        })
      }

      if (Number(hashCount[0]?.count) > 0) {
        ['T1027', 'T1055', 'T1105'].forEach(technique => {
          const current = techniqueUsage.get(technique) || { count: 0, severity: 'high', sources: [], lastSeen: new Date().toISOString() }
          current.count += Math.floor(Number(hashCount[0]?.count) / 2)
          current.sources.push('Malware Hash Analysis')
          techniqueUsage.set(technique, current)
        })
      }
    }

    // Convert to array and add technique details
    const techniques = Array.from(techniqueUsage.entries()).map(([techniqueId, usage]) => {
      const details = MITRE_TECHNIQUES[techniqueId] || {
        name: 'Unknown Technique',
        tactic: 'Unknown',
        description: 'Technique details not available'
      }

      return {
        id: techniqueId,
        name: details.name,
        tactic: details.tactic,
        description: details.description,
        count: usage.count,
        severity: usage.severity,
        sources: [...new Set(usage.sources)], // Remove duplicates
        lastSeen: usage.lastSeen,
        riskScore: calculateRiskScore(usage.count, usage.severity)
      }
    })

    // Sort by count descending
    techniques.sort((a, b) => b.count - a.count)

    // Generate tactic summary
    const tacticSummary = techniques.reduce((acc, technique) => {
      if (!acc[technique.tactic]) {
        acc[technique.tactic] = { count: 0, techniques: 0, maxSeverity: 'low' }
      }
      acc[technique.tactic].count += technique.count
      acc[technique.tactic].techniques += 1
      if (getSeverityLevel(technique.severity) > getSeverityLevel(acc[technique.tactic].maxSeverity)) {
        acc[technique.tactic].maxSeverity = technique.severity
      }
      return acc
    }, {} as any)

    // Generate trend data (mock for now)
    const trends = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      trends.push({
        date: date.toISOString().split('T')[0],
        techniques: Math.floor(Math.random() * 10) + techniques.length,
        criticalTechniques: Math.floor(Math.random() * 3) + 1,
        newTechniques: Math.floor(Math.random() * 2)
      })
    }

    return NextResponse.json({
      success: true,
      techniques: techniques.slice(0, 20), // Top 20 techniques
      tacticSummary,
      trends,
      metadata: {
        totalTechniques: techniques.length,
        criticalTechniques: techniques.filter(t => t.severity === 'critical').length,
        highTechniques: techniques.filter(t => t.severity === 'high').length,
        lastUpdated: new Date().toISOString(),
        coverage: Math.round((techniques.length / Object.keys(MITRE_TECHNIQUES).length) * 100)
      }
    })

  } catch (error) {
    console.error('Error fetching MITRE ATT&CK data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch MITRE ATT&CK data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function calculateRiskScore(count: number, severity: string): number {
  const severityMultiplier = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  }
  
  const baseScore = Math.min(count * 5, 50) // Count contribution (max 50)
  const severityScore = (severityMultiplier[severity as keyof typeof severityMultiplier] || 1) * 12.5 // Severity contribution (max 50)
  
  return Math.min(Math.round(baseScore + severityScore), 100)
}

function getSeverityLevel(severity: string): number {
  const levels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 }
  return levels[severity as keyof typeof levels] || 1
} 