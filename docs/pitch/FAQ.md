# RazorStitch: Judge FAQ

**1. Why use a Deep Q-Network (DQN) instead of traditional, static failure rules?**
Static rules are fragile and fail to capture the nuanced interactions between different error codes, banks, and customer contexts. A DQN can learn these non-linear relationships over time. While static rules generated 2,404,054 INR in our benchmark, our DQN intelligently navigates the state space to achieve 2,512,616 INR in net recovered value—an incremental gain of 36,187 INR per seed—by learning when to wait, when to retry, and when to intervene directly.

**2. Why not just train the model directly on the live Razorpay API?**
Training an RL agent requires exploration, which inevitably involves making suboptimal choices in the early stages (like spamming a customer with payment links). Doing this on a live API would burn through our "Trust Budget," alienate customers, and potentially violate rate limits or compliance standards. We use a high-fidelity simulated environment to train the agent safely before deployment.

**3. Your results show `always_payment_link` recovers more gross revenue than the DQN. Why not just use that?**
Gross revenue is a deceptive metric if it destroys the customer experience. The `always_payment_link` baseline triggered 129 duplicate incidents (customer friction/spam) in our evaluation, compared to just 69 for our DQN. RazorStitch optimizes for *Net Value*, explicitly penalizing actions that degrade the Trust Budget. It’s about sustainable recovery, not burning bridges for a one-time save.

**4. How do you prevent the RL agent from "reward hacking" (e.g., finding a loophole to maximize score without real business value)?**
We implement strict reward shaping and guardrails. The agent is penalized heavily for duplicate interventions, unnecessary retries, and actions that violate the Trust Budget. Furthermore, the environment enforces terminal states once an action is taken or a timeout is reached, preventing infinite loops of zero-cost actions.

**5. What is the "Trust Budget" and how is it quantified?**
The Trust Budget is a conceptual and mathematical framework in our reward function that quantifies the cost of customer friction. Every aggressive action (like an immediate retry or an unsolicited email link) deducts from this budget. The DQN is forced to evaluate if the probability of saving the transaction outweighs the penalty of annoying the customer.

**6. How does the audit trail work, and why is it necessary?**
In fintech, explainability is not optional. Every decision the DQN makes—along with the input state (anatomy of the failure) and the calculated Q-values for all possible actions—is logged. This allows human operators and compliance teams to reconstruct exactly *why* a specific recovery action was taken, ensuring transparency and accountability.

**7. How easily can this be adapted to other payment gateways?**
Very easily. The state representation is designed to be abstract (capturing generic features like error categories, timing, and amounts). Adapting it to Stripe, Adyen, or others simply requires mapping their specific webhook payloads and error codes to our unified state representation and retraining the simulator on their historical data.

**8. What happens if the agent encounters an entirely new, unseen error code?**
The neural network architecture of the DQN generalizes from past experiences. It can map unseen error codes to similar known states based on the embedding of the error description or context. Additionally, we enforce fallback safety rules: if the maximum Q-value falls below a confidence threshold, the system defaults to a safe `noop` or hands the case off to a human operator.
