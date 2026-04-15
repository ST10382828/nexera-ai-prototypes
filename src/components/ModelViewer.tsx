"use client";

import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  useProgress,
  useGLTF,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useMemo, Component, ReactNode } from "react";
import * as THREE from "three";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <div
            className="absolute inset-2 animate-spin rounded-full border-2 border-purple-400/30 border-b-purple-400"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
        </div>
        <span className="text-sm font-medium text-foreground/60">
          Loading {progress.toFixed(0)}%
        </span>
      </div>
    </Html>
  );
}

const TARGET_SIZE = 2.5;

class ModelErrorBoundary extends Component<
  { children: ReactNode; onError?: () => void },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Failed to load model" };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="flex flex-col items-center gap-2 rounded-lg bg-red-900/60 px-6 py-4 text-center backdrop-blur-sm">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <p className="text-sm font-medium text-red-300">Model failed to load</p>
            <p className="max-w-[220px] text-xs text-red-400/70">{this.state.message}</p>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
        }
      }
    });

    clone.scale.set(1, 1, 1);
    clone.position.set(0, 0, 0);
    clone.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0) {
      const scale = TARGET_SIZE / maxDim;
      clone.scale.setScalar(scale);
    }

    clone.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(clone);
    const center = scaledBox.getCenter(new THREE.Vector3());

    clone.position.set(-center.x, -scaledBox.min.y, -center.z);

    return clone;
  }, [scene]);

  return <primitive object={clonedScene} />;
}

function CameraReset({ modelUrl }: { modelUrl: string | null }) {
  const { camera } = useThree();
  const controlsRef = useRef<never>(null);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (modelUrl && modelUrl !== prevUrl.current) {
      camera.position.set(3, 2, 5);
      camera.lookAt(0, TARGET_SIZE / 2, 0);
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        const controls = controlsRef.current as unknown as {
          target: THREE.Vector3;
          update: () => void;
        };
        controls.target.set(0, TARGET_SIZE / 2, 0);
        controls.update();
      }
    }
    prevUrl.current = modelUrl;
  }, [modelUrl, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={1}
      maxDistance={15}
      maxPolarAngle={Math.PI / 2 + 0.05}
      target={[0, TARGET_SIZE / 2, 0]}
    />
  );
}

function PlaceholderBox() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color="#6366f1"
          roughness={0.2}
          metalness={0.3}
          wireframe
        />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.78, 0.78, 0.78]} />
        <meshStandardMaterial
          color="#6366f1"
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={0.15}
        />
      </mesh>
      <Html position={[0, 0.6, 0]} center>
        <div className="whitespace-nowrap rounded-lg bg-black/70 px-4 py-2 text-center text-sm text-white/80 backdrop-blur-sm">
          <p className="font-medium">No model loaded</p>
          <p className="mt-0.5 text-xs text-white/50">
            Generate one from the panel
          </p>
        </div>
      </Html>
    </group>
  );
}

interface ModelViewerProps {
  modelUrl?: string | null;
  showPlaceholder?: boolean;
}

export default function ModelViewer({
  modelUrl,
  showPlaceholder = true,
}: ModelViewerProps) {
  return (
    <div className="relative h-full w-full min-h-[500px] rounded-2xl overflow-hidden border border-border bg-[#0d0d14]">
      <Canvas
        camera={{ position: [3, 2, 5], fov: 40 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        shadows
      >
        <color attach="background" args={["#0d0d14"]} />
        <fog attach="fog" args={["#0d0d14", 8, 16]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-3, 3, -2]} intensity={0.3} color="#818cf8" />

        <Suspense fallback={<Loader />}>
          {modelUrl ? (
            <ModelErrorBoundary key={modelUrl}>
              <Model url={modelUrl} />
            </ModelErrorBoundary>
          ) : showPlaceholder ? (
            <PlaceholderBox />
          ) : null}

          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#141420" roughness={0.85} />
          </mesh>

          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.5}
            scale={10}
            blur={2.5}
          />
          <Environment preset="studio" />
        </Suspense>

        <CameraReset modelUrl={modelUrl ?? null} />
        <gridHelper
          args={[10, 20, "#1a1a2e", "#151525"]}
          position={[0, 0.005, 0]}
        />
      </Canvas>

      <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
        Drag to rotate &middot; Scroll to zoom &middot; Right-click to pan
      </div>
    </div>
  );
}
