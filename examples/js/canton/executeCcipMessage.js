/**
 * Execute a Sepolia/Ethereum → Canton CCIP message via a BitGo Canton wallet
 * (sendMany) — the inbound CCIP lane.
 *
 * Canton never auto-executes inbound CCIP; the CLIENT triggers this execute.
 * Works for custodial wallets (access token only) and hot wallets (token +
 * wallet passphrase). No other BitGo API surface is used beyond the standard
 * wallet sendMany tx-request flow.
 *
 * What the platform resolves (IMS): the PerPartyRouterFactory contract id for
 * first-run setup (EDS disclosure), and the wallet party's CCIPReceiver +
 * PerPartyRouter contract ids (resolveContracts + injectAs; the receiver is
 * selected payload-aware by receiverFinalityConfig). What this script fetches
 * from public services and passes to the platform: the encoded message (source
 * chain receipt), CCV verifier results (CCIP indexer), and the EDS disclosure
 * blobs (attached via cantonCommandParams.disclosedContracts).
 *
 * One-time setup (first run, skippable with --skipSetup): creates the wallet
 * party's PerPartyRouter (ccipOwner factory) and CCIPReceiver (finality 0).
 *
 * Usage (from modules/bitgo):
 *   node ../../examples/js/canton/executeCcipMessage.js \
 *     --accessToken=<spender token> --wallet=<canton wallet id> \
 *     --txHash=0x<sepolia tx hash> [--messageId=0x…] \
 *     [--passphrase=<hot wallet passphrase>] [--otp=000000] \
 *     [--finality=0|65536|<block depth>] [--receiverCid=<cid>] \
 *     [--env=prod] [--skipSetup] [--dryRun]
 *
 * Secrets may also come from env: ACCESS_TOKEN, PASSPHRASE, OTP.
 * 'test' → tcanton (default). 'prod' → canton. Testnet OTP is 000000.
 *
 * Receiver resolution: the message's finality (verifier result `message.finality`)
 * selects the CCIPReceiver instance via createArgumentFilter. When the verifier
 * result carries no finality, pass --finality explicitly; once a receiver exists
 * its contract id can be passed directly with --receiverCid (pairs with
 * --skipSetup).
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */

const BitGoJS = require('bitgo');
const { utils, providers, BigNumber } = require('ethers');

// ── Lane constants ───────────────────────────────────────────────────────────
const CCIP_RECEIVER_TMPL = '#ccip-receiver-v2:CCIP.CCIPReceiver:CCIPReceiver';
const PER_PARTY_ROUTER_TMPL = '#ccip-runtime-v2:CCIP.RuntimeV2.PerPartyRouter:PerPartyRouter';
const PER_PARTY_ROUTER_FACTORY_TMPL = '#ccip-runtime-v2:CCIP.RuntimeV2.PerPartyRouter:PerPartyRouterFactory';

const LANES = {
  test: {
    coin: 'tcanton',
    sourceRpc: 'https://sepolia.rpc.thirdweb.com',
    indexerUrl: 'https://indexer-1.testnet.ccip.chain.link',
    edsUrl: 'https://eds.testnet.ccip.chain.link',
    poolEdsUrl: 'https://chainlink-canton-eds.bitgo-test.com',
  },
  prod: {
    coin: 'canton',
    sourceRpc: 'https://ethereum-rpc.publicnode.com',
    indexerUrl: 'https://indexer-1.mainnet.ccip.chain.link',
    edsUrl: 'https://eds.ccip.chain.link',
    poolEdsUrl: 'https://chainlink-canton-eds.bitgo.com',
  },
};

// ── Boundary types are enforced at runtime by assertShape ────────────────────
function assertShape(value, requiredKeys, source) {
  if (value === null || typeof value !== 'object') {
    throw new Error(`${source}: expected a JSON object`);
  }
  for (const key of requiredKeys) {
    const v = value[key];
    if (v === undefined || v === null || v === '') {
      throw new Error(`${source}: missing required field '${key}'`);
    }
  }
  return value;
}

