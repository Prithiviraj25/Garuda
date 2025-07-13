import { NextResponse } from 'next/server'
import { populateSampleData } from '@/lib/populate-sample-data'

export async function POST() {
  try {
    console.log('🌱 Starting sample data population...')
    
    const result = await populateSampleData()
    
    if (result.success) {
      console.log('✅ Sample data populated successfully!')
      return NextResponse.json({
        success: true,
        message: 'Sample data populated successfully',
        data: result.counts
      })
    } else {
      console.error('❌ Failed to populate sample data:', result.error)
      return NextResponse.json({
        success: false,
        message: 'Failed to populate sample data',
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error in populate-sample-data endpoint:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Use POST to populate sample data',
    endpoint: '/api/populate-sample-data'
  })
} 