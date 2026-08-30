"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const LANES = [
  { id: "checkout_failed", label: "Failed checkout", detail: "UPI timeout • ₹1,499", caseId: "RS-CHK-UPI-2048", reason: "upi_timeout", amount: 1499, method: "upi", hours: 0 },
  { id: "cart_abandon", label: "Abandoned cart", detail: "20 min idle • ₹2,499", caseId: "RS-CART-2048", reason: "payment_page", amount: 2499, method: "card", hours: 0.33 },
  { id: "subscription_failed", label: "Subscription failed", detail: "Card expired • ₹899 MRR", caseId: "RS-SUB-2048", reason: "card_expired", amount: 899, method: "card", hours: 0 },
  { id: "invoice_overdue", label: "Overdue invoice", detail: "7 days late • ₹12,500", caseId: "RS-INV-2048", reason: "smb", amount: 12500, method: "card", hours: 168 },
] as const;

type Lane = (typeof LANES)[number];
type Decision = {
  selected_action: string;
  baseline_value: number;
  q_values: Record<string, number>;
  action_mask: boolean[];
  policy_version: string;
  wedge: string;
};

export default function Home() {
  const [laneId, setLaneId] = useState<Lane["id"]>("checkout_failed");
  const [hours, setHours] = useState(0);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [executed, setExecuted] = useState(false);
  const lane = LANES.find((item) => item.id === laneId)!;

  const think = useCallback(async (nextHours = hours) => {
    setLoading(true);
    setExecuted(false);
    const body: Record<string, unknown> = {
      wedge: lane.id,
      failure_reason: lane.reason,
      hours_since_failure: nextHours,
      amount_inr: lane.amount,
      method: lane.method,
    };
    if (lane.id === "cart_abandon") body.abandon_stage = "payment_page";
    if (lane.id === "subscription_failed") body.failed_attempts = 1;
    if (lane.id === "invoice_overdue") body.customer_tier = "smb";

    const response = await fetch("/api/policy/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) setDecision(await response.json());
    setLoading(false);
  }, [hours, lane]);

  useEffect(() => {
    setHours(lane.hours);
    void think(lane.hours);
  }, [laneId]);

  const ranked = useMemo(
    () => (decision ? Object.entries(decision.q_values).sort((a, b) => b[1] - a[1]) : []),
    [decision]
  );
  const maxQ = Math.max(...ranked.map(([, value]) => Math.abs(value)), 1);
  const step = lane.id === "cart_abandon" ? 2 : lane.id === "invoice_overdue" ? 24 : 6;

  async function seedDemo() {
    await fetch(`/api/demo/seed/${lane.id}`, { method: "POST" });
    await think(hours);
  }

  async function executeAction() {
    if (!decision) return;
    const action = decision.selected_action;
    const mapped =
      action === "create_payment_link" ? "create_payment_link" :
      action === "offer_partial" ? "offer_partial" :
      action === "request_method_update" ? "request_method_update" :
      action === "notify_customer" ? "notify_customer" : "create_payment_link";
    await fetch("/api/recovery/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_id: lane.caseId,
        wedge: lane.id,
        action: mapped,
        amount_paise: Math.round(lane.amount * 100),
      }),
    });
    setExecuted(true);
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>RAZORSTITCH / RECOVERY CONTROL</div>
          <h1 style={styles.title}>Operating Theater</h1>
        </div>
        <div style={styles.live}>
          <span style={styles.dot} /> LIVE POLICY ENGINE
          <span style={styles.version}>{decision?.policy_version ?? "loading"}</span>
          {laneId === "checkout_failed" && (
            <span style={{ marginLeft: 10, color: "#74f2b2", fontSize: 10 }}>v2 · 20k ep tuned</span>
          )}
        </div>
      </header>

      <nav style={styles.tabs}>
        {LANES.map((item) => (
          <button key={item.id} onClick={() => setLaneId(item.id)} style={{ ...styles.tab, ...(laneId === item.id ? styles.activeTab : {}) }}>
            <div>{item.label}</div>
            <small>{item.detail}</small>
          </button>
        ))}
      </nav>

      <section style={styles.grid}>
        <aside style={styles.card}>
          <div style={styles.label}>RECOVERY QUEUE</div>
          <div style={styles.caseBox}>
            <div>
              <b>{lane.label}</b>
              <div style={styles.muted}>{lane.caseId}</div>
            </div>
            <span style={styles.status}>ANALYZING</span>
          </div>
          <div style={styles.facts}>
            <div><small>Trigger</small><b>{lane.detail.split(" • ")[0]}</b></div>
            <div><small>Exposure</small><b>{lane.detail.split(" • ")[1]}</b></div>
            <div><small>Elapsed</small><b>{hours}h</b></div>
            <div><small>Trust budget</small><b>2 / 3 remaining</b></div>
          </div>
          <button style={styles.secondary} onClick={() => void seedDemo()}>Seed demo case</button>
        </aside>

        <section style={styles.card}>
          <div style={styles.label}>POLICY BRAIN</div>
          <div style={styles.brain}>
            <div>
              <div style={styles.muted}>BASELINE RECOVERABILITY V(s)</div>
              <div style={styles.metric}>{loading ? "…" : decision?.baseline_value.toFixed(2) ?? "—"}</div>
              <div style={{ ...styles.muted, marginTop: 8 }}>Estimated action advantages shown in Q ranking</div>
            </div>
          </div>
          <div style={styles.label}>Q-VALUE RANKING</div>
          <div style={styles.bars}>
            {ranked.slice(0, 7).map(([action, q], index) => {
              const idx = Object.keys(decision?.q_values ?? {}).indexOf(action);
              const allowed = decision?.action_mask[idx];
              return (
                <div key={action} style={styles.barRow}>
                  <span>{index + 1}</span>
                  <span style={styles.actionName}>{action.replaceAll("_", " ")}</span>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.bar, width: `${Math.max(8, Math.abs(q) / maxQ * 100)}%`, opacity: allowed ? 1 : 0.35 }} />
                  </div>
                  <span>Q {q.toFixed(1)}</span>
                  <span style={{ color: allowed ? "#74f2b2" : "#ff8a9b" }}>{allowed ? "OK" : "BLOCKED"}</span>
                </div>
              );
            })}
          </div>
          <button
            style={styles.secondary}
            onClick={() => {
              const next = hours + step;
              setHours(next);
              void think(next);
            }}
          >
            Advance episode +{step}h
          </button>
        </section>

        <aside style={styles.card}>
          <div style={styles.label}>EXPLAINABILITY COPILOT</div>
          <p style={styles.quote}>
            The policy selected <b>{decision?.selected_action?.replaceAll("_", " ") ?? "…"}</b> because it has the
            highest masked Q-value for this {lane.label.toLowerCase()} case.
          </p>
          <div style={styles.recommend}>{decision?.selected_action?.replaceAll("_", " ") ?? "Thinking…"}</div>
          <button disabled={!decision || loading} style={styles.execute} onClick={() => void executeAction()}>
            {executed ? "✓ ACTION QUEUED" : "EXECUTE RECOVERY ACTION"}
          </button>
        </aside>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#091014", color: "#e6f0ee", fontFamily: "Inter, system-ui, sans-serif", padding: 28 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1400, margin: "0 auto 18px" },
  eyebrow: { color: "#70d8b4", fontSize: 11, letterSpacing: 2 },
  title: { fontSize: 32, margin: "6px 0 0" },
  live: { fontSize: 11, color: "#9bb4af" },
  dot: { display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#74f2b2", marginRight: 8 },
  version: { marginLeft: 12, color: "#607570" },
  tabs: { display: "flex", gap: 8, maxWidth: 1400, margin: "0 auto 16px", borderBottom: "1px solid #203235" },
  tab: { background: "transparent", border: "none", color: "#879d98", padding: "12px 16px", cursor: "pointer", borderBottom: "2px solid transparent", textAlign: "left" },
  activeTab: { color: "#e6f0ee", borderBottomColor: "#70d8b4" },
  grid: { display: "grid", gridTemplateColumns: "0.9fr 1.4fr 0.9fr", gap: 16, maxWidth: 1400, margin: "0 auto" },
  card: { background: "#101c20", border: "1px solid #203236", borderRadius: 10, padding: 20, minHeight: 520 },
  label: { color: "#76918b", fontSize: 10, letterSpacing: 1.4, marginBottom: 16 },
  caseBox: { display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #31534d", background: "#132822", padding: 12, borderRadius: 8, marginBottom: 20 },
  status: { color: "#70d8b4", fontSize: 10 },
  facts: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  muted: { color: "#70827f", fontSize: 12 },
  brain: { marginBottom: 24 },
  metric: { fontSize: 42, color: "#70d8b4" },
  bars: { display: "grid", gap: 10, marginBottom: 20 },
  barRow: { display: "grid", gridTemplateColumns: "20px 130px 1fr 60px 60px", gap: 8, alignItems: "center", fontSize: 11 },
  actionName: { textTransform: "capitalize" },
  barTrack: { background: "#1d2d30", height: 8, borderRadius: 4, overflow: "hidden" },
  bar: { height: "100%", background: "linear-gradient(90deg,#367d6a,#70d8b4)" },
  quote: { color: "#a9bbb6", lineHeight: 1.6, marginBottom: 20 },
  recommend: { color: "#70d8b4", fontSize: 22, textTransform: "capitalize", marginBottom: 16 },
  secondary: { background: "transparent", border: "1px solid #42665e", color: "#9bd9c5", padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  execute: { width: "100%", padding: 14, background: "#70d8b4", color: "#071311", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" },
};
