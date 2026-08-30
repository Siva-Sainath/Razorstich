import React, { useState } from 'react';
import axios from 'axios';
import { API } from '@/lib/timelineContext';
import { attributionPayload } from '@/lib/gtm';
import { ShareDemoPanel } from './ShareDemoPanel';

const VOLUME_OPTIONS = [
  { value: '<50k', label: '< ₹50k / mo failed' },
  { value: '50k-5L', label: '₹50k – ₹5L / mo' },
  { value: '5L-50L', label: '₹5L – ₹50L / mo' },
  { value: '50L+', label: '₹50L+ / mo' },
];

/**
 * Primary GTM conversion form — pilot waitlist + Razorpay merchants.
 */
export const LeadCaptureForm = ({
  variant = 'default',
  plan = 'pilot',
  headline = 'Get early access',
  subhead = 'We onboard Razorpay merchants in weekly pilot batches. Tell us your failed-payment volume.',
  showShareOnSuccess = true,
  compact = false,
}) => {
  const [form, setForm] = useState({
    email: '',
    company: '',
    volume: '50k-5L',
    uses_razorpay: true,
    note: '',
  });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    try {
      await axios.post(`${API}/leads`, {
        ...form,
        plan,
        ...attributionPayload(),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.detail || err.message || 'Could not submit');
    }
  };

  const fieldClass = 'w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 px-3 type-body text-white/90 placeholder:text-white/30 focus:border-primary/50 outline-none';

  if (status === 'success') {
    return (
      <div
        className={`rounded-[20px] border p-6 sm:p-8 ${
          'border-success/30 bg-success/[0.06]'
        }`}
        data-testid="lead-success"
      >
        <p className="font-display text-xl font-semibold text-white/92">
          You&apos;re on the pilot list.
        </p>
        <p className="type-body mt-2 leading-relaxed">
          We&apos;ll email you within 48h with Test Mode setup steps. Meanwhile, run the demo and share it —
          referrals move you up the queue.
        </p>
        {showShareOnSuccess && (
          <div className="mt-6">
            <ShareDemoPanel />
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-[20px] border p-5 sm:p-6 border-white/[0.1] bg-black/30 ${
        variant === 'hero' ? 'backdrop-blur-xl' : ''
      }`}
      data-testid="lead-capture-form"
    >
      {!compact && (
        <>
          <p className="font-mono type-micro tracking-[0.1em] uppercase text-accent">
            {plan} waitlist
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold mt-2 text-white/92">
            {headline}
          </h2>
          <p className="type-meta mt-2 mb-5 leading-relaxed">{subhead}</p>
        </>
      )}

      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <label className="block sm:col-span-2">
          <span className="type-micro mb-1 block">Work email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@company.com"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="type-micro mb-1 block">Company</span>
          <input
            required
            type="text"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            placeholder="Acme D2C"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="type-micro mb-1 block">Failed payment volume</span>
          <select
            value={form.volume}
            onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
            className={fieldClass}
          >
            {VOLUME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0a1218]">
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 sm:col-span-2 type-meta">
          <input
            type="checkbox"
            checked={form.uses_razorpay}
            onChange={(e) => setForm((f) => ({ ...f, uses_razorpay: e.target.checked }))}
            className="rounded border-white/20"
          />
          We use Razorpay (or plan to)
        </label>
        {!compact && (
          <label className="block sm:col-span-2">
            <span className="type-micro mb-1 block">Anything else? (optional)</span>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              placeholder="Biggest recovery pain today…"
              className={`${fieldClass} py-2 resize-none h-auto`}
            />
          </label>
        )}
      </div>

      {error && <p className="type-micro text-warning mt-3">{error}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full sm:w-auto mt-5 inline-flex items-center justify-center px-8 disabled:opacity-60"
      >
        {status === 'loading' ? 'Submitting…' : 'Request pilot access'}
      </button>
      <p className="type-micro mt-3 text-white/30">
        No spam · 2.5% only on recovered revenue when you go live
      </p>
    </form>
  );
};
