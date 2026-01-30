import React, { useRef, useEffect } from 'react';

interface MagnetLinesProps {
    rows?: number;
    columns?: number;
    containerSize?: string;
    lineColor?: string;
    lineWidth?: string;
    lineHeight?: string;
    baseAngle?: number;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * MagnetLines Component
 * 
 * Creates a grid of lines that rotate and follow the mouse cursor,
 * creating a magnetic field-like visual effect.
 * 
 * @param rows - Number of rows in the grid (default: 9)
 * @param columns - Number of columns in the grid (default: 9)
 * @param containerSize - CSS size value for container (default: '80vmin')
 * @param lineColor - CSS color value for lines (default: 'hsl(var(--accent))')
 * @param lineWidth - CSS width value for each line (default: '1vmin')
 * @param lineHeight - CSS height value for each line (default: '6vmin')
 * @param baseAngle - Initial rotation angle in degrees (default: -10)
 */
export function MagnetLines({
    rows = 9,
    columns = 9,
    containerSize = '80vmin',
    lineColor = 'hsl(var(--accent))',
    lineWidth = '1vmin',
    lineHeight = '6vmin',
    baseAngle = -10,
    className = '',
    style = {},
}: MagnetLinesProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const items = container.querySelectorAll<HTMLSpanElement>('span');

        const onPointerMove = (event: PointerEvent) => {
            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const centerX = rect.x + rect.width / 2;
                const centerY = rect.y + rect.height / 2;

                const b = event.clientX - centerX;
                const a = event.clientY - centerY;
                const c = Math.sqrt(a * a + b * b) || 1;
                const r =
                    ((Math.acos(b / c) * 180) / Math.PI) *
                    (event.clientY > centerY ? 1 : -1);

                item.style.setProperty('--rotate', `${r}deg`);
            });
        };

        window.addEventListener('pointermove', onPointerMove);

        // Initialize with center position
        if (items.length) {
            const middleIndex = Math.floor(items.length / 2);
            const rect = items[middleIndex].getBoundingClientRect();
            onPointerMove({
                clientX: rect.x,
                clientY: rect.y,
            } as PointerEvent);
        }

        return () => {
            window.removeEventListener('pointermove', onPointerMove);
        };
    }, []);

    const total = rows * columns;
    const spans = Array.from({ length: total }, (_, i) => (
        <span
            key={i}
            className="block origin-center transition-transform duration-75"
            style={{
                backgroundColor: lineColor,
                width: lineWidth,
                height: lineHeight,
                // @ts-expect-error - CSS custom property
                '--rotate': `${baseAngle}deg`,
                transform: 'rotate(var(--rotate))',
                willChange: 'transform',
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
                width: containerSize,
                height: containerSize,
                ...style,
            }}
        >
            {spans}
        </div>
    );
}
