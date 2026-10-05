/**
 * What a site pays to move to a package: the package price minus what it already owns of it,
 * never more than buying the missing features one by one. The store project's `suggestUpgrade`
 * uses the same formula, so the amount shown to the buyer is the amount charged here.
 */
export function upgradeAmount(input: { packagePrice: number; packageFeatureKeys: readonly string[]; ownedKeys: ReadonlySet<string>; prices: ReadonlyMap<string, number> }) {
  let ownedValue = 0;
  let missingTotal = 0;
  for (const key of input.packageFeatureKeys) {
    const price = input.prices.get(key) ?? 0;
    if (input.ownedKeys.has(key)) ownedValue += price;
    else missingTotal += price;
  }
  return Math.min(missingTotal, Math.max(0, input.packagePrice - ownedValue));
}

export const tomanToRials = (toman: number) => toman * 10;
