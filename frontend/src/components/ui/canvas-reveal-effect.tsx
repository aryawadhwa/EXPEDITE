"use client";
import React, { useEffect, useRef, useState } from "react";

export const CanvasRevealEffect = ({
  animationSpeed = 0.4,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        initParticles();
      }
    };

    const initParticles = () => {
      particles = [];
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 5000);
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle(canvas, colors, opacities, dotSize));
      }
    };

    const animate = () => {
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle) => {
          particle.update(animationSpeed);
          particle.draw(ctx);
        });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    if (isInView) {
      animate();
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, animationSpeed, colors, opacities, dotSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => {
      if (canvasRef.current) {
        observer.unobserve(canvasRef.current);
      }
    };
  }, []);

  return (
    <div className={`h-full relative bg-white dark:bg-black w-full ${containerClassName}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-[84%]" />
      )}
    </div>
  );
};

class Particle {
  private x: number;
  private y: number;
  private vx: number;
  private vy: number;
  private color: number[];
  private opacity: number;
  private size: number;

  constructor(
    canvas: HTMLCanvasElement,
    colors: number[][],
    opacities: number[],
    dotSize?: number
  ) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.opacity = opacities[Math.floor(Math.random() * opacities.length)];
    this.size = dotSize || Math.random() * 2 + 1;
  }

  update(speed: number) {
    this.x += this.vx * speed;
    this.y += this.vy * speed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.opacity})`;
    ctx.fill();
  }
}
