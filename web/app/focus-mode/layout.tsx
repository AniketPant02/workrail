import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Focus Mode",
  description: "Stay in flow with your schedule front and center.",
}

export default function FocusModeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative">{children}</div>
    </div>
  )
}
