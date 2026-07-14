"use client";

export function ShaderGradientBackground() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 mix-blend-multiply" />
  );
}
