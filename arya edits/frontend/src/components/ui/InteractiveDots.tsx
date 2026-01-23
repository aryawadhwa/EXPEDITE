import React, { useRef, useEffect, useState } from 'react';

interface InteractiveDotsProps {
    rows?: number;
    columns?: number;
    dotSize?: number;
    gap?: number;
    className?: string;
}

/**
 * InteractiveDots Component
 * 
 * Creates a grid of circles that change color with a gradient effect
 * when the mouse cursor moves over them.
 * 
 * @param rows - Number of rows in the grid (default: 20)
 * @param columns - Number of columns in the grid (default: 30)
 * @param dotSize - Size of each dot in pixels (default: 4)
 * @param gap - Gap between dots in pixels (default: 30)
 */
export function InteractiveDots({
    rows = 20,
    columns = 30,
    dotSize = 4,
    gap = 30,
    className = '',
}: InteractiveDotsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const dots = container.querySelectorAll<HTMLDivElement>('.interactive-dot');

        const onPointerMove = (event: PointerEvent) => {
            dots.forEach((dot, index) => {
                const rect = dot.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const distanceX = event.clientX - centerX;
                const distanceY = event.clientY - centerY;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                // Calculate proximity (closer = higher value)
                const maxDistance = 150;
                const proximity = Math.max(0, 1 - distance / maxDistance);

                if (proximity > 0) {
                    // Apply gradient color based on proximity
                    const hue = (proximity * 60 + 180) % 360; // Cyan to blue range
                    const saturation = 100;
                    const lightness = 50 + proximity * 30;
                    const alpha = 0.3 + proximity * 0.7;

                    dot.style.backgroundColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                    dot.style.transform = `scale(${1 + proximity * 2})`;
                    dot.style.boxShadow = `0 0 ${proximity * 20}px hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                } else {
                    // Reset to default
                    dot.style.backgroundColor = 'hsla(220, 20%, 50%, 0.2)';
                    dot.style.transform = 'scale(1)';
                    dot.style.boxShadow = 'none';
                }
            });
        };

        window.addEventListener('pointermove', onPointerMove);

        return () => {
            window.removeEventListener('pointermove', onPointerMove);
        };
    }, []);

    const total = rows * columns;
    const dots = Array.from({ length: total }, (_, i) => (
        <div
            key={i}
            className="interactive-dot rounded-full transition-all duration-200 ease-out"
            style={{
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                backgroundColor: 'hsla(220, 20%, 50%, 0.2)',
            }}
        />
    ));

    return (
        <div
            ref={containerRef}
            className={`grid place-items-center ${className}`}
            style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: `${gap}px`,
                width: '100%',
                height: '100%',
            }}
        >
            {dots}
        </div>
    );
}
