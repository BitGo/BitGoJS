import {
  Address,
  BitGoWallet,
  ChainCode,
  CodeGroups,
  CodesByPurpose, Recipient, Send, sumUnspents, Timechain,
  Unspent,
  WalletConfig,
  WalletLimits,
} from './types';
import { Codes } from '@bitgo/unspents';
import { dumpUnspentsLong } from './display';

export type ResetState = undefined | {
  excessUnspents: boolean,
  missingUnspents: boolean
}

export class ManagedWallet {
  public constructor(
    public usedWallets: Set<BitGoWallet>,
    public chain: Timechain,
    public walletConfig: WalletConfig,
    public wallet: BitGoWallet,
    public unspents: Unspent[],
    public addresses: Address[]
  ) {
  }

  public getWalletLimits(): WalletLimits {
    const minUnspentBalance = 0.001e8;
    const maxUnspentBalance = minUnspentBalance * 4;
    const resetUnspentBalance = minUnspentBalance * 2;
    return {
      minUnspentBalance,
      maxUnspentBalance,
      resetUnspentBalance,
    };
  }

  public isUsed(): boolean {
    return this.usedWallets.has(this.wallet);
  }

  public setUsed() {
    this.usedWallets.add(this.wallet);
  }

  public isReady(): boolean {
    return this.getRequiredUnspents(
      this.unspents.filter((u) => this.chain.getConfirmations(u) > 2)
    ).every(([/* code */, count]) => count <= 0);
  }

  public async getAddress({ chain }) {
    let addr = this.addresses.find((a) => a.chain === chain);
    if (addr) {
      return addr;
    }

    addr = await this.wallet.createAddress({ chain }) as Address;
    if (addr.chain !== chain) {
      throw new Error(`unexpected chain ${addr.chain}, expected ${chain}`);
    }
    this.addresses.push(addr);
    return addr;
  }

  private getAllowedUnspents(unspents: Unspent[]): Unspent[] {
    const valueInRange = (value) =>
      (this.getWalletLimits().minUnspentBalance < value) && (value < this.getWalletLimits().maxUnspentBalance);

    return CodeGroups
      .map((grp) =>
        unspents
          .filter((u) => grp.has(u.chain) && valueInRange(u.value))
          .slice(0, this.walletConfig.getMaxUnspents(grp))
      )
      .reduce((all, us) => [...all, ...us]);
  }

  private getExcessUnspents(unspents: Unspent[]): Unspent[] {
    const allowedUnspents = this.getAllowedUnspents(unspents);
    return unspents.filter((u) => !allowedUnspents.includes(u));
  }

  public getRequiredUnspents(unspents: Unspent[]): [ChainCode, number][] {
    const limits = this.getWalletLimits();

    const allowedUnspents = this.getAllowedUnspents(unspents);

    return [Codes.p2sh, Codes.p2shP2wsh, Codes.p2wsh]
      .map((codes: CodesByPurpose): [ChainCode, number] => {
        const count = allowedUnspents
          .filter((u) => u.value > limits.minUnspentBalance)
          .filter((u) => codes.has(u.chain)).length;
        const resetCount = (min, count) => (count >= min) ? 0 : 2 * min - count;
        return [codes.external, resetCount(this.walletConfig.getMinUnspents(codes), count)];
      });
  }

  public needsReset(): ResetState {
    const excessUnspents = this.getExcessUnspents(this.unspents);
    const missingUnspents = this.getRequiredUnspents(this.unspents)
      .filter(([/* code */, count]) => count > 0);

    const hasExcessUnspents = excessUnspents.length > 0;
    const hasMissingUnspent = missingUnspents.length > 0;

    const needsReset = hasExcessUnspents || hasMissingUnspent;

    /*
    debug(`needsReset ${this.wallet.label()}=${needsReset}`);
    debug(` unspents=${dumpUnspents(this.unspents, this.chain)}`);
    debug(` allowedUnspents=${dumpUnspents(this.getAllowedUnspents(this.unspents), this.chain)}`);
    debug(` excessUnspents=${dumpUnspents(excessUnspents, this.chain)}`);
    debug(` missingUnspents=${missingUnspents.map(([code, count]) => `code=${code},count=${count}`)}`);
    */

    if (needsReset) {
      return {
        excessUnspents: hasExcessUnspents,
        missingUnspents: hasMissingUnspent,
      };
    }
  }

  public async getResetRecipients(us: Unspent[]): Promise<Recipient[]> {
    return (await Promise.all(this.getRequiredUnspents(us)
      .map(async([chain, count]) => {
        if (count <= 0) {
          return [];
        }
        return Promise.all(
          Array(count).fill(0).map(
            async() => (await this.getAddress({ chain })).address
          )
        );
      })
    ))
      .reduce((all, rs) => [...all, ...rs])
      .map((address) => ({
        address,
        amount: this.getWalletLimits().resetUnspentBalance,
      }));
  }

  /**
   * List of source-target pairs
   */
  public async getSends(faucet: ManagedWallet, feeRate: number): Promise<Send[]> {
    if (!this.needsReset()) {
      return [];
    }
    const sends: Send[] = [];
    const faucetAddress = (await faucet.getAddress({ chain: 20 })).address;

    const excessUnspents = this.getExcessUnspents(this.unspents);
    if (excessUnspents.length > 0) {
      const refundAmount = this.chain.getMaxSpendable(excessUnspents, [faucetAddress], feeRate);
      sends.push({
        source: this.wallet,
        unspents: excessUnspents.map((u) => u.id),
        recipients: [{ address: faucetAddress, amount: refundAmount }],
      });
    }

    const resetRecipients = await this.getResetRecipients(this.unspents);
    if (resetRecipients.length > 0) {
      sends.push({
        source: faucet.wallet,
        recipients: resetRecipients,
      });
    }

    return sends;
  }

  public toString(): string {
    return `ManagedWallet[${this.wallet.label()}]`;
  }

  public dump() {
    return [
      (`wallet ${this.wallet.label()}`),
      (` unspents ` + dumpUnspentsLong(this.unspents, this.chain)),
      (` balance ` + sumUnspents(this.unspents)),
      (` needsReset ` + this.needsReset()),
    ].join('\n');
  }
}

