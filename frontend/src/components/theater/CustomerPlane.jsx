import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle2, XCircle, MessageCircle, MessageSquareText, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTimeline } from '@/lib/timelineContext';
import { Panel } from './Panel';

const viewAt = (t) => {
  if (t < 0.167) return 'failed';
  if (t < 0.25) return 'nudge';
  if (t < 0.417) return 'checkout';
  if (t < 0.583) return 'abandoned';
  if (t < 0.694) return 'incentive-msg';
  if (t < 0.833) return 'checkout-offer';
  return 'success';
};

const VIEW_LABEL = {
  failed: { text: 'Payment failed', dot: 'bg-destructive/80' },
  nudge: { text: 'WhatsApp sent', dot: 'bg-primary/80' },
  checkout: { text: 'Customer viewing', dot: 'bg-[rgba(45,212,191,0.85)]' },
  abandoned: { text: 'Customer idle', dot: 'bg-warning/80' },
  'incentive-msg': { text: 'Offer sent', dot: 'bg-primary/80' },
  'checkout-offer': { text: 'Offer active', dot: 'bg-warning/80' },
  success: { text: 'Paid', dot: 'bg-[rgba(45,212,191,0.85)]' },
};

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const CheckoutShell = ({ children }) => (
  <div className="rounded-lg bg-background border border-border/80 overflow-hidden">
    <div className="px-3.5 py-2.5 border-b border-border/70 flex items-center justify-between">
      <span className="text-[10px] font-medium text-muted-foreground">Aurora Fitness</span>
      <span className="font-mono text-[11px] text-foreground tabular-nums">₹2,499</span>
    </div>
    <div className="p-3.5">{children}</div>
  </div>
);

const MsgBubble = ({ icon: Icon, tone, title, children }) => (
  <div className={`rounded-xl rounded-tl-sm border p-3 ${tone}`}>
    <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-80 mb-1.5">
      <Icon size={11} aria-hidden="true" /> {title}
    </div>
    <p className="text-[12px] leading-relaxed text-foreground/90">{children}</p>
  </div>
);

export const CustomerPlane = ({ className }) => {
  const { t } = useTimeline();
  const view = viewAt(t);
  const label = VIEW_LABEL[view];

  return (
    <Panel
      title="Customer checkout preview"
      subtitle="What Riya sees right now"
      icon={Smartphone}
      testId="customer-plane"
      className={className}
      right={
        <span data-testid="customer-plane-state" className="inline-flex items-center gap-2 text-[12px] leading-4 text-white/70 shrink-0">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${label.dot}`} aria-hidden="true" />
          {label.text}
        </span>
      }
    >
      <div
        data-testid="checkout-preview"
        className="mx-auto w-full max-w-[250px] rounded-[24px] border border-white/10 bg-white/[0.03] p-2.5"
      >
        <div className="rounded-[16px] bg-[hsl(218_62%_5%)] border border-white/[0.06] p-3 min-h-[290px] flex flex-col">
          <div className="flex justify-center mb-3" aria-hidden="true">
            <div className="w-14 h-1 rounded-full bg-muted" />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={view} {...fade} className="flex-1 flex flex-col gap-3" data-testid="intervention-asset">
              {view === 'failed' && (
                <CheckoutShell>
                  <div className="flex flex-col items-center text-center py-3">
                    <XCircle size={30} className="text-destructive mb-2" aria-hidden="true" />
                    <p className="text-[13px] text-foreground">Payment failed</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Your bank declined this card</p>
                    <div className="mt-3 w-full rounded-md bg-secondary/60 border border-border/70 py-2 font-mono text-[10px] text-muted-foreground/80">
                      HDFC •••• 4417 · declined
                    </div>
                  </div>
                </CheckoutShell>
              )}

              {view === 'nudge' && (
                <>
                  <MsgBubble icon={MessageCircle} tone="bg-success/[0.08] border-success/25" title="WhatsApp · Aurora Fitness">
                    Hi Riya — your order is saved. Finish in one tap with UPI → <span className="text-primary">rzp.io/l/aur7f3a</span>
                  </MsgBubble>
                  <p className="text-[10px] text-muted-foreground/70 text-center mt-auto">Delivered · T+12h</p>
                </>
              )}

              {(view === 'checkout' || view === 'abandoned') && (
                <CheckoutShell>
                  <div className="space-y-2.5">
                    <div className="rounded-md border border-primary/35 bg-primary/[0.08] px-3 py-2.5 flex items-center justify-between">
                      <span className="text-[12px] text-foreground">UPI · riya@okhdfc</span>
                      <span className="text-[9px] font-semibold text-primary">Recommended</span>
                    </div>
                    <div className="rounded-md border border-border/70 px-3 py-2.5 text-[12px] text-muted-foreground/70">
                      Card •••• 4417 <span className="text-[9px] text-destructive/80 ml-1">declined</span>
                    </div>
                    <div className="rounded-md bg-primary text-primary-foreground text-center py-2 text-[12px] font-semibold">
                      Pay ₹2,499
                    </div>
                    {view === 'abandoned' && (
                      <div className="flex items-center gap-1.5 justify-center pt-1 text-warning text-[10px] font-medium">
                        <Hourglass size={10} aria-hidden="true" /> Idle for 2 minutes
                      </div>
                    )}
                  </div>
                </CheckoutShell>
              )}

              {view === 'incentive-msg' && (
                <>
                  <MsgBubble icon={MessageSquareText} tone="bg-warning/[0.08] border-warning/25" title="SMS · AURFIT">
                    ₹40 cashback if you complete in 30 min → <span className="text-primary">rzp.io/l/aur7f3a-c40</span>
                  </MsgBubble>
                  <p className="text-[10px] text-muted-foreground/70 text-center mt-auto">Delivered · T+42h</p>
                </>
              )}

              {view === 'checkout-offer' && (
                <CheckoutShell>
                  <div className="space-y-2.5">
                    <div className="rounded-md border border-warning/35 bg-warning/[0.1] px-3 py-2 text-center">
                      <span className="text-[10px] font-semibold text-warning">₹40 cashback applied · 22:41 left</span>
                    </div>
                    <div className="rounded-md border border-primary/35 bg-primary/[0.08] px-3 py-2.5 flex items-center justify-between">
                      <span className="text-[12px] text-foreground">UPI · riya@okhdfc</span>
                      <span className="text-[9px] font-semibold text-primary">1-tap</span>
                    </div>
                    <div className="rounded-md bg-primary text-primary-foreground text-center py-2 text-[12px] font-semibold">
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
                      <CheckCircle2 size={34} className="text-success mb-2" aria-hidden="true" />
                    </motion.div>
                    <p className="text-[13px] text-foreground">Payment successful</p>
                    <p className="font-mono text-[11px] text-success mt-1 tabular-nums">₹2,499.00 · UPI</p>
                    <p className="text-[9px] text-muted-foreground/70 mt-2">₹40 cashback queued · 24h</p>
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