const contextOrEmpty = (value) => (value && Object.keys(value).length > 0 ? value : { values: {} });
const strip0x = (s) => (s.toLowerCase().startsWith('0x') ? s.slice(2) : s);

/** Decode a verifier dest address (hex-encoded ASCII raw address) to the raw form. */
function decodeVerifierDestAddress(destAddress) {
  const trimmed = destAddress.trim();
  const hex = strip0x(trimmed);
  if (/^[0-9a-fA-F]+$/.test(hex) && hex.length >= 2 && hex.length % 2 === 0) {
    try {
      return Buffer.from(hex, 'hex').toString('utf8');
    } catch {
      // fall through
    }
  }
  return trimmed;
}

const hashedRawAddress = (raw) => utils.id(raw);

/** Daml JSON variant encoding of the receiver finality config. */
function encodeFinalityConfig(finality) {
  if (finality === 0) return { tag: 'WaitForFinality', value: {} };
  if (finality === 0x00010000) return { tag: 'WaitForSafe', value: {} };
  return { tag: 'BlockDepth', value: String(finality) };
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
  console.error('\n✗ Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
};

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
  const txHash = args.txHash || '';
  const messageId = args.messageId || '';
  const dryRun = args.dryRun === true;
  const skipSetup = args.skipSetup === true;
  const receiverCid = args.receiverCid || '';
  const explicitFinality = args.finality !== undefined ? Number(args.finality) : undefined;

  if (!walletId) throw new Error('Pass --wallet=<canton wallet id>');
  if (!accessToken) throw new Error('Pass --accessToken=<spender token> (or set ACCESS_TOKEN)');
  if (!txHash)
    throw new Error('Pass --txHash=0x<sepolia tx> (message-id-only resolution does not yield encodedMessage)');
  if (
    explicitFinality !== undefined &&
    (!Number.isInteger(explicitFinality) || explicitFinality < 0 || explicitFinality > 0xffffffff)
  ) {
    throw new Error('--finality must be an integer (0, 65536 for WaitForSafe, or a block depth)');
  }

  // ── 1. Resolve the message from the source-chain receipt ────────────────────
  // CCIPMessageSent: w0 feeToken, w1 tokenAmount, w2 offset(encodedMessage),
  // then a length-prefixed bytes blob at that offset (stable head layout).
  const provider = new providers.JsonRpcProvider(lane.sourceRpc);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) throw new Error(`No receipt for ${txHash} on ${lane.sourceRpc}`);
  const targetTopic = messageId ? messageId.toLowerCase() : '';
  const candidates = receipt.logs.filter(
    (log) => log.topics.length === 4 && (!targetTopic || log.topics[3].toLowerCase() === targetTopic)
  );
  if (candidates.length !== 1) {
    throw new Error(
      `Expected exactly one CCIPMessageSent log${messageId ? ' for the message id' : ''}, found ${
        candidates.length
      }. Pass --messageId to disambiguate.`
    );
  }
  const dataBytes = utils.arrayify(candidates[0].data);
  if (dataBytes.length < 96) throw new Error('CCIPMessageSent data too short to hold the fixed head');
  const msgOffset = BigNumber.from(dataBytes.slice(64, 96)).toNumber();
  if (msgOffset + 32 > dataBytes.length) throw new Error(`encodedMessage offset ${msgOffset} out of range`);
  const msgLength = BigNumber.from(dataBytes.slice(msgOffset, msgOffset + 32)).toNumber();
  const msgEnd = msgOffset + 32 + msgLength;
  if (msgEnd > dataBytes.length) throw new Error(`encodedMessage length ${msgLength} exceeds data size`);
  const encodedMessageHex = utils.hexlify(dataBytes.slice(msgOffset + 32, msgEnd));
  const resolvedMessageId = candidates[0].topics[3];
  console.log(`Message ID:        ${resolvedMessageId}`);
  console.log(`encodedMessage:    ${strip0x(encodedMessageHex).length / 2} bytes`);

  // ── 2. Verifier results from the CCIP indexer ──────────────────────────────
  const vrRes = await fetch(`${lane.indexerUrl.replace(/\/$/, '')}/v1/verifierresults/${resolvedMessageId}`);
  if (!vrRes.ok) {
    throw new Error(`Indexer responded ${vrRes.status} — proofs not ready yet. Retry in a few minutes.`);
  }
  const vrJson = assertShape(await vrRes.json(), ['success', 'results'], 'CCIP indexer');
  if (!vrJson.success || vrJson.results.length === 0) {
    throw new Error('Indexer returned no verifier results yet — wait for finality + CCV attestation.');
  }
  const message = (vrJson.results[0].verifierResult || {}).message || {};
  const messageReceiver = message.receiver || '';
  const messageFinality = typeof message.finality === 'number' ? message.finality : undefined;
  // Receiver instances are finality-specific (OffRamp.PrepareExecute rejects
  // mismatches). Resolve the finality explicitly instead of assuming 0.
  const finality = explicitFinality !== undefined ? explicitFinality : messageFinality;
  if (messageFinality !== undefined && explicitFinality !== undefined && messageFinality !== explicitFinality) {
    throw new Error('--finality does not match the attested message finality');
  }
  if (finality === undefined && !receiverCid) {
    throw new Error(
      'Verifier result carries no message.finality — pass --finality=<0|65536|depth> (or --receiverCid once the receiver exists)'
    );
  }
  const verifications = vrJson.results.map(({ verifierResult: vr }) => ({
    ccvData: vr.ccv_data,
    destAddress: vr.verifier_dest_address,
  }));
  const attestationCcvRaw = decodeVerifierDestAddress(verifications[0].destAddress);
  console.log(`Verifier results:  ${verifications.length} (receiver ${messageReceiver.slice(0, 18)}…)`);
  console.log(
    `Message finality:  ${
      finality === undefined ? 'n/a (explicit receiver)' : finality
    }  attestation CCV: ${attestationCcvRaw.slice(0, 40)}…`
  );

  // Read the wallet even in dry-run mode: EDS requests need the real party.
  let partyId = '';
  {
    const bitgo = new BitGoJS.BitGo({ env: bitgoEnv });
    bitgo.authenticateWithAccessToken({ accessToken });
    // No unlock() needed — hot wallets sign via sendMany walletPassphrase
    // (see send-wallet-tx-tsol-staging-hot.js); custodial TSS signs server-side.
    const wallet = await bitgo.coin(lane.coin).wallets().get({ id: walletId });
    partyId = wallet.coinSpecific().rootAddress || '';
    if (!partyId) throw new Error('Wallet has no rootAddress (party id) — is it fully onboarded?');
    console.log(`Wallet:            ${wallet.id()} (${wallet.type()}/${wallet.multisigType()})`);
    console.log(`Party:             ${partyId}`);
    const expected = utils.id(partyId).toLowerCase();
    if (messageReceiver && expected !== messageReceiver.toLowerCase()) {
      throw new Error(
        `Wallet party is NOT this message's receiver (keccak(party)=${expected.slice(0, 20)}…, ` +
          `message.receiver=${messageReceiver.slice(0, 20)}…). Use the wallet whose party the message was addressed to.`
      );
    }

    // ── 4. One-time setup (skip with --skipSetup when contracts exist) ──────
    if (!skipSetup && !dryRun) {
      // IMS discloses the ccipOwner-owned PerPartyRouterFactory from the EDS and
      // injects its contractId as the exercise target — no ACS lookup here (the
      // wallet party cannot see cross-party contracts).
      if (!args.skipRouterSetup) {
        const routerSubmitted = await sendManyCommand(
          bitgo,
          wallet,
          partyId,
          passphrase,
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
            'Setup halted: confirm the router transaction, then rerun with --skipRouterSetup to create the receiver.'
          );
        }
      }

      if (receiverCid) {
        console.log(
          `Using explicit receiver (--receiverCid=${receiverCid.slice(0, 18)}…) — skipping receiver creation.`
        );
      } else {
        const receiverInstanceId = `receiver-finality${finality}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)}`;
        const receiverSubmitted = await sendManyCommand(
          bitgo,
          wallet,
          partyId,
          passphrase,
          {
            actAs: [partyId],
            command: {
              CreateCommand: {
                templateId: CCIP_RECEIVER_TMPL,
                createArguments: {
                  instanceId: receiverInstanceId,
                  owner: partyId,
                  receiverFinalityConfig: encodeFinalityConfig(finality),
                  requiredCCVs: [{ unpack: attestationCcvRaw }],
                  optionalCCVs: [],
                  optionalThreshold: '0',
                },
              },
            },
          },
          'setup 2/2: create CCIPReceiver'
        );
        if (!receiverSubmitted) {
          throw new Error(
            'Setup halted: approve the pending CCIPReceiver transaction first, then rerun with --skipSetup.'
          );
        }
      }
    } else {
      console.log('Skipping setup (--skipSetup) — router/receiver assumed to exist.');
    }
  }

  // ── 5. EDS execute disclosures (public endpoints; payer = wallet party) ───
  const payer = partyId;
  console.log('\nFetching EDS disclosures…');
  const globalExec = await edsPost(
    lane.edsUrl,
    '/ccip/v1/global/message/execute',
    {
      encodedMessage: encodedMessageHex,
      receiver: payer,
    },
    'global EDS message/execute'
  );
  const globalContext = contextOrEmpty(globalExec.contextData);
  const executeDisclosures = [...(globalExec.disclosedContracts || [])];
  console.log(`  global: ${(globalExec.disclosedContracts || []).length} disclosed contracts`);

  const ccvInputsRaw = verifications.map((v) => ({
    raw: decodeVerifierDestAddress(v.destAddress),
    ccvData: v.ccvData,
  }));
  const ccvResults = await Promise.all(
    ccvInputsRaw.map(({ raw }) =>
      edsPost(
        lane.edsUrl,
        `/ccip/v1/external/ccv/${encodeURIComponent(hashedRawAddress(raw))}/execute`,
        {
          encodedMessage: encodedMessageHex,
          receiver: payer,
        },
        'CCV EDS execute'
      )
    )
  );
  for (const ccv of ccvResults) {
    executeDisclosures.push(...(ccv.disclosedContracts || []));
  }
  const ccvInputsArg = ccvInputsRaw.map(({ ccvData }, i) => ({
    ccvCid: ccvResults[i].contractId,
    verifierResults: strip0x(ccvData),
    context: contextOrEmpty(ccvResults[i].contextData),
  }));
  console.log(`  ccv: ${ccvInputsArg.length} CCV input(s)`);

  let tokenTransfer = null;
  if (globalExec.tokenPool) {
    const poolRes = await edsPost(
      lane.poolEdsUrl,
      `/ccip/v1/external/tokenPool/${encodeURIComponent(globalExec.tokenPool)}/execute`,
      { encodedMessage: encodedMessageHex, receiver: payer },
      'token pool EDS execute'
    );
    executeDisclosures.push(...(poolRes.disclosedContracts || []));
    const providedCcvHashes = ccvInputsRaw.map(({ raw }) => hashedRawAddress(raw).toLowerCase());
    const missing = (poolRes.requiredCCVs || []).filter(
      (required) => !providedCcvHashes.includes(hashedRawAddress(decodeVerifierDestAddress(required)).toLowerCase())
    );
    if (missing.length > 0) {
      throw new Error(`Token pool requires CCV result(s) not provided by verifications: ${missing.join(', ')}`);
    }
    tokenTransfer = {
      tokenPoolCid: poolRes.contractId,
      tokenReceiverParty: payer,
      context: contextOrEmpty(poolRes.contextData),
    };
    console.log(`  token pool: ${globalExec.tokenPool.slice(0, 40)}… → cid ${poolRes.contractId.slice(0, 12)}…`);
  } else {
    console.log('  token pool: none (message carries no token transfer)');
  }
  console.log(`  total disclosures to attach: ${executeDisclosures.length}`);

  // ── 6. Assemble the Execute intent ─────────────────────────────────────────
  // IMS resolves and injects ExerciseCommand.choiceArgument.routerCid
  // (PerPartyRouter) via resolveContracts and the CCIPReceiver exercise target
  // (payload-aware by receiverFinalityConfig, or the explicit --receiverCid).
  // The EDS disclosure blobs ride along via disclosedContracts so IMS can
  // attach them at ledger prepare time.
  const resolveContracts = [
    { templateId: PER_PARTY_ROUTER_TMPL, actAs: [partyId], injectAs: 'ExerciseCommand.choiceArgument.routerCid' },
  ];
  const receiverContractId = receiverCid;
  if (!receiverCid) {
    resolveContracts.unshift({
      templateId: CCIP_RECEIVER_TMPL,
      actAs: [partyId],
      injectAs: 'ExerciseCommand.contractId',
      createArgumentFilter: { receiverFinalityConfig: encodeFinalityConfig(finality) },
    });
  }
  const cantonCommandParams = {
    actAs: [partyId],
    command: {
      ExerciseCommand: {
        templateId: CCIP_RECEIVER_TMPL,
        contractId: receiverContractId,
        choice: 'Execute',
        choiceArgument: {
          routerCid: '',
          encodedMessage: encodedMessageHex,
          tokenTransfer,
          ccvInputs: ccvInputsArg,
          context: globalContext,
        },
      },
    },
    resolveContracts,
    disclosedContracts: executeDisclosures,
  };
  logParams('execute cantonCommandParams', cantonCommandParams);

  if (dryRun) {
    console.log('Dry run complete — no wallet transaction submitted.');
    return;
  }

  // ── 7. sendMany the Execute ────────────────────────────────────────────────
  const bitgo = new BitGoJS.BitGo({ env: bitgoEnv });
  bitgo.authenticateWithAccessToken({ accessToken });
  // No unlock() — hot wallets sign via sendMany walletPassphrase; custodial signs server-side.
  const wallet = await bitgo.coin(lane.coin).wallets().get({ id: walletId });
  await sendManyCommand(bitgo, wallet, partyId, passphrase, cantonCommandParams, 'execute CCIP message');
  console.log(
    '\nAfter the update commits, the mint lands as a TransferInstruction — settled onto your ' +
      "wallet's party by the token pre-approval (enable USD1 on the wallet first)."
  );
})().catch(fatal);

// ── sendMany helper (cantonCommand intent; passphrase only needed for hot) ──
// Returns true when the transaction submitted, false when it landed in a
// pending approval or custodial handoff — callers with dependent transactions
// MUST stop on false rather than build on an unsubmitted step.
async function sendManyCommand(bitgo, wallet, partyId, passphrase, cantonCommandParams, label) {
  console.log(`\n[${label}] sendMany…`);
  logParams(`${label} cantonCommandParams`, cantonCommandParams);
  const transaction = await wallet.sendMany({
    type: 'cantonCommand',
    cantonCommandParams,
    walletPassphrase: passphrase || undefined,
    apiVersion: 'full',
  });
  if (transaction && transaction.pendingApproval) {
    console.log(
      `⏳ Pending approval ${transaction.pendingApproval.id} — approve in the BitGo UI / API, then rerun with --skipSetup.`
    );
    return false;
  } else if (!transaction || !transaction.tx) {
    console.log('⏳ No tx yet — custodial handoff. Approve in the BitGo UI.');
    return false;
  } else {
    console.log(`✅ Submitted: ${JSON.stringify(transaction.tx).slice(0, 300)}`);
    return true;
  }
}
