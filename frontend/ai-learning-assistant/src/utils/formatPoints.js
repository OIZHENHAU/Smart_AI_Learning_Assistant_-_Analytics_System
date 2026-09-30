//6 -> "6.0", 6.666 -> "6.67", 9.5 -> "9.5" (same look as the Grade column in the design).
export const formatPoints = (value) => Number(value || 0).toFixed(2).replace(/0$/, '');
