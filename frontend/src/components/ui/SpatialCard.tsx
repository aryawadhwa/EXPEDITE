import React, { useRef, useState } from 'react';
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
 * Refactored to remove framer-motion dependency.
 */
export function SpatialCard({
    children,
    className,
    glowEffect = false,
}: SpatialCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('');

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

        setTransform(`perspective(1000px) rotateX(${rotateXValue}deg) rotateY(${rotateYValue}deg)`);
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
    };

    return (
        <div
            ref={cardRef}
            className={cn(
                'spatial-card rounded-2xl p-6 transition-transform duration-200 ease-out',
                glowEffect && 'floating-card',
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: transform || 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                transformStyle: 'preserve-3d',
            }}
        >
            {children}
        </div>
    );
}
