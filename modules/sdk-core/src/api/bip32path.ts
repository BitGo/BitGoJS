/**
 * @prettier
 */

/**
 * BitGoJS includes some custom hand-rolled bip32 derivation logic in `bitcoin.ts`, which sadly
 * has numerous bugs.
 *
 * One of the effects is that the methods accept invalid bip32 paths:
 * - the `m` prefix is ignored ('m/0' === '0')
 * - path components that cannot be parsed as base-10 numbers are mapped to `0` ('0/x' === '0/0')
 * - path components with trailing characters after numerals are accepted, trailing characters
 *   are ignored ('1x' === '1')
 *
 * This probably does not cover everything but it should cover most bugs encountered in our code.
 *
 * This method attempts to convert a "legacy path", which may be invalid, to a standard bip32 path:
 * meaning the result should be equivalent to the input path when passed to either our custom
 * derivation log or when passed to a standard bip32 library.
 *
 * @param path - legacy path
 * @return string - somewhat sanitized path that can be passed to standard bip32 libraries
 */
export function sanitizeLegacyPath(path: string): string {
  const parts: string[] = path
    .split('/')
    .filter((p) => p !== '')
    .filter((p, i) => i !== 0 || p !== 'm')
    .map((p) => {
      const hardened = p.slice(-1) === "'";
      const v = parseInt(p.slice(0, hardened ? -1 : undefined), 10);
      if (Number.isNaN(v)) {
        return '0';
      }
      return String(v) + (hardened ? "'" : '');
    });

  if (parts.length === 0) {
    throw new Error(`empty path`);
  }
  return parts.join('/');
}
