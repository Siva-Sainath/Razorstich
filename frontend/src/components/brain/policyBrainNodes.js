/** Policy pipeline nodes in 3D cortex space — anatomical coords from Black_Box BRAIN_NODES_3D. */
export const POLICY_NODES = [
  {
    id: 'observe',
    label: 'Observe',
    region: 'Left frontal',
    module: 'Episode state',
    x: 0.0,
    y: 3.2,
    z: 5.6,
  },
  {
    id: 'encode',
    label: 'Encode',
    region: 'Left temporal',
    module: 'Obs vector',
    x: -3.8,
    y: -1.2,
    z: 1.2,
  },
  {
    id: 'guard',
    label: 'Mask',
    region: 'ACC',
    module: 'Guardrails',
    x: 0.0,
    y: 2.1,
    z: 1.5,
  },
  {
    id: 'dqn',
    label: 'DQN',
    region: 'Right DLPFC',
    module: 'Q forward pass',
    x: 3.6,
    y: 2.6,
    z: 3.4,
  },
  {
    id: 'select',
    label: 'Argmax',
    region: 'Right parietal',
    module: 'Legal actions',
    x: 3.2,
    y: -0.8,
    z: 4.8,
  },
  {
    id: 'act',
    label: 'Act',
    region: 'Motor output',
    module: 'Intervention',
    x: 0.0,
    y: 4.5,
    z: 0.2,
  },
];

/** Synaptic tracts between policy stages — no internal connectome mesh. */
export const POLICY_SYNAPSES = [
  { id: 'syn_ob_enc', from: 'observe', to: 'encode', controlOffset: { x: -1.2, y: 1.0, z: 2.4 } },
  { id: 'syn_ob_guard', from: 'observe', to: 'guard', controlOffset: { x: 0.0, y: 0.5, z: 1.0 } },
  { id: 'syn_enc_guard', from: 'encode', to: 'guard', controlOffset: { x: 1.0, y: 1.2, z: 0.5 } },
  { id: 'syn_enc_dqn', from: 'encode', to: 'dqn', controlOffset: { x: 2.0, y: 1.5, z: 2.0 } },
  { id: 'syn_guard_dqn', from: 'guard', to: 'dqn', controlOffset: { x: 1.5, y: 2.2, z: 2.0 } },
  { id: 'syn_dqn_sel', from: 'dqn', to: 'select', controlOffset: { x: 1.0, y: 0.5, z: 1.5 } },
  { id: 'syn_sel_act', from: 'select', to: 'act', controlOffset: { x: -1.0, y: 2.5, z: -1.0 } },
  { id: 'syn_guard_act', from: 'guard', to: 'act', controlOffset: { x: 0.0, y: 2.0, z: 0.5 } },
];

export function policyNodeById(id) {
  return POLICY_NODES.find((n) => n.id === id);
}

export function policyNodeIndex(id) {
  return POLICY_NODES.findIndex((n) => n.id === id);
}

/** Pull surface anatomical coords inward so neurons sit inside the wireframe shell. */
const BRAIN_CENTER = { x: 0, y: 0.55, z: 0.6 };
const INTERIOR_DEPTH = 0.58;

export function interiorPosition({ x, y, z }) {
  return {
    x: BRAIN_CENTER.x + (x - BRAIN_CENTER.x) * INTERIOR_DEPTH,
    y: BRAIN_CENTER.y + (y - BRAIN_CENTER.y) * INTERIOR_DEPTH,
    z: BRAIN_CENTER.z + (z - BRAIN_CENTER.z) * INTERIOR_DEPTH,
  };
}

export function interiorControlOffset(offset) {
  if (!offset) return undefined;
  return {
    x: offset.x * INTERIOR_DEPTH,
    y: offset.y * INTERIOR_DEPTH,
    z: offset.z * INTERIOR_DEPTH,
  };
}
