import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Search,
  Mail,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Users,
  BarChart3,
  Sparkles,
  Shield,
  Clock
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import FloatingLines from "@/components/ui/FloatingLines";
import { motion } from "framer-motion";

const Landing = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Floating Pillbox Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center justify-between gap-4 px-6 py-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-2xl shadow-2xl min-w-[600px]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ExpediteAI" className="h-20 w-auto object-contain" />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <SignedIn>
              <Link to="/dashboard">
                <Button variant="ghost" size="lg" className="text-base text-muted-foreground hover:text-foreground">
                  Dashboard
                </Button>
              </Link>
              <div className="scale-125">
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="lg" className="text-base text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-6 text-base">
                  Get Started
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden min-h-screen">
        {/* FloatingLines Background */}
        <div className="absolute inset-0 w-full h-full">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={5}
            lineDistance={5}
            bendRadius={5}
            bendStrength={-0.5}
            interactive={true}
            parallax={true}
            linesGradient={["#6366f1", "#8b5cf6", "#a855f7"]}
          />
        </div>
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Your AI-Powered
            <span className="block bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
              Outbound Team
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-white max-w-2xl mx-auto mb-10"
          >
            Stop spending hours on manual prospecting. Let AI agents find, research,
            and craft personalized outreach while you focus on closing deals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <SignedIn>
              <Link to="/dashboard">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                  Launch Mission Control
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                  Start Your Mission
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
            </SignedOut>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
            {[
              { value: "10x", label: "Faster Prospecting" },
              { value: "85%", label: "Open Rate Improvement" },
              { value: "3hrs", label: "Saved Daily" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + (i * 0.1) }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Scale Outbound
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI agents handle the heavy lifting so you can focus on what matters most—building relationships.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "AI-Powered Prospecting",
                description: "Automatically find and qualify leads that match your ideal customer profile across LinkedIn and the web.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Mail,
                title: "Personalized Outreach",
                description: "AI writes hyper-personalized emails using real context—recent news, company updates, and social activity.",
                color: "from-primary to-purple-500"
              },
              {
                icon: Shield,
                title: "Human-in-the-Loop",
                description: "You stay in control. Review, edit, and approve every message before it sends. No autopilot mistakes.",
                color: "from-emerald-500 to-green-500"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
              >
                <Card className="p-6 bg-card/50 border-border/50 hover:border-primary/30 transition-colors h-full">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-card/30 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From mission brief to pipeline growth in four simple steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: Target,
                title: "Define Your Mission",
                description: "Tell our AI what you're looking for—role, industry, company size, or any criteria."
              },
              {
                step: "02",
                icon: Zap,
                title: "AI Agents Activate",
                description: "Our agents scout the web, find prospects, and research their context in real-time."
              },
              {
                step: "03",
                icon: CheckCircle,
                title: "Review & Approve",
                description: "See AI reasoning, edit if needed, and approve emails in your review queue."
              },
              {
                step: "04",
                icon: BarChart3,
                title: "Watch It Grow",
                description: "Track opens, replies, and conversions. Iterate on what works best."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-primary/10 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative z-10 pt-8">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Teams Choose ExpediteAI
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Clock,
                    title: "Save Hours Every Day",
                    description: "No more manual LinkedIn searching or copy-pasting research."
                  },
                  {
                    icon: Users,
                    title: "Scale Without Hiring",
                    description: "Get the output of a 10-person SDR team with AI automation."
                  },
                  {
                    icon: Sparkles,
                    title: "Better Personalization",
                    description: "AI reads context humans miss—recent posts, news, company updates."
                  },
                  {
                    icon: Shield,
                    title: "Stay Compliant & Safe",
                    description: "Human approval on every message. Your reputation stays intact."
                  }
                ].map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-video rounded-xl border border-border/50 bg-card/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Live Demo Preview</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border/50">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Supercharge Your Outbound?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of sales teams already using AI to book more meetings with less effort.
          </p>

          <SignedIn>
            <Link to="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignInButton>
          </SignedOut>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Free trial included
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            ExpediteAI
          </span>
          <p className="text-sm text-muted-foreground">
            © 2024 ExpediteAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
