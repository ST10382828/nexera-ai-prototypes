"use client";

import * as THREE from "three";
import { useMemo } from "react";

const WOOD = "#8B6914";
const WOOD_DARK = "#654321";
const METAL = "#888";
const RED = "#cc2222";
const RED_DARK = "#991111";
const WALL = "#2a2a35";
const FLOOR_COLOR = "#1e1e2a";
const SIGN_GREEN = "#22aa44";

function Table({ position }: { position: [number, number, number] }) {
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: WOOD, roughness: 0.6 }), []);
  const legMat = useMemo(() => new THREE.MeshStandardMaterial({ color: WOOD_DARK, roughness: 0.7 }), []);

  return (
    <group position={position}>
      {/* Tabletop */}
      <mesh material={woodMat} position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.05, 0.6]} />
      </mesh>
      {/* Legs */}
      {[[-0.42, 0.35, -0.22], [0.42, 0.35, -0.22], [-0.42, 0.35, 0.22], [0.42, 0.35, 0.22]].map((pos, i) => (
        <mesh key={i} material={legMat} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

function FireExtinguisher({ position }: { position: [number, number, number] }) {
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: RED, roughness: 0.3, metalness: 0.2 }), []);
  const topMat = useMemo(() => new THREE.MeshStandardMaterial({ color: METAL, roughness: 0.2, metalness: 0.6 }), []);
  const labelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.5 }), []);

  return (
    <group position={position}>
      {/* Body */}
      <mesh material={bodyMat} position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.3, 8, 16]} />
      </mesh>
      {/* Top valve */}
      <mesh material={topMat} position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.08, 12]} />
      </mesh>
      {/* Handle */}
      <mesh material={topMat} position={[0.05, 0.56, 0]}>
        <boxGeometry args={[0.08, 0.02, 0.03]} />
      </mesh>
      {/* Nozzle/hose */}
      <mesh material={topMat} position={[-0.06, 0.5, 0.04]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
      </mesh>
      {/* Label */}
      <mesh material={labelMat} position={[0, 0.3, 0.082]}>
        <boxGeometry args={[0.08, 0.12, 0.005]} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.1, 12]} />
        <meshStandardMaterial color={RED_DARK} roughness={0.4} />
      </mesh>
    </group>
  );
}

function SafetySign({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Sign board */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
        <meshStandardMaterial color={SIGN_GREEN} roughness={0.5} />
      </mesh>
      {/* Cross symbol */}
      <mesh position={[0, 1.6, 0.015]}>
        <boxGeometry args={[0.2, 0.06, 0.005]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0, 1.6, 0.015]}>
        <boxGeometry args={[0.06, 0.2, 0.005]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
        <meshStandardMaterial color={METAL} roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

function Cone({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <coneGeometry args={[0.08, 0.3, 8]} />
        <meshStandardMaterial color="#ff6600" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.16, 0.02, 0.16]} />
        <meshStandardMaterial color="#ff6600" roughness={0.5} />
      </mesh>
      {/* Reflective strip */}
      <mesh position={[0, 0.2, 0.06]}>
        <boxGeometry args={[0.06, 0.03, 0.005]} />
        <meshStandardMaterial color="#fff" roughness={0.2} metalness={0.3} />
      </mesh>
    </group>
  );
}

function WallPanel({ position, rotation, width = 5, height = 3 }: { position: [number, number, number]; rotation?: [number, number, number]; width?: number; height?: number }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <boxGeometry args={[width, height, 0.05]} />
      <meshStandardMaterial color={WALL} roughness={0.85} side={THREE.FrontSide} />
    </mesh>
  );
}

export default function SceneEnvironment() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.85} />
      </mesh>

      {/* Floor lines (industrial) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[2.3, 2.35, 32]} />
        <meshStandardMaterial color="#333340" />
      </mesh>

      {/* Back wall */}
      <WallPanel position={[0, 1.5, -3]} width={6.1} />

      {/* Left wall */}
      <WallPanel position={[-3, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} width={6.1} />

      {/* Right wall */}
      <WallPanel position={[3, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} width={6.1} />

      {/* Table */}
      <Table position={[1.8, 0, -1]} />

      {/* Fire extinguisher */}
      <FireExtinguisher position={[-2.5, 0, -1.5]} />

      {/* Safety sign */}
      <SafetySign position={[1.5, 0, -2.9]} />

      {/* Safety cones */}
      <Cone position={[2.5, 0, 1]} />
      <Cone position={[-1.5, 0, 1.5]} />
    </group>
  );
}
