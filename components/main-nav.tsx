"use client"
import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Search, Info, X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchTerm = searchParams.get("search") || ""

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/30"
          : "bg-background border-b border-border/20",
        className,
      )}
      {...props}
    >
      {/* Logo - Left aligned */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 md:gap-3 transition-transform duration-300 hover:scale-105">
          <Image
            src="/nervos-enhanced-logo.png"
            alt="Nervos"
            width={32}
            height={32}
            className="md:w-[42px] md:h-[42px] rounded-lg"
          />
          <span className="font-poppins font-semibold text-base md:text-lg text-white">Grant Tracking</span>
        </Link>
      </div>

      <div className="hidden md:flex justify-center flex-1">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors duration-200" />
          <input
            type="text"
            placeholder="Find programs to manage and track..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/30 rounded-full text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
          />
        </div>
      </div>

      {/* Right side - Mobile search and About/Info */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="md:hidden">
          {!isMobileSearchOpen ? (
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 text-muted-foreground hover:text-white transition-colors duration-200"
            >
              <Search className="w-5 h-5" />
            </button>
          ) : (
            <div className="fixed inset-x-0 top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/30 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Find programs to manage and track..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/30 rounded-full text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="p-2 text-muted-foreground hover:text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/about"
          className="flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-white transition-colors duration-200"
        >
          <span className="hidden md:inline">About us</span>
          <Info className="w-4 h-4" />
        </Link>
      </div>
    </nav>
  )
}
