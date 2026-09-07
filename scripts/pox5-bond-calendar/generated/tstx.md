# PoX-5 bond calendar

All dates are estimates derived from each network anchor and its average block interval.

## tstx (stacks-public-testnet, STX-only)

- pox-5 activation: burn height 2702
- reward cycle: 900 burn blocks (prepare phase: last 100)
- average block interval: 120s
- anchor 27300 @ 2026-10-14T12:03:27Z (resolved via default); roughly 97 burn blocks have elapsed since the anchor, so far-future dates drift by the difference between real and average block production
- SIP-045 note: the L1 timelock is normally set to expire 1050 blocks before the bonding period ends (renewal window)

### Upcoming reward cycles (tstx)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| reward-cycle | 27902 | 2026-10-15 08:07:27Z | tstx — reward cycle 28 starts |
| reward-cycle | 28802 | 2026-10-16 14:07:27Z | tstx — reward cycle 29 starts |

### Bond stx-only-testnet (tstx)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| registration-window | 28000 | 2026-10-15 11:23:27Z | tstx stx-only-testnet — STX stake start |
| reward-cycle | 27902 | 2026-10-15 08:07:27Z | tstx stx-only-testnet — reward cycle 28 |
| reward-cycle | 28802 | 2026-10-16 14:07:27Z | tstx stx-only-testnet — reward cycle 29 |
| reward-cycle | 29702 | 2026-10-17 20:07:27Z | tstx stx-only-testnet — reward cycle 30 |
| reward-cycle | 30602 | 2026-10-19 02:07:27Z | tstx stx-only-testnet — reward cycle 31 |
| stx-lock-end | 31502 | 2026-10-20 08:07:27Z | tstx stx-only-testnet — STX lock end |

Parameter sources:

- SIP-045 section 3.1.2 (bond timing)
- stacks-core stackslib/src/burnchains/mod.rs nakamoto_testnet_default()
- Linear SI-1143 (testnet pox-5 activation height 2702)
- Hiro api.testnet.hiro.so network_block_times + burn block 27300 (fetched 2026-10-14)

Safety margin for post-CLTV recovery: 6 burn blocks.
