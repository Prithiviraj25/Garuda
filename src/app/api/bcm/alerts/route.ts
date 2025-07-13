import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/alerts`, {
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
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ 
      alerts: [
        {
          id: "A-FALLBACK-001",
          title: "Backend Connection Issue",
          severity: "Medium",
          status: "investigating"
        }
      ]
    }, { status: 200 });
  }
} 