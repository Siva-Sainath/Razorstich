import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { X, ExternalLink, CreditCard } from 'lucide-react';
import { API } from '@/lib/timelineContext';
import { openRazorpayCheckout, RAZORPAY_TEST_CARDS } from '@/lib/razorpayCheckout';

/**
 * Pricing-page overlay — opens official Razorpay Standard Checkout (Test Mode).
 * Not a separate route.
 */
export const RazorpayPricingModal = ({ open, onClose, amountInr = 1499, wedge = 'checkout_failed' }) => {
  const [phase, setPhase] = useState('idle'); // idle | loading | ready | result | error
  const [checkout, setCheckout] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setCheckout(null);
    setResult(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return undefined;
    }

    let cancelled = false;
    setPhase('loading');
    setError(null);

    axios
      .post(`${API}/razorpay/orders`, { amount_inr: amountInr, wedge }, { timeout: 30000 })
      .then((r) => {
        if (cancelled) return;
        setCheckout(r.data);
        setPhase(r.data.mode === 'razorpay' ? 'ready' : 'unconfigured');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.detail || err.message || 'Could not reach backend');
        setPhase('error');
      });

    return () => {
      cancelled = true;
    };
  }, [open, amountInr, wedge, reset]);

  const launchCheckout = async () => {
    if (!checkout?.key_id || !checkout?.order) return;
    setPhase('loading');

    const outcome = await openRazorpayCheckout({
      keyId: checkout.key_id,
      order: checkout.order,
      amountInr,
      wedge,
      onSuccess: async (response) => {
        const { data } = await axios.post(`${API}/razorpay/verify`, {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          amount_inr: amountInr,
          wedge,
        });
        setResult(data);
        setPhase('result');
      },
      onFailure: async (response) => {
        const err = response?.error || {};
        const { data } = await axios.post(`${API}/razorpay/payment/failed`, {
          order_id: err.metadata?.order_id || checkout.order.id,
          payment_id: err.metadata?.payment_id,
          error_code: err.code,
          error_description: err.description,
          amount_inr: amountInr,
          wedge,
        });
        setResult(data);
        setPhase('result');
      },
    });

    if (outcome?.type === 'dismissed') {
      setPhase('ready');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rzp-modal-title"
      data-testid="razorpay-pricing-modal"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] border border-white/[0.12] bg-[hsl(218_62%_7%)] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <p className="type-micro text-warning/90 uppercase tracking-wider">Razorpay Test Mode</p>
            <h2 id="rzp-modal-title" className="type-section text-white/92 mt-0.5">
              Try a ₹{amountInr.toLocaleString('en-IN')} checkout
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-white/45 hover:text-white/80">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {phase === 'loading' && (
            <p className="type-body text-white/50 animate-pulse">Preparing checkout…</p>
          )}

          {phase === 'error' && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
              <p className="type-body text-white/80">{error}</p>
              <p className="type-micro text-white/45 mt-2">Start the backend: uvicorn server:app --port 8000</p>
            </div>
          )}

          {phase === 'unconfigured' && (
            <div className="space-y-4">
              <p className="type-body text-white/60">{checkout?.message}</p>
              <p className="type-meta text-white/45">
                Generate <strong className="text-white/70">Test Mode</strong> keys in Razorpay Dashboard → API Keys.
                Add to <code className="font-mono text-xs">backend/.env</code>:
              </p>
              <pre className="rounded-xl bg-black/40 border border-white/10 p-3 type-micro text-white/55 overflow-x-auto">
                {`RAZORPAY_KEY_ID=rzp_test_...\nRAZORPAY_KEY_SECRET=...`}
              </pre>
              <a
                href="https://razorpay.com/docs/payments/payment-gateway/quick-integration/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 type-micro text-primary/80 hover:text-primary"
              >
                Razorpay Quick Integration docs <ExternalLink size={12} />
              </a>
            </div>
          )}

          {(phase === 'ready' || phase === 'unconfigured') && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="type-micro text-white/40 mb-3 flex items-center gap-2">
                <CreditCard size={14} /> Official test cards (any CVV · future expiry)
              </p>
              <ul className="space-y-2">
                {RAZORPAY_TEST_CARDS.map((card) => (
                  <li key={card.number} className="type-meta text-white/55">
                    <span className="font-mono text-white/75">{card.number}</span>
                    <span className="text-white/35"> · {card.network}</span>
                    <p className="type-micro text-white/35 mt-0.5">{card.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phase === 'ready' && (
            <button type="button" onClick={launchCheckout} className="btn-primary w-full h-11 font-semibold">
              Open Razorpay Checkout
            </button>
          )}

          {phase === 'result' && result && (
            <div
              className={`rounded-xl border p-4 ${
                result.recovered ? 'border-success/30 bg-success/[0.08]' : 'border-warning/30 bg-warning/[0.06]'
              }`}
            >
              <p className="type-section text-white/90">{result.message}</p>
              {!result.recovered && result.policy?.selected_action && (
                <p className="type-meta text-white/55 mt-2">
                  Recovery agent:{' '}
                  <span className="text-primary font-mono">
                    {result.policy.selected_action.replace(/_/g, ' ')}
                  </span>
                </p>
              )}
              <Link
                to="/checkout"
                className="inline-block type-micro text-primary/80 hover:text-primary mt-4"
                onClick={onClose}
              >
                Watch full recovery replay →
              </Link>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
            <Link to="/checkout" className="btn-quiet h-9 px-4 text-xs" onClick={onClose}>
              Recovery demo
            </Link>
            <button type="button" onClick={onClose} className="btn-quiet h-9 px-4 text-xs ml-auto">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
