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
  ChevronDown,
  Calendar,
  Layers,
  Rocket,
  MessageSquare,
  History
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { ShaderGradientBackground } from "@/components/ui/shader-gradient-background";
import { GlassButton } from "@/components/ui/glass-button";
import { NeuralGraph } from "@/components/ui/neural-graph";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Logo } from "@/components/ui/logo";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTASection } from "@/components/landing/CTASection";

const Landing = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Shader Gradient Animated Background */}
      <ShaderGradientBackground />

      {/* Header with Logo */}
      {/* Header with Logo and Actions */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <Logo className="w-8 h-8 text-white" />
          <span className="text-lg font-bold tracking-tight text-white">Expedite</span>
        </motion.div>

        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 border-2 border-white/20"
                }
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <GlassButton size="sm" variant="outline" className="text-sm px-6 py-2">
                Get Started
              </GlassButton>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter mb-6 sm:mb-8 leading-[0.9] text-white px-2">
              Your AI Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400">Outbound</span> Team
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-purple-200/80 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4"
          >
            Stop spending hours on manual prospecting. Let AI agents find, research,
            and craft personalized outreach while you focus on closing deals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
          >
            <SignedIn>
              <Link to="/dashboard">
                <GlassButton size="lg" variant="primary">
                  Launch Mission Control
                  <ArrowRight className="ml-2 h-5 w-5" />
                </GlassButton>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <GlassButton size="lg" variant="primary">
                  Start Your Mission
                  <ArrowRight className="ml-2 h-5 w-5" />
                </GlassButton>
              </SignInButton>
            </SignedOut>
            <GlassButton
              size="lg"
              variant="outline"
              onClick={() => window.location.href = 'https://youtu.be/iT05GTtRLig?si=bpNhVB9ELBmktolq'}
            >
              Watch Demo
            </GlassButton>
          </motion.div>


        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter mb-4 sm:mb-6 text-white px-2">
              Everything You Need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Scale</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-purple-200/70 max-w-2xl mx-auto px-4">
              Our AI agents handle the heavy lifting so you can focus on what matters most.
            </p>
          </motion.div>

          <BentoGrid>
            {[
              {
                title: "AI Powered Prospecting",
                description: "Automatically find and qualify leads that match your ideal customer profile using advanced signals.",
                className: "md:col-span-2",
              },
              {
                title: "Human in the Loop",
                description: "You stay in control. Review and approve every message before it sends.",
                className: "md:col-span-1",
              },
              {
                title: "Personalized Outreach",
                description: "AI writes hyper-personalized emails using real context and company updates.",
                className: "md:col-span-1",
              },
              {
                title: "Smart Scheduling",
                description: "Agents negotiate times and book meetings directly to your calendar without back-and-forth.",
                className: "md:col-span-2",
              },
              {
                title: "Seamless Integrations",
                description: "Connect instantly with Salesforce, HubSpot, LinkedIn, and your favorite tools.",
                className: "md:col-span-1",
              },
              {
                title: "Agent Launchpad",
                description: "Deploy specialized agent teams for specific campaigns and vertical markets.",
                className: "md:col-span-1",
              },
              {
                title: "Interactive Strategy",
                description: "Chat with your agents to refine targeting, adjust tone, and pivot strategies.",
                className: "md:col-span-1",
              },
            ].map((feature, i) => (
              <BentoGridItem
                key={i}
                title={feature.title}
                description={feature.description}
                className={feature.className}
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Neural Graph - AI Workflow Visualization */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter mb-4 sm:mb-6 text-white px-2">
              AI <span className="pill-highlight">Workflow</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-purple-200/70 max-w-2xl mx-auto px-4">
              Watch how our AI agents work together to automate your outbound process
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-strong rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]"
          >
            <NeuralGraph />
          </motion.div>
        </div>
      </section>

      {/* New Animated How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}

      {/* CTA Section */}
      <CTASection />

      {/* Minimal Footer */}
      <footer className="border-t border-white/10 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-purple-200/50 mb-4 uppercase tracking-wider">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-purple-200/50 mb-4 uppercase tracking-wider">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-purple-200/50 mb-4 uppercase tracking-wider">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-purple-200/50 mb-4 uppercase tracking-wider">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-sm text-purple-200/70 hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-purple-200/50">
            2026© Expedite. All rights reserved.
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


