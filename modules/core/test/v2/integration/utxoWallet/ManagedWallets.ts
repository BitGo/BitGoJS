import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

Bluebird.longStackTraces();

import * as nock from 'nock';

import makeDebug, { Debugger } from 'debug';

const debug = makeDebug('ManagedWallets');

import { BitGo, RequestTracer } from '../../../../src';
import * as moment from 'moment';
import { dumpUnspentsLong, formatWalletTable } from './display';
import {
  Address,
  BitGoWallet,
  CodeGroups,
  ManagedWalletPredicate,
  Send,
  Recipient,
  Timechain,
  Unspent,
  WalletConfig,
} from './types';
import { ManagedWallet } from './ManagedWallet';

const concurrencyBitGoApi = 4;

export const wait = async (seconds) => {
  debug(`waiting ${seconds} seconds...`);
  await Bluebird.delay(seconds * 1000);
  debug(`done`);
};

export class LabelTracer implements RequestTracer {
  counter: number = 0;
  constructor(public label: string) { }

  inc(): void {
    this.counter++;
  }

  toString(): string {
    const suffix =
      '-' + Math.random().toString(36).substr(6) +
      '-' + this.counter.toString().padStart(3, '0');

    const prefix = this.label
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, '')
      .substr(0, 40 - suffix.length);

    return prefix + suffix;
  }
}

class DryFaucetError extends Error {
  constructor(faucetWallet: BitGoWallet, spendAmount) {
    super(
      `Faucet has run dry ` +
      `[faucetBalance=${faucetWallet.balance()}, ` +
      `spendable=${faucetWallet.spendableBalance()}, ` +
      `sendAmount=${spendAmount}].`
      + `Please deposit tbtc at ${faucetWallet.receiveAddress()}.`
    );
  }
}

class ErrorExcessSendAmount extends Error {
  constructor(wallet: BitGoWallet, spendAmount) {
    super(
      `Invalid recipients: Receive amount exceeds wallet balance: ` +
      `[wallet=${wallet.label()},` +
      `balance=${wallet.balance()}, ` +
      `spendable=${wallet.spendableBalance()}, ` +
      `sendAmount=${spendAmount}].`
    );
  }
}

class ErrorInit extends Error {
  constructor() {
    super(`must call init() first`);
  }
}

// echo -n 'managed' | sha256sum
export const walletPassphrase = '7fdfda5f50a433ae127a784fc143105fb6d93fedec7601ddeb3d1d584f83de05';


const runCollectErrors = async <T>(
  items: T[],
  func: (v: T) => Promise<unknown>,
  options = { concurrency: concurrencyBitGoApi }
): Promise<Error[]> =>
  (
    await Bluebird.map(items, async(v): Promise<Error | null> => {
      try {
        await func(v);
        return null;
      } catch (e) {
        console.error(e);
        return e;
      }
    },
    options)
  ).filter((e) => e !== null) as Error[];

export class ManagedWallets {
  static async create(
    env: string,
    clientId: string,
    walletConfig: WalletConfig,
    poolSize: number = 32,
    { dryRun = false }: { dryRun?: boolean } = {}
  ): Promise<ManagedWallets> {
    const envPoolSize = 'BITGOJS_MW_POOL_SIZE';
    if (envPoolSize in process.env) {
      poolSize = Number(process.env[envPoolSize]);
      if (isNaN(poolSize)) {
        throw new Error(`invalid value for envvar ${envPoolSize}`);
      }
    }

    return (new ManagedWallets({
      env,
      username: clientId,
      walletConfig,
      poolSize,
      dryRun,
    })).init();
  }

  static testUserOTP() {
    return '0000000';
  }

  public getPredicateUnspentsConfirmed(confirmations: number): ManagedWalletPredicate {
    return (w: BitGoWallet, us: Unspent[]) =>
      us.every((u) => this.chain.getConfirmations(u) >= confirmations);
  }

  public _chain?: Timechain;

  public debug: Debugger;
  private username: string;
  private password: string;
  private clientLabel?: string;
  private _bitgo: BitGo;
  private _walletList?: BitGoWallet[];
  private _wallets?: Promise<BitGoWallet[]>;
  private usedWallets: Set<BitGoWallet> = new Set();
  private faucet: BitGoWallet;
  private walletUnspents: Map<BitGoWallet, Promise<Unspent[]>> = new Map();
  private walletAddresses: Map<BitGoWallet, Promise<Address[]>> = new Map();
  private walletConfig: WalletConfig;
  private poolSize: number;
  private labelPrefix: string;
  private dryRun: boolean;

