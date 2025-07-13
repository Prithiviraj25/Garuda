import { database } from '@/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let alerts = await database.getAlerts(limit);

    // If no alerts in database, return some sample data for demonstration
    if (alerts.length === 0) {
      alerts = [
        {
          id: 'alert-1',
          title: 'Critical: Banking Trojan Campaign Detected',
          description: 'Multiple IOCs associated with a sophisticated banking trojan campaign targeting financial institutions. Immediate action required.',
          severity: 'critical',
          status: 'open',
          type: 'campaign_detected',
          sourceType: 'ai',
          relatedIocs: JSON.stringify(['185.220.101.32', 'malicious-banking-site.com']),
          priority: 1,
          metadata: JSON.stringify({
            campaign: 'Banking Trojan Q4 2024',
            affectedSectors: ['Financial Services', 'Banking'],
            confidence: 95
          }),
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()  // 1 hour ago
        },
        {
          id: 'alert-2',
          title: 'High: Ransomware Infrastructure Expansion',
          description: 'New ransomware C2 servers identified. Proactive blocking recommended.',
          severity: 'high',
          status: 'investigating',
          type: 'campaign_detected',
          sourceType: 'ai',
          relatedIocs: JSON.stringify(['198.98.51.189', 'ransomware-payment-portal.biz']),
          priority: 2,
          metadata: JSON.stringify({
            campaign: 'RansomX Campaign',
            techniques: ['T1486', 'T1027', 'T1041'],
            confidence: 87
          }),
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()  // 3 hours ago
        },
        {
          id: 'alert-3',
          title: 'Medium: Phishing Campaign Targeting Employees',
          description: 'Credential harvesting campaign detected targeting corporate employees.',
          severity: 'medium',
          status: 'open',
          type: 'ioc_detected',
          sourceType: 'ai',
          relatedIocs: JSON.stringify(['fake-microsoft-login.net', 'corporate-email-phish.info']),
          priority: 3,
          metadata: JSON.stringify({
            campaign: 'Corporate Phishing Wave',
            targetedSectors: ['Technology', 'Healthcare'],
            confidence: 78
          }),
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()  // 5 hours ago
        },
        {
          id: 'alert-4',
          title: 'High: APT Infrastructure Identified',
          description: 'Advanced Persistent Threat infrastructure detected with links to state-sponsored actors.',
          severity: 'high',
          status: 'investigating',
          type: 'anomaly',
          sourceType: 'ai',
          relatedIocs: JSON.stringify(['91.240.118.172', '119.28.139.120']),
          priority: 2,
          metadata: JSON.stringify({
            campaign: 'APT-X Infrastructure',
            actor: 'State-sponsored',
            techniques: ['T1071', 'T1055', 'T1082'],
            confidence: 92
          }),
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()  // 7 hours ago
        }
      ];
    }

    // Apply filters
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    if (status) {
      alerts = alerts.filter(alert => alert.status === status);
    }
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newAlert = await database.addAlert(body);
    return NextResponse.json(newAlert);
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
} 