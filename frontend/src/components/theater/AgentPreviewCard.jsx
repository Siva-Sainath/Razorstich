import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ShoppingCart, CreditCard, FileText, XCircle } from 'lucide-react';

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

const Phone = ({ children, active = false }) => (
  <div className={`mx-auto w-full max-w-[248px] rounded-[24px] border p-2.5 transition-colors duration-200 ${
    active ? 'border-primary/35 bg-primary/[0.06]' : 'border-white/12 bg-white/[0.04]'
  }`}>
    <div className="rounded-[16px] bg-background border border-white/[0.08] min-h-[268px] p-3.5 flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="w-14 h-1 rounded-full bg-white/15 mx-auto mb-3" aria-hidden="true" />
      {children}
    </div>
  </div>
);

const phase = (t, stops) => {
  let current = stops[0].key;
  for (const stop of stops) {
    if (t >= stop.at) current = stop.key;
  }
  return current;
};

const CheckoutPreview = ({ t, caseData, active }) => {
  const c = caseData?.case;
  const amount = c ? `₹${Number(c.amount).toLocaleString('en-IN')}` : '₹4,999';
  const view = phase(t, [
    { at: 0, key: 'fail' },
    { at: 0.2, key: 'msg' },
    { at: 0.45, key: 'pay' },
    { at: 0.85, key: 'ok' },
  ]);
  return (
    <Phone active={active}>
      <AnimatePresence mode="wait">
        <motion.div key={view} {...fade} className="flex-1 flex flex-col justify-center text-center">
          {view === 'fail' && (
            <>
              <XCircle size={36} className="text-destructive mx-auto mb-2" />
              <p className="type-body text-white/90">Payment failed</p>
              <p className="type-meta text-white/50 mt-1">{c?.declineReason || 'Insufficient funds'}</p>
            </>
          )}
          {view === 'msg' && (
            <div className="rounded-[12px] bg-success/10 border border-success/25 p-3 text-left">
              <p className="type-meta text-white/80">WhatsApp · Pay link sent</p>
              <p className="type-body text-white/90 mt-2">Complete {amount} in one tap</p>
            </div>
          )}
          {view === 'pay' && (
            <div className="space-y-2 text-left">
              <div className="rounded-[12px] border border-primary/30 bg-primary/10 px-3 py-2 type-body">UPI · preselected</div>
              <div className="rounded-[12px] bg-primary text-primary-foreground py-2.5 type-body font-semibold text-center">Pay {amount}</div>
            </div>
          )}
          {view === 'ok' && (
            <>
              <CheckCircle2 size={36} className="text-success mx-auto mb-2" />
              <p className="type-body text-white/90">Payment successful</p>
              <p className="font-mono type-body text-success mt-1">{amount}</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Phone>
  );
};

const CartPreview = ({ t, active }) => {
  const view = phase(t, [
    { at: 0, key: 'cart' },
    { at: 0.35, key: 'idle' },
    { at: 0.55, key: 'nudge' },
    { at: 0.82, key: 'ok' },
  ]);
  return (
    <Phone active={active}>
      <AnimatePresence mode="wait">
        <motion.div key={view} {...fade} className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/70">
            <ShoppingCart size={18} />
            <span className="type-body font-medium">Your cart</span>
          </div>
          {view === 'cart' && <p className="type-body text-white/60">2 items · ₹999 · shipping selected</p>}
          {view === 'idle' && <p className="type-body text-warning/90">Payment page idle · 4h</p>}
          {view === 'nudge' && (
            <div className="rounded-[12px] bg-primary/10 border border-primary/25 p-3 type-body text-white/85">
              Still want these items? Checkout closes in 44h.
            </div>
          )}
          {view === 'ok' && (
            <div className="text-center mt-auto">
              <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
              <p className="type-body">Order placed</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Phone>
  );
};

const SubscriptionPreview = ({ t, active }) => {
  const view = phase(t, [
    { at: 0, key: 'fail' },
    { at: 0.3, key: 'email' },
    { at: 0.6, key: 'update' },
    { at: 0.88, key: 'ok' },
  ]);
  return (
    <Phone active={active}>
      <AnimatePresence mode="wait">
        <motion.div key={view} {...fade} className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/70">
            <CreditCard size={18} />
            <span className="type-body font-medium">Pro plan renewal</span>
          </div>
          {view === 'fail' && <p className="type-body text-destructive/90">Card expired · ₹499/mo</p>}
          {view === 'email' && <p className="type-body text-white/70">Email reminder with update link</p>}
          {view === 'update' && (
            <div className="rounded-[12px] border border-white/15 px-3 py-2 type-body">New card ending 8821</div>
          )}
          {view === 'ok' && (
            <div className="text-center mt-auto">
              <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
              <p className="type-body">Renewal captured</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Phone>
  );
};

const InvoicePreview = ({ t, active }) => {
  const view = phase(t, [
    { at: 0, key: 'due' },
    { at: 0.35, key: 'reminder' },
    { at: 0.65, key: 'link' },
    { at: 0.9, key: 'ok' },
  ]);
  return (
    <Phone active={active}>
      <AnimatePresence mode="wait">
        <motion.div key={view} {...fade} className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/70">
            <FileText size={18} />
            <span className="type-body font-medium">Invoice #INV-4412</span>
          </div>
          {view === 'due' && <p className="type-body text-warning/90">₹12,500 overdue · 7 days</p>}
          {view === 'reminder' && <p className="type-body text-white/70">Accounts payable reminder sent</p>}
          {view === 'link' && (
            <div className="rounded-[12px] bg-white/[0.05] border border-white/10 p-3 type-body">
              Pay invoice · net-15 terms
            </div>
          )}
          {view === 'ok' && (
            <div className="text-center mt-auto">
              <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
              <p className="type-body">Invoice settled</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Phone>
  );
};

export const AgentPreviewCard = ({ wedge, t, caseData, compact = false }) => {
  const active = Boolean(caseData);
  return (
    <>
      {wedge === 'checkout_failed' && <CheckoutPreview t={t} caseData={caseData} active={active} />}
      {wedge === 'cart_abandon' && <CartPreview t={t} active={active} />}
      {wedge === 'subscription_failed' && <SubscriptionPreview t={t} active={active} />}
      {wedge === 'invoice_overdue' && <InvoicePreview t={t} active={active} />}
    </>
  );
};
