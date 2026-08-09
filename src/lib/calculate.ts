import type { HouseType, CustomizationOption } from "@/db/schema";

export interface EstimateBreakdown {
  baseCost: number;
  modifiers: { name: string; amount: number; type: string }[];
  parishMultiplier: number;
  parishName: string | null;
  subtotalBeforeParish: number;
  totalCost: number;
}

export function calculateEstimate(
  houseType: HouseType,
  sqft: number,
  options: CustomizationOption[],
  parish?: { name: string; costMultiplier: string } | null
): EstimateBreakdown {
  const baseCostPerSqFt = Number(houseType.baseCostPerSqFt);
  const baseCost = baseCostPerSqFt * sqft;

  const nonPercentage = options.filter((o) => o.modifierType !== "percentage");
  const percentageOpts = options.filter((o) => o.modifierType === "percentage");

  const modifiers: { name: string; amount: number; type: string }[] = [];

  for (const opt of nonPercentage) {
    const modifier = Number(opt.costModifier);
    const amount = opt.modifierType === "per_sq_ft" ? modifier * sqft : modifier;
    modifiers.push({ name: opt.name, amount, type: opt.modifierType });
  }

  const subtotal = baseCost + modifiers.reduce((sum, m) => sum + m.amount, 0);

  for (const opt of percentageOpts) {
    const pct = Number(opt.costModifier);
    const amount = subtotal * (pct / 100);
    modifiers.push({ name: opt.name, amount, type: opt.modifierType });
  }

  const subtotalBeforeParish = subtotal + modifiers
    .filter((m) => m.type === "percentage")
    .reduce((sum, m) => sum + m.amount, 0);

  const parishMultiplier = parish ? Number(parish.costMultiplier) : 1.0;
  const totalCost = subtotalBeforeParish * parishMultiplier;

  return {
    baseCost: Math.round(baseCost * 100) / 100,
    modifiers,
    parishMultiplier,
    parishName: parish?.name ?? null,
    subtotalBeforeParish: Math.round(subtotalBeforeParish * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}
