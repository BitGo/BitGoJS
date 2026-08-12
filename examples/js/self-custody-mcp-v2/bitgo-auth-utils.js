/**
 * Utilities for BitGo authentication, particularly for Express/proxy compatibility.
 *
 * BitGo Express expects Authorization: Bearer <rawAccessToken>.
 * BitGoJS "v2 auth" sends a token hash + HMAC, which Express cannot use to extract the raw token.
 * These utilities help force v1 auth when needed.
 */

/**
 * Determines whether to force v1 auth for BitGo Express/proxy compatibility.
 * @returns {boolean} True if v1 auth should be forced
 */
function shouldForceV1AuthToProxy() {
  // BitGo Express expects Authorization: Bearer <rawAccessToken>.
  // BitGoJS "v2 auth" sends a token hash + HMAC, which Express cannot use to extract the raw token.
  // Set BITGO_FORCE_V1_AUTH=true to force this behavior explicitly.
  const explicit = (process.env.BITGO_FORCE_V1_AUTH || '').toLowerCase();
  if (explicit === 'true' || explicit === '1' || explicit === 'yes') return true;

  const root = process.env.BITGO_CUSTOM_ROOT_URI || '';
  return /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(root);
}

/**
 * Wrap BitGo instance to force v1 auth for all requests when using Express/proxy.
 * This wraps only the public API request methods (get, post, put, del, patch, options),
 * avoiding monkey-patching internal implementation.
 * @param {Object} bitgo - BitGo instance to wrap
 * @returns {Object} The wrapped BitGo instance (or original if wrapping not needed)
 */
function wrapBitGoForV1Auth(bitgo) {
  if (!shouldForceV1AuthToProxy()) return bitgo;

  const methods = ['get', 'post', 'put', 'del', 'patch', 'options'];
  methods.forEach((method) => {
    const original = bitgo[method].bind(bitgo);
    bitgo[method] = function (url) {
      const req = original(url);
      req.forceV1Auth = true;
      return req;
    };
  });

  return bitgo;
}

module.exports = {
  shouldForceV1AuthToProxy,
  wrapBitGoForV1Auth,
};
