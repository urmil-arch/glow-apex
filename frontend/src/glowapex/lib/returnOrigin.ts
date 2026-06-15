// Resolve which store to send the user back to after payment.
//
// The backend attaches an `origin` query param (Stripe success/cancel URLs) or stores it
// in the session (`return_origin`, used by Razorpay). That value was validated server-side
// against the allowlist before it ever reached the browser. Here we only sanity-check the
// shape and fall back to VITE_D1_URL when nothing usable is present.

const FALLBACK = (import.meta.env.VITE_D1_URL || 'http://localhost:5173').replace(/\/$/, '')

function sanitize(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return raw.replace(/\/$/, '')
    }
  } catch {
    // malformed origin — ignore
  }
  return null
}

/** Resolve the return origin from a URL search string (e.g. window.location.search). */
export function resolveReturnOrigin(search: string): string {
  const fromQuery = sanitize(new URLSearchParams(search).get('origin'))
  return fromQuery ?? FALLBACK
}

/** Resolve the return origin from an explicit value (e.g. session.return_origin), with fallback. */
export function resolveReturnOriginValue(value: string | null | undefined): string {
  return sanitize(value) ?? FALLBACK
}

const STORE_NAMES: Record<string, string> = {
  'buyrealviews.com': 'BuyRealViews',
  'buyrealsubscribers.com': 'BuyRealSubscribers',
}

/** Human-readable store name for an origin, for portal copy. */
export function storeNameFromOrigin(origin: string): string {
  try {
    const host = new URL(origin).hostname.replace(/^www\./, '')
    return STORE_NAMES[host] ?? host
  } catch {
    return 'the store'
  }
}
