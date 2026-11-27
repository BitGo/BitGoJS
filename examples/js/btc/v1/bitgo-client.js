'use strict';

/**
 * Shared helpers for the deprecated v1 Bitcoin wallet examples.
 *
 * This file is not an example on its own. See README.md for the guide.
 *
 * The v1 interfaces used here (`bitgo.wallets()` and `bitgo.pendingApprovals()`)
 * are deprecated. They only apply to existing legacy v1 wallets.
 */

const { BitGoAPI } = require('@bitgo/sdk-api');

/**
 * Read a required environment variable.
 *
 * Secrets are read from the environment so they do not end up in shell history
 * or in this repository.
 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name} before running this script`);
  }
  return value;
}

/**
 * Validate a required command-line argument.
 */
function requireArgument(value, name, usage) {
  if (!value) {
    throw new Error(`Provide ${name}.\nUsage: ${usage}`);
  }
  return value;
}

/**
 * Parse an integer amount of satoshis from a command-line argument.
 *
 * v1 amounts are integer satoshis. 100,000,000 satoshis = 1 BTC.
 *
 * The v1 SDK requires the amount as a number. Max Bitcoin supply is well below
 * Number.MAX_SAFE_INTEGER, and this function rejects unsafe values.
 */
function parseSatoshis(value, name, usage) {
  const text = requireArgument(value, name, usage || `${name} must be a positive integer number of satoshis`);
  if (!/^[0-9]+$/.test(text)) {
    throw new Error(`${name} must be an integer number of satoshis (for example 100000)`);
  }
  const amount = Number(text);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error(`${name} must be a positive safe integer`);
  }
  return amount;
}

/**
 * Create an authenticated v1 BitGo client.
 *
 * Required environment variables:
 *   BITGO_ENV          "test" or "prod"
 *   BITGO_ACCESS_TOKEN access token for that environment
 */
function createClient() {
  const env = required('BITGO_ENV');
  if (env !== 'test' && env !== 'prod') {
    throw new Error('BITGO_ENV must be either "test" or "prod"');
  }

  const bitgo = new BitGoAPI({ env });
  bitgo.authenticateWithAccessToken({ accessToken: required('BITGO_ACCESS_TOKEN') });
  return bitgo;
}

/**
 * Fetch a v1 wallet by ID.
 */
async function getWallet(bitgo, walletId, usage) {
  return bitgo.wallets().get({ id: requireArgument(walletId, 'wallet ID', usage) });
}

/**
 * Unlock the API session before a state-changing call.
 *
 * The OTP is a fresh authenticator code. It may be different from the OTP used
 * for the transaction itself.
 */
async function unlockSession(bitgo) {
  await bitgo.unlock({ otp: required('BITGO_UNLOCK_OTP') });
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

module.exports = {
  createClient,
  getWallet,
  parseSatoshis,
  printJson,
  requireArgument,
  required,
  unlockSession,
};
