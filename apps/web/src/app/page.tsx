export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>RazorStitch</h1>
      <p>Recovery API is running. Emergent UI will replace this page.</p>
      <ul>
        <li>
          <code>POST /api/policy/recommend</code> — DQN-exported policy
        </li>
        <li>
          <code>POST /api/webhooks/razorpay</code> — payment events
        </li>
        <li>
          <code>GET /api/cases</code> — list recovery cases
        </li>
      </ul>
    </main>
  );
}
