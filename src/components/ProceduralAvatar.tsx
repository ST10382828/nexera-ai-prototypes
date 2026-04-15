"use client";

import { useRef, useMemo, useImperativeHandle, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface AvatarCommand {
  animation: string;
  targetPosition?: [number, number, number] | null;
  standoff?: number;
}

export interface AvatarHandle {
  playAnimation: (name: string) => void;
  executeCommand: (cmd: AvatarCommand) => void;
  getWorldPosition: () => THREE.Vector3;
  currentAnimation: string;
}

interface PoseMap {
  [jointName: string]: Partial<{
    posY: number;
    rotX: number;
    rotY: number;
    rotZ: number;
  }>;
}

const SKIN = "#f0c0a0";
const HAIR = "#3d2b1f";
const SHIRT = "#4f6df5";
const SHIRT_DARK = "#3b5ae0";
const PANTS = "#2c3e6b";
const SHOE = "#1a1a2e";
const EYE_WHITE = "#f5f5f5";
const EYE_IRIS = "#4a6741";
const EYE_PUPIL = "#1a1a1a";
const LIP = "#c47a6a";
const BELT = "#222";
const BELT_BUCKLE = "#c4a53a";

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function ss(t: number, freq: number): number {
  return Math.sin(t * freq * Math.PI * 2);
}

function getDefaultPose(): PoseMap {
  return {
    hips: { posY: 0.95 },
    spine: {},
    head: {},
    leftUpperArm: { rotZ: 0.2 },
    leftLowerArm: { rotX: -0.05 },
    leftHand: {},
    rightUpperArm: { rotZ: -0.2 },
    rightLowerArm: { rotX: -0.05 },
    rightHand: {},
    leftUpperLeg: {},
    leftLowerLeg: {},
    leftFoot: {},
    rightUpperLeg: {},
    rightLowerLeg: {},
    rightFoot: {},
  };
}

type PoseFn = (t: number) => PoseMap;

const anims: Record<string, PoseFn> = {
  idle: (t) => {
    const b = ss(t, 0.3) * 0.006;
    return {
      hips: { posY: 0.95 + b },
      spine: { rotX: -0.02 + b * 0.3 },
      head: { rotX: ss(t, 0.2) * 0.012, rotY: ss(t, 0.12) * 0.02 },
      leftUpperArm: { rotX: 0.04, rotZ: 0.2 + ss(t, 0.25) * 0.008 },
      leftLowerArm: { rotX: -0.12 },
      leftHand: { rotX: -0.04 },
      rightUpperArm: { rotX: 0.04, rotZ: -0.2 - ss(t, 0.25) * 0.008 },
      rightLowerArm: { rotX: -0.12 },
      rightHand: { rotX: -0.04 },
      leftUpperLeg: { rotX: 0.015 },
      leftLowerLeg: {},
      rightUpperLeg: { rotX: -0.01 },
      rightLowerLeg: {},
    };
  },

  walking: (t) => {
    const sp = 1.8;
    const s = ss(t, sp);
    const bn = Math.abs(ss(t, sp)) * 0.018;
    const tl = ss(t, sp) * 0.025;
    return {
      hips: { posY: 0.95 + bn, rotY: tl, rotZ: -tl * 0.3 },
      spine: { rotX: -0.05, rotY: -tl * 0.4 },
      head: { rotX: -0.02, rotY: -tl * 0.2 },
      leftUpperArm: { rotX: -s * 0.45, rotZ: 0.15 },
      leftLowerArm: { rotX: -0.3 - Math.max(0, s) * 0.25 },
      leftHand: {},
      rightUpperArm: { rotX: s * 0.45, rotZ: -0.15 },
      rightLowerArm: { rotX: -0.3 - Math.max(0, -s) * 0.25 },
      rightHand: {},
      leftUpperLeg: { rotX: s * 0.55 },
      leftLowerLeg: { rotX: -Math.max(0, -s) * 0.7 - 0.04 },
      leftFoot: { rotX: s * 0.08 },
      rightUpperLeg: { rotX: -s * 0.55 },
      rightLowerLeg: { rotX: -Math.max(0, s) * 0.7 - 0.04 },
      rightFoot: { rotX: -s * 0.08 },
    };
  },

  walk_to: (t) => anims.walking(t),

  waving: (t) => {
    const w = ss(t, 3) * 0.35;
    const b = ss(t, 0.3) * 0.004;
    return {
      hips: { posY: 0.95 + b },
      spine: { rotX: -0.02, rotZ: 0.02 },
      head: { rotX: -0.04, rotZ: ss(t, 2.5) * 0.04, rotY: 0.06 },
      rightUpperArm: { rotX: -0.15, rotZ: -2.7 },
      rightLowerArm: { rotX: w, rotZ: 0.3 },
      rightHand: { rotX: w * 0.4 },
      leftUpperArm: { rotX: 0.04, rotZ: 0.22 },
      leftLowerArm: { rotX: -0.12 },
      leftHand: {},
      leftUpperLeg: { rotX: 0.015 },
      leftLowerLeg: {},
      rightUpperLeg: { rotX: -0.01 },
      rightLowerLeg: {},
    };
  },

  pointing: (t) => {
    const b = ss(t, 0.3) * 0.003;
    const p = ss(t, 1.5) * 0.008;
    return {
      hips: { posY: 0.95 + b },
      spine: { rotX: -0.02 },
      head: { rotX: -0.08 },
      rightUpperArm: { rotX: -1.5 + p, rotZ: -0.05 },
      rightLowerArm: { rotX: 0.01 },
      rightHand: { rotX: -0.03 },
      leftUpperArm: { rotX: 0.04, rotZ: 0.2 },
      leftLowerArm: { rotX: -0.12 },
      leftHand: {},
      leftUpperLeg: { rotX: 0.02 },
      leftLowerLeg: {},
      rightUpperLeg: { rotX: -0.01 },
      rightLowerLeg: {},
    };
  },

  looking: (t) => {
    const lh = ss(t, 0.3) * 0.7;
    const lv = ss(t, 0.2) * 0.15;
    const b = ss(t, 0.3) * 0.004;
    return {
      hips: { posY: 0.95 + b, rotY: lh * 0.12 },
      spine: { rotY: lh * 0.2, rotX: lv * 0.06 },
      head: { rotY: lh, rotX: lv },
      leftUpperArm: { rotZ: 0.2 + Math.abs(lh) * 0.02 },
      leftLowerArm: { rotX: -0.1 },
      leftHand: {},
      rightUpperArm: { rotZ: -0.2 - Math.abs(lh) * 0.02 },
      rightLowerArm: { rotX: -0.1 },
      rightHand: {},
      leftUpperLeg: { rotX: 0.015 },
      leftLowerLeg: {},
      rightUpperLeg: { rotX: -0.01 },
      rightLowerLeg: {},
    };
  },

  safety_posture: (t) => {
    const b = ss(t, 0.35) * 0.003;
    return {
      hips: { posY: 0.97 + b },
      spine: { rotX: -0.03 },
      head: { rotX: 0.015 },
      leftUpperArm: { rotZ: 0.1 },
      leftLowerArm: {},
      leftHand: {},
      rightUpperArm: { rotZ: -0.1 },
      rightLowerArm: {},
      rightHand: {},
      leftUpperLeg: { rotZ: 0.04 },
      leftLowerLeg: {},
      leftFoot: {},
      rightUpperLeg: { rotZ: -0.04 },
      rightLowerLeg: {},
      rightFoot: {},
    };
  },
};

const BLEND_SPEED = 4;
const WALK_SPEED = 1.2;

const ProceduralAvatar = forwardRef<AvatarHandle>(function ProceduralAvatar(
  _,
  ref
) {
  const curAnim = useRef("idle");
  const prevAnim = useRef("idle");
  const time = useRef(0);
  const blend = useRef(1);

  const wPos = useRef(new THREE.Vector3(0, 0, 0));
  const wRot = useRef(0);
  const tgtPos = useRef<THREE.Vector3 | null>(null);
  const tgtReached = useRef(false);
  const faceTarget = useRef<THREE.Vector3 | null>(null);
  const arriveCallback = useRef<string>("idle");
  const turnTarget = useRef<number | null>(null);

  const jRefs: Record<string, React.RefObject<THREE.Group | null>> = {
    root: useRef(null),
    hips: useRef(null),
    spine: useRef(null),
    head: useRef(null),
    leftUpperArm: useRef(null),
    leftLowerArm: useRef(null),
    leftHand: useRef(null),
    rightUpperArm: useRef(null),
    rightLowerArm: useRef(null),
    rightHand: useRef(null),
    leftUpperLeg: useRef(null),
    leftLowerLeg: useRef(null),
    leftFoot: useRef(null),
    rightUpperLeg: useRef(null),
    rightLowerLeg: useRef(null),
    rightFoot: useRef(null),
  };

  const mat = {
    skin: useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.55, metalness: 0.02 }), []),
    hair: useMemo(() => new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.85 }), []),
    shirt: useMemo(() => new THREE.MeshStandardMaterial({ color: SHIRT, roughness: 0.4, metalness: 0.05 }), []),
    shirtD: useMemo(() => new THREE.MeshStandardMaterial({ color: SHIRT_DARK, roughness: 0.45 }), []),
    pants: useMemo(() => new THREE.MeshStandardMaterial({ color: PANTS, roughness: 0.5 }), []),
    shoe: useMemo(() => new THREE.MeshStandardMaterial({ color: SHOE, roughness: 0.65, metalness: 0.1 }), []),
    eyeW: useMemo(() => new THREE.MeshStandardMaterial({ color: EYE_WHITE }), []),
    iris: useMemo(() => new THREE.MeshStandardMaterial({ color: EYE_IRIS }), []),
    pupil: useMemo(() => new THREE.MeshStandardMaterial({ color: EYE_PUPIL }), []),
    lip: useMemo(() => new THREE.MeshStandardMaterial({ color: LIP, roughness: 0.35 }), []),
    belt: useMemo(() => new THREE.MeshStandardMaterial({ color: BELT, roughness: 0.35, metalness: 0.2 }), []),
    buckle: useMemo(() => new THREE.MeshStandardMaterial({ color: BELT_BUCKLE, roughness: 0.15, metalness: 0.7 }), []),
  };

  function setAnim(name: string) {
    if (anims[name] && name !== curAnim.current) {
      prevAnim.current = curAnim.current;
      curAnim.current = name;
      blend.current = 0;
    }
  }

  useImperativeHandle(ref, () => ({
    playAnimation(name: string) {
      tgtPos.current = null;
      tgtReached.current = false;
      faceTarget.current = null;
      if (name === "turn_around") {
        turnTarget.current = wRot.current + Math.PI;
        setAnim("idle");
        return;
      }
      setAnim(name);
    },
    executeCommand(cmd: AvatarCommand) {
      const { animation, targetPosition, standoff = 0.5 } = cmd;

      if (animation === "turn_around") {
        tgtPos.current = null;
        tgtReached.current = false;
        faceTarget.current = null;
        turnTarget.current = wRot.current + Math.PI;
        setAnim("idle");
        return;
      }

      if (targetPosition && (animation === "walk_to" || animation === "walking")) {
        const objPos = new THREE.Vector3(targetPosition[0], 0, targetPosition[2]);
        const dir = new THREE.Vector3().subVectors(objPos, wPos.current);
        dir.y = 0;
        const dist = dir.length();
        if (dist > standoff) {
          dir.normalize();
          tgtPos.current = objPos.clone().sub(dir.multiplyScalar(standoff));
        } else {
          tgtPos.current = wPos.current.clone();
        }
        tgtReached.current = false;
        faceTarget.current = objPos;
        arriveCallback.current = "idle";
        setAnim("walk_to");
      } else if (targetPosition && animation === "pointing") {
        tgtPos.current = null;
        tgtReached.current = false;
        faceTarget.current = new THREE.Vector3(targetPosition[0], 0, targetPosition[2]);
        setAnim("pointing");
      } else if (targetPosition && animation === "looking") {
        tgtPos.current = null;
        tgtReached.current = false;
        faceTarget.current = new THREE.Vector3(targetPosition[0], 0, targetPosition[2]);
        setAnim("looking");
      } else {
        tgtPos.current = null;
        tgtReached.current = false;
        faceTarget.current = null;
        setAnim(animation);
      }
    },
    getWorldPosition() {
      return wPos.current.clone();
    },
    get currentAnimation() {
      return curAnim.current;
    },
  }));

  useFrame((_, delta) => {
    time.current += delta;
    blend.current = Math.min(blend.current + delta * BLEND_SPEED, 1);

    const root = jRefs.root.current;
    if (!root) return;

    if (tgtPos.current && !tgtReached.current) {
      const dir = new THREE.Vector3().subVectors(tgtPos.current, wPos.current);
      dir.y = 0;
      const dist = dir.length();

      if (dist > 0.08) {
        dir.normalize();
        const tAngle = Math.atan2(dir.x, dir.z);
        let ad = tAngle - wRot.current;
        while (ad > Math.PI) ad -= Math.PI * 2;
        while (ad < -Math.PI) ad += Math.PI * 2;
        wRot.current += ad * Math.min(delta * 6, 1);
        wPos.current.add(dir.multiplyScalar(Math.min(WALK_SPEED * delta, dist)));
      } else {
        tgtReached.current = true;
        if (faceTarget.current) {
          const fd = new THREE.Vector3().subVectors(faceTarget.current, wPos.current);
          fd.y = 0;
          if (fd.length() > 0.01) {
            wRot.current = Math.atan2(fd.x, fd.z);
          }
        }
        setAnim(arriveCallback.current);
      }
    }

    if (faceTarget.current && !tgtPos.current) {
      const fd = new THREE.Vector3().subVectors(faceTarget.current, wPos.current);
      fd.y = 0;
      if (fd.length() > 0.01) {
        const tAngle = Math.atan2(fd.x, fd.z);
        let ad = tAngle - wRot.current;
        while (ad > Math.PI) ad -= Math.PI * 2;
        while (ad < -Math.PI) ad += Math.PI * 2;
        wRot.current += ad * Math.min(delta * 6, 1);
      }
    }

    if (turnTarget.current !== null) {
      let ad = turnTarget.current - wRot.current;
      while (ad > Math.PI) ad -= Math.PI * 2;
      while (ad < -Math.PI) ad += Math.PI * 2;
      if (Math.abs(ad) < 0.05) {
        wRot.current = turnTarget.current;
        turnTarget.current = null;
      } else {
        wRot.current += ad * Math.min(delta * 4, 1);
      }
    }

    root.position.set(wPos.current.x, wPos.current.y, wPos.current.z);
    root.rotation.y = wRot.current;

    const allValid = Object.entries(jRefs).every(([, r]) => r.current);
    if (!allValid) return;

    const defaults = getDefaultPose();
    const curPose = (anims[curAnim.current] || anims.idle)(time.current);
    const eb = easeInOut(blend.current);
    let prevPose: PoseMap | null = null;
    if (eb < 1) prevPose = (anims[prevAnim.current] || anims.idle)(time.current);

    for (const [name, jRef] of Object.entries(jRefs)) {
      if (!jRef.current || name === "root") continue;
      const d = defaults[name] || {};
      const c = curPose[name] || {};

      let py = c.posY ?? d.posY ?? undefined;
      let rx = c.rotX ?? d.rotX ?? 0;
      let ry = c.rotY ?? d.rotY ?? 0;
      let rz = c.rotZ ?? d.rotZ ?? 0;

      if (prevPose && eb < 1) {
        const p = prevPose[name] || {};
        if (py !== undefined) {
          const ppy = p.posY ?? d.posY ?? py;
          py = THREE.MathUtils.lerp(ppy, py, eb);
        }
        rx = THREE.MathUtils.lerp(p.rotX ?? d.rotX ?? 0, rx, eb);
        ry = THREE.MathUtils.lerp(p.rotY ?? d.rotY ?? 0, ry, eb);
        rz = THREE.MathUtils.lerp(p.rotZ ?? d.rotZ ?? 0, rz, eb);
      }

      if (py !== undefined) jRef.current.position.y = py;
      jRef.current.rotation.x = rx;
      jRef.current.rotation.y = ry;
      jRef.current.rotation.z = rz;
    }
  });

  return (
    <group ref={jRefs.root}>
      <group ref={jRefs.hips} position={[0, 0.95, 0]}>
        {/* Belt */}
        <mesh material={mat.belt}>
          <cylinderGeometry args={[0.14, 0.14, 0.05, 16]} />
        </mesh>
        <mesh material={mat.buckle} position={[0, 0, 0.14]}>
          <boxGeometry args={[0.05, 0.032, 0.008]} />
        </mesh>

        <group ref={jRefs.spine} position={[0, 0.025, 0]}>
          {/* Lower torso */}
          <mesh material={mat.shirt} position={[0, 0.12, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.14, 10, 16]} />
          </mesh>
          {/* Upper chest */}
          <mesh material={mat.shirt} position={[0, 0.27, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.06, 10, 16]} />
          </mesh>
          {/* Shoulder ridge */}
          <mesh material={mat.shirtD} position={[0, 0.33, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.3, 6, 12]} rotation={[0, 0, Math.PI / 2]} />
          </mesh>
          {/* Collar */}
          <mesh material={mat.shirtD} position={[0, 0.35, 0.02]}>
            <cylinderGeometry args={[0.05, 0.06, 0.025, 12]} />
          </mesh>

          {/* Neck */}
          <mesh material={mat.skin} position={[0, 0.39, 0]} castShadow>
            <capsuleGeometry args={[0.035, 0.04, 8, 12]} />
          </mesh>

          {/* Head */}
          <group ref={jRefs.head} position={[0, 0.5, 0]}>
            <mesh material={mat.skin} castShadow>
              <sphereGeometry args={[0.115, 28, 28]} />
            </mesh>
            <mesh material={mat.skin} position={[0, -0.035, 0.018]}>
              <sphereGeometry args={[0.085, 20, 20]} />
            </mesh>
            {/* Hair */}
            <mesh material={mat.hair} position={[0, 0.04, -0.01]}>
              <sphereGeometry args={[0.118, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            </mesh>
            <mesh material={mat.hair} position={[-0.085, 0.012, -0.022]}>
              <capsuleGeometry args={[0.032, 0.07, 6, 8]} />
            </mesh>
            <mesh material={mat.hair} position={[0.085, 0.012, -0.022]}>
              <capsuleGeometry args={[0.032, 0.07, 6, 8]} />
            </mesh>
            <mesh material={mat.hair} position={[0, 0.008, -0.06]}>
              <capsuleGeometry args={[0.08, 0.07, 8, 10]} />
            </mesh>
            {/* Eyebrows */}
            <mesh material={mat.hair} position={[-0.036, 0.044, 0.1]} rotation={[0.1, 0, 0.06]}>
              <boxGeometry args={[0.032, 0.005, 0.007]} />
            </mesh>
            <mesh material={mat.hair} position={[0.036, 0.044, 0.1]} rotation={[0.1, 0, -0.06]}>
              <boxGeometry args={[0.032, 0.005, 0.007]} />
            </mesh>
            {/* Eyes */}
            <mesh material={mat.eyeW} position={[-0.034, 0.028, 0.1]}>
              <sphereGeometry args={[0.018, 14, 14]} />
            </mesh>
            <mesh material={mat.iris} position={[-0.034, 0.028, 0.112]}>
              <sphereGeometry args={[0.011, 12, 12]} />
            </mesh>
            <mesh material={mat.pupil} position={[-0.034, 0.028, 0.119]}>
              <sphereGeometry args={[0.005, 8, 8]} />
            </mesh>
            <mesh material={mat.eyeW} position={[0.034, 0.028, 0.1]}>
              <sphereGeometry args={[0.018, 14, 14]} />
            </mesh>
            <mesh material={mat.iris} position={[0.034, 0.028, 0.112]}>
              <sphereGeometry args={[0.011, 12, 12]} />
            </mesh>
            <mesh material={mat.pupil} position={[0.034, 0.028, 0.119]}>
              <sphereGeometry args={[0.005, 8, 8]} />
            </mesh>
            {/* Nose */}
            <mesh material={mat.skin} position={[0, -0.002, 0.11]}>
              <sphereGeometry args={[0.012, 10, 10]} />
            </mesh>
            {/* Mouth */}
            <mesh material={mat.lip} position={[0, -0.032, 0.1]}>
              <capsuleGeometry args={[0.004, 0.022, 4, 8]} rotation={[0, 0, Math.PI / 2]} />
            </mesh>
            {/* Ears */}
            <mesh material={mat.skin} position={[-0.115, 0.008, 0]}>
              <sphereGeometry args={[0.018, 10, 10]} />
            </mesh>
            <mesh material={mat.skin} position={[0.115, 0.008, 0]}>
              <sphereGeometry args={[0.018, 10, 10]} />
            </mesh>
          </group>

          {/* LEFT ARM */}
          <group ref={jRefs.leftUpperArm} position={[0.19, 0.31, 0]}>
            <mesh material={mat.shirt}>
              <sphereGeometry args={[0.044, 12, 12]} />
            </mesh>
            <mesh material={mat.shirt} position={[0, -0.1, 0]} castShadow>
              <capsuleGeometry args={[0.036, 0.1, 8, 12]} />
            </mesh>
            <group ref={jRefs.leftLowerArm} position={[0, -0.21, 0]}>
              <mesh material={mat.skin}>
                <sphereGeometry args={[0.03, 10, 10]} />
              </mesh>
              <mesh material={mat.skin} position={[0, -0.09, 0]} castShadow>
                <capsuleGeometry args={[0.025, 0.1, 8, 12]} />
              </mesh>
              <group ref={jRefs.leftHand} position={[0, -0.19, 0]}>
                <mesh material={mat.skin}>
                  <sphereGeometry args={[0.024, 10, 10]} />
                </mesh>
                <mesh material={mat.skin} position={[0, -0.025, 0.004]}>
                  <boxGeometry args={[0.03, 0.022, 0.018]} />
                </mesh>
              </group>
            </group>
          </group>

          {/* RIGHT ARM */}
          <group ref={jRefs.rightUpperArm} position={[-0.19, 0.31, 0]}>
            <mesh material={mat.shirt}>
              <sphereGeometry args={[0.044, 12, 12]} />
            </mesh>
            <mesh material={mat.shirt} position={[0, -0.1, 0]} castShadow>
              <capsuleGeometry args={[0.036, 0.1, 8, 12]} />
            </mesh>
            <group ref={jRefs.rightLowerArm} position={[0, -0.21, 0]}>
              <mesh material={mat.skin}>
                <sphereGeometry args={[0.03, 10, 10]} />
              </mesh>
              <mesh material={mat.skin} position={[0, -0.09, 0]} castShadow>
                <capsuleGeometry args={[0.025, 0.1, 8, 12]} />
              </mesh>
              <group ref={jRefs.rightHand} position={[0, -0.19, 0]}>
                <mesh material={mat.skin}>
                  <sphereGeometry args={[0.024, 10, 10]} />
                </mesh>
                <mesh material={mat.skin} position={[0, -0.025, 0.004]}>
                  <boxGeometry args={[0.03, 0.022, 0.018]} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* LEFT LEG */}
      <group ref={jRefs.leftUpperLeg} position={[0.08, 0.92, 0]}>
        <mesh material={mat.pants}>
          <sphereGeometry args={[0.052, 12, 12]} />
        </mesh>
        <mesh material={mat.pants} position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.048, 0.24, 8, 12]} />
        </mesh>
        <group ref={jRefs.leftLowerLeg} position={[0, -0.46, 0]}>
          <mesh material={mat.pants}>
            <sphereGeometry args={[0.042, 10, 10]} />
          </mesh>
          <mesh material={mat.pants} position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.036, 0.22, 8, 12]} />
          </mesh>
          <group ref={jRefs.leftFoot} position={[0, -0.42, 0.02]}>
            <mesh material={mat.shoe} position={[0, 0, 0.02]} castShadow>
              <capsuleGeometry args={[0.033, 0.08, 6, 10]} rotation={[Math.PI / 2, 0, 0]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* RIGHT LEG */}
      <group ref={jRefs.rightUpperLeg} position={[-0.08, 0.92, 0]}>
        <mesh material={mat.pants}>
          <sphereGeometry args={[0.052, 12, 12]} />
        </mesh>
        <mesh material={mat.pants} position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.048, 0.24, 8, 12]} />
        </mesh>
        <group ref={jRefs.rightLowerLeg} position={[0, -0.46, 0]}>
          <mesh material={mat.pants}>
            <sphereGeometry args={[0.042, 10, 10]} />
          </mesh>
          <mesh material={mat.pants} position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.036, 0.22, 8, 12]} />
          </mesh>
          <group ref={jRefs.rightFoot} position={[0, -0.42, 0.02]}>
            <mesh material={mat.shoe} position={[0, 0, 0.02]} castShadow>
              <capsuleGeometry args={[0.033, 0.08, 6, 10]} rotation={[Math.PI / 2, 0, 0]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
});

export default ProceduralAvatar;
