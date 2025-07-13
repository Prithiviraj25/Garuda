import { db } from '@/db'
import { threatFeeds, iocs, alerts, threatCampaigns } from '@/db/schema'

export async function populateSampleData() {
  console.log('🌱 Populating database with sample data...')
  
  try {
    // Clear existing data
    await db.delete(alerts)
    await db.delete(iocs)
    await db.delete(threatFeeds)
    await db.delete(threatCampaigns)
    
    // Insert sample threat feeds
    const sampleFeeds = [
      {
        name: 'URLhaus Malware URLs',
        type: 'urlhaus' as const,
        url: 'https://urlhaus-api.abuse.ch/v1/urls/recent/',
        isActive: true,
        syncInterval: 3600,
        config: { format: 'json', limit: 100 },
        apiKey: '',
        lastSync: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        name: 'ThreatFox IOCs',
        type: 'custom' as const,
        url: 'https://threatfox-api.abuse.ch/api/v1/',
        isActive: true,
        syncInterval: 3600,
        config: { query: 'get_iocs', limit: 100 },
        apiKey: '',
        lastSync: new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
      },
      {
        name: 'OpenPhish',
        type: 'custom' as const,
        url: 'https://openphish.com/feed.txt',
        isActive: true,
        syncInterval: 1800,
        config: { format: 'txt' },
        apiKey: '',
        lastSync: new Date(Date.now() - 7 * 60 * 1000) // 7 minutes ago
      },
      {
        name: 'Malware Bazaar',
        type: 'custom' as const,
        url: 'https://bazaar.abuse.ch/api/v1/',
        isActive: true,
        syncInterval: 3600,
        config: { query: 'get_recent', limit: 100 },
        apiKey: '',
        lastSync: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      },
      {
        name: 'Feodo Tracker',
        type: 'custom' as const,
        url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.csv',
        isActive: true,
        syncInterval: 3600,
        config: { format: 'csv' },
        apiKey: '',
        lastSync: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      },
      {
        name: 'AbuseIPDB',
        type: 'custom' as const,
        url: 'https://api.abuseipdb.com/api/v2/blacklist',
        isActive: true,
        syncInterval: 7200,
        config: { format: 'json', limit: 1000 },
        apiKey: '',
        lastSync: new Date(Date.now() - 8 * 60 * 1000) // 8 minutes ago
      },
      {
        name: 'VirusTotal',
        type: 'custom' as const,
        url: 'https://www.virustotal.com/vtapi/v2/',
        isActive: true,
        syncInterval: 3600,
        config: { api_version: 'v2' },
        apiKey: '',
        lastSync: new Date(Date.now() - 6 * 60 * 1000) // 6 minutes ago
      },
      {
        name: 'AlienVault OTX',
        type: 'custom' as const,
        url: 'https://otx.alienvault.com/api/v1/',
        isActive: false,
        syncInterval: 7200,
        config: { pulses: true },
        apiKey: '',
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        name: 'Spamhaus DROP',
        type: 'custom' as const,
        url: 'https://www.spamhaus.org/drop/drop.txt',
        isActive: true,
        syncInterval: 14400,
        config: { format: 'txt' },
        apiKey: '',
        lastSync: new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
      },
      {
        name: 'Emerging Threats',
        type: 'custom' as const,
        url: 'https://rules.emergingthreats.net/blockrules/compromised-ips.txt',
        isActive: true,
        syncInterval: 7200,
        config: { format: 'txt' },
        apiKey: '',
        lastSync: new Date(Date.now() - 18 * 60 * 1000) // 18 minutes ago
      },
      {
        name: 'SANS ISC',
        type: 'custom' as const,
        url: 'https://isc.sans.edu/api/threatlist/',
        isActive: true,
        syncInterval: 14400,
        config: { format: 'json' },
        apiKey: '',
        lastSync: new Date(Date.now() - 25 * 60 * 1000) // 25 minutes ago
      },
      {
        name: 'Krebs Security',
        type: 'custom' as const,
        url: 'https://krebsonsecurity.com/feed/',
        isActive: true,
        syncInterval: 21600,
        config: { format: 'rss' },
        apiKey: '',
        lastSync: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        name: 'Bleeping Computer',
        type: 'custom' as const,
        url: 'https://www.bleepingcomputer.com/feed/',
        isActive: true,
        syncInterval: 21600,
        config: { format: 'rss' },
        apiKey: '',
        lastSync: new Date(Date.now() - 35 * 60 * 1000) // 35 minutes ago
      },
      {
        name: 'GreyNoise',
        type: 'custom' as const,
        url: 'https://api.greynoise.io/v2/',
        isActive: true,
        syncInterval: 3600,
        config: { api_version: 'v2' },
        apiKey: '',
        lastSync: new Date(Date.now() - 4 * 60 * 1000) // 4 minutes ago
      },
      {
        name: 'Phishing Army',
        type: 'custom' as const,
        url: 'https://phishing.army/download/phishing_army_blocklist.txt',
        isActive: true,
        syncInterval: 14400,
        config: { format: 'txt' },
        apiKey: '',
        lastSync: new Date(Date.now() - 12 * 60 * 1000) // 12 minutes ago
      }
    ]
    
    await db.insert(threatFeeds).values(sampleFeeds)
    
    // Insert sample IOCs
    const sampleIOCs = [
      {
        type: 'ip' as const,
        value: '185.220.101.32',
        description: 'Botnet C2 server identified in multiple campaigns',
        severity: 'critical' as const,
        confidence: '95.5',
        sources: ['URLhaus', 'ThreatFox'],
        firstSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastSeen: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        tags: ['botnet', 'c2', 'malware'],
        metadata: { country: 'Germany', asn: 'AS24940', threatType: 'C2' }
      },
      {
        type: 'ip' as const,
        value: '45.142.214.48',
        description: 'Malware distribution server hosting multiple exploit kits',
        severity: 'high' as const,
        confidence: '87.2',
        sources: ['Malware Bazaar', 'AbuseIPDB'],
        firstSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        tags: ['malware', 'exploit-kit', 'distribution'],
        metadata: { country: 'Netherlands', asn: 'AS20473', threatType: 'Malware Distribution' }
      },
      {
        type: 'ip' as const,
        value: '103.224.182.245',
        description: 'Phishing campaign infrastructure targeting banking customers',
        severity: 'high' as const,
        confidence: '82.1',
        sources: ['OpenPhish', 'Phishing Army'],
        firstSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        tags: ['phishing', 'banking', 'fraud'],
        metadata: { country: 'India', asn: 'AS45609', threatType: 'Phishing' }
      },
      {
        type: 'domain' as const,
        value: 'malicious-banking-site.com',
        description: 'Fake banking portal used for credential harvesting',
        severity: 'critical' as const,
        confidence: '96.8',
        sources: ['OpenPhish', 'VirusTotal'],
        firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        lastSeen: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        tags: ['phishing', 'banking', 'credential-theft'],
        metadata: { registrar: 'Namecheap', threatType: 'Banking Phishing' }
      },
      {
        type: 'domain' as const,
        value: 'crypto-stealer-payload.org',
        description: 'Cryptocurrency wallet stealer distribution site',
        severity: 'high' as const,
        confidence: '91.3',
        sources: ['URLhaus', 'Emerging Threats'],
        firstSeen: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        lastSeen: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        tags: ['cryptocurrency', 'stealer', 'malware'],
        metadata: { registrar: 'GoDaddy', threatType: 'Crypto Theft' }
      },
      {
        type: 'url' as const,
        value: 'https://fake-microsoft-login.net/secure/oauth2/authorize',
        description: 'Microsoft OAuth phishing page with convincing UI',
        severity: 'high' as const,
        confidence: '88.7',
        sources: ['OpenPhish', 'SANS ISC'],
        firstSeen: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        tags: ['phishing', 'oauth', 'microsoft', 'impersonation'],
        metadata: { scheme: 'https', threatType: 'OAuth Phishing' }
      },
      {
        type: 'hash' as const,
        value: 'a1b2c3d4e5f6789012345678901234567890abcdef123456789012345678901234',
        description: 'Ransomware payload (CryptoLocker variant)',
        severity: 'critical' as const,
        confidence: '98.1',
        sources: ['Malware Bazaar', 'VirusTotal'],
        firstSeen: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        tags: ['ransomware', 'cryptolocker', 'file-encryption'],
        metadata: { fileType: 'PE32', threatType: 'Ransomware' }
      },
      {
        type: 'hash' as const,
        value: 'f9e8d7c6b5a4930281746352819048576473829d1234567890abcdef12345678',
        description: 'Banking trojan targeting European financial institutions',
        severity: 'high' as const,
        confidence: '92.4',
        sources: ['ThreatFox', 'Feodo Tracker'],
        firstSeen: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        tags: ['banking-trojan', 'financial', 'europe'],
        metadata: { fileType: 'PE32', threatType: 'Banking Trojan' }
      }
    ]
    
    await db.insert(iocs).values(sampleIOCs)
    
    // Insert sample alerts
    const sampleAlerts = [
      {
        title: 'Critical: Multi-stage ransomware campaign detected',
        description: 'Advanced ransomware campaign with new TTPs detected targeting financial institutions. Multiple IOCs confirmed as part of coordinated attack infrastructure.',
        severity: 'critical' as const,
        status: 'open' as const,
        type: 'campaign_detected' as const,
        sourceType: 'ai' as const,
        relatedIocs: JSON.stringify(['185.220.101.32', 'malicious-banking-site.com']),
        priority: 1,
        metadata: JSON.stringify({
          campaign: 'CryptoLocker Q1 2025',
          affectedSectors: ['Financial Services', 'Healthcare'],
          confidence: 95,
          mitreTechniques: ['T1486', 'T1027', 'T1041']
        })
      },
      {
        title: 'High: Banking trojan infrastructure expansion',
        description: 'New C2 servers identified for banking trojan campaign. Immediate blocking recommended to prevent credential theft.',
        severity: 'high' as const,
        status: 'investigating' as const,
        type: 'ioc_detected' as const,
        sourceType: 'feed' as const,
        relatedIocs: JSON.stringify(['45.142.214.48', 'crypto-stealer-payload.org']),
        priority: 2,
        metadata: JSON.stringify({
          campaign: 'Banking Trojan Wave 2025',
          techniques: ['T1071', 'T1055', 'T1082'],
          confidence: 87
        })
      },
      {
        title: 'Medium: Phishing campaign targeting employees',
        description: 'Large-scale phishing campaign detected using OAuth impersonation tactics. Multiple domains registered with similar patterns.',
        severity: 'medium' as const,
        status: 'open' as const,
        type: 'campaign_detected' as const,
        sourceType: 'ai' as const,
        relatedIocs: JSON.stringify(['fake-microsoft-login.net', '103.224.182.245']),
        priority: 3,
        metadata: JSON.stringify({
          campaign: 'OAuth Phishing 2025',
          targetedSectors: ['Technology', 'Education'],
          confidence: 78
        })
      },
      {
        title: 'High: Cryptocurrency theft malware surge',
        description: 'Significant increase in cryptocurrency wallet stealer variants detected. New evasion techniques identified.',
        severity: 'high' as const,
        status: 'investigating' as const,
        type: 'anomaly' as const,
        sourceType: 'ai' as const,
        relatedIocs: JSON.stringify(['a1b2c3d4e5f6789012345678901234567890abcdef123456789012345678901234']),
        priority: 2,
        metadata: JSON.stringify({
          campaign: 'Crypto Stealer Evolution',
          techniques: ['T1555', 'T1027', 'T1041'],
          confidence: 92
        })
      },
      {
        title: 'Medium: DNS tunneling activity detected',
        description: 'Suspicious DNS query patterns consistent with data exfiltration via DNS tunneling. Multiple domains show irregular traffic.',
        severity: 'medium' as const,
        status: 'investigating' as const,
        type: 'anomaly' as const,
        sourceType: 'ai' as const,
        relatedIocs: JSON.stringify(['crypto-stealer-payload.org']),
        priority: 3,
        metadata: JSON.stringify({
          technique: 'DNS Tunneling',
          mitreTechniques: ['T1071.004', 'T1568'],
          confidence: 74
        })
      }
    ]
    
    await db.insert(alerts).values(sampleAlerts)
    
    // Insert sample campaigns
    const sampleCampaigns = [
      {
        name: 'CryptoLocker Q1 2025',
        description: 'Sophisticated ransomware campaign targeting financial institutions with advanced evasion techniques',
        severity: 'critical' as const,
        status: 'active' as const,
        family: 'CryptoLocker',
        firstSeen: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        lastSeen: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        relatedIocs: JSON.stringify(['185.220.101.32', 'malicious-banking-site.com']),
        mitreTechniques: JSON.stringify(['T1486', 'T1027', 'T1041', 'T1071']),
        tags: JSON.stringify(['ransomware', 'financial', 'advanced', 'cryptolocker']),
        metadata: JSON.stringify({
          attribution: 'Unknown',
          targetedSectors: ['Financial Services', 'Healthcare'],
          geographicFocus: ['North America', 'Europe'],
          confidence: 95
        })
      },
      {
        name: 'Banking Trojan Wave 2025',
        description: 'Coordinated banking trojan campaign with shared infrastructure and similar TTPs',
        severity: 'high' as const,
        status: 'active' as const,
        family: 'Banking Trojan',
        firstSeen: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        relatedIocs: JSON.stringify(['45.142.214.48', 'f9e8d7c6b5a4930281746352819048576473829d1234567890abcdef12345678']),
        mitreTechniques: JSON.stringify(['T1071', 'T1055', 'T1082', 'T1005']),
        tags: JSON.stringify(['banking-trojan', 'financial', 'credential-theft']),
        metadata: JSON.stringify({
          attribution: 'Cybercriminal Group',
          targetedSectors: ['Financial Services', 'Banking'],
          geographicFocus: ['Europe', 'Asia'],
          confidence: 87
        })
      }
    ]
    
    await db.insert(threatCampaigns).values(sampleCampaigns)
    
    console.log('✅ Sample data populated successfully!')
    
    return {
      success: true,
      counts: {
        feeds: sampleFeeds.length,
        iocs: sampleIOCs.length,
        alerts: sampleAlerts.length,
        campaigns: sampleCampaigns.length
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to populate sample data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 