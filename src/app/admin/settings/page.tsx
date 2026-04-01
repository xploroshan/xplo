"use client"

import { Save, Globe, Palette, Shield, Bell, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function AdminSettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
        <p className="text-zinc-400 mt-1">Configure every aspect of HYKRZ.</p>
      </div>

      <div className="space-y-6">
        {/* General */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-500" /> General
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Platform Name</label>
                <Input defaultValue="HYKRZ" className="bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Support Email</label>
                <Input defaultValue="support@hykrz.com" className="bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-orange-500" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Platform Description</label>
              <textarea
                defaultValue="Discover, organize, and join group adventures."
                rows={2}
                className="w-full rounded-lg bg-zinc-800/50 border border-zinc-700 text-white p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="h-5 w-5 text-orange-500" /> Appearance
            </CardTitle>
            <CardDescription>Brand colors and themes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Primary Color</label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded-lg bg-orange-500 border border-zinc-700" />
                  <Input defaultValue="#f97316" className="bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-orange-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Accent Color</label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded-lg bg-amber-500 border border-zinc-700" />
                  <Input defaultValue="#f59e0b" className="bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-orange-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Theme</label>
                <Input defaultValue="Dark" disabled className="bg-zinc-800/50 border-zinc-700 text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" /> Security
            </CardTitle>
            <CardDescription>Security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Require email verification", enabled: true },
              { label: "Enable 2FA for organizers", enabled: false },
              { label: "Rate limit login attempts", enabled: true },
              { label: "Enable CAPTCHA on registration", enabled: false },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-300">{setting.label}</span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    setting.enabled ? "bg-orange-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      setting.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" /> Notifications
            </CardTitle>
            <CardDescription>Push and email notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Send welcome email to new users", enabled: true },
              { label: "Event reminder notifications (24h before)", enabled: true },
              { label: "Weekly digest email", enabled: false },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-300">{setting.label}</span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    setting.enabled ? "bg-orange-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      setting.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="glow" className="rounded-xl">
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
