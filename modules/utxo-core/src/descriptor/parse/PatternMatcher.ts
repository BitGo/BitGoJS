// Pattern matching types
export type PatternVar = { $var: string };
export type Pattern = PatternVar | string | number | { [key: string]: Pattern | Pattern[] } | Pattern[];

export type ExtractedVars = Record<string, unknown>;

export class PatternMatcher {
  match(node: unknown, pattern: Pattern): ExtractedVars | null {
    const vars: ExtractedVars = {};
    return this.matchNode(node, pattern, vars) ? vars : null;
  }

  private matchNode(node: unknown, pattern: Pattern, vars: ExtractedVars): boolean {
    // Variable placeholder
    if (this.isPatternVar(pattern)) {
      const varName = pattern.$var;
      if (varName in vars) {
        return this.deepEqual(vars[varName], node);
      }
      vars[varName] = node;
      return true;
    }

    // Primitive values
    if (typeof node !== typeof pattern) return false;
    if (typeof node === 'string' || typeof node === 'number') {
      return node === pattern;
    }

    // Arrays
    if (Array.isArray(node) && Array.isArray(pattern)) {
      return node.length === pattern.length && node.every((item, i) => this.matchNode(item, pattern[i], vars));
    }

    // Objects
    if (typeof node === 'object' && typeof pattern === 'object' && node !== null && pattern !== null) {
      const nodeKeys = Object.keys(node);
      const patternKeys = Object.keys(pattern);

      return (
        nodeKeys.length === patternKeys.length &&
        nodeKeys.every(
          (key) =>
            patternKeys.includes(key) &&
            this.matchNode((node as Record<string, unknown>)[key], (pattern as Record<string, Pattern>)[key], vars)
        )
      );
    }

    return false;
  }

  private isPatternVar(value: unknown): value is PatternVar {
    return value !== null && typeof value === 'object' && '$var' in value;
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((item, i) => this.deepEqual(item, b[i]));
    }
    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      return (
        keysA.length === keysB.length &&
        keysA.every((key) => this.deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
      );
    }
    return false;
  }
}
