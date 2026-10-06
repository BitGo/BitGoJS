/**
 * Canonical SIWS (Sign In With Solana) message validator.
 *
 * Exact JS mirror of the firmware's validate_sol_message (hsm-firmware src/bg/sol.c,
 * DEFI-945) as also mirrored in hsm-api validateSiwsMessage (DEFI-946). Shared by
 * sdk-coin-sol, Wallet Platform, and bitgo-ui; hsm-api keeps its own bytes-based copy.
 * Any change here must land identically in all layers, including firmware.
 */

const SIWS_SUFFIX = ' wants you to sign in with your Solana account:';
const SIWS_FIELD_LABELS = [
  'URI: ',
  'Version: ',
  'Chain ID: ',
  'Nonce: ',
  'Issued At: ',
  'Expiration Time: ',
  'Not Before: ',
  'Request ID: ',
  'Resources:',
];
const SIWS_CHAIN_IDS = [
  'mainnet',
  'testnet',
  'devnet',
  'localnet',
  'solana:mainnet',
  'solana:testnet',
  'solana:devnet',
];
const SIWS_FIELD_URI = 0;
const SIWS_FIELD_VERSION = 1;
const SIWS_FIELD_CHAIN_ID = 2;
const SIWS_FIELD_NONCE = 3;
const SIWS_FIELD_ISSUED_AT = 4;
const SIWS_FIELD_EXPIRATION_TIME = 5;
const SIWS_FIELD_NOT_BEFORE = 6;
const SIWS_FIELD_REQUEST_ID = 7;
const SIWS_FIELD_RESOURCES = 8;

// A lone surrogate cannot be encoded as UTF-8; Buffer.from would silently replace it
// with U+FFFD and the signed bytes would no longer match the caller's text.
const LONE_SURROGATE_PATTERN = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF]))|(?:(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF])/;

function isSiwsBase58Address(line: string): boolean {
  return line.length >= 32 && line.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(line);
}

function isSiwsAlnum(value: string): boolean {
  return value.length >= 8 && /^[a-zA-Z0-9]+$/.test(value);
}

function isSiwsDatetime(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 60) {
    return false;
  }
  if (match[8] === 'Z') {
    return true;
  }
  const offsetHour = parseInt(match[8].substring(1, 3), 10);
  const offsetMinute = parseInt(match[8].substring(4, 6), 10);
  return offsetHour <= 23 && offsetMinute <= 59;
}

/**
 * Validates a SIWS message per the Sign In With Solana ABNF grammar: the domain-bound
 * sign-in template where the statement and every advanced field is optional (any
 * subset, in canonical order, with strict value checks). Throws when the message is
 * not strict UTF-8-representable or not a well-formed SIWS message; returns silently
 * otherwise.
 */
export function validateSiwsMessage(message: string): void {
  const invalid = () => {
    throw new Error('message is not a valid SIWS message');
  };
  if (LONE_SURROGATE_PATTERN.test(message)) {
    throw new Error('message is not valid UTF-8');
  }
  const lines = message.replace(/\n+$/, '').split('\n');
  if (lines.length < 2 || !lines[0].endsWith(SIWS_SUFFIX) || lines[0].length === SIWS_SUFFIX.length) {
    invalid();
  }
  if (!isSiwsBase58Address(lines[1]) || (lines.length >= 3 && lines[2] !== '')) {
    invalid();
  }
  let hasField = false;
  let inFields = false;
  let inResources = false;
  let requireFields = false;
  let lastField = -1;
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') {
      if (inFields || inResources || requireFields) {
        invalid();
      }
      requireFields = true;
      continue;
    }
    if (inResources) {
      if (!line.startsWith('- ')) {
        invalid();
      }
      continue;
    }
    let field = -1;
    for (let f = 0; f < SIWS_FIELD_LABELS.length; f++) {
      if (line.startsWith(SIWS_FIELD_LABELS[f])) {
        field = f;
        break;
      }
    }
    if (field === -1) {
      if (inFields || requireFields) {
        invalid();
      }
      continue;
    }
    if (hasField && field <= lastField) {
      invalid();
    }
    hasField = true;
    lastField = field;
    inFields = true;
    requireFields = false;
    const value = line.substring(SIWS_FIELD_LABELS[field].length);
    switch (field) {
      case SIWS_FIELD_VERSION:
        if (value !== '1') {
          invalid();
        }
        break;
      case SIWS_FIELD_CHAIN_ID:
        if (!SIWS_CHAIN_IDS.includes(value)) {
          invalid();
        }
        break;
      case SIWS_FIELD_NONCE:
        if (!isSiwsAlnum(value)) {
          invalid();
        }
        break;
      case SIWS_FIELD_ISSUED_AT:
      case SIWS_FIELD_EXPIRATION_TIME:
      case SIWS_FIELD_NOT_BEFORE:
        if (!isSiwsDatetime(value)) {
          invalid();
        }
        break;
      case SIWS_FIELD_URI:
      case SIWS_FIELD_REQUEST_ID:
        if (value === '') {
          invalid();
        }
        break;
      case SIWS_FIELD_RESOURCES:
        if (value !== '') {
          invalid();
        }
        inResources = true;
        break;
    }
  }
}
