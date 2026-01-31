import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'input' | 'process' | 'output' | 'hub' | 'end';
}

interface Connection {
  from: string;
  to: string;
}

export function NeuralGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Design Constants
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 600;
  const GRID_COLS = 6; // 0 to 5
  const GRID_ROWS = 5; // 0 to 4
  const COL_WIDTH = CANVAS_WIDTH / GRID_COLS;
  const ROW_HEIGHT = CANVAS_HEIGHT / GRID_ROWS;

  // Helper to get grid coordinates
  const getGridPos = (col: number, row: number) => ({
    x: col * COL_WIDTH + COL_WIDTH / 2,
    y: row * ROW_HEIGHT + ROW_HEIGHT / 2
  });

  // Strict Grid Layout
  const nodes: Node[] = [
    // Layer 0: Start
    { id: '0', ...getGridPos(0, 2), label: "Mission Definition", type: "input" }, // Center Left

    // Layer 1: Discovery (Split)
    { id: '1', ...getGridPos(1.5, 1), label: "Prospect Discovery", type: "process" }, // Top
    { id: '2', ...getGridPos(1.5, 3), label: "Market Analysis", type: "process" },   // Bottom

    // Layer 2: Intelligence (Hub & Spoke)
    { id: '3', ...getGridPos(2.5, 2), label: "Context Engine", type: "hub" },     // CENTER HUB
    { id: '4', ...getGridPos(2.5, 0.5), label: "Verification", type: "process" },   // Top Top
    { id: '5', ...getGridPos(2.5, 3.5), label: "News Monitor", type: "process" },   // Bottom Bottom

    // Layer 3: Action (Output from Hub)
    { id: '6', ...getGridPos(3.5, 1), label: "Draft Gen", type: "process" },      // Top
    { id: '7', ...getGridPos(3.5, 3), label: "Personalize", type: "process" },    // Bottom

    // Layer 4: Review
    { id: '8', ...getGridPos(4.5, 2), label: "Review Queue", type: "output" },    // Center

    // Layer 5: End
    { id: '9', ...getGridPos(5.2, 2), label: "Analytics", type: "end" }           // Far Right
  ];

  const connections: Connection[] = [
    // Stage 1: Definition -> Discovery
    { from: '0', to: '1' },
    { from: '0', to: '2' },
    
    // Stage 2: Discovery -> Context Hub
    { from: '1', to: '3' },
    { from: '2', to: '3' },

    // Stage 3: Hub Integrations (Two-way conceptually, drawn as input to hub usually, but let's show flow)
    { from: '1', to: '4' }, // Prospect -> Verification
    { from: '4', to: '3' }, // Verification -> Hub
    
    { from: '2', to: '5' }, // Market -> News
    { from: '5', to: '3' }, // News -> Hub
    
    // Stage 4: Hub -> Content Creation
    { from: '3', to: '6' }, // Hub -> Draft
    { from: '3', to: '7' }, // Hub -> Personalize
    
    // Stage 5: Content -> Review
    { from: '6', to: '8' },
    { from: '7', to: '8' },
    
    // Stage 6: Review -> Analytics
    { from: '8', to: '9' }
  ];

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const newScale = Math.min(width / CANVAS_WIDTH, 1); 
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const canvas = containerRef.current?.querySelector('canvas'); // Use direct selector as backup
    if (!canvas || !canvasRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0].isIntersecting);
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(canvasRef.current);

    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    let animationFrame: number;
    let time = 0;
    
    // Particle System
    const particles: { 
      connectionIndex: number, 
      progress: number, 
      speed: number,
      offset: number 
    }[] = [];

    // Initialize particles: 2-3 per connection
    connections.forEach((_, idx) => {
      for(let i=0; i<2; i++) {
        particles.push({
          connectionIndex: idx,
          progress: Math.random(),
          speed: 0.005 + Math.random() * 0.005,
          offset: Math.random() * 10 // Random sideways shimmer
        });
      }
    });

    const animate = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      time += 0.02;

      // 1. Draw Connections (Lines)
      ctx.lineCap = 'round';
      connections.forEach(conn => {
        const start = nodes.find(n => n.id === conn.from)!;
        const end = nodes.find(n => n.id === conn.to)!;

        // Gradient Line
        const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        grad.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
        grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
        grad.addColorStop(1, 'rgba(139, 92, 246, 0.1)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      });

      // 2. Draw Moving Particles
      particles.forEach(p => {
        p.progress += p.speed;
        if(p.progress >= 1) p.progress = 0;

        const conn = connections[p.connectionIndex];
        const start = nodes.find(n => n.id === conn.from)!;
        const end = nodes.find(n => n.id === conn.to)!;

        const currentX = start.x + (end.x - start.x) * p.progress;
        const currentY = start.y + (end.y - start.y) * p.progress;

        // Trail effect
        const tailLength = 0.1;
        const grad = ctx.createLinearGradient(
          currentX - (end.x - start.x) * tailLength,
          currentY - (end.y - start.y) * tailLength,
          currentX,
          currentY
        );
        grad.addColorStop(0, 'rgba(167, 139, 250, 0)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

        ctx.beginPath();
        ctx.moveTo(currentX - (end.x - start.x) * tailLength, currentY - (end.y - start.y) * tailLength);
        ctx.lineTo(currentX, currentY);
        ctx.lineWidth = 3;
        ctx.strokeStyle = grad;
        ctx.stroke();

        // Lead dot
        ctx.beginPath();
        ctx.arc(currentX, currentY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      });

      // 3. Draw Nodes
      nodes.forEach(node => {
        // Outer Glow
        const pulse = Math.sin(time * 2 + parseInt(node.id)) * 0.1 + 1; // Slight size pulse
        const glow = ctx.createRadialGradient(node.x, node.y, 10, node.x, node.y, 40);
        glow.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
        glow.addColorStop(1, 'rgba(139, 92, 246, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 40 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Node Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1b4b'; // dark violet bg
        ctx.fill();
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner Core
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        
        // Color coding by type
        if (node.type === 'hub') ctx.fillStyle = '#f472b6'; // pink
        else if (node.type === 'input') ctx.fillStyle = '#60a5fa'; // blue
        else if (node.type === 'output') ctx.fillStyle = '#a78bfa'; // violet
        else if (node.type === 'end') ctx.fillStyle = '#34d399'; // emerald
        else ctx.fillStyle = '#8b5cf6'; // violet default

        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div 
        style={{ 
          width: CANVAS_WIDTH, 
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }} 
        className="relative shrink-0"
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
        
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute text-sm font-medium text-white/90 whitespace-nowrap bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10"
            style={{
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, 30px)', // Fixed offset below node
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {node.label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
