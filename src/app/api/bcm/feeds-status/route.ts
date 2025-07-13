import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/feeds/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Python API responded with status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching feeds status:', error);
    return NextResponse.json({ 
      feeds: [
        { name: "AbuseIPDB", status: "unknown" },
        { name: "URLhaus", status: "unknown" },
        { name: "PhishTank", status: "unknown" },
        { name: "Pinecone Vector DB", status: "unknown" }
      ]
    }, { status: 200 });
  }
} 