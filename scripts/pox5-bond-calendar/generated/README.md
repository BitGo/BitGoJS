# Generated PoX-5 bond calendars

Snapshot outputs of the bond calendar tool, checked in for review convenience — one `.ics` calendar and one `.md` report per network.

| Network       | Calendar            | Report             |
| ------------- | ------------------- | ------------------ |
| btc           | `btc.ics`           | `btc.md`           |
| tbtcstx       | `tbtcstx.ics`       | `tbtcstx.md`       |
| tstx          | `tstx.ics`          | `tstx.md`          |
| tbtcstxsignet | `tbtcstxsignet.ics` | `tbtcstxsignet.md` |
| tbtcbgsig     | `tbtcbgsig.ics`     | `tbtcbgsig.md`     |
| tstxsignet    | `tstxsignet.ics`    | `tstxsignet.md`    |

Regenerate after changing network parameters, bond inputs or anchors:

```sh
./node_modules/.bin/tsx scripts/pox5-bond-calendar/index.ts \
  --bonds scripts/pox5-bond-calendar/example-bonds.json \
  --live tbtcstxsignet=hiro:https://api.staking-testnet.hiro.so \
  --anchor tbtcbgsig=<height>@<ISO8601> \
  --anchor tstxsignet=<height>@<ISO8601> \
  --out-dir scripts/pox5-bond-calendar/generated
```

Notes:

- All dates are estimates derived from each network anchor and its average block interval; each report states its anchor and resolution source.
- The signet anchors above are placeholders for the BitGo private signets and the Stacks Foundation staking-testnet, which publish no public chain state. Replace them with real `--anchor <coin>=<height>@<ISO8601>` values (or `--live` against an endpoint you control) before using the dates operationally. For `tbtcstxsignet` the staking-testnet Stacks API resolves the anchor live, as in the command above.
- The `tbtcstxsignet` chain was reset in October 2026 and now produces blocks on a fixed ~2-minute cadence (previously assumed ~10 minutes). The checked-in snapshots for `tbtcstxsignet` predate that reset (their anchor references burn height 41000 from the old chain); regenerate with a live anchor before using the dates.
- Bonds without `numCycles` are capped at 24 reward-cycle events (SIP-045 section 3.1.2: one bonding period contains 24 distributions).
