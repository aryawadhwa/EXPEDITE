"use client";
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

export function ShaderGradientBackground() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 opacity-40 pointer-events-none">
      <ShaderGradientCanvas
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        pixelDensity={0.5}
        fov={60}
      >
        <ShaderGradient
          animate="on"
          brightness={1.5}
          cAzimuthAngle={180}
          cDistance={3}
          cPolarAngle={90}
          cameraZoom={1}
          color1="#000088"
          color2="#bb5adb"
          color3="#000015"
          envPreset="city"
          grain="on"
          lightType="3d"
          positionX={-1.4}
          positionY={0}
          positionZ={0}
          reflection={0.2}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
          type="waterPlane"
          uAmplitude={1.5}
          uDensity={1.1}
          uFrequency={4}
          uSpeed={0.3}
          uStrength={3}
          wireframe={false}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
