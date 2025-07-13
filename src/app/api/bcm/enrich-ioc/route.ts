import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  let body: any = null;
  
  try {
    body = await request.json();
    const { ioc, ioc_type, severity, sector } = body;

    if (!ioc || !ioc_type) {
      return NextResponse.json({ error: "IOC and IOC type are required" }, { status: 400 });
    }

    const response = await fetch(`${PYTHON_API_URL}/analyze-ioc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ioc, ioc_type, severity, sector }),
    });

    if (!response.ok) {
      throw new Error(`Python API responded with status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error enriching IOC:', error);
    return NextResponse.json({ 
      error: 'Failed to enrich IOC',
      response: `Unable to enrich IOC: ${body?.ioc || 'unknown'}

General threat analysis:
- IOC Type: ${body?.ioc_type || 'unknown'}
- Severity: ${body?.severity || 'medium'}
- Sector: ${body?.sector || 'general'}

Recommended actions:
- Block/monitor this IOC in security tools
- Check logs for related activity
- Review security policies and controls
- Consider threat hunting activities

Please ensure the Python backend is running for detailed analysis.`,
      context_used: 'Fallback response - enrichment service unavailable'
    }, { status: 200 });
  }
} 