  /**
   * Because we need an async operation to be ready, please use
   * `const wallets = yield TestWallets.create()` instead
   */
  private constructor(
    {
      env,
      username,
      walletConfig,
      poolSize,
      dryRun,
    }: {
      env: string,
      username: string,
      walletConfig: WalletConfig,
      poolSize: number,
      dryRun: boolean,
    }) {
    if (!['test', 'dev'].includes(env)) {
      throw new Error(`unsupported env "${env}"`);
    }
    this.debug = debug.extend(`[${env}/${walletConfig.name}]`);
    const password = process.env.BITGOJS_TEST_PASSWORD;
    if (!password) {
      throw new Error(`envvar BITGOJS_TEST_PASSWORD must be set`);
    }
    this.password = password;
    if (!this.password) {
      throw new Error(`envvar not set: BITGOJS_TEST_PASSWORD`);
    }
    this.username = username;
    // @ts-ignore
    this._bitgo = new BitGo({ env });
    this.poolSize = poolSize;
    this.walletConfig = walletConfig;
    this.labelPrefix = `managed/${walletConfig.name}`;
    this.dryRun = dryRun;
  }

  private static withInit<T>(v: T | undefined): T {
    if (!v) {
      throw new ErrorInit();
    }
    return v;
  }

  public setClientLabel(label: string) {
    this.clientLabel = label;
  }

  public get bitgo(): any {
    if (this.clientLabel) {
      this._bitgo.setRequestTracer(new LabelTracer(this.clientLabel));
    }
    return this._bitgo;
  }

  public get basecoin(): any {
    return this.bitgo.coin('tbtc');
  }

  public get chain(): Timechain {
    return ManagedWallets.withInit(this._chain);
  }

  public get wallets(): Promise<BitGoWallet[]> {
    return ManagedWallets.withInit(this._wallets);
  }

  public get walletList(): BitGoWallet[] {
    return ManagedWallets.withInit(this._walletList);
  }

  public async cleanup() {
    await wait(10);
    const errors: Error[] = [];

    try {
      await this.resetWallets();
      this.debug('resetWallets() finished without error');
    } catch (e) {
      console.error(e);
      errors.push(e);
    }

    try {
      await this.checkTransfers();
      this.debug('checkTransfers() finished without error');
    } catch (e) {
      console.error(e);
      errors.push(e);
    }

    if (errors.length > 0) {
      throw new Error(`errors in after() hook`);
    }
  }

  private isValidLabel(label) {
    return label.startsWith(this.labelPrefix);
  }

  private getLabelForIndex(i: number) {
    return `${this.labelPrefix}/${i}`;
  }

  private getWalletIndex(wallet: BitGoWallet): number {
    const idx = wallet.label().replace(`^${this.labelPrefix}`, '');
    if (isNaN(idx)) {
      throw new Error(`cannot determine index from ${wallet.label()}`);
    }
    return Number(idx);
  }

  private async init(): Promise<this> {
    this.debug(`init poolSize=${this.poolSize}`);
    nock.cleanAll();
    nock.enableNetConnect();
    await this.bitgo.fetchConstants();

    const { height } = await this.bitgo.get(this.basecoin.url('/public/block/latest')).result();
    this.debug('chainHeight=', height);
    this._chain = new Timechain(height, this.basecoin._network);

    const response = await this.bitgo.authenticate({
      username: this.username,
      password: this.password,
      otp: ManagedWallets.testUserOTP(),
    });

    if (!response['access_token']) {
      throw new Error(`no access_token in response`);
    }

    await this.bitgo.unlock({ otp: ManagedWallets.testUserOTP() });

    this.debug(`fetching wallets for ${this.username}...`);
    this._walletList = await this.getWalletList();

    this.faucet = await this.getWalletWithLabel('managed-faucet', { create: true });

    this._wallets = (async() => await Bluebird.map(
      Array(this.poolSize).fill(null).map((v, i) => i),
      (i) => this.getWalletWithLabel(this.getLabelForIndex(i), { create: !this.dryRun }),
      { concurrency: 4 }
    ))();

    return this;
  }

