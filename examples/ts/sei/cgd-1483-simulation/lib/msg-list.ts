/**
 * The canonical list of Msg types simulated in CGD-1483 for sei.
 *
 * Each entry has a stable `key` used as:
 *   - the wallets.json key (picks the victim wallet for that simulation)
 *   - the fixture filename under fixtures/<key>.json
 *   - the msg script filename under msg/<key>.ts
 *
 * Coverage comes from `final-report.md` on the `sei-cosmos-whitelist-report`
 * branch of BitGo/indexer:
 *   - all 12 ❌ broken
 *   - all 16 🔍 needs-investigation
 *   - representative ✅ sanity per module
 *   - 6 edge-case scenarios
 *
 * `bucket` mirrors the report buckets so reconcile.ts can sort by it.
 * `notes` records the rationale or known escape-valve.
 */

export type Bucket = 'broken' | 'investigate' | 'sanity' | 'edge';

export interface MsgSpec {
  key: string;
  protoTypeUrl: string;
  bucket: Bucket;
  description: string;
  /** true if the simulation requires the BitGo wallet to be a separate "victim"
   * receiving funds. False for actor-only msgs (delegate, vote, etc.) where the
   * attacker performs the action on themselves. */
  needsVictim: boolean;
  /** Some msgs can't be simulated end-to-end on testnet (validator-only ops,
   * governance quorum). For those we either reuse a historical mainnet sample
   * or skip with rationale. */
  escapeValve?: 'historical-mainnet' | 'skip-rationale';
  notes?: string;
}

