# PoX-5 bond calendar

All dates are estimates derived from each network anchor and its average block interval.

## tbtcstx (stacks-public-testnet, BTC-backed)

- pox-5 activation: burn height 2702
- reward cycle: 900 burn blocks (prepare phase: last 100)
- average block interval: 120s
- anchor 27300 @ 2026-10-14T12:03:27Z (resolved via default); roughly 97 burn blocks have elapsed since the anchor, so far-future dates drift by the difference between real and average block production
- SIP-045 note: the L1 timelock is normally set to expire 1050 blocks before the bonding period ends (renewal window)

### Upcoming reward cycles (tbtcstx)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| reward-cycle | 27902 | 2026-10-15 08:07:27Z | tbtcstx — reward cycle 28 starts |
| reward-cycle | 28802 | 2026-10-16 14:07:27Z | tbtcstx — reward cycle 29 starts |

### Bond public-testnet-smoke (tbtcstx)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| registration-window | 3602 | 2026-09-11 14:07:27Z | tbtcstx public-testnet-smoke (50000) — register-for-bond window |
| reward-cycle | 27902 | 2026-10-15 08:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 28 |
| reward-cycle | 28802 | 2026-10-16 14:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 29 |
| reward-cycle | 29702 | 2026-10-17 20:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 30 |
| reward-cycle | 30602 | 2026-10-19 02:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 31 |
| reward-cycle | 31502 | 2026-10-20 08:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 32 |
| reward-cycle | 32402 | 2026-10-21 14:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 33 |
| reward-cycle | 33302 | 2026-10-22 20:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 34 |
| reward-cycle | 34202 | 2026-10-24 02:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 35 |
| reward-cycle | 35102 | 2026-10-25 08:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 36 |
| reward-cycle | 36002 | 2026-10-26 14:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 37 |
| reward-cycle | 36902 | 2026-10-27 20:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 38 |
| reward-cycle | 37802 | 2026-10-29 02:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 39 |
| reward-cycle | 38702 | 2026-10-30 08:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 40 |
| reward-cycle | 39602 | 2026-10-31 14:07:27Z | tbtcstx public-testnet-smoke (50000) — reward cycle 41 |
| cltv-unlock | 40000 | 2026-11-01 03:23:27Z | tbtcstx public-testnet-smoke (50000) — CLTV unlock |
| post-cltv-recovery | 40006 | 2026-11-01 03:35:27Z | tbtcstx public-testnet-smoke (50000) — post-CLTV recovery (earliest) |

Parameter sources:

- SIP-045 section 3.1.2 (bond timing)
- stacks-core stackslib/src/burnchains/mod.rs nakamoto_testnet_default()
- Linear SI-1143 (testnet pox-5 activation height 2702)
- Hiro api.testnet.hiro.so network_block_times + burn block 27300 (fetched 2026-10-14)

Safety margin for post-CLTV recovery: 6 burn blocks.
