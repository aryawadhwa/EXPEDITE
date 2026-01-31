import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { GlassButton } from "@/components/ui/glass-button";

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[80vh] flex flex-col justify-center overflow-hidden py-24"
    >
      {/* Background Texture */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-[90vw]">
          <motion.div style={{ opacity, y }}>
            <p className="text-sm md:text-base text-purple-400 font-mono mb-4 tracking-wider">
                    /// MISSION READY
            </p>
            <h2 className="text-[8vw] leading-[0.8] font-black tracking-tighter text-white mb-8">
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                DEPLOY
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white/80 to-white/40 ml-[6vw]">
                YOUR
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-500">
                AGENTS
              </span>
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border-t border-white/10 pt-8 mt-8">
            <div className="max-w-md">
              <p className="text-base text-purple-200/60 leading-relaxed">
                Join hundreds of forward-thinking teams using Expedite AI to automate their growth engine.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <SignedIn>
                <Link to="/dashboard">
                  <GlassButton size="md" variant="primary" className="text-base px-8 py-4 rounded-full">
                    Launch Mission Control
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </GlassButton>
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <GlassButton size="md" variant="primary" className="text-base px-8 py-4 rounded-full">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </GlassButton>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative large glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />
    </section>
  );
}
