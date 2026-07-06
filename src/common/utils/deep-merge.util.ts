export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const key in source) {
    const value = source[key];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const existing = target[key];
      if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
        target[key] = {};
      }
      deepMerge(
        target[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      target[key] = value;
    }
  }

  return target;
}