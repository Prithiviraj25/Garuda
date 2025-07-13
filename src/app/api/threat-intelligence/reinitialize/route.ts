import { NextResponse } from 'next/server'
import { ThreatIntelligenceSystemInitializer } from '@/lib/threat-intelligence/system-initializer'

export async function POST() {
  try {
    console.log('🔄 Force reinitializing Threat Intelligence System...')
    
    const systemInitializer = ThreatIntelligenceSystemInitializer.getInstance()
    const result = await systemInitializer.forceReinitialize()
    
    if (result.success) {
      console.log('✅ Force reinitialization successful:', result.data)
      return NextResponse.json(result)
    } else {
      console.error('❌ Force reinitialization failed:', result.data)
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Critical reinitialization error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Critical system reinitialization failure',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      { status: 500 }
    )
  }
} 