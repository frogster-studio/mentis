export interface PaywallFit {
  showsIllustration: boolean;
  showsCrest: boolean;
  isScrollable: boolean;
}

export interface PaywallSavings {
  illustration: number;
  crest: number;
}

export const FULL_PAYWALL: PaywallFit = {
  showsIllustration: true,
  showsCrest: true,
  isScrollable: false,
};

// The illustration goes first, the crest next, and scrolling only once both are gone.
export function paywallFit(
  fullHeight: number,
  availableHeight: number,
  savings: PaywallSavings,
): PaywallFit {
  if (fullHeight <= availableHeight) {
    return FULL_PAYWALL;
  }
  const withoutIllustration = fullHeight - savings.illustration;
  if (withoutIllustration <= availableHeight) {
    return { showsIllustration: false, showsCrest: true, isScrollable: false };
  }
  return {
    showsIllustration: false,
    showsCrest: false,
    isScrollable: withoutIllustration - savings.crest > availableHeight,
  };
}

// Hidden parts are added back, so the fit never flips on the height it just produced.
export function fullPaywallHeight(
  renderedHeight: number,
  fit: PaywallFit,
  savings: PaywallSavings,
): number {
  return (
    renderedHeight +
    (fit.showsIllustration ? 0 : savings.illustration) +
    (fit.showsCrest ? 0 : savings.crest)
  );
}
