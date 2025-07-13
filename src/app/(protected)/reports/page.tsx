'use client'

import { UnifiedReportGenerator } from "@/components/ui/unified-report-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart3, Download, History } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Report Center</h2>
          <p className="text-muted-foreground">
            Generate comprehensive reports for threat intelligence and business continuity management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Unified Reporting</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Report Generator - Main Column */}
        <div className="md:col-span-2">
          <UnifiedReportGenerator />
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Report Types Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Available Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Threat Intelligence</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    IOC analysis, MITRE mappings, feed status, and threat analytics
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">BCM Impact Analysis</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Business continuity assessment, risk distribution, and sector analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Formats Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Format Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Executive Summary</span>
                  <span className="text-muted-foreground">Strategic overview</span>
                </div>
                <div className="flex justify-between">
                  <span>Technical Report</span>
                  <span className="text-muted-foreground">Detailed analysis</span>
                </div>
                <div className="flex justify-between">
                  <span>IOC Report</span>
                  <span className="text-muted-foreground">Indicators only</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Reports Generated Today</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span>Total This Month</span>
                  <span className="font-medium">248</span>
                </div>
                <div className="flex justify-between">
                  <span>Most Popular Format</span>
                  <span className="font-medium">Executive</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Generation Time</span>
                  <span className="font-medium">2.3s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Your recently generated reports are available for download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Threat Intelligence Executive Summary", type: "threat-intelligence", date: "2024-01-13", size: "2.4 MB" },
              { name: "BCM Impact Analysis Technical Report", type: "bcm", date: "2024-01-13", size: "1.8 MB" },
              { name: "IOC Intelligence Report", type: "threat-intelligence", date: "2024-01-12", size: "3.2 MB" },
              { name: "Business Continuity Executive Summary", type: "bcm", date: "2024-01-12", size: "1.5 MB" },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.type === 'threat-intelligence' ? 'Threat Intelligence' : 'BCM Analysis'} • {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 