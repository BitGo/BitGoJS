# PoX-5 bond calendar

All dates are estimates derived from each network anchor and its average block interval.

## btc (bitcoin-mainnet, BTC-backed)

- pox-5 activation: burn height 960230
- reward cycle: 2100 burn blocks (prepare phase: last 100)
- average block interval: 600s
- anchor 960230 @ 2026-07-30T08:32:18Z (resolved via default); roughly 10984 burn blocks have elapsed since the anchor, so far-future dates drift by the difference between real and average block production
- SIP-045 note: the L1 timelock is normally set to expire 1050 blocks before the bonding period ends (renewal window)

### Upcoming reward cycles (btc)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| reward-cycle | 972830 | 2026-10-25 20:32:18Z | btc — reward cycle 6 starts |
| reward-cycle | 974930 | 2026-11-09 10:32:18Z | btc — reward cycle 7 starts |

### Bond mainnet-smoke (btc)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| registration-window | 962330 | 2026-08-13 22:32:18Z | btc mainnet-smoke (1000000) — register-for-bond window |
| reward-cycle | 960230 | 2026-07-30 08:32:18Z | btc mainnet-smoke (1000000) — reward cycle 0 |
| reward-cycle | 962330 | 2026-08-13 22:32:18Z | btc mainnet-smoke (1000000) — reward cycle 1 |
| reward-cycle | 964430 | 2026-08-28 12:32:18Z | btc mainnet-smoke (1000000) — reward cycle 2 |
| reward-cycle | 966530 | 2026-09-12 02:32:18Z | btc mainnet-smoke (1000000) — reward cycle 3 |
| reward-cycle | 968630 | 2026-09-26 16:32:18Z | btc mainnet-smoke (1000000) — reward cycle 4 |
| reward-cycle | 970730 | 2026-10-11 06:32:18Z | btc mainnet-smoke (1000000) — reward cycle 5 |
| reward-cycle | 972830 | 2026-10-25 20:32:18Z | btc mainnet-smoke (1000000) — reward cycle 6 |
| reward-cycle | 974930 | 2026-11-09 10:32:18Z | btc mainnet-smoke (1000000) — reward cycle 7 |
| reward-cycle | 977030 | 2026-11-24 00:32:18Z | btc mainnet-smoke (1000000) — reward cycle 8 |
| reward-cycle | 979130 | 2026-12-08 14:32:18Z | btc mainnet-smoke (1000000) — reward cycle 9 |
| reward-cycle | 981230 | 2026-12-23 04:32:18Z | btc mainnet-smoke (1000000) — reward cycle 10 |
| reward-cycle | 983330 | 2027-01-06 18:32:18Z | btc mainnet-smoke (1000000) — reward cycle 11 |
| reward-cycle | 985430 | 2027-01-21 08:32:18Z | btc mainnet-smoke (1000000) — reward cycle 12 |
| reward-cycle | 987530 | 2027-02-04 22:32:18Z | btc mainnet-smoke (1000000) — reward cycle 13 |
| reward-cycle | 989630 | 2027-02-19 12:32:18Z | btc mainnet-smoke (1000000) — reward cycle 14 |
| reward-cycle | 991730 | 2027-03-06 02:32:18Z | btc mainnet-smoke (1000000) — reward cycle 15 |
| reward-cycle | 993830 | 2027-03-20 16:32:18Z | btc mainnet-smoke (1000000) — reward cycle 16 |
| reward-cycle | 995930 | 2027-04-04 06:32:18Z | btc mainnet-smoke (1000000) — reward cycle 17 |
| reward-cycle | 998030 | 2027-04-18 20:32:18Z | btc mainnet-smoke (1000000) — reward cycle 18 |
| reward-cycle | 1000130 | 2027-05-03 10:32:18Z | btc mainnet-smoke (1000000) — reward cycle 19 |
| reward-cycle | 1002230 | 2027-05-18 00:32:18Z | btc mainnet-smoke (1000000) — reward cycle 20 |
| reward-cycle | 1004330 | 2027-06-01 14:32:18Z | btc mainnet-smoke (1000000) — reward cycle 21 |
| reward-cycle | 1006430 | 2027-06-16 04:32:18Z | btc mainnet-smoke (1000000) — reward cycle 22 |
| reward-cycle | 1008530 | 2027-06-30 18:32:18Z | btc mainnet-smoke (1000000) — reward cycle 23 |
| cltv-unlock | 1050000 | 2028-04-13 18:12:18Z | btc mainnet-smoke (1000000) — CLTV unlock |
| post-cltv-recovery | 1050006 | 2028-04-13 19:12:18Z | btc mainnet-smoke (1000000) — post-CLTV recovery (earliest) |

Parameter sources:

- SIP-045 section 3.1.2 (bond timing)
- stacks-core stacks-common/src/types/mod.rs BITCOIN_MAINNET_STACKS_40_BURN_HEIGHT
- stacks-core stackslib/src/core/mod.rs POX_REWARD_CYCLE_LENGTH / POX_PREPARE_WINDOW_LENGTH
- Linear WAL-2149 (pox-5 activated at burn height 960230)
- blockstream.info block 960230 timestamp (verified 2026-10-14)

Safety margin for post-CLTV recovery: 6 burn blocks.