  /**
   * In order to quickly find a wallet with a certain label, we need to get a list of all wallets.
   * @return {*}
   */
  private async getWalletList() {
    const allWallets: BitGoWallet[] = [];
    let prevId;
    do {
      const page = await this.basecoin.wallets().list({ prevId, limit: 100 });
      prevId = page.nextBatchPrevId;
      allWallets.push(...page.wallets);
    } while (prevId !== undefined);
    return allWallets;
  }

  public async getAddresses(w: BitGoWallet, { cache = true }: { cache?: boolean } = {}): Promise<Address[]> {
    if (!this.walletAddresses.has(w) || !cache) {
      this.walletAddresses.set(w, (async(): Promise<Address[]> =>
        (await Bluebird.map(
          CodeGroups,
          async(group) => (await w.addresses({ limit: 100, chains: group.values })).addresses,
          { concurrency: 2 }
        )).reduce((all, addrs) => [...all, ...addrs])
      )());
    }
    return this.walletAddresses.get(w) as Promise<Address[]>;
  }

  public async getUnspents(w: BitGoWallet, { cache = true }: { cache?: boolean } = {}): Promise<Unspent[]> {
    if (!this.walletUnspents.has(w) || !cache) {
      this.walletUnspents.set(w, ((async() => {
        const all: Unspent[] = [];
        let prevId;
        do {
          const page = await w.unspents({ prevId, limit: 500 });
          all.push(...page.unspents);
          prevId = page.nextBatchPrevId;
        } while (prevId !== undefined);
        return all;
      }))());
    }
    return this.walletUnspents.get(w) as Promise<Unspent[]>;
  }

  /**
   * Returns a wallet with given label. If wallet with label does not exist yet, create it.
   * @param allWallets
   * @param create - if true, creates new wallet with label if one doesn't exist. Throws error otherwise.
   * @param label
   * @return {*}
   */
  public async getWalletWithLabel(label: string, { create }: { create: boolean }): Promise<BitGoWallet> {
    const walletsWithLabel = this.walletList
      .filter(w => w.label() === label);
    if (walletsWithLabel.length < 1) {
      this.debug(`no wallet with label ${label} - creating new wallet...`);
      if (!create) {
        throw new Error(`not creating new wallet (create=false)`);
      }
      const { wallet } = await this.basecoin.wallets().generateWallet({
        label,
        passphrase: walletPassphrase,
      });
      this.walletUnspents.set(wallet, Promise.resolve([]));
      return wallet;
    } else if (walletsWithLabel.length === 1) {
      this.debug(`fetching wallet ${label}...`);
      const thinWallet = walletsWithLabel[0];
      const walletId = thinWallet.id();
      const wallet = await this.basecoin.wallets().get({ id: walletId });
      this.getUnspents(wallet);
      return wallet;
    } else {
      throw new Error(`More than one wallet with label ${label}. Please remove duplicates.`);
    }
  }

  public async getAll(): Promise<ManagedWallet[]> {
    return Bluebird.map(
      (await this.wallets),
      async(w) => new ManagedWallet(
        this.usedWallets,
        this.chain,
        this.walletConfig,
        w,
        await this.getUnspents(w),
        await this.getAddresses(w),
      ),
      { concurrency: concurrencyBitGoApi }
    );
  }

  private async walletSendMany(
    wallet: BitGoWallet,
    { recipients, unspents, feeRate }: {
      recipients: Recipient[];
      unspents?: Unspent[];
      feeRate?: number;
    }
  ) {
    const unspentIds = unspents ? unspents.map(u => u.id) : undefined;
    this.debug(`sendMany() inputs=${unspentIds} recipients=${
      recipients.map(({ address, amount }) => `${address}=${amount}`)
    }`);
    try {
      await wallet.sendMany({
        feeRate,
        unspents: unspentIds,
        recipients,
        walletPassphrase,
      });
    } catch (e) {
      console.error(`error in sendMany(): ${e}`);
      console.error(`unspents: ${unspentIds ? unspentIds.join(',') : '(empty)'}`);
      const availableUnspents = await this.getUnspents(wallet, { cache: false });
      console.error(`availableUnspents: ${availableUnspents.map(u => u.id).join(',')}`);
      throw e;
    }
  }

