# PoX-5 bond calendar

All dates are estimates derived from each network anchor and its average block interval.

## tbtcbgsig (bitgo-private-signet, BTC-backed)

- pox-5 activation: burn height 0
- reward cycle: 10 burn blocks (prepare phase: last 3)
- average block interval: 600s
- anchor 41000 @ 2026-10-13T10:00:00Z (resolved via override); roughly 175 burn blocks have elapsed since the anchor, so far-future dates drift by the difference between real and average block production
- SIP-045 note: the L1 timelock is normally set to expire 1050 blocks before the bonding period ends (renewal window)

### Upcoming reward cycles (tbtcbgsig)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| reward-cycle | 41180 | 2026-10-14 16:00:00Z | tbtcbgsig — reward cycle 4118 starts |
| reward-cycle | 41190 | 2026-10-14 17:40:00Z | tbtcbgsig — reward cycle 4119 starts |

### Bond bgsig-smoke (tbtcbgsig)

| Event | Burn height | Estimated UTC date | Summary |
| --- | --- | --- | --- |
| registration-window | 10 | 2026-01-01 18:20:00Z | tbtcbgsig bgsig-smoke (250000) — register-for-bond window |
| reward-cycle | 0 | 2026-01-01 16:40:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 0 |
| reward-cycle | 10 | 2026-01-01 18:20:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 1 |
| reward-cycle | 20 | 2026-01-01 20:00:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 2 |
| reward-cycle | 30 | 2026-01-01 21:40:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 3 |
| reward-cycle | 40 | 2026-01-01 23:20:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 4 |
| reward-cycle | 50 | 2026-01-02 01:00:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 5 |
| reward-cycle | 60 | 2026-01-02 02:40:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 6 |
| reward-cycle | 70 | 2026-01-02 04:20:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 7 |
| reward-cycle | 80 | 2026-01-02 06:00:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 8 |
| reward-cycle | 90 | 2026-01-02 07:40:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 9 |
| reward-cycle | 100 | 2026-01-02 09:20:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 10 |
| reward-cycle | 110 | 2026-01-02 11:00:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 11 |
| reward-cycle | 120 | 2026-01-02 12:40:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 12 |
| reward-cycle | 130 | 2026-01-02 14:20:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 13 |
| reward-cycle | 140 | 2026-01-02 16:00:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 14 |
| reward-cycle | 150 | 2026-01-02 17:40:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 15 |
| reward-cycle | 160 | 2026-01-02 19:20:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 16 |
| reward-cycle | 170 | 2026-01-02 21:00:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 17 |
| reward-cycle | 180 | 2026-01-02 22:40:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 18 |
| reward-cycle | 190 | 2026-01-03 00:20:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 19 |
| reward-cycle | 200 | 2026-01-03 02:00:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 20 |
| reward-cycle | 210 | 2026-01-03 03:40:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 21 |
| reward-cycle | 220 | 2026-01-03 05:20:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 22 |
| reward-cycle | 230 | 2026-01-03 07:00:00Z | tbtcbgsig bgsig-smoke (250000) — reward cycle 23 |
| cltv-unlock | 42000 | 2026-10-20 08:40:00Z | tbtcbgsig bgsig-smoke (250000) — CLTV unlock |
| post-cltv-recovery | 42006 | 2026-10-20 09:40:00Z | tbtcbgsig bgsig-smoke (250000) — post-CLTV recovery (earliest) |

Parameter sources:

- SIP-045 section 3.1.2 (bond timing)
- stacks-core stackslib/src/burnchains/burnchain.rs ("bitcoin","signet") => signet_default()
- stacks-core stackslib/src/burnchains/mod.rs signet_default() (reward 10 / prepare 3)
- bitgo-microservices wallet-platform app/base/utxo/staking/pox5/README.md

Safety margin for post-CLTV recovery: 6 burn blocks.
