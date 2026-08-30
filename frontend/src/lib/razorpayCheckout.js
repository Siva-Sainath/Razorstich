/**
 * Razorpay Standard Checkout — official checkout.js integration (Test Mode).
 * @see https://razorpay.com/docs/payments/payment-gateway/quick-integration/
 * @see https://razorpay.com/docs/payments/payments/test-card-details/
 */

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/** Official test cards (India / international) — random CVV, any future expiry. */
export const RAZORPAY_TEST_CARDS = [
  {
    network: 'Visa',
    region: 'International',
    number: '4239 5360 0631 5640',
    note: 'Click Pay → Razorpay mock page → Success',
  },
  {
    network: 'Mastercard',
    region: 'International',
    number: '5421 1393 0609 0628',
    note: 'Use for alternate network testing',
  },
  {
    network: 'Visa',
    region: 'United States',
    number: '4384 7968 2770 3274',
    note: 'US test card per Razorpay docs',
  },
];

export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Browser only'));
      return;
    }
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay));
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Razorpay script failed'));
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay Standard Checkout modal (requires backend order + key_id).
 */
export async function openRazorpayCheckout({
  keyId,
  order,
  amountInr,
  wedge,
  onSuccess,
  onFailure,
}) {
  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve) => {
    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'RazorStitch',
      description: 'Sandbox · Test Mode only',
      order_id: order.id,
      prefill: {
        name: 'Test Merchant',
        email: 'sandbox@razorstitch.dev',
      },
      theme: { color: '#2B8AF7' },
      handler(response) {
        onSuccess?.(response);
        resolve({ type: 'success', response });
      },
      modal: {
        ondismiss() {
          resolve({ type: 'dismissed' });
        },
      },
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', (response) => {
      onFailure?.(response);
      resolve({ type: 'failed', response });
    });

    rzp.open();
  });
}
