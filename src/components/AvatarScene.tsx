"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { Suspense, forwardRef, useRef, useEffect } from "react";
import * as THREE from "three";
import ProceduralAvatar, { AvatarHandle } from "./ProceduralAvatar";
import SceneEnvironment from "./SceneEnvironment";

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-sm text-foreground/60">Loading scene...</span>
      </div>
    </Html>
  );
}

function CameraFollow({
  avatarRef,
}: {
  avatarRef: React.RefObject<AvatarHandle | null>;
}) {
  const controlsRef = useRef<never>(null);
  const smoothTarget = useRef(new THREE.Vector3(0, 0.9, 0));

  useFrame((_, delta) => {
    if (!avatarRef.current || !controlsRef.current) return;

    const pos = avatarRef.current.getWorldPosition();
    const desiredTarget = new THREE.Vector3(pos.x, 0.9, pos.z);

    smoothTarget.current.lerp(desiredTarget, Math.min(delta * 3, 1));

    const controls = controlsRef.current as unknown as {
      target: THREE.Vector3;
      update: () => void;
    };
    controls.target.copy(smoothTarget.current);
    controls.update();
  });

  useEffect(() => {
    smoothTarget.current.set(0, 0.9, 0);
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      target={[0, 0.9, 0]}
      minDistance={2}
      maxDistance={12}
      maxPolarAngle={Math.PI / 2 + 0.05}
      minPolarAngle={0.2}
    />
  );
}

const AvatarScene = forwardRef<AvatarHandle>(function AvatarScene(_, ref) {
  const internalRef = useRef<AvatarHandle>(null);

  const combinedRef = (handle: AvatarHandle | null) => {
    (internalRef as React.MutableRefObject<AvatarHandle | null>).current =
      handle;
    if (typeof ref === "function") {
      ref(handle);
    } else if (ref) {
      (ref as React.MutableRefObject<AvatarHandle | null>).current = handle;
    }
  };

  return (
    <div className="relative h-full w-full min-h-[500px] rounded-2xl overflow-hidden border border-border bg-[#0d0d14]">
      <Canvas
        camera={{ position: [0, 2.5, 5], fov: 40 }}
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
          position={[4, 6, 3]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <pointLight position={[-3, 3, 2]} intensity={0.4} color="#818cf8" />
        <pointLight position={[3, 2, -2]} intensity={0.25} color="#f59e0b" />

        <Suspense fallback={<Loader />}>
          <ProceduralAvatar ref={combinedRef} />
          <SceneEnvironment />
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.6}
            scale={12}
            blur={2}
          />
          <Environment preset="city" />
        </Suspense>

        <CameraFollow avatarRef={internalRef} />
      </Canvas>

      <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
        Drag to rotate &middot; Scroll to zoom &middot; Right-click to pan
      </div>
    </div>
  );
});

export default AvatarScene;
