import { NextRequest, NextResponse } from 'next/server'
import { ThreatReportGenerator } from '@/lib/threat-intelligence/report-generator'

export async function POST(request: NextRequest) {
  try {
    const { type, timeframe, format } = await request.json()
    
    if (!type || !['executive', 'technical', 'ioc', 'campaign'].includes(type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    const reportGenerator = ThreatReportGenerator.getInstance()
    let report

    // Generate the appropriate report
    switch (type) {
      case 'executive':
        report = await reportGenerator.generateExecutiveReport(timeframe || '7 days')
        break
      case 'technical':
        report = await reportGenerator.generateTechnicalReport(timeframe || '7 days')
        break
      case 'ioc':
        report = await reportGenerator.generateIOCReport(timeframe || '7 days')
        break
      case 'campaign':
        report = await reportGenerator.generateCampaignReport()
        break
      default:
        return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 })
    }

    // Format the report based on requested format
    let formattedReport: string
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'html':
        formattedReport = reportGenerator.formatAsHTML(report)
        contentType = 'text/html'
        fileExtension = 'html'
        break
      case 'markdown':
        formattedReport = reportGenerator.formatAsMarkdown(report)
        contentType = 'text/markdown'
        fileExtension = 'md'
        break
      case 'json':
        formattedReport = JSON.stringify(report, null, 2)
        contentType = 'application/json'
        fileExtension = 'json'
        break
      default:
        formattedReport = reportGenerator.formatAsHTML(report)
        contentType = 'text/html'
        fileExtension = 'html'
    }

    // Return the formatted report as a downloadable file
    return new NextResponse(formattedReport, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.${fileExtension}"`
      }
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const timeframe = searchParams.get('timeframe') || '7 days'
    const format = searchParams.get('format') || 'html'

    if (!type || !['executive', 'technical', 'ioc', 'campaign'].includes(type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    const reportGenerator = ThreatReportGenerator.getInstance()
    let report

    switch (type) {
      case 'executive':
        report = await reportGenerator.generateExecutiveReport(timeframe)
        break
      case 'technical':
        report = await reportGenerator.generateTechnicalReport(timeframe)
        break
      case 'ioc':
        report = await reportGenerator.generateIOCReport(timeframe)
        break
      case 'campaign':
        report = await reportGenerator.generateCampaignReport()
        break
      default:
        return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 })
    }

    return NextResponse.json(report)

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 