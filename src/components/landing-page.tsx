
import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { ArrowRight, Clock, Shield, Zap, Users, Globe, ChevronRight } from "lucide-react"

interface LandingPageProps {
  onNavigateToDashboard: () => void
}

export function LandingPage({ onNavigateToDashboard }: LandingPageProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (textRef.current && isHovering) {
        const rect = textRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    if (isHovering) {
      document.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isHovering])

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Top Banner */}

      <div className="bg-blue-600 text-white text-center py-3 px-4 relative">
        {/* <p className="text-sm">
          PineappleCream is now live. <span className="underline cursor-pointer">Claim your NIGHT.</span>
        </p> */}
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200">×</button>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Clock className="h-8 w-8 text-white" />
          <span className="text-xl font-bold">PineappleCream</span>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <button className="text-gray-300 hover:text-white transition-colors flex items-center">
            DOWNLOAD
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="text-gray-300 hover:text-white transition-colors flex items-center">
            PRICING
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="text-gray-300 hover:text-white transition-colors flex items-center">
            SYNC
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="text-gray-300 hover:text-white transition-colors flex items-center">
            PUBLISH
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            FAQ
          </a>
        </div>

        <Button
          onClick={onNavigateToDashboard}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
        >
          VIEW DASHBOARD
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-32 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="mb-8">
            <p className="text-sm text-gray-400 tracking-widest uppercase mb-4">PINEAPPLECREAM</p>
          </div>

          <div
            ref={textRef}
            className="relative inline-block cursor-pointer"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
              minHeight: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Base text - always visible */}
            <h1 className="text-6xl md:text-8xl font-light text-white leading-tight select-none">
              Blah blah blah
              <br />
              blah blah
            </h1>

            {/* Hidden text layer - only visible through blue circle mask */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{
                clipPath: isHovering
                  ? `circle(150px at ${mousePosition.x}px ${mousePosition.y}px)`
                  : "circle(0px at 50% 50%)",
                transition: "clip-path 0.2s ease-out",
              }}
            >
              {/* Blue background for the circle */}
              <div className="absolute inset-0 bg-blue-600"></div>

              {/* Hidden text */}
              <h1 className="text-6xl md:text-8xl font-light text-white leading-tight select-none relative z-10">
                wiow Blah blah blah
                <br />
                blah csjkd blah
              </h1>
            </div>
          </div>
        </div>

        {/* Floating dots for visual interest */}
        <div className="absolute top-20 left-10 opacity-30">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute top-40 right-20 opacity-20">
          <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 opacity-25">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-500"></div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">Privacy-first blockchain infrastructure</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            The easiest way to publish your wiki, knowledge base, documentation, or digital garden.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 hover:border-blue-500/50 transition-colors">
            <Shield className="h-12 w-12 text-blue-500 mb-6" />
            <h3 className="text-xl font-semibold text-white mb-4">Zero-Knowledge Privacy</h3>
            <p className="text-gray-400">
              Protect sensitive data with advanced zero-knowledge proofs while maintaining blockchain verification.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 hover:border-blue-500/50 transition-colors">
            <Zap className="h-12 w-12 text-blue-500 mb-6" />
            <h3 className="text-xl font-semibold text-white mb-4">High Performance</h3>
            <p className="text-gray-400">
              Built for scale with optimized consensus mechanisms and efficient transaction processing.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 hover:border-blue-500/50 transition-colors">
            <Users className="h-12 w-12 text-blue-500 mb-6" />
            <h3 className="text-xl font-semibold text-white mb-4">Developer Friendly</h3>
            <p className="text-gray-400">
              Comprehensive tooling and documentation to build privacy-preserving applications with ease.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">Built for real-world applications</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Financial Services</h3>
                  <p className="text-gray-400">
                    Private transactions and compliance-ready solutions for traditional finance.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Healthcare</h3>
                  <p className="text-gray-400">
                    Secure patient data sharing while maintaining privacy and regulatory compliance.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Supply Chain</h3>
                  <p className="text-gray-400">
                    Transparent tracking with selective disclosure of sensitive business information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-blue-500/20">
            <Globe className="h-16 w-16 text-blue-400 mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">Global Impact</h3>
            <p className="text-gray-300 mb-6">
              Join the movement towards a more private and secure digital future.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Learn More
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl border border-blue-500/20 p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">Ready to build with privacy?</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Start exploring our comprehensive note-taking dashboard and discover how privacy-first development can
            transform your workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onNavigateToDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Explore Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-lg bg-transparent"
            >
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Token Distribution Section */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-t border-gray-800">
        <div className="text-left">
          <p className="text-sm text-gray-400 tracking-widest uppercase">PINEAPPLECREAM</p>
        </div>
      </section>

      {/* Floating action buttons (bottom right)
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <button className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
          <Clock className="h-6 w-6 text-white" />
        </button>
        <button className="w-12 h-12 bg-black hover:bg-gray-900 rounded-full flex items-center justify-center transition-colors border border-gray-700">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div> */}
    </div>
  )
}
