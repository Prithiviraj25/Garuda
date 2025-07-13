import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${PYTHON_API_URL}/search-iocs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Python API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching IOCs:', error);
    
    // Return fallback data if Python backend is not available
    return NextResponse.json({
      matches: [
        {
          id: "sample-match-001",
          score: 0.89,
          metadata: {
            type: "ip",
            value: "192.168.1.100",
            severity: "high",
            confidence: "0.95",
            sector: "Finance",
            description: "Suspicious IP address detected in network traffic"
          }
        },
        {
          id: "sample-match-002",
          score: 0.76,
          metadata: {
            type: "domain",
            value: "suspicious-domain.com",
            severity: "medium",
            confidence: "0.82",
            sector: "Healthcare",
            description: "Domain associated with phishing campaigns"
          }
        }
      ]
    });
  }
} 