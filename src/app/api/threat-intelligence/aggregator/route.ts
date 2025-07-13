import { NextResponse } from 'next/server'
import { ThreatFeedAggregator } from '@/lib/threat-intelligence/feed-aggregator'

let aggregator: ThreatFeedAggregator | null = null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'start') {
      if (!aggregator) {
        aggregator = ThreatFeedAggregator.getInstance()
        // Start aggregation in background
        aggregator.processAllFeeds().catch(console.error)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Threat intelligence aggregation started'
      })
    }

    if (action === 'stop') {
      if (aggregator) {
        // No explicit stop method needed for ThreatFeedAggregator
        aggregator = null
      }
      
      return NextResponse.json({
        success: true,
        message: 'Threat intelligence aggregation stopped'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error controlling aggregator:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to control aggregator' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    status: aggregator ? 'running' : 'stopped'
  })
} 