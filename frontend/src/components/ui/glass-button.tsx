import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'relative overflow-hidden rounded-full font-semibold transition-all duration-300 group';
    
    const variantStyles = {
      primary: 'glass-strong text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]',
      secondary: 'glass text-white/90 hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]',
      outline: 'glass-subtle border-2 border-white/20 text-white hover:border-purple-400/50 hover:scale-105',
    };
    
    const sizeStyles = {
      sm: 'px-6 py-2 text-sm',
      md: 'px-8 py-3 text-base',
      lg: 'px-10 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {/* Animated gradient background on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-purple-500/20 animate-pulse" />
        </div>
        
        {/* Border glow effect */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/50 via-violet-400/50 to-purple-400/50 blur-sm" 
               style={{ padding: '1px', margin: '-1px' }} />
        </div>
        
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
