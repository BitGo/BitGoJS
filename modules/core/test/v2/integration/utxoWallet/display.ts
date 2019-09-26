import { table } from 'table';
import { CodeGroups, GroupPureP2sh, Timechain, Unspent, WalletConfig, WalletLimits } from './types';
import { ManagedWallet, ResetState } from './ManagedWallet';


export const dumpUnspentsLong = (unspents: Unspent[], chain?: Timechain, { value = false } = {}): string =>
  unspents
    .map((u) => ({
      chain: u.chain,
      conf: chain ? chain.getConfirmations(u) : undefined,
      ...(value ? { value: u.value } : {}),
    }))
    .map((obj) =>
      `{${Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(',')}}`
    )
    .join(',');


export const formatTable = (
  headers: string[],
  columns: string[][],
): string =>
  table([headers, ...columns], {
    drawHorizontalLine: (i, size) => i === 0 || i === 1 || i === size,
  });


class MWTable {
  static tableHeaders = ['wallet', 'p2sh', 'p2shP2wsh', 'p2wsh', 'state'];

  static getWalletRow(
    label: string,
    chain: Timechain,
    unspents: Unspent[],
    walletConfig: WalletConfig,
    walletLimits: WalletLimits,
    resetState: ResetState
  ): string[] {
    const minConfirms = 3;
    return [label, ...CodeGroups
      .map((g) => unspents.filter(u => g.has(u.chain)))
      .map((us) => ({
        nUnspents: us.length,
        nUnconfirmed: us.filter((u) => chain.getConfirmations(u) < minConfirms).length,
        nSubminBalance: us.filter((u) => u.value < walletLimits.minUnspentBalance).length,
        nExcessBalance: us.filter((u) => u.value > walletLimits.maxUnspentBalance).length,
      }))
      .map(({
        nUnspents: v,
        nUnconfirmed: u,
        nSubminBalance: s,
        nExcessBalance: x,
      }) =>
        `${v === 0 ? '-' : v} ${
          (u + s + x) === 0
            ? ''
            : `(${[u, s, x].map((w, i) =>
              w > 0
                ? `${w}${['u', '▼', '▲'][i]}`
                : null
            )
              .filter(v => v !== null)
              .join(' ')
            })`
        }`
      ),
    resetState ?
      (
        (resetState.excessUnspents ? 'X' : '') +
          (resetState.missingUnspents ? 'M' : '')
      ) : '🗸',
    ];
  }

  static getWalletRows(managedWallets: ManagedWallet[]) {
    const ord = (mw) => Number(mw.wallet.label().split('/')[2]);
    managedWallets.sort((a, b) => ord(a) - ord(b));
    return managedWallets.map((mw) =>
      this.getWalletRow(
        mw.wallet.label().replace(/^managed\//, ''),
        mw.chain,
        mw.unspents,
        mw.walletConfig,
        mw.getWalletLimits(),
        mw.needsReset()
      )
    );
  }
}

export const formatWalletTable = (managedWallets: ManagedWallet[]) =>
  formatTable(
    MWTable.tableHeaders,
    MWTable.getWalletRows(managedWallets)
  );

if (require.main === module) {
  const chain = new Timechain(100, {});
  const unspents = [
    { blockHeight: 50, value: 1000, chain: 0 },
    { blockHeight: 50, value: 100, chain: 0 },
    { blockHeight: 99, value: 1000, chain: 0 },
    { blockHeight: 99, value: 1000, chain: 10 },
  ] as Unspent[];
  const walletConfig = GroupPureP2sh;
  const walletLimits: WalletLimits = {
    minUnspentBalance: 1000,
    maxUnspentBalance: 2000,
    resetUnspentBalance: 10000,
  };

  const columms = Array(32).fill(0).map(
    (v, i) => MWTable.getWalletRow(
      `w${i}`, chain, unspents, walletConfig, walletLimits,
      { excessUnspents: true, missingUnspents: true }
    )
  );
  console.log(
    formatTable(MWTable.tableHeaders, columms)
  );
}
