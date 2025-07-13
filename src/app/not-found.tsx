import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import Logo from "@/components/global/logo"
import { ThemeToggle } from "@/components/global/theme-toggle"

const NotFoundPage = async () => {
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: "url('/pages/not-allowed.png')",
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs"></div>
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
      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        {/* Main Content */}
        <div className="space-y-6 rounded-3xl p-8">
          <div className="space-y-4">
            <h1 className="text-8xl font-bold text-white drop-shadow-2xl">404</h1>
            <h2 className="text-3xl font-semibold text-white drop-shadow-lg">Page Not Found</h2>
            <p className="text-xl text-white/90 drop-shadow-md max-w-md mx-auto leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or has been moved to another location.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" className="min-w-[160px] bg-white text-black hover:bg-white/90 shadow-lg">
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Go Home
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

        {/* Additional Help */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <p className="text-white/80 text-sm">
            Need help? Contact our{" "}
            <Link href="/support" className="text-white underline hover:text-white/80 font-medium">
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
