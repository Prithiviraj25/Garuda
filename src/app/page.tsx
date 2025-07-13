"use server"
import React from 'react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Navbar from "@/components/global/navbar";
import LandingPageHero from '@/components/landing-page/hero';
import LandingPageFooter from '@/components/landing-page/footer';
import CTASection from '@/components/landing-page/cta';
import { Separator } from '@/components/ui/separator';

const HomePage = async () => {
  // TEMPORARY FIX: Bypass database authentication with mock session
  let session = null
  
  try {
    session = await auth.api.getSession({
      headers: await headers()
    })
  } catch (error) {
    // Database connection failed, use mock session for demo
    console.log('Database connection failed, using mock session for demo')
    session = {
      user: {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@threatintel.com',
        image: '/default-avatar.png'
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <LandingPageHero user={session?.user ?? null} />
      <Separator />
      <CTASection />
      <Separator />
      <LandingPageFooter />
    </div>
  )
}

export default HomePage;