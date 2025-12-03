import Link from "next/link"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-6 md:px-8 md:py-8">
        <div className="text-xl font-bold tracking-tight text-foreground">workrail</div>
        <Link
          href="/sign-in"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 md:py-32 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight text-balance">
            One task. Complete focus.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-balance max-w-xl mx-auto">
            Eliminate distractions and achieve more by doing one thing at a time. Monotasking for modern productivity.
          </p>
          <div className="pt-6">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-base hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}