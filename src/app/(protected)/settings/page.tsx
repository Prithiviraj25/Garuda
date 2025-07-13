"use server"
import React from 'react'
import { logoFont, PROJECT_NAME } from '../../../../config'
import { Separator } from '@/components/ui/separator'
import { SettingsIcon, Shield, Activity } from 'lucide-react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ImageChangeButton } from '@/components/auth/image-change-button'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import ChangeName from '@/components/auth/change-name'
import BasicUserInfo from '@/components/auth/basic-user-info'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThreatFeedStatus } from '@/components/threat-intelligence/threat-feed-status'

const SettingsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  return (
    <div className='max-h-[95vh] overflow-y-scroll'>
      <header className='flex sticky top-0 items-center justify-between bg-background z-50'>
        <h1 className={`text-lg  ${logoFont.className} flex items-center gap-2 ml-4`}><SettingsIcon /> Settings</h1>
        <SidebarTrigger />
      </header>
      <Separator className='mt-2' />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <main className='space-y-8'>
          <div className="bg-card rounded-lg p-8 shadow-sm border border-border/40">
          <div id='top-group' className="w-full flex flex-col items-center justify-center">
            <ImageChangeButton user={session?.user ?? null} />
            <div className='mt-3 flex flex-col items-center justify-center'>
              <h2 className='text-2xl font-bold'>Welcome, {session?.user?.name}</h2>
              <p className='mt-4'>Manage your info, privacy and security to make <span className='font-semibold'>{PROJECT_NAME}</span> work better for you.</p>
            </div>
          </div>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-sm border border-border/40">
            <h2 className='text-xl font-semibold mb-2'>Basic Information</h2>
            <p className='text-sm text-muted-foreground mb-6'>
              Information about you is used to personalize your experience.{' '}
              <Link href="/docs/privacy" className='text-primary hover:underline'>Learn More</Link>
            </p>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/4">Profile Picture</TableCell>
                  <TableCell className="text-muted-foreground w-2/4">A Profile Picture is used to identify you in the system.</TableCell>
                  <TableCell>
                    <ImageChangeButton user={session?.user ?? null} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Name</TableCell>
                  <TableCell className="text-muted-foreground">
                    {session?.user?.name ?? ""}
                  </TableCell>
                  <TableCell>
                    <ChangeName defaultValue={session?.user?.name ?? ""} />
                  </TableCell>
                </TableRow>
                <BasicUserInfo />
              </TableBody>
            </Table>
          </div>



          <div className="bg-card rounded-lg p-8 shadow-sm border border-border/40">
            <h2 className='text-xl font-semibold mb-2 flex items-center gap-2'>
              <Shield className="h-5 w-5" />
              Threat Intelligence Configuration
            </h2>
            <p className='text-sm text-muted-foreground mb-6'>
              Configure threat intelligence feeds, integrations, and monitoring settings.{' '}
              <Link href="/threat-intelligence" className='text-primary hover:underline'>View Dashboard</Link>
            </p>
            
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Feed Sources
                </h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  Monitor and manage threat intelligence feed sources and their sync status.
                </p>
                <div className="border rounded-lg p-4">
                  <ThreatFeedStatus />
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">System Information</h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  Threat intelligence system status and configuration details.
                </p>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-200">System Status</h4>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          Threat intelligence system is operational and processing data
                        </p>
                      </div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-200">Active</div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">API Endpoints</h4>
                        <p className="text-sm text-muted-foreground">
                          Internal threat intelligence API is functioning
                        </p>
                      </div>
                      <div className="text-sm font-medium text-green-600">Operational</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Data Refresh Rate</h4>
                        <p className="text-sm text-muted-foreground">
                          Dashboard updates every 2 minutes for optimal performance
                        </p>
                      </div>
                      <div className="text-sm font-medium text-blue-600">2 min</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">External AI Integration</h4>
                        <p className="text-sm text-yellow-600 dark:text-yellow-300">
                          AI analysis requires Python backend and API keys
                        </p>
                      </div>
                      <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Limited</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <footer className="mt-10 border-t border-border/40 pt-6 text-sm text-muted-foreground">
            <p>
              Your personal and system configuration data is kept private and secure.
              {PROJECT_NAME} follows best practices for data protection. <Link href="/docs/privacy" className='text-primary hover:underline'>Learn More</Link>.
            </p>
            <p className="mt-2">
              For threat intelligence configuration, ensure your API keys and credentials are stored securely.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default SettingsPage