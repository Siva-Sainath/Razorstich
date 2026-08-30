/** GTM helpers — UTM capture, referral codes, viral share links. */

const REF_KEY = 'rs_ref';
const UTM_KEY = 'rs_utm';

export function captureAttribution() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  const utm = {
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
  };
  if (ref) localStorage.setItem(REF_KEY, ref);
  if (utm.source || utm.medium || utm.campaign) {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  }
  return { ref: ref || localStorage.getItem(REF_KEY), utm: getStoredUtm() };
}

export function getStoredUtm() {
  try {
    return JSON.parse(localStorage.getItem(UTM_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getReferralCode() {
  let code = localStorage.getItem('rs_my_ref');
  if (!code) {
    code = `rs_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('rs_my_ref', code);
  }
  return code;
}

export function demoShareUrl(path = '/checkout') {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const ref = getReferralCode();
  return `${origin}${path}?ref=${ref}`;
}

export function shareTweetUrl(path = '/checkout') {
  const url = encodeURIComponent(demoShareUrl(path));
  const text = encodeURIComponent(
    'This RL agent recovers failed Razorpay checkouts — +61% vs retry rules in their benchmark. Try the demo:'
  );
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
}

export function shareLinkedInUrl(path = '/checkout') {
  const url = encodeURIComponent(demoShareUrl(path));
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
}

export function attributionPayload() {
  return {
    referral_code: getReferralCode(),
    referred_by: localStorage.getItem(REF_KEY) || null,
    utm: getStoredUtm(),
    page: typeof window !== 'undefined' ? window.location.pathname : null,
  };
}
