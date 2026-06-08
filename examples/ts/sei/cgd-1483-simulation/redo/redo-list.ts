/**
 * 6 tier-1 redo targets — actions that produce balance events on the
 * signer (the BitGo wallet) and have a proper BitGo SDK intent.
 *
 * Each redo wallet gets funded from the attacker BEFORE its action.
 *
 * Tiers 2/3 (12 remaining attacker-only txs) need the `contractCall`
 * envelope path (cosmjs-builds the unsigned tx, BitGo TSS signs the
 * bytes via the wallet platform). Out of scope for this pass — they
 * are documented in REDO-REPORT.md's §3 with the expected behavior
 * once that path is wired.
 */
export interface RedoSpec {
  key: string;
  bitgoIntent: 'transfer' | 'StakingActivate' | 'StakingDeactivate' | 'StakingWithdraw' | 'StakingSwitchValidator';
  msgType: string;
  description: string;
  /** usei to send to the redo wallet so it has enough for the action + gas. */
  fundingUsei: string;
  /** for staking actions, the action amount (subset of funding). */
  actionUsei?: string;
  expectedIndexer: string;
}

export const REDO_LIST: RedoSpec[] = [
  {
    key: 'redo-bank-msgsend-selfloop',
    bitgoIntent: 'transfer',
    msgType: '/cosmos.bank.v1beta1.MsgSend',
    description: 'BitGo wallet sends to itself (covers selfloop + same-address-twice indexer paths)',
    fundingUsei: '50000',
    actionUsei: '500',
    expectedIndexer:
      'Indexer should write `transactions` row with two matched Transfer entries (debit + credit) on the same address. ' +
      '`balances.b` net-change should be -fee only. If it double-credits, that is a parser bug.',
  },
  {
    key: 'redo-staking-msgdelegate',
    bitgoIntent: 'StakingActivate',
    msgType: '/cosmos.staking.v1beta1.MsgDelegate',
    description: 'BitGo wallet delegates to a validator',
    fundingUsei: '80000',
    actionUsei: '10000',
    expectedIndexer:
      'Indexer should write `transactions` row + Transfer −10000 (coin_spent on delegator) + Fee debit. ' +
      '`balances.s` (staked) should increase by 10000, `b` (spendable) decrease by 10000+fee. ' +
      'Watch for phantom `coin_received` entry on bonded_tokens_pool module account `sei1fl48vsn...` — ' +
      'that is the §5.1 fee-collector gap reproduction.',
  },
  {
    key: 'redo-staking-msgundelegate',
    bitgoIntent: 'StakingDeactivate',
    msgType: '/cosmos.staking.v1beta1.MsgUndelegate',
    description: 'BitGo wallet undelegates (deferred-emission path)',
    fundingUsei: '60000',
    actionUsei: '5000',
    expectedIndexer:
      'Indexer should write `transactions` row with zero-value Transfer (DEFERRED_EMISSION) + Fee debit + pending payback record. ' +
      'Principal returns at completion_time (testnet ~21 days). `balances.s` decreases by 5000 immediately; `b` increases later. ' +
      'Auto-claimed rewards (if any) should fire as a separate Transfer entry tagged isReward=true.',
  },
  {
    key: 'redo-staking-msgbeginredelegate',
    bitgoIntent: 'StakingSwitchValidator',
    msgType: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
    description: 'BitGo wallet redelegates between validators',
    fundingUsei: '70000',
    actionUsei: '1000',
    expectedIndexer:
      'Indexer should write `transactions` row + Fee debit. NO Transfer entry for the share move (no bank event). ' +
      '`redelegate` event fires but parser switch does NOT handle it (§4 broken bucket — WRONG_EVENT_HANDLING). ' +
      'Auto-claimed rewards (if any) should still appear. Liquid `b` unchanged; `s` unchanged total.',
  },
  {
    key: 'redo-staking-msgwithdrawdelegatorreward',
    bitgoIntent: 'StakingWithdraw',
    msgType: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    description: 'BitGo wallet withdraws delegation rewards',
    fundingUsei: '40000',
    expectedIndexer:
      'Indexer should write `transactions` row + Transfer entry tagged isReward=true (positive on BitGo wallet). ' +
      '`balances.b` increases by withdrawn rewards minus fee. `balances.r` (rewards) should reset to 0.',
  },
  {
    key: 'redo-bank-msgsend-fanout',
    bitgoIntent: 'transfer',
    msgType: '/cosmos.bank.v1beta1.MsgSend',
    description: 'BitGo wallet sends to attacker (counterparty receive — sanity)',
    fundingUsei: '50000',
    actionUsei: '500',
    expectedIndexer:
      'Indexer should write `transactions` row + Transfer −500 (coin_spent on BitGo wallet) + Fee debit. ' +
      '`balances.b` decreases by 500+fee. The recipient (attacker) is NOT tracked, so only the sender side appears.',
  },
];

export function pickIntent(spec: RedoSpec): {
  type: string;
  /** any extra fields sendMany needs */
  extra: Record<string, unknown>;
} {
  return {
    type: spec.bitgoIntent,
    extra: {},
  };
}
