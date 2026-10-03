/** Percent of the ISA Allowance at which the dashboard starts warning. */
export const DEFAULT_WARNING_THRESHOLD = 90

export type ThresholdValidation =
  | { ok: true; value: number }
  | { ok: false; error: string }

/** Whole percentages only, so the threshold comparison stays exact in pence. */
export function validateWarningThreshold(input: string): ThresholdValidation {
  const match = /^(\d+)\s*%?$/.exec(input.trim())
  const value = match ? Number(match[1]) : NaN
  if (!(value >= 1 && value <= 100)) {
    return { ok: false, error: 'Enter a whole number from 1 to 100.' }
  }
  return { ok: true, value }
}
