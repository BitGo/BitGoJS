# PoX-5 bond calendar

All dates are estimates derived from each network anchor and its average block interval.

## tstxsignet (stacks-foundation-private-signet, STX-only)

- pox-5 activation: burn height 0
- reward cycle: 10 burn blocks (prepare phase: last 3)
- average block interval: 600s
- anchor 450 @ 2026-10-13T10:00:00Z (resolved via override); roughly 175 burn blocks have elapsed since the anchor, so far-future dates drift by the difference between real and average block production
- SIP-045 note: the L1 timelock is normally set to expire 1050 blocks before the bonding period ends (renewal window)

### Upcoming reward cycles (tstxsignet)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| reward-cycle | 630 | 2026-10-14 16:00:00Z | tstxsignet — reward cycle 63 starts |
| reward-cycle | 640 | 2026-10-14 17:40:00Z | tstxsignet — reward cycle 64 starts |

### Bond foundation-signet-stake (tstxsignet)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| registration-window | 500 | 2026-10-13 18:20:00Z | tstxsignet foundation-signet-stake — STX stake start |
| reward-cycle | 500 | 2026-10-13 18:20:00Z | tstxsignet foundation-signet-stake — reward cycle 50 |
| reward-cycle | 510 | 2026-10-13 20:00:00Z | tstxsignet foundation-signet-stake — reward cycle 51 |
| reward-cycle | 520 | 2026-10-13 21:40:00Z | tstxsignet foundation-signet-stake — reward cycle 52 |
| reward-cycle | 530 | 2026-10-13 23:20:00Z | tstxsignet foundation-signet-stake — reward cycle 53 |
| reward-cycle | 540 | 2026-10-14 01:00:00Z | tstxsignet foundation-signet-stake — reward cycle 54 |
| reward-cycle | 550 | 2026-10-14 02:40:00Z | tstxsignet foundation-signet-stake — reward cycle 55 |
| stx-lock-end | 560 | 2026-10-14 04:20:00Z | tstxsignet foundation-signet-stake — STX lock end |

Parameter sources:

- SIP-045 section 3.1.2 (bond timing)
- stacks-core stackslib/src/burnchains/burnchain.rs ("bitcoin","signet") => signet_default()
- stacks-core stackslib/src/burnchains/mod.rs signet_default() (reward 10 / prepare 3)
- bitgo-workspace modules/statics/src/networks.ts StxSignet (chain ID 1280)

Safety margin for post-CLTV recovery: 6 burn blocks.
