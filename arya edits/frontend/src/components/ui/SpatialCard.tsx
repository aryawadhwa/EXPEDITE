import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpatialCardProps {
    children: React.ReactNode;
    className?: string;
    glowEffect?: boolean;
}

/**
 * SpatialCard Component
 * 
 * A card with 3D depth effect that responds to mouse movement.
 * Creates an immersive spatial computing experience.
 * 
 * @param children - Content to display inside the card
 * @param className - Additional CSS classes
 * @param glowEffect - Whether to add glow effect (default: false)
 */
export function SpatialCard({
    children,
    className,
    glowEffect = false,
}: SpatialCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        const rotateXValue = (mouseY / (rect.height / 2)) * -10;
        const rotateYValue = (mouseX / (rect.width / 2)) * 10;

        setRotateX(rotateXValue);
        setRotateY(rotateYValue);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <motion.div
            ref={cardRef}
            className={cn(
                'spatial-card rounded-2xl p-6',
                glowEffect && 'floating-card',
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{
                rotateX,
                rotateY,
            }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
            }}
            style={{
                transformStyle: 'preserve-3d',
                perspective: 1000,
            }}
        >
            {children}
        </motion.div>
    );
}
