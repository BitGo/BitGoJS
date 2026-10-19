/**
 * Send a Canton token (USD1) to a remote EVM chain (Sepolia/Ethereum) via a
 * BitGo Canton wallet (sendMany) — the outbound CCIP lane.
 *
 * The CLIENT triggers and signs everything itself via the standard wallet
 * sendMany flow. Custodial wallets need the access token only; hot wallets
 * also need the wallet passphrase. No unlock() is needed either way — hot
 * wallets sign via sendMany walletPassphrase (see
 * send-wallet-tx-tsol-staging-hot.js); custodial TSS signs server-side.
 *
 * One-time setup (first run, skippable with --skipSetup): creates the wallet
 * party's PerPartyRouter (ccipOwner factory) and CCIPSender.
 *
 * Holdings: pass --tokenHoldingCid and --feeHoldingCid explicitly (your USD1
 * and fee-token holding contract ids, from the wallet's unspents). Automatic
 * unspent selection is planned once the Canton unspent schema is wired.
 *
 * Platform dependencies (IMS, SCAAS-11643):
 *  - `feeTokenInput.feeTokenTransferFactory` is resolved server-side (the
 *    preview must be computed as the wallet party by the hosting validator's
 *    transfer-instruction API — clients cannot authenticate for custodial
 *    wallets); this script leaves it empty.
 *  - `--tokenName` (e.g. tcanton:usd1) is required: Send consumes Holdings, so
 *    the platform locks and validates both holding sets against that token.
 *  - The EDS disclosure blobs ride along via cantonCommandParams.disclosedContracts.
 *
 * Usage (from modules/bitgo):
 *   node ../../examples/js/canton/sendCcipMessage.js \
 *     --accessToken=<spender token> --wallet=<canton wallet id> \
 *     --amount=1 --evmReceiver=0x<destination address> \
 *     --tokenName=tcanton:usd1 \
 *     --tokenHoldingCid=00… --feeHoldingCid=00… \
 *     [--passphrase=<hot wallet passphrase>] [--otp=000000] \
 *     [--feeToken=amulet|link] [--gasLimit=200000] [--noExec] \
 *     [--env=prod] [--skipSetup] [--dryRun]
 *
 * Secrets may also come from env: ACCESS_TOKEN, PASSPHRASE, OTP.
 * 'test' → tcanton (default). 'prod' → canton. Testnet OTP is 000000.
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */

const BitGoJS = require('bitgo');
const { utils } = require('ethers');

// ── Lane constants ───────────────────────────────────────────────────────────
const CCIP_SENDER_TMPL = '#ccip-sender-v2:CCIP.CCIPSender:CCIPSender';
const PER_PARTY_ROUTER_TMPL = '#ccip-runtime-v2:CCIP.RuntimeV2.PerPartyRouter:PerPartyRouter';
const PER_PARTY_ROUTER_FACTORY_TMPL = '#ccip-runtime-v2:CCIP.RuntimeV2.PerPartyRouter:PerPartyRouterFactory';

const LANES = {
  test: {
    coin: 'tcanton',
    destChainSelector: '16015286601757825753', // sepolia
    edsUrl: 'https://eds.testnet.ccip.chain.link',
    poolEdsUrl: 'https://chainlink-canton-eds.bitgo-test.com',
    usd1Instrument: {
      admin: '1220a::1220afe5f990cdf777c54b9943ef0a5532dfb28cbacf92105295109b858355f694b8',
      id: 'USD1',
    },
    amuletInstrument: {
      admin: 'DSO::1220f22a8b8f2d813c25b9a684dc4dd52b532a0174d8e73a13cdf2baabfff7518337',
      id: 'Amulet',
    },
    ccipLinkFeeToken: {
      admin: 'ccipOwner::1220e382f4e57b0815e6be737006e381e6b7de448e06bd033ece6df498017879f551',
      id: 'link-token',
    },
  },
  prod: {
    coin: 'canton',
    destChainSelector: '5009297550715157269', // ethereum mainnet
    edsUrl: 'https://eds.ccip.chain.link',
    poolEdsUrl: 'https://chainlink-canton-eds.bitgo.com',
    usd1Instrument: {
      admin: '1220b::1220bab043849b986b52bc6271edf1ae962bab03d9f0c0713f071732d2278386bd02',
      id: 'USD1',
    },
    amuletInstrument: {
      admin: 'DSO::1220f22a8b8f2d813c25b9a684dc4dd52b532a0174d8e73a13cdf2baabfff7518337',
      id: 'Amulet',
    },
    ccipLinkFeeToken: {
      admin: 'ccipOwner::1220e382f4e57b0815e6be737006e381e6b7de448e06bd033ece6df498017879f551',
      id: 'link-token',
    },
  },
};

