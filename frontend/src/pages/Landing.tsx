import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  Target,
  Users,
  BarChart3,
  Sparkles,
  Shield,
  Mail,
  Search,
  CheckCircle,
  ChevronDown
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { ShaderGradientBackground } from "@/components/ui/shader-gradient-background";

const Landing = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Shader Gradient Animated Background */}
      <ShaderGradientBackground />

      {/* Floating Pill Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-between gap-8 px-8 py-4 rounded-full bg-[rgba(22,22,22,0.8)] backdrop-blur-heavy border border-white/10 shadow-2xl min-w-[700px]"
        >
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ExpediteAI" className="h-10 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="text-sm text-white/70 hover:text-white transition-colors">Workflow</a>
            <a href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">How It Works</a>
          </div>

          <SignedIn>
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-sm">
                  Dashboard
                </Button>
              </Link>
              <UserButton />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="bg-lime hover:bg-lime/90 text-black font-bold rounded-full px-6 glow-lime transition-all hover:scale-105">
                Launch App
              </Button>
            </SignInButton>
          </SignedOut>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.9]">
              Your AI-Powered{" "}
              <span className="pill-highlight">Outbound</span>{" "}
              Team
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Stop spending hours on manual prospecting. Let AI agents find, research,
            and craft personalized outreach while you focus on closing deals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <SignedIn>
              <Link to="/dashboard">
                <Button size="lg" className="bg-lime hover:bg-lime/90 text-black font-bold text-lg px-10 py-7 rounded-full glow-lime transition-all hover:scale-105">
                  Launch Mission Control
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="bg-lime hover:bg-lime/90 text-black font-bold text-lg px-10 py-7 rounded-full glow-lime transition-all hover:scale-105">
                  Start Your Mission
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
            </SignedOut>
            <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-full border-white/20 hover:bg-white/10">
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-8 h-8 text-white/50" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen flex items-center justify-center px-6 py-20 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
              Everything You Need to{" "}
              <span className="pill-highlight">Scale</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Our AI agents handle the heavy lifting so you can focus on what matters most.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "AI-Powered Prospecting",
                description: "Automatically find and qualify leads that match your ideal customer profile.",
              },
              {
                icon: Mail,
                title: "Personalized Outreach",
                description: "AI writes hyper-personalized emails using real context and company updates.",
              },
              {
                icon: Shield,
                title: "Human-in-the-Loop",
                description: "You stay in control. Review and approve every message before it sends.",
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ scale: 1.05, y: -10 }}
              >
                <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 rounded-3xl h-full hover:border-lime/50 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-lime flex items-center justify-center mb-6">
                    <feature.icon className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Gemini Effect - Workflow Visualization */}
      <WorkflowSection />

      {/* Canvas Reveal Effect - Interactive Feature Cards */}
      <CanvasRevealSection />

      {/* How It Works Section */}
      <section id="how-it-works" className="min-h-screen flex items-center justify-center px-6 py-20 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
              How It <span className="pill-highlight">Works</span>
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              From mission brief to pipeline growth in four simple steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
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
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                className="relative p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-lime/50 transition-all"
              >
                <div className="text-8xl font-black text-lime/20 absolute top-4 right-4">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-lime flex items-center justify-center mb-6">
                    <item.icon className="h-7 w-7 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                  <p className="text-white/70 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex items-center justify-center px-6 py-20 relative z-10">
        <div className="absolute inset-0 peripheral-glow" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-8">
            Ready to <span className="pill-highlight">Supercharge</span> Your Outbound?
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Join hundreds of sales teams already using AI to book more meetings with less effort.
          </p>

          <SignedIn>
            <Link to="/dashboard">
              <Button size="lg" className="bg-lime hover:bg-lime/90 text-black font-bold text-xl px-12 py-8 rounded-full glow-lime transition-all hover:scale-105">
                Go to Dashboard
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg" className="bg-lime hover:bg-lime/90 text-black font-bold text-xl px-12 py-8 rounded-full glow-lime transition-all hover:scale-105">
                Get Started Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </SignInButton>
          </SignedOut>
          <p className="text-sm text-white/50 mt-6">
            No credit card required • Free trial included
          </p>
        </motion.div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-white/10 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/50">
            2026© ExpediteAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Workflow Section with Google Gemini Effect
const WorkflowSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);

  return (
    <div
      id="workflow"
      className="h-[400vh] w-full relative pt-40 overflow-clip"
      ref={ref}
    >
      <GoogleGeminiEffect
        title="Your AI Workflow"
        description="Watch how our AI agents work together to find, research, and reach your ideal prospects"
        pathLengths={[pathLengthFirst, pathLengthSecond, pathLengthThird]}
      />
    </div>
  );
};

// Canvas Reveal Effect Section
const CanvasRevealSection = () => {
  return (
    <section className="py-20 flex flex-col lg:flex-row items-center justify-center w-full gap-4 mx-auto px-8 relative z-10">
      <FeatureCard
        title="AI-Powered Prospecting"
        icon={<Search className="h-10 w-10" />}
        colors={[[0, 255, 255]]}
        containerClassName="bg-emerald-900"
      />
      <FeatureCard
        title="Personalized Outreach"
        icon={<Mail className="h-10 w-10" />}
        colors={[[236, 72, 153], [232, 121, 249]]}
        containerClassName="bg-black"
        dotSize={2}
      />
      <FeatureCard
        title="Human-in-the-Loop"
        icon={<Shield className="h-10 w-10" />}
        colors={[[125, 211, 252]]}
        containerClassName="bg-sky-600"
      />
    </section>
  );
};

// Feature Card Component
const FeatureCard = ({
  title,
  icon,
  colors,
  containerClassName,
  dotSize,
}: {
  title: string;
  icon: React.ReactNode;
  colors: number[][];
  containerClassName: string;
  dotSize?: number;
}) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-white/10 group/canvas-card flex items-center justify-center max-w-sm w-full mx-auto p-4 relative h-[30rem] rounded-3xl overflow-hidden"
    >
      <PlusIcon className="absolute h-6 w-6 -top-3 -left-3 text-white" />
      <PlusIcon className="absolute h-6 w-6 -bottom-3 -left-3 text-white" />
      <PlusIcon className="absolute h-6 w-6 -top-3 -right-3 text-white" />
      <PlusIcon className="absolute h-6 w-6 -bottom-3 -right-3 text-white" />

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full absolute inset-0"
          >
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName={containerClassName}
              colors={colors}
              dotSize={dotSize}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20">
        <div className="text-center group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0 transition duration-200 w-full mx-auto flex items-center justify-center text-white">
          {icon}
        </div>
        <h2 className="text-white text-xl opacity-0 group-hover/canvas-card:opacity-100 relative z-10 mt-4 font-bold group-hover/canvas-card:-translate-y-2 transition duration-200 text-center">
          {title}
        </h2>
      </div>
    </div>
  );
};

// Plus Icon Component
const PlusIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};

export default Landing;
