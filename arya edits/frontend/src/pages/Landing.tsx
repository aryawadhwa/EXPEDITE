import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowRight,
  Zap,
  Target,
  Users,
  BarChart3,
  Sparkles,
  Shield,
  Clock,
  Linkedin,
  Github,
  Twitter
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { LampContainer } from "@/components/ui/LampContainer";
import { InteractiveDots } from "@/components/ui/InteractiveDots";
import { SpatialCard } from "@/components/ui/SpatialCard";
import { motion } from "framer-motion";

const Landing = () => {
  return (
    <div className="min-h-screen bg-[hsl(var(--depth-far))] text-foreground relative">
      {/* Interactive Dots Background - Full Page */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <InteractiveDots
          rows={15}
          columns={20}
          dotSize={3}
          gap={50}
          className="hidden sm:grid"
        />
        <InteractiveDots
          rows={20}
          columns={10}
          dotSize={2}
          gap={40}
          className="sm:hidden"
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              ExpediteAI
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <a href="#about" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#contact" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
            <SignedIn>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">Dashboard</Button>
              </Link>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-sm">Sign In</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="sm" className="glow-primary text-xs sm:text-sm px-3 sm:px-4">
                  Get Started
                  <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </nav>

      {/* Hero Section with LampContainer */}
      <LampContainer className="relative z-10 -mt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center w-full px-4 sm:px-6 max-w-5xl mx-auto"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 sm:mb-8 leading-tight">
            <span className="block text-white mb-2">Your AI-Powered</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
              Expedite Engine
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed">
            Deploy autonomous AI agents to <span className="text-foreground font-medium">find, research, and engage</span> your ideal customers with precision and scale.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 max-w-md sm:max-w-none mx-auto">
            <SignedIn>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base sm:text-lg glow-primary animate-spring">
                  Launch Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base sm:text-lg glow-primary animate-spring">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </SignInButton>
            </SignedOut>

            <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base sm:text-lg bg-accent hover:bg-accent/90 text-black font-semibold">
              <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Watch Demo
            </Button>
          </div>
        </motion.div>
      </LampContainer>

      {/* Features Section */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 layer-mid relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Everything You Need
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              AI agents that handle the heavy lifting so you can focus on building relationships.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "AI-Powered Prospecting",
                description: "Automatically find and qualify leads that match your ideal customer profile across LinkedIn and the web.",
                gradient: "from-primary to-accent"
              },
              {
                icon: Mail,
                title: "Personalized Outreach",
                description: "AI writes hyper-personalized emails using real context—recent news, company updates, and social activity.",
                gradient: "from-accent to-secondary"
              },
              {
                icon: Shield,
                title: "Human-in-the-Loop",
                description: "You stay in control. Review, edit, and approve every message before it sends. No autopilot mistakes.",
                gradient: "from-secondary to-primary"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <SpatialCard glowEffect className="h-full">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </SpatialCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 layer-near relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              How It Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
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
                icon: Shield,
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-8xl font-bold text-primary/10 absolute -top-8 -left-4">
                  {item.step}
                </div>
                <SpatialCard className="relative z-10 pt-12 h-full">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 glow-primary">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </SpatialCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 layer-mid relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8">
                Why Teams Choose ExpediteAI
              </h2>
              <div className="space-y-8">
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
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 glow-primary">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <SpatialCard glowEffect className="aspect-video">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 rounded-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/30 flex items-center justify-center mx-auto mb-6 animate-pulse glow-primary">
                      <Zap className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Live Demo Preview</p>
                  </div>
                </div>
              </SpatialCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 layer-near relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8">About ExpediteAI</h2>
            <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              <p>
                ExpediteAI was built by sales professionals who were tired of spending hours on manual prospecting and research. We believe that AI should augment human creativity, not replace it.
              </p>
              <p>
                Our mission is to empower sales teams with intelligent automation that handles the repetitive work—finding leads, researching context, and drafting personalized outreach—while keeping humans in control of the final message.
              </p>
              <p className="text-foreground font-medium">
                We're building the future of sales automation, one AI agent at a time.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 layer-mid relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8">Get In Touch</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto">
              Have questions? Want to learn more? We'd love to hear from you.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: Mail,
                  title: "Email Us",
                  value: "hello@expediteai.com",
                  link: "mailto:hello@expediteai.com"
                },
                {
                  icon: Linkedin,
                  title: "LinkedIn",
                  value: "@expediteai",
                  link: "https://linkedin.com"
                },
                {
                  icon: Twitter,
                  title: "Twitter",
                  value: "@expediteai",
                  link: "https://twitter.com"
                }
              ].map((contact, i) => (
                <motion.a
                  key={i}
                  href={contact.link}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <SpatialCard className="text-center hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4 glow-primary">
                      <contact.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{contact.title}</h3>
                    <p className="text-sm text-muted-foreground">{contact.value}</p>
                  </SpatialCard>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 layer-near relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Ready to Transform Your Expedite?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12">
              Join hundreds of sales teams already using AI to book more meetings with less effort.
            </p>

            <SignedIn>
              <Link to="/dashboard">
                <Button size="lg" className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 text-base sm:text-lg glow-primary animate-spring">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 text-base sm:text-lg glow-primary animate-spring">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
            </SignedOut>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Free trial included
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.08] layer-far relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              ExpediteAI
            </span>
            <div className="flex items-center gap-6">
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
              <a href="https://github.com" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © 2024 ExpediteAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
