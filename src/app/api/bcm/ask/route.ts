import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
    const { query } = body;
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    // Always use fallback response, do not call Python API
    const response = (await axios.post(`${PYTHON_API_URL}/ask`, { query })).data.response;
    console.log('response', response);
    return NextResponse.json({ 
      response: response,
      context_used: 'Fallback response - AI assistant unavailable'
    }, { status: 200 });
  } catch (error) {
    // Defensive fallback for malformed requests
    return NextResponse.json({ 
      error: 'AI assistant temporarily unavailable',
      response: 'Unable to process your request at this time.'
    }, { status: 200 });
  }
}

// function generateFallbackResponse(query: string): string {
//   const lowerQuery = query.toLowerCase();
  
//   if (lowerQuery.includes('threat') || lowerQuery.includes('attack') || lowerQuery.includes('malware')) {
//     return `Based on current threat intelligence regarding "${query}":

// 🛡️ **Threat Analysis:**
// - Monitor for suspicious network activity and unusual traffic patterns
// - Implement defense-in-depth security strategies
// - Keep threat intelligence feeds updated
// - Review recent IOCs and indicators in our system

// 🔍 **Recommended Actions:**
// - Check our threat intelligence dashboard for latest IOCs
// - Review recent alerts for related activity
// - Implement appropriate security controls
// - Consider threat hunting activities

// 📊 **Current Status:** Check the main dashboard for real-time threat metrics and recent activity.`;
//   }
  
//   if (lowerQuery.includes('ioc') || lowerQuery.includes('indicator')) {
//     return `Regarding IOCs and indicators for "${query}":

// 🎯 **IOC Analysis:**
// - Check our threat intelligence system for related indicators
// - Review recent IOC feeds and their severity ratings
// - Correlate with existing alerts and incidents
// - Validate indicators against current infrastructure

// 📋 **Next Steps:**
// - Use the BCM Analysis tool to assess business impact
// - Search our IOC database for related indicators
// - Review the global threat map for geographic patterns
// - Check feed status for latest updates`;
//   }
  
//   if (lowerQuery.includes('bcm') || lowerQuery.includes('business') || lowerQuery.includes('continuity')) {
//     return `For business continuity management regarding "${query}":

// 🏢 **BCM Analysis:**
// - Run the BCM Analysis tool to assess current business impact
// - Review critical business processes and their threat exposure
// - Calculate risk scores based on current threat landscape
// - Generate executive reports for stakeholders

// ⚠️ **Risk Assessment:**
// - Current business risk score: Check BCM dashboard
// - Critical processes monitored: 5 key business areas
// - Active threat exposure: Review real-time metrics
// - Recommended mitigation strategies available`;
//   }
  
//   return `I'm currently analyzing "${query}" for you. Here's what I can provide:

// 🔍 **General Guidance:**
// - Use our threat intelligence dashboard for real-time data
// - Check the BCM Analysis tool for business impact assessment
// - Review the global threat map for geographic context
// - Access recent alerts and IOCs through the main interface

// 📊 **Available Tools:**
// - Real-time threat intelligence monitoring
// - Business continuity management analysis
// - IOC correlation and analysis
// - Global threat visualization

// 💡 **Tip:** Try using the specific tools in our dashboard for detailed analysis of your query.`;
// }