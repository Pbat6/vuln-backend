// Cố ý vulnerable: không lọc __proto__ / constructor / prototype
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const key in source) {
    const value = source[key];

    if (key === '__proto__' && value && typeof value === 'object') {
      deepMerge(
        Object.prototype as Record<string, unknown>,
        value as Record<string, unknown>,
      );
      continue;
    }

    if (key === 'constructor' && value && typeof value === 'object') {
      const proto = (value as { prototype?: Record<string, unknown> }).prototype;
      if (proto && typeof proto === 'object') {
        deepMerge(
          Object.prototype as Record<string, unknown>,
          proto,
        );
      }
      continue;
    }

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') {
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