  /**
   * Get next wallet satisfying some criteria
   * @param predicate - Callback with wallet as argument. Can return promise.
   * @return {*}
   */
  async getNextWallet(predicate?: ManagedWalletPredicate): Promise<BitGoWallet> {
    if (predicate !== undefined) {
      if (!_.isFunction(predicate)) {
        throw new Error(`condition must be function`);
      }
    }

    let found: ManagedWallet | undefined;
    const stats = { nUsed: 0, nNeedsReset: 0, nNotReady: 0 };

    for (const mw of await this.getAll()) {
      const isUsed = this.usedWallets.has(mw.wallet);
      const needsReset = mw.needsReset();
      const notReady = !mw.isReady();

      stats.nUsed += isUsed ? 1 : 0;
      stats.nNeedsReset += needsReset ? 1 : 0;
      stats.nNotReady += notReady ? 1 : 0;

      if (isUsed) {
        continue;
      }

      if (needsReset) {
        // this.debug(`skipping wallet ${mw}: needs reset`);
        continue;
      }

      if (notReady) {
        // this.debug(`skipping wallet ${mw}: not ready`);
        continue;
      }

      if (predicate === undefined || (await Bluebird.resolve(predicate(mw.wallet, mw.unspents)))) {
        found = mw;
        break;
      }
    }

    if (found === undefined) {
      throw new Error(
        `No wallet matching criteria found ` +
        `(`
        + `nUsed=${stats.nUsed},`
        + `nNeedsReset=${stats.nNeedsReset},`
        + `nNotReady=${stats.nNotReady},`
        + `predicate=${predicate}`
        + `)`
      );
    }

    this.debug(`found wallet ${found} unspents=${dumpUnspentsLong(found.unspents, this.chain, { value: true })}`);

    found.setUsed();
    return found.wallet;
  }

  async customSweepWallet(wallet: BitGoWallet, address: string, unspents?: Unspent[]) {
    // we won't use `wallet.sweep()` since it does not work for 200+ unspents
    if (unspents === undefined) {
      return await this.customSweepWallet(wallet, address, await this.getUnspents(wallet));
    }

    if (unspents.length === 0) {
      return;
    }

    const feeRate = 2_000;
    const maxUnspents = 200;
    const nextUnspents = unspents.splice(maxUnspents);
    const amount = this.chain.getMaxSpendable(unspents, [address], feeRate);
    this.debug(`customSweep ${wallet.label()}: ${amount} with ${unspents.length} unspents`);
    await this.walletSendMany(wallet, {
      feeRate, unspents, recipients: [{ address, amount }],
    });
    await this.customSweepWallet(wallet, address, nextUnspents);
  }

  async removeAllWallets() {
    const faucetAddress = this.faucet.receiveAddress();
    const wallets = this.walletList
      .filter((thinWallet) => thinWallet.id() !== this.faucet.id())
      .map((thinWallet) => this.basecoin.wallets().get({ id: thinWallet.id() }));

    const walletUnspents = await Bluebird.map(
      wallets,
      async(w) => (await w.unspents()).unspents,
      { concurrency: concurrencyBitGoApi }
    );

    const deleteWallets = wallets.filter((w, i) => walletUnspents[i].length === 0);
    this.debug(`deleting ${deleteWallets.length} wallets`);
    const deleteErrors = await runCollectErrors(
      deleteWallets,
      (w) => this.bitgo.del(this.basecoin.url('/wallet/' + w.id()))
    );
    deleteErrors.forEach((e) => console.error(e));

    const sweepWallets = wallets.filter((w) => !deleteWallets.includes(w));
    this.debug(`sweeping ${sweepWallets.length} wallets`);
    const sweepErrors = await runCollectErrors(
      sweepWallets,
      (w) => this.customSweepWallet(w, faucetAddress)
    );
    sweepErrors.forEach((e) => console.error(e));

    if (sweepWallets.length > 0) {
      throw new Error(
        `${sweepWallets.length} wallets still had unspents. ` +
        `Please try again when sweep tx have confirmed`
      );
    }
  }

  buildParams(params: object) {
    const buildId = process.env.BUILD_ID || '';
    return {
      ...params,
      sequenceId: `${this.debug.namespace}/${this.clientLabel || ''}/build-${buildId}`,
      walletPassphrase,
    };
  }