const SENDER_INSTANCE_ID = 'prod-ccipsender';

// ── Helpers ──────────────────────────────────────────────────────────────────
const contextOrEmpty = (value) => (value && Object.keys(value).length > 0 ? value : { values: {} });
const strip0x = (s) => (s.toLowerCase().startsWith('0x') ? s.slice(2) : s);
const hashedInstrumentId = (instrument) => utils.id(`${instrument.id}@${instrument.admin}`);

/** Canton 10-decimal amount string (e.g. 1 → "1.0000000000"). */
function toCantonDecimalAmount(amount) {
  const scaled = utils.parseUnits(amount, 10);
  const digits = scaled.toString().padStart(11, '0');
  return `${digits.slice(0, -10)}.${digits.slice(-10)}`;
}

async function edsPost(baseUrl, path, body, source, timeoutMs = 30_000) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`${source} responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

async function edsGet(baseUrl, path, source, timeoutMs = 30_000) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    throw new Error(`${source} responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

function parseFlags(argv) {
  const args = {};
  for (const arg of argv) {
    const m = arg.match(/^--([A-Za-z-]+)=(.*)$/);
    if (m) {
      args[m[1]] = m[2];
    } else if (arg.startsWith('--')) {
      args[arg.slice(2)] = true;
    }
  }
  return args;
}

