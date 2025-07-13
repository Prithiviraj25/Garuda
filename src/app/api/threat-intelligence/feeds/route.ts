import { database } from '@/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let feeds = await database.getThreatFeeds();
    
    // If no feeds in database, return some sample data for demonstration
    if (feeds.length === 0) {
      feeds = [
        {
          id: 'feed-1',
          name: 'URLhaus Malware URLs',
          type: 'urlhaus',
          url: 'https://urlhaus-api.abuse.ch/v1/urls/recent/',
          isActive: true,
          syncInterval: 3600,
          config: { format: 'json', limit: 100 },
          apiKey: '',
          lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-2',
          name: 'ThreatFox IOCs',
          type: 'custom',
          url: 'https://threatfox-api.abuse.ch/api/v1/',
          isActive: true,
          syncInterval: 3600,
          config: { query: 'get_iocs', limit: 100 },
          apiKey: '',
          lastSync: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 minutes ago
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-3',
          name: 'OpenPhish',
          type: 'custom',
          url: 'https://openphish.com/feed.txt',
          isActive: true,
          syncInterval: 1800,
          config: { format: 'txt' },
          apiKey: '',
          lastSync: new Date(Date.now() - 7 * 60 * 1000).toISOString(), // 7 minutes ago
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-4',
          name: 'Malware Bazaar',
          type: 'custom',
          url: 'https://bazaar.abuse.ch/api/v1/',
          isActive: true,
          syncInterval: 3600,
          config: { query: 'get_recent', limit: 100 },
          apiKey: '',
          lastSync: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
          createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-5',
          name: 'Feodo Tracker',
          type: 'custom',
          url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.csv',
          isActive: true,
          syncInterval: 3600,
          config: { format: 'csv' },
          apiKey: '',
          lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-6',
          name: 'AbuseIPDB',
          type: 'custom',
          url: 'https://api.abuseipdb.com/api/v2/blacklist',
          isActive: true,
          syncInterval: 7200,
          config: { format: 'json', limit: 1000 },
          apiKey: '',
          lastSync: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-7',
          name: 'VirusTotal',
          type: 'custom',
          url: 'https://www.virustotal.com/vtapi/v2/',
          isActive: true,
          syncInterval: 3600,
          config: { api_version: 'v2' },
          apiKey: '',
          lastSync: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 minutes ago
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-8',
          name: 'AlienVault OTX',
          type: 'custom',
          url: 'https://otx.alienvault.com/api/v1/',
          isActive: false,
          syncInterval: 7200,
          config: { pulses: true },
          apiKey: '',
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-9',
          name: 'Spamhaus DROP',
          type: 'custom',
          url: 'https://www.spamhaus.org/drop/drop.txt',
          isActive: true,
          syncInterval: 14400,
          config: { format: 'txt' },
          apiKey: '',
          lastSync: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-10',
          name: 'Emerging Threats',
          type: 'custom',
          url: 'https://rules.emergingthreats.net/blockrules/compromised-ips.txt',
          isActive: true,
          syncInterval: 7200,
          config: { format: 'txt' },
          apiKey: '',
          lastSync: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 minutes ago
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-11',
          name: 'SANS ISC',
          type: 'custom',
          url: 'https://isc.sans.edu/api/threatlist/',
          isActive: true,
          syncInterval: 14400,
          config: { format: 'json' },
          apiKey: '',
          lastSync: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-12',
          name: 'Krebs Security',
          type: 'custom',
          url: 'https://krebsonsecurity.com/feed/',
          isActive: true,
          syncInterval: 21600,
          config: { format: 'rss' },
          apiKey: '',
          lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-13',
          name: 'Bleeping Computer',
          type: 'custom',
          url: 'https://www.bleepingcomputer.com/feed/',
          isActive: true,
          syncInterval: 21600,
          config: { format: 'rss' },
          apiKey: '',
          lastSync: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-14',
          name: 'GreyNoise',
          type: 'custom',
          url: 'https://api.greynoise.io/v2/',
          isActive: true,
          syncInterval: 3600,
          config: { api_version: 'v2' },
          apiKey: '',
          lastSync: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 minutes ago
          createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString()
        },
        {
          id: 'feed-15',
          name: 'Phishing Army',
          type: 'custom',
          url: 'https://phishing.army/download/phishing_army_blocklist.txt',
          isActive: true,
          syncInterval: 14400,
          config: { format: 'txt' },
          apiKey: '',
          lastSync: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 minutes ago
          createdAt: new Date(Date.now() - 0.25 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
        }
      ];
    }
    
    return NextResponse.json(feeds);
  } catch (error) {
    console.error('Error fetching threat feeds:', error);
    return NextResponse.json({ error: 'Failed to fetch threat feeds' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newFeed = await database.addThreatFeed(body);
    return NextResponse.json(newFeed);
  } catch (error) {
    console.error('Error creating threat feed:', error);
    return NextResponse.json({ error: 'Failed to create threat feed' }, { status: 500 });
  }
} 