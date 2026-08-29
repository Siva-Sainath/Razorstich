import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle2, XCircle, MessageCircle, MessageSquareText, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';

const viewAt = (t) => {
  if (t < 0.28) return 'failed';
  if (t < 0.5) return 'nudge';
  if (t < 0.58) return 'checkout';
  if (t < 0.66) return 'abandoned';
  if (t < 0.82) return 'incentive-msg';
  if (t < 0.94) return 'checkout-offer';
  return 'success';
};

const VIEW_LABEL = {
  failed: { text: 'FAILURE SHOWN', tone: 'bg-rose-500/15 text-rose-200 border-rose-400/20' },
  nudge: { text: 'WHATSAPP SENT', tone: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/20' },
  checkout: { text: 'CUSTOMER VIEWING', tone: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20' },
  abandoned: { text: 'SESSION IDLE', tone: 'bg-amber-500/15 text-amber-200 border-amber-400/20' },
  'incentive-msg': { text: 'SMS + OFFER SENT', tone: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/20' },
  'checkout-offer': { text: 'OFFER ACTIVE', tone: 'bg-amber-500/15 text-amber-200 border-amber-400/20' },
  success: { text: 'CAPTURED', tone: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20' },
};

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const CheckoutShell = ({ children }) => (
  <div className="rounded-lg bg-[#0d1117] border border-white/10 overflow-hidden">
    <div className="px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between">
      <span className="font-mono text-[10px] text-white/60">Aurora Fitness</span>
      <span className="font-mono text-[11px] text-white/90">₹2,499</span>
    </div>
    <div className="p-3.5">{children}</div>
  </div>
);

const MsgBubble = ({ icon: Icon, tone, title, children }) => (
  <div className={`rounded-xl rounded-tl-sm border p-3 ${tone}`}>
    <div className="flex items-center gap-1.5 font-mono text-[10px] opacity-80 mb-1.5">
      <Icon size={11} aria-hidden="true" /> {title}
    </div>
    <p className="text-[12px] leading-relaxed text-white/85">{children}</p>
  </div>
);

export const CustomerPlane = ({ className }) => {
  const { t } = useTimeline();
  const view = viewAt(t);
  const label = VIEW_LABEL[view];

  return (
    <Panel
      title="Customer Plane"
      icon={Smartphone}
      testId="customer-plane"
      index="04"
      className={className}
      right={
        <Badge data-testid="customer-plane-state" className={`border font-mono text-[10px] ${label.tone}`}>
          {label.text}
        </Badge>
      }
    >
      <div className="label-caps mb-3">What Riya sees right now</div>
      <div
        data-testid="checkout-preview"
        className="mx-auto w-full max-w-[250px] rounded-[26px] border border-white/12 bg-black/50 p-2.5 shadow-[0_16px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="rounded-[20px] bg-[#090c10] border border-white/[0.06] p-3 min-h-[290px] flex flex-col">
          <div className="flex justify-center mb-3" aria-hidden="true">
            <div className="w-14 h-1 rounded-full bg-white/15" />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={view} {...fade} className="flex-1 flex flex-col gap-3" data-testid="intervention-asset">
              {view === 'failed' && (
                <CheckoutShell>
                  <div className="flex flex-col items-center text-center py-3">
                    <XCircle size={30} className="text-rose-400 mb-2" aria-hidden="true" />
                    <p className="text-[13px] text-white/90">Payment failed</p>
                    <p className="font-mono text-[10px] text-white/50 mt-1">Your bank declined this card</p>
                    <div className="mt-3 w-full rounded-md bg-white/[0.06] border border-white/10 py-2 font-mono text-[10px] text-white/40">
                      HDFC •••• 4417 · declined
                    </div>
                  </div>
                </CheckoutShell>
              )}

              {view === 'nudge' && (
                <>
                  <MsgBubble icon={MessageCircle} tone="bg-emerald-500/[0.08] border-emerald-400/20" title="WhatsApp · Aurora Fitness">
                    Hi Riya — your order is saved. Finish in one tap with UPI → <span className="text-cyan-300">rzp.io/l/aur7f3a</span>
                  </MsgBubble>
                  <p className="font-mono text-[10px] text-white/40 text-center mt-auto">delivered · 21:28</p>
                </>
              )}

              {(view === 'checkout' || view === 'abandoned') && (
                <CheckoutShell>
                  <div className="space-y-2.5">
                    <div className="rounded-md border border-cyan-400/30 bg-cyan-500/[0.08] px-3 py-2.5 flex items-center justify-between">
                      <span className="text-[12px] text-white/90">UPI · riya@okhdfc</span>
                      <span className="font-mono text-[9px] text-cyan-300">RECOMMENDED</span>
                    </div>
                    <div className="rounded-md border border-white/10 px-3 py-2.5 text-[12px] text-white/45">
                      Card •••• 4417 <span className="font-mono text-[9px] text-rose-300/80 ml-1">declined</span>
                    </div>
                    <div className="rounded-md bg-cyan-400/90 text-[#06121a] text-center py-2 text-[12px] font-medium">
                      Pay ₹2,499
                    </div>
                    {view === 'abandoned' && (
                      <div className="flex items-center gap-1.5 justify-center pt-1 text-amber-300/90 font-mono text-[10px]">
                        <Hourglass size={10} aria-hidden="true" /> session idle 120s
                      </div>
                    )}
                  </div>
                </CheckoutShell>
              )}

              {view === 'incentive-msg' && (
                <>
                  <MsgBubble icon={MessageSquareText} tone="bg-amber-500/[0.08] border-amber-400/20" title="SMS · AURFIT">
                    ₹40 cashback if you complete in 30 min → <span className="text-cyan-300">rzp.io/l/aur7f3a-c40</span>
                  </MsgBubble>
                  <p className="font-mono text-[10px] text-white/40 text-center mt-auto">delivered · 22:03</p>
                </>
              )}

              {view === 'checkout-offer' && (
                <CheckoutShell>
                  <div className="space-y-2.5">
                    <div className="rounded-md border border-amber-400/30 bg-amber-500/[0.1] px-3 py-2 text-center">
                      <span className="font-mono text-[10px] text-amber-200">₹40 CASHBACK APPLIED · 22:41 left</span>
                    </div>
                    <div className="rounded-md border border-cyan-400/30 bg-cyan-500/[0.08] px-3 py-2.5 flex items-center justify-between">
                      <span className="text-[12px] text-white/90">UPI · riya@okhdfc</span>
                      <span className="font-mono text-[9px] text-cyan-300">1-TAP</span>
                    </div>
                    <div className="rounded-md bg-cyan-400/90 text-[#06121a] text-center py-2 text-[12px] font-medium">
                      Pay ₹2,499 · get ₹40 back
                    </div>
                  </div>
                </CheckoutShell>
              )}

              {view === 'success' && (
                <CheckoutShell>
                  <div className="flex flex-col items-center text-center py-4">
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                    >
                      <CheckCircle2 size={34} className="text-emerald-400 mb-2" aria-hidden="true" />
                    </motion.div>
                    <p className="text-[13px] text-white/95">Payment successful</p>
                    <p className="font-mono text-[11px] text-emerald-300 mt-1">₹2,499.00 · UPI</p>
                    <p className="font-mono text-[9px] text-white/40 mt-2">₹40 cashback queued · 24h</p>
                  </div>
                </CheckoutShell>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Panel>
  );
};
