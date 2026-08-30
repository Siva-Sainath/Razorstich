import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { X, ExternalLink, CreditCard, Loader2 } from 'lucide-react';
import { API } from '@/lib/timelineContext';
import { openRazorpayCheckout, RAZORPAY_TEST_CARDS } from '@/lib/razorpayCheckout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

/**
 * Pricing-page overlay — official Razorpay Standard Checkout (Test Mode).
 * Checkout opens on explicit user click (avoids browser popup-blocker).
 */
export const RazorpayPricingModal = ({ open, onClose, planId = 'sandbox', wedge = 'checkout_failed' }) => {
  const [phase, setPhase] = useState('idle');
  const [checkout, setCheckout] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const launchedRef = useRef(false);
  const [orderKey, setOrderKey] = useState(0);

  const reset = useCallback(() => {
    setPhase('idle');
    setCheckout(null);
    setResult(null);
    setError(null);
    launchedRef.current = false;
  }, []);

  const createOrder = useCallback(() => {
    setPhase('loading');
    setError(null);
    setResult(null);
    launchedRef.current = false;

    return axios
      .post(`${API}/razorpay/orders`, { plan_id: planId, wedge }, { timeout: 30000 })
      .then((r) => {
        setCheckout(r.data);
        setPhase(r.data.mode === 'razorpay' ? 'ready' : 'unconfigured');
        return r.data;
      })
      .catch((err) => {
        const message =
          err.response?.data?.detail || err.message || 'Could not reach backend';
        setError(message);
        setPhase('error');
        throw err;
      });
  }, [planId, wedge]);

  const launchCheckout = useCallback(async () => {
    if (!checkout?.key_id || !checkout?.order || launchedRef.current) return;
    launchedRef.current = true;
    setPhase('checkout');
    setError(null);

    axios.post(`${API}/razorpay/checkout/opened`, { order_id: checkout.order.id }).catch(() => {});

    try {
      const outcome = await openRazorpayCheckout({
        keyId: checkout.key_id,
        order: checkout.order,
        wedge,
        onSuccess: async (response) => {
          const { data } = await axios.post(`${API}/razorpay/verify`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
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
          });
          setResult(data);
          setPhase('result');
        },
      });

      if (outcome?.type === 'dismissed') {
        launchedRef.current = false;
        const { data } = await axios.post(`${API}/razorpay/checkout/cancelled`, {
          order_id: checkout.order.id,
        });
        setResult(data);
        setPhase('cancelled');
      }
    } catch (err) {
      launchedRef.current = false;
      setError(err.message || 'Could not open Razorpay checkout');
      setPhase('ready');
    }
  }, [checkout, wedge]);

  useEffect(() => {
    if (!open) {
      reset();
      return undefined;
    }

    let cancelled = false;
    createOrder().catch(() => {
      if (!cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [open, orderKey, createOrder, reset]);

  const displayAmount = checkout?.amount_inr ?? 1499;

  const handleRetry = () => {
    setOrderKey((k) => k + 1);
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

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] border border-white/[0.12] bg-[hsl(218_62%_7%)] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <p className="type-micro text-warning/90 uppercase tracking-wider">Razorpay Test Mode</p>
            <h2 id="rzp-modal-title" className="type-section text-white/92 mt-0.5">
              ₹{displayAmount.toLocaleString('en-IN')} checkout
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-white/45 hover:text-white/80">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="type-body text-white/70">Creating order…</p>
            </div>
          )}

          {phase === 'checkout' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="type-body text-white/70">Complete payment in Razorpay…</p>
              <p className="type-micro text-white/40 max-w-xs">
                Use test card <span className="font-mono text-white/60">4239 5360 0631 5640</span> · any CVV · future expiry
              </p>
            </div>
          )}

          {phase === 'error' && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 space-y-3">
              <p className="type-body text-white/80">{error}</p>
              <p className="type-micro text-white/45">
                Backend: <code className="font-mono">{BACKEND_URL}</code>
              </p>
              <p className="type-micro text-white/45">
                Local: <code className="font-mono">cd backend && uvicorn server:app --port 8000</code>
              </p>
              <button type="button" onClick={handleRetry} className="btn-quiet h-9 px-4 text-xs">
                Retry
              </button>
            </div>
          )}

          {phase === 'unconfigured' && (
            <div className="space-y-3">
              <p className="type-body text-white/60">{checkout?.message}</p>
              <p className="type-micro text-white/45">
                Add <code className="font-mono">RAZORPAY_KEY_ID</code> and{' '}
                <code className="font-mono">RAZORPAY_KEY_SECRET</code> (Test Mode) to backend <code className="font-mono">.env</code>.
              </p>
              <a
                href="https://razorpay.com/docs/payments/payment-gateway/quick-integration/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 type-micro text-primary/80 hover:text-primary"
              >
                Razorpay integration docs <ExternalLink size={12} />
              </a>
            </div>
          )}

          {(phase === 'ready' || phase === 'cancelled' || phase === 'unconfigured') && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="type-micro text-white/40 mb-2 flex items-center gap-2">
                <CreditCard size={14} /> Official test cards
              </p>
              <ul className="space-y-1.5">
                {RAZORPAY_TEST_CARDS.map((card) => (
                  <li key={card.number} className="type-micro text-white/50">
                    <span className="font-mono text-white/70">{card.number}</span>
                    <span className="text-white/35"> · {card.network}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phase === 'ready' && (
            <>
              <p className="type-micro text-white/45 text-center">
                Click below to open Razorpay — required for browser security.
              </p>
              <button type="button" onClick={launchCheckout} className="btn-primary w-full h-11 font-semibold">
                Open Razorpay Checkout
              </button>
            </>
          )}

          {phase === 'cancelled' && result && (
            <div className="rounded-xl border border-white/[0.12] bg-white/[0.03] p-4 space-y-3">
              <p className="type-section text-white/90">{result.message}</p>
              <button type="button" onClick={launchCheckout} className="btn-primary w-full h-10 text-sm">
                Try again
              </button>
            </div>
          )}

          {phase === 'result' && result && (
            <div
              className={`rounded-xl border p-4 ${
                result.recovered
                  ? 'border-success/30 bg-success/[0.08]'
                  : 'border-warning/30 bg-warning/[0.06]'
              }`}
            >
              <p className="type-section text-white/90">{result.message}</p>
              {result.duplicate && (
                <p className="type-micro text-white/45 mt-1">This payment was already recorded.</p>
              )}
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

          <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
            {(phase === 'ready' || phase === 'cancelled') && (
              <button type="button" onClick={handleRetry} className="btn-quiet h-9 px-4 text-xs">
                New order
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-quiet h-9 px-4 text-xs ml-auto">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
