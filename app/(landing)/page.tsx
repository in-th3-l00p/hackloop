import { Header } from "./components/header"
import { Hero } from "./components/hero"
import { Features } from "./components/features"
import { CTA } from "./components/cta"
import { Footer } from "./components/footer"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center px-6">
      <Header />
      <main className="flex w-full max-w-5xl flex-col items-center gap-16 py-8">
        <Hero />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
