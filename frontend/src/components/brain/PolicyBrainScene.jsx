import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Line } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/kit/ErrorBoundary';
import { PolicyBrainFallback } from './PolicyBrainFallback';
import {
  createLeftHemisphereGeometry,
  createRightHemisphereGeometry,
  createCerebellumGeometry,
  createBrainstemGeometry,
} from './brainMeshUtils';
import {
  POLICY_NODES,
  POLICY_SYNAPSES,
  policyNodeById,
  interiorPosition,
  interiorControlOffset,
} from './policyBrainNodes';

const WHITE_SHELL = '#f0f9ff';
const CYAN_GLOW = '#67e8f9';
const TEAL_PASS = '#2dd4bf';
const WARN_AMBER = '#f59e0b';

/** Wireframe envelope only — no solid interior mesh. Neurons render inside this shell. */
function HolographicShell({ geometry }) {
  return (
    <mesh geometry={geometry} renderOrder={3}>
      <meshBasicMaterial
        color={WHITE_SHELL}
        wireframe
        transparent
        opacity={0.36}
        depthWrite={false}
      />
    </mesh>
  );
}

function Cortex() {
  const leftGeom = useMemo(() => createLeftHemisphereGeometry(), []);
  const rightGeom = useMemo(() => createRightHemisphereGeometry(), []);
  const cerebellumGeom = useMemo(() => createCerebellumGeometry(), []);
  const stemGeom = useMemo(() => createBrainstemGeometry(), []);

  return (
    <group>
      <HolographicShell geometry={leftGeom} />
      <HolographicShell geometry={rightGeom} />
      <HolographicShell geometry={cerebellumGeom} />
      <HolographicShell geometry={stemGeom} />
    </group>
  );
}

