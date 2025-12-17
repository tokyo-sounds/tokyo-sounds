"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

interface ModelPreviewProps {
  modelPath: string;
  planeColor?: string;
}

function ModelViewer({ modelPath, planeColor }: ModelPreviewProps) {
  const { scene } = useGLTF(modelPath);

  // Apply color if provided
  if (planeColor) {
    const clonedScene = scene.clone();
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((mat) => {
            const newMat = mat.clone();
            if ("color" in newMat) {
              newMat.color = new THREE.Color(planeColor);
            }
            return newMat;
          });
        } else {
          const newMat = child.material.clone();
          if ("color" in newMat) {
            newMat.color = new THREE.Color(planeColor);
          }
          child.material = newMat;
        }
      }
    });

    return <primitive object={clonedScene} scale={0.15} rotation={[0, -Math.PI / 2, 0]} />;
  }

  return <primitive object={scene} scale={0.15} rotation={[0, -Math.PI / 2, 0]} />;
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666" />
    </mesh>
  );
}

export default function ModelPreview({ modelPath, planeColor }: ModelPreviewProps) {
  if (!modelPath) return null;

  return (
    <div className="w-full h-48 bg-neutral-900/50 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: false, alpha: true }}
      >
        <Suspense fallback={<Loader />}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <ModelViewer modelPath={modelPath} planeColor={planeColor} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={1}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2.2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

