import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Loader2 } from 'lucide-react';
import { API } from '@/lib/timelineContext';
import { openRazorpayCheckout, RAZORPAY_TEST_CARDS } from '@/lib/razorpayCheckout';
import { attributionPayload } from '@/lib/gtm';
import { PRICING_PLANS } from '@/config/pricingPlans';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const PLAN_COPY = {
  sandbox: {
    title: 'Sandbox test checkout',
    subtitle: 'Run a full ₹1,499 Razorpay Test payment — no real money moves.',
    button: 'Pay ₹1,499 with test card',
  },
  growth: {
    title: 'Pre-book Growth',
    subtitle: '₹499 refundable deposit (Test Mode) — we hold your spot and email setup steps.',
    button: 'Pre-book with test card',
  },
};

/**
 * Inline pricing checkout — sign up + Razorpay test cards on the page (not buried in a modal).
 */
export const PricingCheckoutPanel = ({ initialPlan = 'sandbox' }) => {
  const [planId, setPlanId] = useState(initialPlan);
  const [form, setForm] = useState({ email: '', company: '', name: '' });
  const [signupStatus, setSignupStatus] = useState('idle');
  const [phase, setPhase] = useState('idle');
  const [checkout, setCheckout] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const launchedRef = useRef(false);
  const [orderKey, setOrderKey] = useState(1);
  const panelRef = useRef(null);

  const copy = PLAN_COPY[planId] || PLAN_COPY.sandbox;
  const planMeta = PRICING_PLANS.find((p) => p.id === planId);
  const displayAmount = checkout?.amount_inr ?? (planId === 'growth' ? 499 : 1499);

  const resetCheckout = useCallback(() => {
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
      .post(`${API}/razorpay/orders`, { plan_id: planId, wedge: 'checkout_failed' }, { timeout: 30000 })
      .then((r) => {
        setCheckout(r.data);
        setPhase(r.data.mode === 'razorpay' ? 'ready' : 'unconfigured');
        return r.data;
      })
      .catch((err) => {
        const raw = err.response?.data?.detail || err.message || 'Could not reach backend';
        const message =
          typeof raw === 'string' && raw.includes('Unknown plan_id')
            ? `${raw} — restart the backend (uvicorn) so it loads the latest plan prices.`
            : raw;
        setError(message);
        setPhase('error');
        throw err;
      });
  }, [planId]);

  useEffect(() => {
    setPlanId(initialPlan);
  }, [initialPlan]);

  useEffect(() => {
    resetCheckout();
    setOrderKey((k) => k + 1);
  }, [planId, resetCheckout]);

  useEffect(() => {
    if (orderKey === 0) return undefined;
    let cancelled = false;
    createOrder().catch(() => {
      if (!cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [orderKey, createOrder]);

  const saveSignup = async () => {
    if (!form.email.trim() || !form.company.trim()) {
      setError('Enter work email and company before paying.');
      return false;
    }
    setSignupStatus('loading');
    try {
      await axios.post(`${API}/leads`, {
        email: form.email.trim(),
        company: form.company.trim(),
        note: form.name.trim() ? `Contact: ${form.name.trim()}` : '',
        plan: planId,
        uses_razorpay: true,
        volume: '50k-5L',
        ...attributionPayload(),
        page: '/pricing',
      });
      setSignupStatus('saved');
      return true;
    } catch (err) {
      setSignupStatus('error');
      setError(err.response?.data?.detail || err.message || 'Could not save signup');
      return false;
    }
  };

  const launchCheckout = async () => {
    if (!checkout?.key_id || !checkout?.order || launchedRef.current) return;

    const ok = await saveSignup();
    if (!ok) return;

    launchedRef.current = true;
    setPhase('checkout');
    setError(null);

    axios.post(`${API}/razorpay/checkout/opened`, { order_id: checkout.order.id }).catch(() => {});

    try {
      const outcome = await openRazorpayCheckout({
        keyId: checkout.key_id,
        order: checkout.order,
        prefill: {
          name: form.name.trim() || form.company.trim(),
          email: form.email.trim(),
        },
        description: planId === 'growth' ? 'Growth pre-book · Test Mode' : 'Sandbox · Test Mode',
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
  };

  return (
    <section
      id="pricing-checkout"
      ref={panelRef}
      className="mb-14 rounded-[24px] border border-primary/25 bg-primary/[0.04] overflow-hidden"
      data-testid="pricing-checkout-panel"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/[0.08]">
          <p className="type-micro text-warning/90 uppercase tracking-wider">Razorpay Test Mode</p>
          <h2 className="font-display text-2xl font-semibold text-white/92 mt-2">{copy.title}</h2>
          <p className="type-body text-white/55 mt-2 leading-relaxed">{copy.subtitle}</p>

          <div className="flex flex-wrap gap-2 mt-5">
            {['sandbox', 'growth'].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPlanId(id)}
                className={`rounded-full px-4 py-1.5 type-micro font-medium border transition-colors ${
                  planId === id
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-white/10 text-white/50 hover:border-white/25'
                }`}
              >
                {id === 'sandbox' ? 'Sandbox · ₹1,499' : 'Pre-book Growth · ₹499'}
              </button>
            ))}
          </div>

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              launchCheckout();
            }}
          >
            <label className="block">
              <span className="type-micro text-white/45 mb-1 block">Work email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 px-3 type-body text-white/90 placeholder:text-white/30 focus:border-primary/50 outline-none"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="type-micro text-white/45 mb-1 block">Company</span>
                <input
                  required
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Acme D2C"
                  className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 px-3 type-body text-white/90 placeholder:text-white/30 focus:border-primary/50 outline-none"
                />
              </label>
              <label className="block">
                <span className="type-micro text-white/45 mb-1 block">Your name (optional)</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Priya"
                  className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 px-3 type-body text-white/90 placeholder:text-white/30 focus:border-primary/50 outline-none"
                />
              </label>
            </div>

            {phase === 'ready' && (
              <button type="submit" className="btn-primary w-full h-11 font-semibold mt-2">
                {copy.button}
              </button>
            )}
            {(phase === 'loading' || phase === 'checkout') && (
              <div className="flex items-center justify-center gap-2 py-3 type-body text-white/60">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                {phase === 'loading' ? 'Creating order…' : 'Complete payment in Razorpay…'}
              </div>
            )}
            {phase === 'cancelled' && (
              <button type="button" onClick={launchCheckout} className="btn-primary w-full h-11 font-semibold mt-2">
                Try payment again
              </button>
            )}
            {phase === 'error' && (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 mt-2 space-y-2">
                <p className="type-meta text-white/75">{error}</p>
                <p className="type-micro text-white/45">
                  Backend: <code className="font-mono">{BACKEND_URL}</code>
                </p>
                <button type="button" onClick={() => setOrderKey((k) => k + 1)} className="btn-quiet h-9 px-4 text-xs">
                  Retry
                </button>
              </div>
            )}
            {phase === 'unconfigured' && (
              <div className="rounded-xl border border-white/15 bg-white/[0.03] p-3 mt-2 space-y-2">
                <p className="type-meta text-white/70">
                  {checkout?.message || 'Razorpay Test Mode keys are not set on the backend.'}
                </p>
                <p className="type-micro text-white/45 font-mono">
                  Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env (rzp_test_*), then restart uvicorn.
                </p>
              </div>
            )}
            {phase === 'result' && result && (
              <div
                className={`rounded-xl border p-4 mt-2 ${
                  result.recovered
                    ? 'border-success/30 bg-success/[0.08]'
                    : 'border-warning/30 bg-warning/[0.06]'
                }`}
              >
                <p className="type-section text-white/90">{result.message}</p>
                <Link to="/checkout" className="inline-block type-micro text-primary/80 hover:text-primary mt-3">
                  Watch recovery demo →
                </Link>
              </div>
            )}
            {signupStatus === 'saved' && phase === 'ready' && (
              <p className="type-micro text-success/80 text-center">Signup saved — open Razorpay when ready.</p>
            )}
          </form>
        </div>

        <div className="p-6 sm:p-8 bg-black/20">
          <p className="type-micro text-white/40 mb-3 flex items-center gap-2">
            <CreditCard size={14} /> Use these Razorpay test cards
          </p>
          <ul className="space-y-3">
            {RAZORPAY_TEST_CARDS.map((card) => (
              <li
                key={card.number}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
              >
                <p className="font-mono type-body text-white/85 tracking-wide">{card.number}</p>
                <p className="type-micro text-white/45 mt-1">
                  {card.network} · {card.region}
                </p>
                <p className="type-micro text-white/35 mt-0.5">{card.note}</p>
              </li>
            ))}
          </ul>
          <p className="type-micro text-white/35 mt-4 leading-relaxed">
            Any CVV · any future expiry · Test Mode only. Amount shown:{' '}
            <span className="font-mono text-white/55">₹{displayAmount.toLocaleString('en-IN')}</span>
            {planMeta?.name ? ` (${planMeta.name})` : ''}.
          </p>
        </div>
      </div>
    </section>
  );
};
