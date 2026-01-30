import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

// Graphics for each step
const Graphics = {
  Define: () => (
    <div className="relative w-full h-full bg-black/40 rounded-xl border border-white/10 p-4 flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
      </div>
      <div className="space-y-2">
        <div className="h-2 w-1/3 bg-white/10 rounded-full" />
        <div className="h-10 w-full bg-white/5 rounded-lg border border-purple-500/30 flex items-center px-3 relative">
          <span className="text-xs text-purple-200">Find Series A Founders...</span>
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="absolute right-3 w-0.5 h-4 bg-purple-400"
          />
        </div>
      </div>
    </div>
  ),
  Activate: () => (
    <div className="relative w-full h-full bg-black/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
        {/* Radar circles */}
        <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute border border-purple-500/30 rounded-full"
                    style={{ width: `${i * 30}%`, height: `${i * 30}%` }}
                    animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                />
            ))}
        </div>
        {/* Central Node */}
        <div className="relative z-10 w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center">
             <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
        </div>
        {/* Satellites */}
        <motion.div 
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        >
            <div className="absolute top-[20%] left-[50%] w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_title-blue-400]" />
        </motion.div>
    </div>
  ),
  Review: () => (
    <div className="relative w-full h-full bg-black/40 rounded-xl border border-white/10 p-4 flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="h-2 w-20 bg-white/20 rounded-full" />
            <div className="h-4 w-12 bg-green-500/20 rounded text-[8px] text-green-400 flex items-center justify-center font-mono">98% Match</div>
        </div>
        <div className="space-y-2 mt-1">
            <div className="h-2 w-full bg-white/5 rounded-full" />
            <div className="h-2 w-3/4 bg-white/5 rounded-full" />
            <div className="h-2 w-5/6 bg-white/5 rounded-full" />
        </div>
        <motion.div 
            className="mt-auto self-end flex items-center gap-2"
            initial={{ opacity: 0.5 }}
            whileInView={{ opacity: 1 }}
        >
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                 <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-white"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
        </motion.div>
    </div>
  ),
  Grow: () => (
    <div className="relative w-full h-full bg-black/40 rounded-xl border border-white/10 p-5 flex items-end justify-between gap-2 overflow-hidden">
        {[40, 65, 45, 80, 55, 95].map((h, i) => (
            <motion.div
                key={i}
                initial={{ height: "0%" }}
                whileInView={{ height: `${h}%` }}
                viewport={{ margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.1, type: "spring" }}
                className="w-full bg-gradient-to-t from-purple-600/50 to-purple-400/80 rounded-t-sm relative group"
            >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white">
                    {h}%
                </div>
            </motion.div>
        ))}
    </div>
  )
};

const items = [
  {
    step: "01",
    title: "Define Your Mission",
    description: "Tell our AI exactly who you want to target. Inputs like role, industry, or even natural language queries launch the hunt.",
    Graphic: Graphics.Define
  },
  {
    step: "02",
    title: "AI Agents Activate",
    description: "Our diverse swarm of agents scans the web, verifying emails, analyzing company news, and building rich prospect profiles.",
    Graphic: Graphics.Activate
  },
  {
    step: "03",
    title: "Review & Approve",
    description: "You're the pilot. Review generated drafts in your queue, tweak the strategy, and approve with a single click.",
    Graphic: Graphics.Review
  },
  {
    step: "04",
    title: "Watch It Grow",
    description: "Track the performance of your campaigns. Optimize based on real-time data on open rates, relies, and conversions.",
    Graphic: Graphics.Grow
  }
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="py-24 px-6 relative" id="how-it-works">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-white"
            >
              How It <span className="pill-highlight">Works</span>
            </motion.h2>
            <p className="text-lg text-purple-200/60 max-w-xl mx-auto">
              From input to inbox in four streamlined steps.
            </p>
        </div>

        <div className="relative">
            {/* Connecting Beam (Desktop) */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10 hidden md:block" />
            <motion.div 
                className="absolute left-8 top-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-purple-500 hidden md:block origin-top"
                style={{ height: "100%", scaleY: scrollYProgress }} 
            />

            <div className="space-y-24">
                {items.map((item, index) => (
                    <div key={index} className="relative grid md:grid-cols-[1fr_300px_1fr] gap-12 items-center">
                        {/* Timeline Node (Desktop) */}
                        <div className="absolute left-8 -translate-x-1/2 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-black border border-white/20 z-10">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                        </div>

                        {/* Text Content */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                            className={cn(
                                "md:text-right pr-8",
                                index % 2 !== 0 ? "md:order-3 md:text-left md:pl-8 md:pr-0" : ""
                            )}
                        >
                            <div className="text-6xl font-black text-white/5 mb-2">{item.step}</div>
                            <h3 className="text-3xl font-bold text-white mb-4">{item.title}</h3>
                            <p className="text-purple-200/70 text-lg leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                        
                        {/* Spacer for timeline column */}
                        <div className="hidden md:block" />

                        {/* Graphic Card */}
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                            className={cn(
                                "w-full aspect-square md:aspect-[4/3] rounded-3xl p-1",
                                "bg-gradient-to-b from-white/10 to-transparent",
                                index % 2 !== 0 ? "md:order-1" : ""
                            )}
                        >
                             <div className="w-full h-full rounded-[20px] bg-black overflow-hidden relative glass-strong p-2">
                                <item.Graphic />
                                
                                {/* Glow on hover */}
                                <div className="absolute inset-0 bg-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                             </div>
                        </motion.div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </section>
  );
}
