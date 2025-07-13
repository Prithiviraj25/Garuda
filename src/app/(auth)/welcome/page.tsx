"use server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { ThemeToggle } from "@/components/global/theme-toggle"
import Logo from "@/components/global/logo"
import { truncateFollowedByDots } from "@/lib/utils"

const WelcomePage = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: "url('/pages/welcome.png')",
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[5px]"></div>
      {/* Content */}
      <header className="fixed top-0 left-0 w-full bg-transparent backdrop-blur-sm z-10">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Logo alwaysWhite />
            </div>
            <div className="flex items-center gap-x-4">
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </header>
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        {/* Main Content */}
        <div className="space-y-6 rounded-3xl p-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-white drop-shadow-xl">Welcome, {truncateFollowedByDots(session?.user?.name ?? "User", 20)}</h1>
            <h2 className="text-3xl font-semibold text-white drop-shadow-lg">Let&apos;s get started</h2>
            <p className="text-xl text-white/90 drop-shadow-md max-w-md mx-auto leading-relaxed">
              We&apos;re excited to have you on board.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" className="min-w-[160px] bg-white text-black hover:bg-white/90 shadow-lg">
              <Link href="/dashboard">
                <Home className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-w-[160px] border-white/30 text-white hover:bg-white/10 backdrop-blur-sm bg-transparent"
            >
              <Link href="javascript:history.back()">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomePage;
