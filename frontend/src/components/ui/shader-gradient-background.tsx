"use client";
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

export function ShaderGradientBackground() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 opacity-60">
      <ShaderGradientCanvas
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <ShaderGradient
          animate="on"
          brightness={1.8}
          cAzimuthAngle={180}
          cDistance={2.59}
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
          reflection={0.3}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
          type="waterPlane"
          uAmplitude={2}
          uDensity={1.3}
          uFrequency={5.5}
          uSpeed={0.4}
          uStrength={6}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
