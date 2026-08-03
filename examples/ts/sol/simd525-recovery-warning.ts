/**
 * SIMD-525 Verification: Recovery Warning (PR #9372)
 *
 * Tests: recover() logs warning when durableNonce is not provided.
 *
 * This test calls recover() with and without durableNonce, capturing log
 * output to verify the warning fires correctly.
 *
 * IMPORTANT: This test requires the BitGoJS from the fix branch
 * (feat/sol-200ms-slot-recovery-nonce-warning). The warning code is at
 * sol.ts:~1283 in the recover() method.
 *
 * The recover() call will fail early (no real key material), but the
 * warning fires before network calls — so we just check if it fired.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tsol } from '@bitgo/sdk-coin-sol';
import { coins } from '@bitgo/statics';

const path = require('path');
const envPath = path.resolve(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

// ==================== CONFIG ====================
const ACCESS_TOKEN = process.env.TESTNET_ACCESS_TOKEN || '';
const ENV = 'staging';

// Key material for recovery (from a wallet you control)
// These don't need to be real — recover() will fail, but the warning
// fires before any validation that would reject fake keys
const BITGO_KEY = 'fakeBitGoKeyForTestingPurposesOnly';
const USER_KEY = { prv: 'fakeUserPrvForTestingPurposesOnly' };
const BACKUP_KEY = { prv: 'fakeBackupPrvForTestingPurposesOnly' };
const WALLET_PASSPHRASE = 'fakePassphrase';
const RECOVERY_DESTINATION = 'DTn5zvSLiHJ4fApHobgkzcHzSdgM4Hc9Enkfy2UCC8oo';

// Durable nonce params (for the "with nonce" test)
const DURABLE_NONCE_ACCOUNT = '45zDnMboeZBrgvbnbJ8yjtgdJN9UAgUecezbTcaVzxEK';
// =================================================

// Capture console.warn output
const warnings: string[] = [];
const originalWarn = console.warn;

function hookWarn() {
  warnings.length = 0;
  console.warn = (...args: any[]) => {
    const msg = args.join(' ');
    warnings.push(msg);
    originalWarn.apply(console, args as any);
  };
}

function unhookWarn() {
  console.warn = originalWarn;
}

async function main() {
  console.log('=== SIMD-525: Recovery Warning Verification ===\n');

  if (!ACCESS_TOKEN) {
    console.error('No access token found. Set TESTNET_ACCESS_TOKEN in .env');
    process.exit(1);
  }

  const bitgo = new BitGoAPI({
    accessToken: ACCESS_TOKEN,
    env: ENV,
  });
  const coin = coins.get('tsol');
  bitgo.register(coin.name, Tsol.createInstance);

  const sol = bitgo.coin('tsol');

  const baseRecoveryParams: any = {
    bitgoKey: BITGO_KEY,
    recoveryDestination: RECOVERY_DESTINATION,
    userKey: USER_KEY,
    backupKey: BACKUP_KEY,
    walletPassphrase: WALLET_PASSPHRASE,
  };

  // --- Test A: recover WITHOUT durable nonce → expect warning ---
  console.log('--- TEST A: recover() WITHOUT durableNonce ---');
  hookWarn();

  try {
    await sol.recover({ ...baseRecoveryParams });
  } catch (err: any) {
    // Expected — we just want to see if the warning fired
  }

  unhookWarn();

  const warningA = warnings.find((w) =>
    w.includes('durable nonce') || w.includes('durableNonce') || w.includes('SOL recovery')
  );

  if (warningA) {
    console.log('  ✅ WARNING FIRED:', warningA.slice(0, 120));
    console.log('  ✓ PR #9372 works — warning fires when durableNonce is not provided\n');
  } else {
    console.log('  ❌ WARNING DID NOT FIRE');
    console.log('  All captured warnings:', warnings.length > 0 ? warnings : '(none)');
    console.log('  PR #9372 may not be in this build, or recover() failed before reaching the warning\n');
  }

  // --- Test B: recover WITH durable nonce → expect NO warning ---
  console.log('--- TEST B: recover() WITH durableNonce ---');
  hookWarn();

  try {
    await sol.recover({
      ...baseRecoveryParams,
      durableNonce: {
        nonceAccount: DURABLE_NONCE_ACCOUNT,
      },
    });
  } catch (err: any) {
    // Expected
  }

  unhookWarn();

  const warningB = warnings.find((w) =>
    w.includes('durable nonce') || w.includes('durableNonce') || w.includes('SOL recovery')
  );

  if (!warningB) {
    console.log('  ✅ NO WARNING — correct behavior when durableNonce is provided');
    console.log('  ✓ Recovery with durableNonce does not trigger the warning\n');
  } else {
    console.log('  ❌ WARNING FIRED even with durableNonce — bug in the guard');
    console.log('  Warning:', warningB.slice(0, 120));
  }

  // --- Summary ---
  console.log('=== Summary ===');
  if (warningA && !warningB) {
    console.log('  ✅ PR #9372 verified: warning fires WITHOUT durableNonce, silent WITH durableNonce');
  } else if (!warningA) {
    console.log('  ⚠️  Warning not firing — ensure you are running the fix branch build');
    console.log('     Branch: feat/sol-200ms-slot-recovery-nonce-warning');
    console.log('     Run: yarn install && tsc -b ./tsconfig.packages.json');
  }

  console.log('\n=== Test Complete ===');
}

main().catch((e) => console.log(e));