export const MSG_LIST: MsgSpec[] = [
  // ─── ❌ Broken (12) ───────────────────────────────────────────────────────
  {
    key: 'evm-msgevmtransaction',
    protoTypeUrl: '/seiprotocol.seichain.evm.MsgEVMTransaction',
    bucket: 'broken',
    description: 'EVM tx via precompile; spender balance overstated due to complementary-arrays bug',
    needsVictim: true,
    notes: 'PARSER_ERROR — CosmosLikeTransaction.java:394-412. Repro 62ABC7EAC436271559CF.',
  },
  {
    key: 'authz-msgexec-undelegate',
    protoTypeUrl: '/cosmos.authz.v1beta1.MsgExec',
    bucket: 'broken',
    description: 'MsgExec wrapping inner MsgUndelegate — pending payback dropped',
    needsVictim: false,
    notes: 'MISSING_ENTRY — CosmosLikeTransaction.java:317-329 (parseIsUnstakeTx top-level only).',
  },
  {
    key: 'staking-msgbeginredelegate',
    protoTypeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
    bucket: 'broken',
    description: 'Redelegate; redelegate event not handled',
    needsVictim: false,
    notes: 'WRONG_EVENT_HANDLING (informational only — no liquid balance error).',
  },
  {
    key: 'tokenfactory-msgmint',
    protoTypeUrl: '/seiprotocol.seichain.tokenfactory.MsgMint',
    bucket: 'broken',
    description: 'Mint tokenfactory denom to attacker, then send to victim',
    needsVictim: true,
    notes: 'UNSUPPORTED_TOKEN — factory/* denom not in CosmosSupportedDenomination.',
  },
  {
    key: 'tokenfactory-msgburn',
    protoTypeUrl: '/seiprotocol.seichain.tokenfactory.MsgBurn',
    bucket: 'broken',
    description: 'Burn tokenfactory denom held by attacker',
    needsVictim: false,
    notes: 'UNSUPPORTED_TOKEN — same denom gap.',
  },
  {
    key: 'wasm-msgexecutecontract-cw20',
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    bucket: 'broken',
    description: 'CW-20 transfer to victim — no bank events; indexer drops silently',
    needsVictim: true,
    notes: 'UNSUPPORTED_TOKEN / out-of-scope. Reproduced in CGD-1093.',
  },
  {
    key: 'evm-msgclaim',
    protoTypeUrl: '/seiprotocol.seichain.evm.MsgClaim',
    bucket: 'broken',
    description: 'EVM claim — bank event emission unconfirmed',
    needsVictim: false,
    escapeValve: 'skip-rationale',
    notes: 'PARSER_ERROR pending. Cannot synthesize without a pre-existing pointer registration.',
  },
  {
    key: 'evm-msgclaimspecific',
    protoTypeUrl: '/seiprotocol.seichain.evm.MsgClaimSpecific',
    bucket: 'broken',
    description: 'EVM CW20/CW721 claim — no bank events by design',
    needsVictim: false,
    escapeValve: 'skip-rationale',
    notes: 'Requires pre-existing pointer + CW20 escrow.',
  },
  {
    key: 'evm-msginternalevmcall',
    protoTypeUrl: '/seiprotocol.seichain.evm.MsgInternalEVMCall',
    bucket: 'broken',
    description: 'Pure EVM value transfer',
    needsVictim: true,
    escapeValve: 'skip-rationale',
    notes: 'Sei v6.5.0 disallows users from submitting MsgInternalEVMCall directly — emitted only via MsgEVMTransaction.',
  },
  {
    key: 'evm-msginternalevmdelegatecall',
    protoTypeUrl: '/seiprotocol.seichain.evm.MsgInternalEVMDelegateCall',
    bucket: 'broken',
    description: 'Pure EVM delegatecall',
    needsVictim: false,
    escapeValve: 'skip-rationale',
    notes: 'Same as MsgInternalEVMCall — internal-only.',
  },
  {
    key: 'ibc-msgrecvpacket',
    protoTypeUrl: '/ibc.core.channel.v1.MsgRecvPacket',
    bucket: 'broken',
    description: 'Inbound IBC fungible transfer — fee attributed to relayer not user',
    needsVictim: true,
    escapeValve: 'skip-rationale',
    notes: 'Relayer-submitted. Cannot directly originate from attacker. Inbound voucher only verifiable if we send MsgTransfer from another chain to sei.',
  },

  // ─── 🔍 Needs investigation (16) ──────────────────────────────────────────
  {
    key: 'staking-msgdelegate',
    protoTypeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    bucket: 'investigate',
    description: 'Delegate to a validator',
    needsVictim: false,
    notes: 'SUSPECT — fee-collector gap leaves bonded_tokens_pool receive unstripped.',
  },
  {
    key: 'staking-msgcancelunbondingdelegation',
    protoTypeUrl: '/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation',
    bucket: 'investigate',
    description: 'Undelegate then cancel — double-credit risk',
    needsVictim: false,
    notes: 'SUSPECT — no cancel handler in pending-payback task.',
  },
  {
    key: 'ibc-msgacknowledgement',
    protoTypeUrl: '/ibc.core.channel.v1.MsgAcknowledgement',
    bucket: 'investigate',
    description: 'IBC error-ack path',
    needsVictim: false,
    escapeValve: 'skip-rationale',
    notes: 'Relayer-submitted; observed indirectly via MsgTransfer to a known-down counterparty (paired with MsgTimeout).',
  },
  {
    key: 'gov-msgsubmitproposal-v1beta1',
    protoTypeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
    bucket: 'investigate',
    description: 'Submit a text gov proposal v1beta1',
    needsVictim: false,
  },
  {
    key: 'gov-msgsubmitproposal-v1',
    protoTypeUrl: '/cosmos.gov.v1.MsgSubmitProposal',
    bucket: 'investigate',
    description: 'Submit a text gov proposal v1',
    needsVictim: false,
  },
  {
    key: 'distribution-msgfundcommunitypool',
    protoTypeUrl: '/cosmos.distribution.v1beta1.MsgFundCommunityPool',
    bucket: 'investigate',
    description: 'Fund community pool',
    needsVictim: false,
  },
  {
    key: 'crisis-msgverifyinvariant',
    protoTypeUrl: '/cosmos.crisis.v1beta1.MsgVerifyInvariant',
    bucket: 'investigate',
    description: 'Verify invariant',
    needsVictim: false,
    escapeValve: 'skip-rationale',
    notes: 'Requires a registered crisis route on Sei; expensive — skip with rationale unless needed.',
  },
  {
    key: 'vesting-msgcreatevestingaccount',
    protoTypeUrl: '/cosmos.vesting.v1beta1.MsgCreateVestingAccount',
    bucket: 'investigate',
    description: 'Create a delayed-vesting account for the victim',
    needsVictim: true,
  },
  {
    key: 'vesting-msgcreatepermanentlockedaccount',
    protoTypeUrl: '/cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount',
    bucket: 'investigate',
    description: 'Create a permanent-locked account for the victim',
    needsVictim: true,
  },
  {
    key: 'vesting-msgcreateperiodicvestingaccount',
    protoTypeUrl: '/cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount',
    bucket: 'investigate',
    description: 'Create a periodic-vesting account for the victim',
    needsVictim: true,
  },
  {
    key: 'vesting-msgfundvestingaccount',
    protoTypeUrl: '/cosmos.vesting.v1beta1.MsgFundVestingAccount',
    bucket: 'investigate',
    description: 'Fund an existing vesting account',
    needsVictim: true,
    escapeValve: 'skip-rationale',
    notes: 'Depends on a pre-existing vesting account. Combined with MsgCreateVestingAccount scenarios.',
  },
  {
    key: 'wasm-msginstantiatecontract',
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
    bucket: 'investigate',
    description: 'Instantiate a CW-20 contract with attached funds',
    needsVictim: false,
    notes: 'Reuses code_id=4029 (cw20_base v1.1.2) per CGD-1093.',
  },
  {
    key: 'wasm-msginstantiatecontract2',
    protoTypeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract2',
    bucket: 'investigate',
    description: 'Predictable-address instantiate',
    needsVictim: false,
  },
  {
    key: 'staking-msgbeginredelegate-investigation',
    protoTypeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
    bucket: 'investigate',
    description: 'Duplicate of broken; in 🔍 because resolution = product decision',
    needsVictim: false,
    escapeValve: 'skip-rationale',
    notes: 'Same tx as staking-msgbeginredelegate; only one fixture needed.',
  },
  {
    key: 'tokenfactory-msgmint-investigation',
    protoTypeUrl: '/seiprotocol.seichain.tokenfactory.MsgMint',
    bucket: 'investigate',
    description: 'Duplicate of broken (product decision)',
    needsVictim: false,
    escapeValve: 'skip-rationale',
  },
  {
    key: 'tokenfactory-msgburn-investigation',
    protoTypeUrl: '/seiprotocol.seichain.tokenfactory.MsgBurn',
    bucket: 'investigate',
    description: 'Duplicate of broken (product decision)',
    needsVictim: false,
    escapeValve: 'skip-rationale',
  },

  // ─── ✅ Sanity samples (one per module) ─────────────────────────────────
  {
    key: 'bank-msgsend',
    protoTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
    bucket: 'sanity',
    description: 'Plain bank send attacker → victim',
    needsVictim: true,
  },
  {
    key: 'bank-msgmultisend',
    protoTypeUrl: '/cosmos.bank.v1beta1.MsgMultiSend',
    bucket: 'sanity',
    description: 'MultiSend fan-out to victim + a second address',
    needsVictim: true,
  },
  {
    key: 'staking-msgundelegate',
    protoTypeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    bucket: 'sanity',
    description: 'Undelegate from a validator (deferred-emission path)',
    needsVictim: false,
  },
  {
    key: 'distribution-msgwithdrawdelegatorreward',
    protoTypeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    bucket: 'sanity',
    description: 'Withdraw rewards',
    needsVictim: false,
  },
  {
    key: 'distribution-msgsetwithdrawaddress',
    protoTypeUrl: '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress',
    bucket: 'sanity',
    description: 'Change withdraw address',
    needsVictim: false,
  },
  {
    key: 'gov-msgvote',
    protoTypeUrl: '/cosmos.gov.v1beta1.MsgVote',
    bucket: 'sanity',
    description: 'Vote on an active proposal',
    needsVictim: false,
    escapeValve: 'skip-rationale',
    notes: 'Requires an active proposal — captured if available, otherwise skipped.',
  },
  {
    key: 'feegrant-msggrantallowance',
    protoTypeUrl: '/cosmos.feegrant.v1beta1.MsgGrantAllowance',
    bucket: 'sanity',
    description: 'Grant fee allowance',
    needsVictim: true,
  },
  {
    key: 'authz-msggrant',
    protoTypeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    bucket: 'sanity',
    description: 'Grant authz (no balance impact)',
    needsVictim: true,
  },
  {
    key: 'ibc-msgtransfer',
    protoTypeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    bucket: 'sanity',
    description: 'IBC outbound transfer (used as pair half for MsgTimeout)',
    needsVictim: false,
  },
  {
    key: 'tokenfactory-msgcreatedenom',
    protoTypeUrl: '/seiprotocol.seichain.tokenfactory.MsgCreateDenom',
    bucket: 'sanity',
    description: 'Create tokenfactory denom',
    needsVictim: false,
  },
  {
    key: 'evm-msgsend',
    protoTypeUrl: '/seiprotocol.seichain.evm.MsgSend',
    bucket: 'sanity',
    description: 'Sei EVM module MsgSend (bank-style)',
    needsVictim: true,
    escapeValve: 'historical-mainnet',
    notes: 'Sei v6.5.0 disallows direct user submission — reuse historical mainnet sample.',
  },

  // ─── Edge cases (6) ───────────────────────────────────────────────────────
  {
    key: 'edge-failed-tx',
    protoTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
    bucket: 'edge',
    description: 'Intentionally-failing tx (invalid recipient / insufficient fee) — must be zero-impact',
    needsVictim: false,
  },
  {
    key: 'edge-msgexec-single-inner',
    protoTypeUrl: '/cosmos.authz.v1beta1.MsgExec',
    bucket: 'edge',
    description: 'MsgExec wrapping a single inner MsgSend that moves funds',
    needsVictim: true,
  },
  {
    key: 'edge-msgexec-multi-inner',
    protoTypeUrl: '/cosmos.authz.v1beta1.MsgExec',
    bucket: 'edge',
    description: 'MsgExec wrapping multiple inner msgs (mix of move/no-move)',
    needsVictim: true,
  },
  {
    key: 'edge-msgmultisend-selfloop',
    protoTypeUrl: '/cosmos.bank.v1beta1.MsgMultiSend',
    bucket: 'edge',
    description: 'MultiSend with same address in inputs AND outputs',
    needsVictim: false,
  },
  {
    key: 'edge-ibc-timeout',
    protoTypeUrl: '/ibc.core.channel.v1.MsgTimeout',
    bucket: 'edge',
    description: 'IBC timeout — MsgTransfer to known-down counterparty triggers MsgTimeout refund',
    needsVictim: false,
    escapeValve: 'historical-mainnet',
    notes: 'Original tx attacker-broadcast; timeout msg is relayer-submitted. Capture the 2-tx pair.',
  },
  {
    key: 'edge-same-address-twice',
    protoTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
    bucket: 'edge',
    description: 'Tx body contains a msg whose payload addresses include the BitGo wallet alongside attacker',
    needsVictim: true,
  },
];

/** Subset of msgs that we'll create wallets for — only those with needsVictim=true
 * AND not skip-rationale. Avoids creating wallets we'd never use. */
export function walletsToCreate(): MsgSpec[] {
  return MSG_LIST.filter((m) => m.needsVictim && m.escapeValve !== 'skip-rationale');
}
