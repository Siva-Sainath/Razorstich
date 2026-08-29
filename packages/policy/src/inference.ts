export interface DuelingWeights {
  policy_version: string;
  state_dim: number;
  action_dim: number;
  hidden_dim: number;
  architecture: string;
  shared: {
    fc1: { w: number[][]; b: number[] };
    fc2: { w: number[][]; b: number[] };
  };
  value_stream: {
    fc1: { w: number[][]; b: number[] };
    fc2: { w: number[][]; b: number[] };
  };
  advantage_stream: {
    fc1: { w: number[][]; b: number[] };
    fc2: { w: number[][]; b: number[] };
  };
}

export interface PolicyTelemetry {
  selectedAction: string;
  actionIndex: number;
  baselineValue: number;
  advantages: Record<string, number>;
  qValues: Record<string, number>;
  actionMask: boolean[];
}

export const ACTION_NAMES = [
  "wait",
  "retry_checkout",
  "suggest_alt_method",
  "create_payment_link",
  "resend_link",
  "notify_customer",
  "request_method_update",
  "offer_partial",
  "escalate_human",
  "reconcile",
  "stop",
] as const;

function relu(v: number[]): number[] {
  return v.map((x) => (x > 0 ? x : 0));
}

function matmul(input: number[], weight: number[][], bias: number[]): number[] {
  const out = new Array(bias.length);
  for (let i = 0; i < bias.length; i++) {
    let sum = bias[i];
    for (let j = 0; j < input.length; j++) {
      sum += input[j] * weight[j][i];
    }
    out[i] = sum;
  }
  return out;
}

export function predictDuelingDQN(
  stateVector: number[],
  actionMask: boolean[],
  weights: DuelingWeights
): PolicyTelemetry {
  if (stateVector.length !== weights.state_dim) {
    throw new Error(
      `State vector dimension mismatch: expected ${weights.state_dim}, got ${stateVector.length}`
    );
  }

  const relu1 = relu(matmul(stateVector, weights.shared.fc1.w, weights.shared.fc1.b));
  const features = relu(matmul(relu1, weights.shared.fc2.w, weights.shared.fc2.b));

  const vH1 = relu(
    matmul(features, weights.value_stream.fc1.w, weights.value_stream.fc1.b)
  );
  const baselineValue = matmul(
    vH1,
    weights.value_stream.fc2.w,
    weights.value_stream.fc2.b
  )[0];

  const aH1 = relu(
    matmul(features, weights.advantage_stream.fc1.w, weights.advantage_stream.fc1.b)
  );
  const rawAdvantages = matmul(
    aH1,
    weights.advantage_stream.fc2.w,
    weights.advantage_stream.fc2.b
  );

  const meanAdvantage =
    rawAdvantages.reduce((acc, val) => acc + val, 0) / rawAdvantages.length;
  const qValuesArray = rawAdvantages.map(
    (adv) => baselineValue + (adv - meanAdvantage)
  );

  let bestIdx = -1;
  let maxQ = -Infinity;
  const advantageMap: Record<string, number> = {};
  const qValueMap: Record<string, number> = {};

  for (let i = 0; i < ACTION_NAMES.length; i++) {
    const name = ACTION_NAMES[i];
    advantageMap[name] = rawAdvantages[i];
    qValueMap[name] = qValuesArray[i];
    if (actionMask[i] && qValuesArray[i] > maxQ) {
      maxQ = qValuesArray[i];
      bestIdx = i;
    }
  }

  if (bestIdx === -1) bestIdx = 0;

  return {
    selectedAction: ACTION_NAMES[bestIdx],
    actionIndex: bestIdx,
    baselineValue,
    advantages: advantageMap,
    qValues: qValueMap,
    actionMask,
  };
}
