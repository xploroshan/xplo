import Link from "next/link"
import { Compass } from "lucide-react"

const footerLinks = {
  Product: [
    { label: "Events", href: "/events" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Download App", href: "#download" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
}

export function Footer() {
  return (
    <footer className="relative border-t border-zinc-800/50 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <Compass className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                HYK<span className="text-orange-500">RZ</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-xs">
              Discover, organize, and join group adventures. Never ride alone again.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} HYKRZ. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600">Made with passion in India</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
