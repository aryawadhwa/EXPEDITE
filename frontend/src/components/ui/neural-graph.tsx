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
  
  // Optimized node layout for better visual flow
  const nodes: Node[] = [
    { id: '0', x: 100, y: 300, label: "Mission Definition", type: "input" },
    
    // Discovery Layer - Vertically split
    { id: '1', x: 300, y: 150, label: "Prospect Discovery", type: "process" },
    { id: '2', x: 300, y: 450, label: "Market Analysis", type: "process" },
    
    // Intelligence Layer - Staggered
    { id: '3', x: 600, y: 300, label: "Context Engine", type: "hub" },
    { id: '4', x: 500, y: 100, label: "Verification", type: "process" },
    { id: '5', x: 500, y: 500, label: "News Monitor", type: "process" },
    
    // Action Layer
    { id: '6', x: 800, y: 200, label: "Draft Gen", type: "process" },
    { id: '7', x: 800, y: 400, label: "Personalize", type: "process" },
    
    // Review & Output
    { id: '8', x: 1000, y: 300, label: "Review Queue", type: "output" },
    { id: '9', x: 1150, y: 300, label: "Analytics", type: "end" }
  ];

  const connections: Connection[] = [
    // Input to Discovery
    { from: '0', to: '1' },
    { from: '0', to: '2' },
    
    // Discovery to Intelligence
    { from: '1', to: '3' },
    { from: '2', to: '3' },
    { from: '1', to: '4' }, // Prospect -> Verification
    { from: '2', to: '5' }, // Market -> News
    
    // Intelligence Interconnectivity
    { from: '4', to: '3' },
    { from: '5', to: '3' },
    
    // Intelligence to Action
    { from: '3', to: '6' }, // Context -> Draft
    { from: '3', to: '7' }, // Context -> Personalize
    
    // Action Cross-talk
    { from: '6', to: '7' },
    
    // Action to Review
    { from: '6', to: '8' },
    { from: '7', to: '8' },
    
    // Review to Final
    { from: '8', to: '9' }
  ];

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Calculate scale to fit width, but cap it at 1 for larger screens
        // and allow it to go small for mobile
        const newScale = Math.min(width / 1200, 1); 
        setScale(newScale);
      }
    };

    // Initial scale
    updateScale();

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Intersection Observer to pause animation when not visible
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(canvas);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Fix canvas dimensions to the design size
    const width = 1200;
    const height = 600;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    let animationFrame: number;
    let time = 0;
    let lastFrameTime = 0;
    const targetFPS = 30; // Reduced from 60fps for better performance
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= frameInterval) {
        lastFrameTime = currentTime - (deltaTime % frameInterval);
        
        ctx.clearRect(0, 0, width, height);
        time += 0.015; // Slightly slower animation

        // Draw connections with animated flow
        connections.forEach((conn, index) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          
          if (!fromNode || !toNode) return;

          // Base connection line
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          ctx.quadraticCurveTo(midX, midY - 30, toNode.x, toNode.y);
          ctx.stroke();

          // Animated gradient flow (fewer particles for performance)
          const offset = (time + index * 0.5) % 1;
          
          // Single flowing particle per connection
          const t = offset;
          const particleX = fromNode.x + (toNode.x - fromNode.x) * t;
          const particleY = fromNode.y + (toNode.y - fromNode.y) * t - 30 * Math.sin(t * Math.PI);
          
          // Particle glow
          const particleGradient = ctx.createRadialGradient(particleX, particleY, 0, particleX, particleY, 8);
          particleGradient.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
          particleGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
          
          ctx.fillStyle = particleGradient;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Particle core
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw nodes
        nodes.forEach((node) => {
          const pulse = Math.sin(time * 1.5) * 0.15 + 0.85;
          
          // Outer glow (simplified)
          const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 35 * pulse);
          glowGradient.addColorStop(0, `rgba(139, 92, 246, ${0.4 * pulse})`);
          glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 35 * pulse, 0, Math.PI * 2);
          ctx.fill();

          // Node circle with gradient
          const nodeGradient = ctx.createRadialGradient(
            node.x - 5, node.y - 5, 0,
            node.x, node.y, 20
          );
          
          if (node.type === 'input') {
            nodeGradient.addColorStop(0, 'rgba(96, 165, 250, 1)'); // Blue
            nodeGradient.addColorStop(1, 'rgba(59, 130, 246, 0.9)');
          } else if (node.type === 'output') {
            nodeGradient.addColorStop(0, 'rgba(192, 132, 252, 1)'); // Purple
            nodeGradient.addColorStop(1, 'rgba(168, 85, 247, 0.9)');
          } else if (node.type === 'hub') {
            nodeGradient.addColorStop(0, 'rgba(244, 114, 182, 1)'); // Pink (Central Hub)
            nodeGradient.addColorStop(1, 'rgba(244, 114, 182, 0.9)');
          } else if (node.type === 'end') {
            nodeGradient.addColorStop(0, 'rgba(52, 211, 153, 1)'); // Emerald (Success)
            nodeGradient.addColorStop(1, 'rgba(52, 211, 153, 0.9)');
          } else { // Default for 'process'
            nodeGradient.addColorStop(0, 'rgba(167, 139, 250, 1)'); // Violet
            nodeGradient.addColorStop(1, 'rgba(139, 92, 246, 0.9)');
          }
          
          ctx.fillStyle = nodeGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
          ctx.fill();
          
          // Node border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Inner highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(node.x - 4, node.y - 4, 6, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (isVisible) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div 
        style={{ 
          width: 1200, 
          height: 600,
          transform: `scale(${scale})`,
          transformOrigin: 'center center' // Scale from center
        }} 
        className="relative shrink-0" // shrink-0 ensures it keeps its size
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
        />
        
        {/* Node Labels with better positioning */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute text-xs font-medium text-white/80 pointer-events-none whitespace-nowrap"
            style={{
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, 35px)', // Center below the node
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (parseInt(node.id) * 0.1) }}
          >
            {node.label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