function PolicyNeuron({ node, nodeIndex, activeStep, thinking, guardrailActive, selectedAction }) {
  const coreRef = useRef(null);
  const glowRef = useRef(null);
  const baseScale = 0.13;

  const isPast = nodeIndex < activeStep || (selectedAction && node.id === 'act');
  const isCurrent = nodeIndex === activeStep;
  const isWarn = guardrailActive && node.id === 'guard' && activeStep >= 2;
  const isActive = isCurrent && (thinking || guardrailActive || Boolean(selectedAction));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (isWarn && coreRef.current && glowRef.current) {
      const pulse = 1 + Math.sin(t * 5) * 0.3;
      coreRef.current.scale.setScalar(baseScale * 1.7 * pulse);
      glowRef.current.scale.setScalar(baseScale * 3 * pulse);
      const mat = coreRef.current.material;
      mat.opacity = 0.85 + Math.sin(t * 5) * 0.12;
    } else if (isActive && coreRef.current) {
      const pulse = 1 + Math.sin(t * 4) * 0.15;
      coreRef.current.scale.setScalar(baseScale * 1.5 * pulse);
    }
  });

  let coreColor = WHITE_SHELL;
  let glowColor = CYAN_GLOW;
  if (isWarn) {
    coreColor = WARN_AMBER;
    glowColor = WARN_AMBER;
  } else if (isActive) {
    coreColor = CYAN_GLOW;
  } else if (isPast) {
    coreColor = TEAL_PASS;
    glowColor = TEAL_PASS;
  }

  const coreScale = isWarn ? baseScale * 1.7 : isActive ? baseScale * 1.5 : isPast ? baseScale * 1.15 : baseScale;
  const showGlow = isWarn || isActive || isPast;
  const pos = interiorPosition(node);

  return (
    <group position={[pos.x, pos.y, pos.z]} renderOrder={1}>
      {showGlow && (
        <mesh ref={glowRef} scale={isWarn ? baseScale * 3 : baseScale * 2.2}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={isWarn ? 0.35 : 0.18}
            depthWrite={false}
          />
        </mesh>
      )}
      <mesh ref={coreRef} scale={coreScale}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

function PolicyNeurons({ activeStep, thinking, guardrailActive, selectedAction }) {
  return (
    <group>
      {POLICY_NODES.map((node, index) => (
        <PolicyNeuron
          key={node.id}
          node={node}
          nodeIndex={index}
          activeStep={activeStep}
          thinking={thinking}
          guardrailActive={guardrailActive}
          selectedAction={selectedAction}
        />
      ))}
    </group>
  );
}

function buildCurve(from, to, controlOffset) {
  const a = interiorPosition(from);
  const b = interiorPosition(to);
  const p1 = new THREE.Vector3(a.x, a.y, a.z);
  const p2 = new THREE.Vector3(b.x, b.y, b.z);
  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  const offset = interiorControlOffset(controlOffset);
  if (offset) {
    mid.x += offset.x;
    mid.y += offset.y;
    mid.z += offset.z;
  }
  return new THREE.QuadraticBezierCurve3(p1, mid, p2);
}

function PolicySynapses({ activeStep, thinking, guardrailActive }) {
  const activePair = useMemo(() => {
    if (activeStep <= 0) return null;
    return {
      from: POLICY_NODES[activeStep - 1].id,
      to: POLICY_NODES[activeStep].id,
    };
  }, [activeStep]);

  return (
    <group renderOrder={1}>
      {POLICY_SYNAPSES.map((syn) => {
        const from = policyNodeById(syn.from);
        const to = policyNodeById(syn.to);
        if (!from || !to) return null;

        const fromIdx = POLICY_NODES.findIndex((n) => n.id === syn.from);
        const toIdx = POLICY_NODES.findIndex((n) => n.id === syn.to);
        const lit = toIdx <= activeStep && fromIdx < activeStep;
        const isActive =
          activePair &&
          ((activePair.from === syn.from && activePair.to === syn.to) ||
            (activePair.from === syn.to && activePair.to === syn.from));
        const touchesGuard = guardrailActive && (syn.from === 'guard' || syn.to === 'guard');

        const curve = buildCurve(from, to, syn.controlOffset);
        const points = curve.getPoints(28);

        let color = CYAN_GLOW;
        let opacity = 0.28;
        if (touchesGuard && isActive) {
          color = WARN_AMBER;
          opacity = 0.75;
        } else if (isActive && (thinking || guardrailActive)) {
          color = CYAN_GLOW;
          opacity = 0.92;
        } else if (lit) {
          color = TEAL_PASS;
          opacity = 0.55;
        }

        return (
          <Line
            key={syn.id}
            points={points}
            color={color}
            transparent
            opacity={opacity}
            lineWidth={isActive ? 2 : lit ? 1.2 : 0.8}
          />
        );
      })}
    </group>
  );
}

function SignalPulse({ activeStep, thinking, guardrailActive }) {
  const ref = useRef(null);

  const curve = useMemo(() => {
    if (guardrailActive && activeStep >= 2) {
      const node = policyNodeById('guard');
      if (!node) return null;
      const pos = interiorPosition(node);
      return {
        type: 'pulse',
        center: new THREE.Vector3(pos.x, pos.y, pos.z),
        color: WARN_AMBER,
      };
    }
    if (activeStep <= 0 || !thinking) return null;
    const from = POLICY_NODES[activeStep - 1];
    const to = POLICY_NODES[activeStep];
    const syn = POLICY_SYNAPSES.find(
      (s) =>
        (s.from === from.id && s.to === to.id) ||
        (s.from === to.id && s.to === from.id)
    );
    return {
      type: 'path',
      curve: buildCurve(from, to, syn?.controlOffset),
      color: CYAN_GLOW,
    };
  }, [activeStep, thinking, guardrailActive]);

  useFrame((state) => {
    if (!ref.current || !curve) {
      if (ref.current) ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    const t = state.clock.elapsedTime;
    const mat = ref.current.material;

    if (curve.type === 'pulse') {
      const pulse = 1 + Math.sin(t * 8) * 0.4;
      ref.current.position.copy(curve.center);
      ref.current.scale.setScalar(0.35 * pulse);
      mat.color.set(curve.color);
      mat.opacity = 0.6 + Math.sin(t * 8) * 0.3;
    } else {
      const p = curve.curve.getPoint((t * 0.5) % 1);
      ref.current.position.copy(p);
      ref.current.scale.setScalar(0.1);
      mat.color.set(curve.color);
      mat.opacity = 0.95;
    }
  });

  if (!curve) return null;

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial color={CYAN_GLOW} transparent opacity={0.95} />
    </mesh>
  );
}

function SceneContent({ activeStep, thinking, guardrailActive, selectedAction }) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.5, 14]} fov={38} />
      <OrbitControls
        enablePan={false}
        minDistance={7}
        maxDistance={26}
        target={[0, 0.4, 0]}
        autoRotate={autoRotate}
        autoRotateSpeed={0.28}
        onStart={() => setAutoRotate(false)}
      />
      <ambientLight intensity={0.15} />
      <PolicySynapses
        activeStep={activeStep}
        thinking={thinking}
        guardrailActive={guardrailActive}
      />
      <PolicyNeurons
        activeStep={activeStep}
        thinking={thinking}
        guardrailActive={guardrailActive}
        selectedAction={selectedAction}
      />
      <SignalPulse
        activeStep={activeStep}
        thinking={thinking}
        guardrailActive={guardrailActive}
      />
      <Cortex />
    </>
  );
}

