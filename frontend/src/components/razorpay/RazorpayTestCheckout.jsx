import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { CreditCard, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { API } from '@/lib/timelineContext';
import { WEDGE_LANES } from '@/config/wedges';

const DEMO_AMOUNTS = [499, 1499, 4999];

/**
 * Razorpay Test Mode checkout UI — uses official test cards via backend simulator.
 * No live payment gateway or compliance required.
 */
export const RazorpayTestCheckout = ({ defaultAmount = 1499, defaultWedge = 'checkout_failed', compact = false }) => {
  const [cards, setCards] = useState([]);
  const [amount, setAmount] = useState(defaultAmount);
  const [wedge, setWedge] = useState(defaultWedge);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardInput, setCardInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/razorpay/test/cards`, { timeout: 15000 })
      .then((r) => {
        setCards(r.data.cards || []);
        if (r.data.cards?.[0]) {
          setSelectedCard(r.data.cards[0].id);
          setCardInput(r.data.cards[0].display?.replace(/\s/g, '') || '');
        }
      })
      .catch(() => setError('Backend offline — start uvicorn in backend/'));
  }, []);

  const pickCard = useCallback(
    (card) => {
      setSelectedCard(card.id);
      setCardInput(card.display.replace(/\s/g, ''));
      setResult(null);
      setError(null);
    },
    []
  );

  const pay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await axios.post(
        `${API}/razorpay/test/pay`,
        {
          card_number: cardInput.replace(/\s/g, ''),
          amount_inr: Number(amount),
          wedge,
          method: 'card',
        },
        { timeout: 30000 }
      );
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoPath = WEDGE_LANES.find((l) => l.wedge === wedge)?.path || '/checkout';

  return (
    <div
      className={`rounded-[24px] border border-white/[0.1] overflow-hidden ${
        compact ? 'surface-1' : 'bg-[#0a1218]/90 shadow-2xl'
      }`}
      data-testid="razorpay-test-checkout"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-white/90">Razorpay</span>
          <span className="type-micro px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
            Test Mode
          </span>
        </div>
        <Shield className="w-4 h-4 text-white/35" aria-hidden />
      </div>

      <form onSubmit={pay} className="p-5 sm:p-6 space-y-5">
        <p className="type-meta text-white/45">
          Official Razorpay test cards — no live PG keys. Failures trigger the recovery agent.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="type-micro text-white/40 mb-1 block">Amount (INR)</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 px-3 font-mono text-white/90"
            />
            <div className="flex gap-2 mt-2">
              {DEMO_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className="type-micro px-2 py-1 rounded-lg border border-white/10 text-white/50 hover:border-primary/40"
                >
                  ₹{a.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className="type-micro text-white/40 mb-1 block">Recovery wedge</span>
            <select
              value={wedge}
              onChange={(e) => setWedge(e.target.value)}
              className="w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 px-3 type-body text-white/90"
            >
              {WEDGE_LANES.map((l) => (
                <option key={l.wedge} value={l.wedge} className="bg-[#0a1218]">
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span className="type-micro text-white/40 mb-2 block">Test card</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => pickCard(card)}
                className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                  selectedCard === card.id
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <p className="type-meta text-white/75">{card.label}</p>
                <p className="type-micro font-mono text-white/40 mt-0.5">{card.display}</p>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="type-micro text-white/40 mb-1 block">Card number</span>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              required
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              placeholder="4111 1111 1111 1111"
              className="w-full h-11 rounded-xl bg-white/[0.05] border border-white/10 pl-10 pr-3 font-mono text-white/90 tracking-wider"
            />
          </div>
          <p className="type-micro text-white/30 mt-1">CVV & expiry: any valid future values (Test Mode)</p>
        </label>

        {error && <p className="type-meta text-warning/90">{error}</p>}

        {result && (
          <div
            className={`rounded-xl border p-4 ${
              result.recovered
                ? 'border-success/30 bg-success/[0.08]'
                : 'border-warning/30 bg-warning/[0.06]'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.recovered ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-warning shrink-0" />
              )}
              <div className="min-w-0">
                <p className="type-section text-white/90">{result.message}</p>
                {!result.recovered && result.policy?.selected_action && (
                  <p className="type-meta text-white/55 mt-2">
                    Agent recommends:{' '}
                    <span className="text-primary font-mono">
                      {result.policy.selected_action.replace(/_/g, ' ')}
                    </span>
                  </p>
                )}
                <p className="type-micro font-mono text-white/35 mt-2 truncate">
                  {result.order_id} · {result.payment_id}
                </p>
                <Link
                  to={demoPath}
                  className="inline-block type-micro text-primary/80 hover:text-primary mt-3"
                >
                  Watch full recovery replay in demo →
                </Link>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-11 font-semibold disabled:opacity-60"
        >
          {loading ? 'Processing…' : `Pay ₹${Number(amount).toLocaleString('en-IN')} (Test Mode)`}
        </button>
      </form>
    </div>
  );
};
