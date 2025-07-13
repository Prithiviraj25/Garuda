import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/bcm-dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Python API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching BCM dashboard data:', error);
    
    // Return fallback data if Python backend is not available
    return NextResponse.json({
      bcm_results: [
        {
          ioc_id: "sample-ioc-001",
          score: 0.85,
          bcm_summary: "⚠️ Medium Impact\n\nBusiness Reason: This IOC affects internal processes and support functions\n\nSuggested Mitigation:\n- Monitor network traffic\n- Update security policies\n- Implement additional access controls"
        },
        {
          ioc_id: "sample-ioc-002", 
          score: 0.92,
          bcm_summary: "🔥 High Impact\n\nBusiness Reason: This threat affects critical business operations and revenue generators\n\nSuggested Mitigation:\n- Immediate containment required\n- Isolate affected systems\n- Activate incident response team"
        }
      ]
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${PYTHON_API_URL}/bcm-dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Python API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error posting to BCM dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BCM dashboard data' },
      { status: 500 }
    );
  }
} 