function BrainCanvas({ activeStep, thinking, guardrailActive, selectedAction }) {
  return (
    <Canvas
      className="w-full h-full touch-none"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#000000' }}
    >
      <color attach="background" args={['#000000']} />
      <SceneContent
        activeStep={activeStep}
        thinking={thinking}
        guardrailActive={guardrailActive}
        selectedAction={selectedAction}
      />
    </Canvas>
  );
}

/**
 * Wireframe cortex envelope with semantic neurons + synapses rendered inside the shell.
 */
export const PolicyBrainScene = ({
  pipelineStep = 0,
  thinking = false,
  guardrailActive = false,
  selectedAction = '',
  className = '',
  height,
}) => {
  const activeStep = Math.min(pipelineStep, POLICY_NODES.length - 1);
  const resolvedHeight = height ?? 340;
  const sizeStyle =
    typeof resolvedHeight === 'number'
      ? { height: resolvedHeight, minHeight: resolvedHeight }
      : { height: resolvedHeight, minHeight: resolvedHeight };
  const fallback = (
    <PolicyBrainFallback
      pipelineStep={pipelineStep}
      thinking={thinking}
      selectedAction={selectedAction}
      height={typeof resolvedHeight === 'number' ? resolvedHeight : 340}
      className={className}
    />
  );

  return (
    <ErrorBoundary fallback={fallback} message="3D policy cortex unavailable.">
      <div
        className={cn(
          'relative w-full rounded-[16px] border border-white/[0.08] bg-black overflow-hidden select-none',
          className
        )}
        style={sizeStyle}
        data-testid="policy-brain-viz"
      >
        <div className="absolute inset-0 z-0">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center type-meta text-white/35 font-mono">
                Loading 3D cortex…
              </div>
            }
          >
            <BrainCanvas
              activeStep={activeStep}
              thinking={thinking}
              guardrailActive={guardrailActive}
              selectedAction={selectedAction}
            />
          </Suspense>
        </div>

        <div className="absolute top-3 left-4 right-4 flex items-center justify-between type-micro font-mono z-10 pointer-events-none">
          <div className="flex flex-col gap-0.5 max-w-[55%]">
            <span className="text-white/45 truncate">Policy cortex</span>
          </div>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-md border type-micro shrink-0',
              thinking
                ? 'border-primary/45 bg-primary/10 text-primary'
                : selectedAction
                  ? 'border-[rgba(45,212,191,0.4)] bg-[rgba(45,212,191,0.08)] text-[rgba(45,212,191,0.9)]'
                  : 'border-white/10 text-white/45'
            )}
          >
            {thinking ? 'firing' : selectedAction ? selectedAction.replace(/_/g, ' ') : 'inspect'}
          </span>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PolicyBrainScene;
