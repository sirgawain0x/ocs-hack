/**
 * Open a Coinbase Pay / onramp URL in a way that works in mobile in-app browsers
 * (Base Account, Coinbase Wallet) where window.open is often blocked.
 */
export function openFundingUrl(url: string): boolean {
  if (!url) return false;

  try {
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (popup) {
      popup.opener = null;
      return true;
    }
  } catch {
    // fall through to same-tab navigation
  }

  try {
    window.location.assign(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Open a blank popup synchronously during a user click to preserve gesture context.
 * The caller sets popup.location.href once the async funding URL is ready.
 */
export function openBlankFundingPopup(): Window | null {
  try {
    const popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
    if (popup) {
      popup.opener = null;
      return popup;
    }
  } catch {
    // fall through — caller will use same-tab navigation
  }
  return null;
}

/** Navigate a pre-opened popup or fall back to same-tab navigation. */
export function navigateFundingTarget(popup: Window | null, url: string): boolean {
  if (!url) return false;

  if (popup) {
    try {
      if (!popup.closed) {
        popup.location.href = url;
        return true;
      }
    } catch {
      // fall through
    }
  }

  try {
    window.location.assign(url);
    return true;
  } catch {
    return false;
  }
}

export function closeFundingPopup(popup: Window | null): void {
  if (!popup) return;
  try {
    if (!popup.closed) {
      popup.close();
    }
  } catch {
    // ignore
  }
}
