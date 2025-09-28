import { useState, useRef, useEffect } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowRight, Shield, Zap, Users, Globe } from "lucide-react";

export function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();

  const navigateToDashboard = () => {
    // Only allow navigation to dashboard if wallet is connected
    if (currentAccount) {
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (textRef.current && isHovering) {
        const rect = textRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    if (isHovering) {
      document.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isHovering]);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Top Banner */}

      <div className="bg-[#97F0E5] text-white text-center py-3 px-4 relative">
        {/* <p className="text-sm">
          PineappleCream is now live. <span className="underline cursor-pointer">Claim your NIGHT.</span>
        </p> */}
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200">
          ×
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <a href="/">
            <img className="w-8 h-10" src="/logo.png" alt="img-logo" />
          </a>

          <span className="text-xl font-bold">PineappleCream</span>
        </div>

        {/* <div className="hidden md:flex items-center space-x-8">
          <button className="text-gray-300 hover:text-white transition-colors flex items-center">
            DOWNLOAD
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button className="text-gray-300 hover:text-white transition-colors flex items-center">
            PRICING
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button className="text-gray-300 hover:text-white transition-colors flex items-center">
            SYNC
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button className="text-gray-300 hover:text-white transition-colors flex items-center">
            PUBLISH
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <a
            href="#"
            className="text-gray-300 hover:text-white transition-colors"
          >
            FAQ
          </a>
        </div> */}

        <div className="flex items-center gap-4">
          <ConnectButton />
          {currentAccount && (
            <Button
              onClick={navigateToDashboard}
              className="bg-[#97F0E5] hover:bg-[#97F0E5]/700 text-black px-6 py-2 rounded-md font-medium"
            >
              VIEW DASHBOARD
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-32 max-w-7xl mx-auto overflow-visible">
        <div className="text-center">
          <div className="mb-8">
            <p className="text-sm text-gray-400 tracking-widest uppercase mb-4">
              PINEAPPLECREAM
            </p>
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
              overflow: "visible",
            }}
          >
            {/* Base text - always visible */}
            <h1 className="text-6xl md:text-8xl font-light text-white leading-tight select-none">
              Store files, notes, <br /> and documents privately.
            </h1>

            {/* Hidden text layer - only visible through blue circle mask */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                top: "-200px",
                left: "-200px",
                right: "-200px",
                bottom: "-200px",
                clipPath: isHovering
                  ? `circle(150px at ${mousePosition.x + 200}px ${
                      mousePosition.y + 200
                    }px)`
                  : "circle(0px at 50% 50%)",
                transition: "clip-path 0.2s ease-out",
              }}
            >
              {/* Blue background for the circle */}
              <div className="absolute inset-0 bg-[#97F0E5]"></div>

              {/* Hidden text */}
              <h1 className="text-6xl md:text-8xl font-light text-black leading-tight select-none relative z-10">
                Smart organization <br /> that adapts to you.
              </h1>
            </div>
          </div>
        </div>

        {/* Floating dots for visual interest */}
        <div className="absolute top-20 left-10 opacity-30">
          <div className="w-2 h-2 bg-[#97F0E5] rounded-full animate-pulse"></div>
        </div>
        <div className="absolute top-40 right-20 opacity-20">
          <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 opacity-25">
          <div className="w-1.5 h-1.5 bg-[#97F0E5] rounded-full animate-pulse delay-500"></div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            A decentralized home for your idea
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Hook: “From private files to public knowledge, all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 hover:border-[#97F0E5]/500/50 transition-colors">
            <Shield className="h-12 w-12 text-[#97F0E5] mb-6" />
            <h3 className="text-xl font-semibold text-white mb-4">
              Smart Organization
            </h3>
            <p className="text-gray-400">
              Automatically tag, categorize, and connect your files and notes
              for instant discoverability
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 hover:border-[#97F0E5]/500/50 transition-colors">
            <Zap className="h-12 w-12 text-[#97F0E5] mb-6" />
            <h3 className="text-xl font-semibold text-white mb-4">
              Decentralized Ownership
            </h3>
            <p className="text-gray-400">
              Store your data securely on blockchain and decentralized storage
              while retaining full control.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 hover:border-[#97F0E5]/500/50 transition-colors">
            <Users className="h-12 w-12 text-[#97F0E5] mb-6" />
            <h3 className="text-xl font-semibold text-white mb-4">
              Secure Sharing
            </h3>
            <p className="text-gray-400">
              Share content publicly, privately, or via one-time temporary
              access links with confidence.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Built for real-world knowledge management
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#97F0E5] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-sm font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Students & Educators
                  </h3>
                  <p className="text-gray-400">
                    Organize notes, share study material, and create
                    collaborative knowledge bases securely.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#97F0E5] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-sm font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Freelancers & Creators
                  </h3>
                  <p className="text-gray-400">
                    Store projects, assets, and documents with full ownership
                    and temporary sharing options.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#97F0E5] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-black text-sm font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Researchers & Professionals
                  </h3>
                  <p className="text-gray-400">
                    Manage sensitive data, papers, and insights while keeping
                    full control and traceability.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#97F0E5]/20 to-purple-600/20 rounded-2xl p-8 border border-[#97F0E5]/500/20">
            <Globe className="h-16 w-16 text-[#97F0E5]/400 mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">
              Ready to take control of your knowledge?
            </h3>
            <p className="text-gray-300 mb-6">
              Start writing, organizing, and sharing your files and notes
              securely with PineappleCream’s decentralized dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#97F0E5]/10 to-purple-600/10 rounded-2xl border border-[#97F0E5]/500/20 p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Ready to build with privacy?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Start exploring our comprehensive note-taking dashboard and discover
            how privacy-first development can transform your workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentAccount ? (
              <Button
                onClick={navigateToDashboard}
                className="bg-[#97F0E5] hover:bg-[#97F0E5]/700 text-black px-8 py-3 text-lg"
              >
                Explore Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-gray-400">
                  Connect your Sui wallet to access the dashboard
                </p>
                <ConnectButton />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Token Distribution Section */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-t border-gray-800">
        <div className="text-left">
          <p className="text-sm text-gray-400 tracking-widest uppercase">
            PINEAPPLECREAM
          </p>
        </div>
      </section>
    </div>
  );
}
