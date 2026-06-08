/**
 * CGD-1483 broken — /ibc.core.channel.v1.MsgRecvPacket.
 *
 * Pre-existing parser bug: `createdFeeEntry` at
 * CosmosLikeTransaction.java:281-307 attributes the fee debit to
 * `tx.body.messages[0]` signer = the RELAYER, not the actual fee payer.
 * This is the same bug across all IBC chains.
 *
 * Escape valve: this msg is relayer-submitted, not attacker-submitted, so
 * we can't directly broadcast one from cosmjs. To reproduce on testnet we'd
 * need to send a MsgTransfer from a counterparty chain (cosmos hub testnet)
 * targeting the victim sei address — the relayer then delivers MsgRecvPacket
 * on sei.
 *
 * For this script: try fetching a recent MsgRecvPacket from testnet via
 * tx-search filtered on the BitGo wallet's destination address (if any
 * inbound transfers have happened) and capture that as the fixture.
 * Otherwise fall back to the documented mainnet sample.
 */

import {
  buildAttacker,
  captureFixture,
  decodeEventAttributes,
  requireEnv,
  lcdGet,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'ibc-msgrecvpacket';
const TYPE_URL = '/ibc.core.channel.v1.MsgRecvPacket';
const HISTORICAL_MAINNET_TX = '96C863A17E5BD3F8EE4FD63CC06C03D44B2A42EA14C97377FFA82D500206F499';
const MAINNET_RESTS = ['https://sei-api.polkachu.com', 'https://rest.sei-apis.com'];

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const { address: attacker } = await buildAttacker(mnemonic);
  // No dedicated wallet for this msg (relayer-submitted, not attacker-driven).
  // Use attacker as the placeholder "victim" address — relevant only for the
  // fixture metadata; the real victim in a historical capture is whatever
  // address appears in the captured tx events.
  const victim = process.env.VICTIM_ADDRESS ?? attacker;

  console.log(`=== CGD-1483 ${TYPE_URL} (relayer-submitted) ===`);
  console.log(`victim    : ${victim}`);

  // First try testnet: tx-search for fungible_token_packet.receiver=<victim>.
  try {
    const q =
      `?events=fungible_token_packet.receiver='${victim}'` +
      `&pagination.limit=1`;
    const body = await lcdGet(DEFAULTS.restEndpoint, `/cosmos/tx/v1beta1/txs${q}`);
    const found = (body?.tx_responses ?? [])[0];
    if (found) {
      console.log(`Found testnet inbound MsgRecvPacket on victim: ${found.txhash}`);
      writeFixture(found, victim, 'testnet-msgrecvpacket', false);
      return;
    }
  } catch (e: any) {
    console.warn(`testnet search failed: ${e.message ?? e}`);
  }

  console.log(`No testnet inbound. Trying historical mainnet sample.`);
  let tx: any = null;
  let lastErr: any;
  for (const endpoint of MAINNET_RESTS) {
    try {
      const body = await lcdGet(endpoint, `/cosmos/tx/v1beta1/txs/${HISTORICAL_MAINNET_TX}`);
      if (body?.tx_response) {
        tx = body.tx_response;
        console.log(`  fetched via ${endpoint}`);
        break;
      }
    } catch (e) {
      lastErr = e;
      console.warn(`  endpoint ${endpoint} failed: ${(e as any).message ?? e}`);
    }
  }
  if (!tx) {
    captureFixture(MSG_KEY, {
      msgType: TYPE_URL,
      scenario: 'historical-mainnet-unavailable',
      victim, attacker: '(relayer)', txHash: HISTORICAL_MAINNET_TX,
      height: '207042134', code: -1,
      txBodyMessages: [], authInfoFee: null, logsEvents: [], topLevelEvents: [],
      notes: `Could not fetch ${HISTORICAL_MAINNET_TX} from any tried mainnet endpoint. See https://www.seiscan.app/pacific-1/txs/${HISTORICAL_MAINNET_TX} and report.`,
      capturedAt: new Date().toISOString(),
    });
    console.log(`  placeholder fixture written.`);
    return;
  }
  writeFixture(tx, victim, 'historical-mainnet-msgrecvpacket', true);
}

function writeFixture(tx: any, victim: string, scenario: string, isHistorical: boolean) {
  captureFixture(MSG_KEY, {
    msgType: TYPE_URL,
    scenario,
    victim,
    attacker: '(relayer)',
    txHash: tx.txhash,
    height: String(tx.height),
    code: tx.code,
    rawLog: tx.raw_log,
    txBodyMessages: tx.tx?.body?.messages ?? [],
    authInfoFee: tx.tx?.auth_info?.fee ?? null,
    logsEvents: (tx.logs ?? []).map((l: any) => ({ msg_index: l.msg_index, events: l.events ?? [] })),
    topLevelEvents: decodeEventAttributes(tx.events ?? []),
    notes: isHistorical
      ? `Historical mainnet escape-valve. Fee attribution bug: indexer credits fee debit to tx.body.messages[0].signer (relayer) instead of fee_payer (user).`
      : `Testnet inbound to victim ${victim}.`,
    capturedAt: new Date().toISOString(),
  });
  console.log(`  fixture written.`);
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
