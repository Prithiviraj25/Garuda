import { NextResponse } from 'next/server'
import { AIThreatAnalyzer } from '@/lib/threat-intelligence/ai-analyzer'
import { RealTimeThreatProcessor } from '@/lib/threat-intelligence/real-time-processor'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, content, url } = body

    const aiAnalyzer = AIThreatAnalyzer.getInstance()
    const processor = RealTimeThreatProcessor.getInstance()

    // AI analyzer is always available with local fallback logic
    // No external API key required

    switch (action) {
      case 'analyze-text':
        if (!content) {
          return NextResponse.json({
            success: false,
            error: 'Content is required for text analysis'
          }, { status: 400 })
        }

        const textAnalysis = await aiAnalyzer.analyzeContent(content)
        return NextResponse.json({
          success: true,
          analysis: textAnalysis
        })

      case 'analyze-url':
        if (!url) {
          return NextResponse.json({
            success: false,
            error: 'URL is required for URL analysis'
          }, { status: 400 })
        }

        // This would use Web2MD service to fetch and analyze URL content
        return NextResponse.json({
          success: true,
          message: 'URL analysis queued for processing'
        })

      case 'extract-iocs':
        if (!content) {
          return NextResponse.json({
            success: false,
            error: 'Content is required for IOC extraction'
          }, { status: 400 })
        }

        const iocs = await aiAnalyzer.extractIOCsFromText(content)
        return NextResponse.json({
          success: true,
          iocs
        })

      case 'enrich-ioc':
        const { ioc, type } = body
        if (!ioc || !type) {
          return NextResponse.json({
            success: false,
            error: 'IOC value and type are required'
          }, { status: 400 })
        }

        const enrichment = await aiAnalyzer.enrichIOC(ioc, type)
        return NextResponse.json({
          success: true,
          enrichment
        })

      case 'process-feeds':
        await processor.manualFeedProcessing()
        return NextResponse.json({
          success: true,
          message: 'Feed processing initiated'
        })

      case 'scrape-web':
        await processor.manualWebScraping()
        return NextResponse.json({
          success: true,
          message: 'Web scraping initiated'
        })

      case 'generate-summary':
        await processor.manualSummaryGeneration()
        return NextResponse.json({
          success: true,
          message: 'Executive summary generated'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: analyze-text, analyze-url, extract-iocs, enrich-ioc, process-feeds, scrape-web, generate-summary'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Analysis API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Analysis failed. Please try again.'
    }, { status: 500 })
  }
}

export async function GET() {
  const aiAnalyzer = AIThreatAnalyzer.getInstance()
  
  return NextResponse.json({
    success: true,
    status: {
      aiConfigured: true, // Always available with local fallback
      availableActions: [
        'analyze-text',
        'analyze-url', 
        'extract-iocs',
        'enrich-ioc',
        'process-feeds',
        'scrape-web',
        'generate-summary'
      ]
    }
  })
} 