import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LampContainerProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * LampContainer Component
 * 
 * A modern lamp effect container with animated light beams and glowing effects.
 * Creates dramatic lighting atmosphere perfect for hero sections and showcases.
 * 
 * @param children - Content to display inside the lamp container
 * @param className - Additional CSS classes
 */
export function LampContainer({ children, className }: LampContainerProps) {
    return (
        <div
            className={cn(
                'relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[hsl(var(--depth-far))] w-full rounded-md z-0',
                className
            )}
        >
            <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">
                {/* Left gradient beam */}
                <motion.div
                    initial={{ opacity: 0.5, width: '25rem' }}
                    whileInView={{ opacity: 1, width: '50rem' }}
                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
                    style={{
                        backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
                    }}
                    className="absolute inset-auto right-1/2 h-72 overflow-visible w-[50rem] bg-gradient-conic from-cyan-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top] opacity-30 md:opacity-70"
                >
                    <div className="absolute w-[100%] left-0 bg-[hsl(var(--depth-far))] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
                    <div className="absolute w-40 h-[100%] left-0 bg-[hsl(var(--depth-far))] bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
                </motion.div>

                {/* Right gradient beam */}
                <motion.div
                    initial={{ opacity: 0.5, width: '15rem' }}
                    whileInView={{ opacity: 1, width: '30rem' }}
                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
                    style={{
                        backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
                    }}
                    className="absolute inset-auto left-1/2 h-72 w-[50rem] bg-gradient-conic from-transparent via-transparent to-cyan-500 text-white [--conic-position:from_290deg_at_center_top] opacity-30 md:opacity-70"
                >
                    <div className="absolute w-40 h-[100%] right-0 bg-[hsl(var(--depth-far))] bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
                    <div className="absolute w-[100%] right-0 bg-[hsl(var(--depth-far))] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
                </motion.div>

                {/* Background blur layers - reduced on mobile */}
                <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-[hsl(var(--depth-far))] blur-2xl" />
                <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />

                {/* Glow effects - reduced on mobile */}
                <div className="absolute inset-auto z-50 h-48 w-[40rem] -translate-y-1/2 rounded-full bg-cyan-500 opacity-20 md:opacity-40 blur-3xl" />
                <motion.div
                    initial={{ width: '12rem' }}
                    whileInView={{ width: '24rem' }}
                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
                    className="absolute inset-auto z-30 h-48 w-80 -translate-y-[6rem] rounded-full bg-cyan-400 blur-2xl opacity-20 md:opacity-60"
                />

                {/* Center line */}
                <motion.div
                    initial={{ width: '25rem' }}
                    whileInView={{ width: '50rem' }}
                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
                    className="absolute inset-auto z-50 h-0.5 w-[50rem] -translate-y-[7rem] bg-cyan-400 opacity-40 md:opacity-80"
                />

                {/* Top mask */}
                <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-[hsl(var(--depth-far))]" />
            </div>

            {/* Content */}
            <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
                {children}
            </div>
        </div>
    );
}
