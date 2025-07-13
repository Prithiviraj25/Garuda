import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ioc, ioc_type, severity, sector } = body;

    if (!ioc || !ioc_type) {
      return NextResponse.json({ error: 'IOC and IOC type are required' }, { status: 400 });
    }

    // Try BCM impact analysis first
    const bcmResponse = await fetch(`${PYTHON_API_URL}/bcm-impact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ioc,
        ioc_type,
        severity,
        sector
      })
    });

    if (bcmResponse.ok) {
      const bcmData = await bcmResponse.json();
      return NextResponse.json(bcmData);
    }

    // Fallback to mock analysis if Python backend fails
    const fallbackAnalysis = generateFallbackAnalysis(body);
    return NextResponse.json({
      response: fallbackAnalysis,
      context_used: "Fallback analysis - Python backend unavailable"
    });
  } catch (error) {
    console.error('Error analyzing IOC:', error);
    
    // Generate fallback analysis for error case
    const fallbackAnalysis = generateFallbackAnalysis({
      ioc: 'unknown',
      ioc_type: 'unknown',
      severity: 'medium',
      sector: 'Unknown'
    });
    
    return NextResponse.json({
      response: fallbackAnalysis,
      context_used: "Fallback analysis - Error occurred"
    });
  }
}

function generateFallbackAnalysis(body: any): string {
  
  return `
BCM Impact Analysis (Fallback Mode)

IOC: ${body.ioc || 'N/A'}
Type: ${body.ioc_type || 'N/A'}
Severity: ${body.severity || 'N/A'}
Client Sector: ${body.sector || 'general'}

🔍 Threat Assessment:
Based on the provided IOC characteristics, this indicator poses a ${body.severity || 'medium'} level threat to business operations.

💼 Business Impact:
- ${body.severity === 'high' ? '🔥 High' : body.severity === 'medium' ? '⚠️ Medium' : '🟢 Low'} Impact Level
- Potential disruption to ${body.sector || 'general'} sector operations
- Risk to data integrity and system availability

🛡️ Recommended Mitigations:
1. Implement network monitoring for this IOC
2. Update security policies and procedures
3. Conduct threat hunting activities
4. Review and update incident response procedures
5. Consider additional security controls

📊 Risk Score: ${body.severity === 'high' ? '8.5/10' : body.severity === 'medium' ? '6.0/10' : '3.5/10'}

Note: This is a fallback analysis. For detailed AI-powered assessment, please configure the Python backend with proper API keys.
  `;
} 