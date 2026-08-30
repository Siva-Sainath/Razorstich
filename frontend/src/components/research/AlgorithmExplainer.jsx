import React from 'react';
import { METHODOLOGY_LAYERS } from '@/config/trainingNarrative';

/** Plain-English Dueling DDQN explainer for §2. */
export const AlgorithmExplainer = () => {
  const dueling = METHODOLOGY_LAYERS.find((l) => l.label === 'Dueling DDQN');

  return (
    <div className="space-y-5" data-testid="algorithm-explainer">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="type-micro text-primary/80 mb-2">What the agent does</p>
          <p className="type-body text-white/75 leading-relaxed">
            At each tick it picks one of <strong className="text-white/90">11 actions</strong> — wait, SMS,
            payment link, escalate, and so on. It sees amount at risk, time left in the window, contacts already
            sent, and the decline type.
          </p>
        </div>
        <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="type-micro text-primary/80 mb-2">What we optimize</p>
          <p className="type-body text-white/75 leading-relaxed">
            Reward is <strong className="text-white/90">net INR recovered</strong> minus contact and duplicate
            penalties — not gross recovery %. Spammy retries score poorly even if they occasionally work.
          </p>
        </div>
        <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="type-micro text-primary/80 mb-2">Why Dueling DDQN</p>
          <p className="type-body text-white/75 leading-relaxed">
            The network learns two things: how good the <em>situation</em> is overall, and how much better each
            action is than average. That helps when many actions look similar early in training.
          </p>
        </div>
        <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="type-micro text-primary/80 mb-2">At inference</p>
          <p className="type-body text-white/75 leading-relaxed">
            We mask illegal actions (trust budget, UPI duplicate rules), then take the argmax. Same masks in the
            simulator, demo Q-bars, and <code className="text-white/60">/api/policy/recommend</code>.
          </p>
        </div>
      </div>
      {dueling && (
        <p className="type-meta text-white/40 border-l-2 border-primary/30 pl-3">
          {dueling.detail} · artifact: <span className="font-mono">{dueling.artifact}</span>
        </p>
      )}
    </div>
  );
};
