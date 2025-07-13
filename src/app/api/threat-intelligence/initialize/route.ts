import { NextResponse } from 'next/server'
import { ThreatIntelligenceSystemInitializer } from '@/lib/threat-intelligence/system-initializer'

export async function POST() {
  try {
    console.log('🚀 Initializing Threat Intelligence System...')
    
    const systemInitializer = ThreatIntelligenceSystemInitializer.getInstance()
    const result = await systemInitializer.initializeSystem()
    
    if (result.success) {
      console.log('✅ System initialization successful:', result.data)
      return NextResponse.json(result)
    } else {
      console.error('❌ System initialization failed:', result.data)
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Critical initialization error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Critical system initialization failure',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      { status: 500 }
    )
  }
} 