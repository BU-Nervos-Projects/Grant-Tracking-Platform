import type React from "react"
import type { Metadata, Viewport } from "next/types"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
import { Suspense } from "react"   // ← add this

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Grant Management",
  description: "A grant management application built with Next.js and shadcn/ui.",
  generator: "v0.app",
  applicationName: "Grant Management",
  keywords: ["grants", "management", "projects", "milestones"],
  authors: [{ name: "Grant Management Team" }],
  creator: "Grant Management Team",
  publisher: "Grant Management",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://grants.example.com",
    title: "Grant Management",
    description: "A grant management application built with Next.js and shadcn/ui.",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#26C6DA",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
        style={{
          fontFamily:
            "var(--font-sf-rounded), var(--font-poppins), var(--font-inter), sans-serif",
        }}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>
            <MainNav />   {/* ← wrap in Suspense */}
          </Suspense>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