const logParams = (label, params) => console.log(`\n${label}\n${JSON.stringify(params, null, 2)}\n`);
const fatal = (err) => {
  console.error('\n✗ Fatal:', err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
};

// Returns true when the transaction submitted, false when it landed in a
// pending approval or custodial handoff — callers with dependent transactions
// MUST stop on false rather than build on an unsubmitted step.
async function sendManyCommand(wallet, passphrase, tokenName, cantonCommandParams, label) {
  console.log(`\n[${label}] sendMany…`);
  logParams(`${label} cantonCommandParams`, cantonCommandParams);
  const transaction = await wallet.sendMany({
    type: 'cantonCommand',
    cantonCommandParams,
    tokenName,
    walletPassphrase: passphrase || undefined,
    apiVersion: 'full',
  });
  if (transaction && transaction.pendingApproval) {
    console.log(`⏳ Pending approval ${transaction.pendingApproval.id} — approve in the BitGo UI / API.`);
    return false;
  } else if (!transaction || !transaction.tx) {
    console.log('⏳ No tx yet — custodial handoff. Approve in the BitGo UI.');
    return false;
  } else {
    console.log(`✅ Submitted: ${JSON.stringify(transaction.tx).slice(0, 300)}`);
    return true;
  }
}

// ── main ────────────────────────────────────────────────────────────────────
(async () => {
  const args = parseFlags(process.argv.slice(2));
  const envName = args.env === 'prod' ? 'prod' : 'test';
  const lane = args.laneConfig ? require(require('path').resolve(args.laneConfig)) : LANES[envName];
  if (envName === 'prod' && !args.laneConfig) {
    throw new Error(
      'Production requires --laneConfig=<verified production lane JSON>; draft constants are not verified.'
    );
  }
  const bitgoEnv = envName === 'prod' ? 'production' : 'test';

  const walletId = args.wallet || process.env.WALLET_ID || '';
  const accessToken = args.accessToken || process.env.ACCESS_TOKEN || '';
  const passphrase = args.passphrase || process.env.PASSPHRASE || '';
  const amount = args.amount || '';
  const evmReceiver = args.evmReceiver || '';
  const tokenName = args.tokenName || '';
  const feeTokenChoice = args.feeToken || 'amulet';
  const gasLimit = args.gasLimit || '200000';
  const noExec = args.noExec === true;
  const skipSetup = args.skipSetup === true;
  const dryRun = args.dryRun === true;
  const tokenHoldingCid = args.tokenHoldingCid || '';
  const feeHoldingCid = args.feeHoldingCid || '';

  if (!walletId) throw new Error('Pass --wallet=<canton wallet id>');
  if (!accessToken) throw new Error('Pass --accessToken=<spender token> (or set ACCESS_TOKEN)');
  if (!amount || !evmReceiver) throw new Error('Required: --amount=<usd1 amount> --evmReceiver=0x…');
  if (!tokenName) {
    throw new Error(
      'Pass --tokenName=<BitGo token name, e.g. tcanton:usd1> — Send consumes Holdings, so the platform locks and validates both holding sets against that token.'
    );
  }
  if (!tokenHoldingCid || !feeHoldingCid) {
    throw new Error(
      'Required: --tokenHoldingCid and --feeHoldingCid (your USD1 and fee-token holding contract ids, ' +
        'from the wallet unspents) — automatic selection is not wired yet.'
    );
  }
  if (!utils.isAddress(evmReceiver)) throw new Error(`--evmReceiver is not a valid EVM address: ${evmReceiver}`);
  if (tokenHoldingCid === feeHoldingCid) {
    throw new Error('Fee holding and token transfer holding must be different contracts.');
  }

  if (!['amulet', 'link'].includes(feeTokenChoice)) {
    throw new Error('--feeToken must be amulet or link');
  }
  if (!utils.parseUnits(amount, 10).gt(0)) throw new Error('--amount must be positive');
  const feeInstrument = feeTokenChoice === 'link' ? lane.ccipLinkFeeToken : lane.amuletInstrument;
  const tokenInstrument = lane.usd1Instrument;
  const tokenAmountDecimal = toCantonDecimalAmount(amount);
  const receiverHex = strip0x(evmReceiver);

  // ── 1. Wallet + party ──────────────────────────────────────────────────────
  const bitgo = new BitGoJS.BitGo({ env: bitgoEnv });
  bitgo.authenticateWithAccessToken({ accessToken });
  // No unlock() needed — hot wallets sign via sendMany walletPassphrase
  // (see send-wallet-tx-tsol-staging-hot.js); custodial TSS signs server-side.
  const wallet = await bitgo.coin(lane.coin).wallets().get({ id: walletId });
  const partyId = (wallet.coinSpecific() || {}).rootAddress || '';
  if (!partyId) throw new Error('Wallet has no rootAddress (party id) — is it fully onboarded?');
  console.log(`Wallet:            ${wallet.id()} (${wallet.type()}/${wallet.multisigType()})`);
  console.log(`Party:             ${partyId}`);
  console.log(`Send:              ${amount} USD1 → ${evmReceiver} (selector ${lane.destChainSelector})`);
  console.log(`Token name:        ${tokenName}`);
  console.log(`Fee token:         ${feeTokenChoice} (${feeInstrument.id})`);
  console.log(`Token holdings:    ${tokenHoldingCid}`);
  console.log(`Fee holdings:      ${feeHoldingCid}`);

  // ── 2. One-time setup (router + CCIPSender) — skipped on --dryRun ─────────
  if (dryRun) {
    console.log('Dry run: skipping setup sendMany commands.');
  } else if (!skipSetup) {
    // IMS discloses the ccipOwner-owned PerPartyRouterFactory from the EDS and
    // injects its contractId as the exercise target — no ACS lookup here (the
    // wallet party cannot see cross-party contracts).
    if (!args.skipRouterSetup) {
      const routerSubmitted = await sendManyCommand(
        wallet,
        passphrase,
        tokenName,
        {
          actAs: [partyId],
          command: {
            ExerciseCommand: {
              templateId: PER_PARTY_ROUTER_FACTORY_TMPL,
              contractId: '',
              choice: 'CreateRouter',
              choiceArgument: { partyOwner: partyId, instanceId: `router-${partyId}` },
            },
          },
        },
        'setup 1/2: create PerPartyRouter'
      );
      if (!routerSubmitted) {
        throw new Error(
          'Setup halted: confirm the router transaction, then rerun with --skipRouterSetup to create the sender.'
        );
      }
    }

    const senderSubmitted = await sendManyCommand(
      wallet,
      passphrase,
      tokenName,
      {
        actAs: [partyId],
        command: {
          CreateCommand: {
            templateId: CCIP_SENDER_TMPL,
            createArguments: { instanceId: SENDER_INSTANCE_ID, owner: partyId },
          },
        },
      },
      'setup 2/2: create CCIPSender'
    );
    if (!senderSubmitted) {
      throw new Error('Setup halted: approve the pending CCIPSender transaction first, then rerun with --skipSetup.');
    }
  } else {
    console.log('Skipping setup (--skipSetup) — router/sender assumed to exist.');
  }

  // ── 3. EDS send disclosures (public endpoints) ────────────────────────────
  const edsMessage = {
    destinationChainSelector: lane.destChainSelector,
    sender: partyId,
    receiver: receiverHex,
    payload: '',
    tokenTransfer: {
      token: tokenInstrument,
      amount: tokenAmountDecimal,
      holdingContractIds: [tokenHoldingCid],
    },
    feeToken: feeInstrument,
    executor: { type: '' },
  };

  console.log('\nFetching EDS disclosures…');
  const tarLookup = await edsGet(
    lane.edsUrl,
    `/ccip/v1/global/TokenAdminRegistry/token/${encodeURIComponent(hashedInstrumentId(tokenInstrument))}`,
    'TAR lookup'
  );
  const tokenPoolAddress = tarLookup.tokenPool || tarLookup.pool || tarLookup.rawInstanceAddress || '';
  if (!tokenPoolAddress) throw new Error('No token pool registered for the USD1 instrument on the TokenAdminRegistry.');

  const poolSend = await edsPost(
    lane.poolEdsUrl,
    `/ccip/v1/external/tokenPool/${encodeURIComponent(tokenPoolAddress)}/send`,
    { message: edsMessage },
    'token pool EDS send'
  );
  const sendDisclosures = [...(poolSend.disclosedContracts || [])];
  console.log(`  token pool: ${tokenPoolAddress.slice(0, 40)}… → cid ${poolSend.contractId.slice(0, 12)}…`);

  const globalSend = await edsPost(
    lane.edsUrl,
    '/ccip/v1/global/message/send',
    {
      message: edsMessage,
      senderRequiredCCVs: [],
      tokenPoolRequiredCCVs: poolSend.requiredCCVs || [],
    },
    'global EDS message/send'
  );
  sendDisclosures.push(...(globalSend.disclosedContracts || []));
  const globalContext = contextOrEmpty(globalSend.contextData);
  const feeTokenConfigCid = globalSend.feeTokenConfigCid || '';
  if (!feeTokenConfigCid)
    throw new Error('Global EDS did not return feeTokenConfigCid — fee token not registered in TAR.');
  console.log(
    `  global: ${(globalSend.disclosedContracts || []).length} disclosed, feeTokenConfig ${feeTokenConfigCid.slice(
      0,
      12
    )}…`
  );

  const ccvSends = await Promise.all(
    (globalSend.ccvs || []).map((ccvAddress) =>
      edsPost(
        lane.edsUrl,
        `/ccip/v1/external/ccv/${encodeURIComponent(ccvAddress)}/send`,
        {
          message: edsMessage,
        },
        'CCV EDS send'
      )
    )
  );
  for (const ccv of ccvSends) {
    sendDisclosures.push(...(ccv.disclosedContracts || []));
  }
  const ccvRawAddresses = ccvSends.map((ccv) => ccv.rawInstanceAddress || '');
  console.log(`  ccv: ${ccvSends.length} CCV input(s)`);

  let executorInput = null;
  const executorExtraArg = noExec
    ? { tag: 'Executor_NoExecutor', value: {} }
    : { tag: 'Executor_UseDefault', value: { executorArgs: '' } };
  if (!noExec && globalSend.executor) {
    const executorSend = await edsPost(
      lane.edsUrl,
      `/ccip/v1/external/executor/${encodeURIComponent(globalSend.executor)}/send`,
      { message: edsMessage, ccvs: ccvSends.map((ccv) => ccv.instanceAddress) },
      'executor EDS send'
    );
    sendDisclosures.push(...(executorSend.disclosedContracts || []));
    executorInput = {
      executorCid: executorSend.contractId,
      context: contextOrEmpty(executorSend.contextData),
    };
    console.log(`  executor: cid ${executorSend.contractId.slice(0, 12)}…`);
  } else {
    console.log(`  executor: ${noExec ? 'none (--noExec)' : 'default (no executor configured)'}`);
  }
  console.log(`  total disclosures to attach: ${sendDisclosures.length}`);

  // ── 4. Assemble the Send intent ────────────────────────────────────────────
  // Mirrors CantonChain.generateUnsignedSendMessage. IMS resolves and injects:
  // CCIPSender contractId + PerPartyRouter routerCid (resolveContracts), and
  // feeTokenInput.feeTokenTransferFactory (server-side factory preview — the
  // preview must be computed as the wallet party, which clients cannot
  // authenticate for custodial wallets).
  const cantonCommandParams = {
    actAs: [partyId],
    command: {
      ExerciseCommand: {
        templateId: CCIP_SENDER_TMPL,
        contractId: '',
        choice: 'Send',
        choiceArgument: {
          destinationChainSelector: lane.destChainSelector,
          context: globalContext,
          routerCid: '',
          message: {
            receiver: receiverHex,
            payload: '',
            tokenTransfer: { token: tokenInstrument, amount: tokenAmountDecimal },
            feeToken: feeInstrument,
            extraArgs: {
              tag: 'V3',
              value: {
                gasLimit: String(gasLimit),
                ccvs: ccvRawAddresses.map((raw) => ({ ccvAddress: { unpack: raw }, ccvArgs: '' })),
                executor: executorExtraArg,
                tokenReceiver: '',
                tokenArgs: '',
              },
            },
          },
          feeTokenInput: {
            senderInputCids: [feeHoldingCid],
            feeTokenTransferFactory: '',
            feeTokenConfigCid,
            feeTokenExtraArgs: { context: { values: {} }, meta: { values: {} } },
          },
          ccvSendInputs: ccvSends.map((ccv, i) => ({
            ccvAddress: { unpack: ccvRawAddresses[i] },
            ccvCid: ccv.contractId,
            context: contextOrEmpty(ccv.contextData),
          })),
          tokenTransferInput: {
            senderInputCids: [tokenHoldingCid],
            tokenPoolCid: poolSend.contractId,
            context: contextOrEmpty(poolSend.contextData),
          },
          executorInput,
        },
      },
    },
    resolveContracts: [
      { templateId: CCIP_SENDER_TMPL, actAs: [partyId], injectAs: 'ExerciseCommand.contractId' },
      { templateId: PER_PARTY_ROUTER_TMPL, actAs: [partyId], injectAs: 'ExerciseCommand.choiceArgument.routerCid' },
    ],
    disclosedContracts: sendDisclosures,
  };
  logParams('send cantonCommandParams', cantonCommandParams);

  if (dryRun) {
    console.log('\nDry run complete — no wallet transaction submitted.');
    return;
  }

  // ── 5. sendMany the Send ───────────────────────────────────────────────────
  await sendManyCommand(wallet, passphrase, tokenName, cantonCommandParams, 'send CCIP message');
  console.log(
    '\nAfter proofs land on the destination (~5–15 min), execution proceeds per the executor mode ' +
      '(default: automatic on the destination chain; --noExec: run the destination-side manual exec).'
  );
})().catch(fatal);
