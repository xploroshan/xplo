import type { Metadata, Viewport } from "next"
import "./globals.css"
import { APP_NAME, APP_DESCRIPTION, APP_URL } from "@/lib/constants"

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Discover & Join Group Adventures`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  keywords: [
    "group rides",
    "motorcycle rides",
    "bicycle rides",
    "treks",
    "group travel",
    "adventure events",
    "hykrz",
    "event discovery",
    "riding community",
    "group events",
  ],
  authors: [{ name: "HYKRZ" }],
  creator: "HYKRZ",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    title: `${APP_NAME} — Discover & Join Group Adventures`,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Discover & Join Group Adventures`,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