  async execWalletSends(w: BitGoWallet, sends: Send[], { feeRate } : { feeRate: number }) {
    const faucet = this.faucet;

    if (sends.length === 0) {
      throw new Error(`no sends for ${w}`);
    }

    let unspents;
    if (sends.length === 1) {
      unspents = sends[0].unspents;
    } else {
      if (!sends.every(({ unspents }) => unspents === undefined)) {
        throw new Error(`cannot declare unspent in send with more than one send per wallet`);
      }
    }

    const recipients =
      sends.reduce((rs: Recipient[], s: Send) => [...rs, ...s.recipients], []);

    const sum = recipients.reduce((sum, v) => sum + v.amount, 0);
    if (sum > w.spendableBalance()) {
      if (w === faucet) {
        throw new DryFaucetError(faucet, sum);
      }
      throw new ErrorExcessSendAmount(w, sum);
    }

    if (w === faucet) {
      if (unspents !== undefined) {
        throw new Error(`expected faucet unspents to be empty`);
      }
      const faucetUnspents = await this.getUnspents(faucet);
      if (faucetUnspents.length > 100) {
        unspents = faucetUnspents;
        this.debug(`consolidate ${unspents.length} faucet unspents`);
      }
    }

    if (this.dryRun) {
      console.warn(`dryRun set: skipping sendMany for ${w.label()}`);
      return;
    }

    await this.walletSendMany(w, { feeRate, unspents, recipients });
  }

  async resetWallets() {
    // refresh unspents of used wallets
    for (const mw of await this.getAll()) {
      if (mw.isUsed()) {
        this.getUnspents(mw.wallet, { cache: false });
      }
    }

    const managedWallets = await this.getAll();
    const faucet = this.faucet;
    const managedFaucet = new ManagedWallet(
      this.usedWallets,
      this.chain,
      this.walletConfig,
      faucet,
      await this.getUnspents(faucet),
      await this.getAddresses(faucet)
    );

    this.debug(`Checking reset for ${managedWallets.length} wallets:`);
    this.debug('\n' + formatWalletTable(managedWallets));

    const feeRate = 10_000;
    const sends = await Promise.all(managedWallets.map((m) => m.getSends(managedFaucet, feeRate)));
    const sendsByWallet: Map<BitGoWallet, Send[]> = sends
      .reduce((all, sends) => [...all, ...sends], [])
      .reduce((map, send: Send) => {
        const sds = map.get(send.source) || [];
        map.set(send.source, [...sds, send]);
        return map;
      }, new Map());

    sendsByWallet.forEach((sends, wallet) => {
      this.debug(`${wallet.label()} ->`);
      sends.forEach((send) => {
        send.recipients.forEach((r) => {
          this.debug(`  ${r.address} ${r.amount}`);
        });
      });
    });

    const errors = await runCollectErrors(
      Array.from(sendsByWallet.entries()),
      ([w, sends]) => this.execWalletSends(w, sends, { feeRate }),
      { concurrency: 1 }
    );

    if (errors.length > 0) {
      throw new Error(`${errors.length} reset errors`);
    }
  }

  async checkTransfers() {
    // ignore failed transfers before this point
    const checkpoint = moment().subtract(1, 'days');
    const managedWallets = await this.getAll();
    const errors = await runCollectErrors(
      managedWallets,
      async(mw) => {
        const w = mw.wallet;
        const transfersWithState = async(state) =>
          (await w.transfers({ state, dateGte: checkpoint.toISOString() }))
            .transfers;

        const [removedTransfers, failedTransfers] = await Promise.all(
          [transfersWithState('removed'), transfersWithState('failed')]
        );

        const dumpTransfers = (transfers) => transfers.map(({ id, txid }) =>
          `{id=${id},txid=${txid}}`).join(',');

        if (removedTransfers.length > 0 || failedTransfers.length > 0) {
          throw new Error(
            `wallet ${w.label()} transfer failures: ` +
            `failed: [${dumpTransfers(failedTransfers)}]` +
            `removed: [${dumpTransfers(removedTransfers)}]`
          );
        }
      }
    );

    if (errors.length > 0) {
      throw new Error(`${errors.length} errors in checkTransfers()`);
    }
  }
}

