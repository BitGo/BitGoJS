import { IWallet } from './iWallet';

export interface ILightningWallet {
  /**
   * Creates a lightning invoice
   * @param params Invoice parameters (to be defined)
   */
  createInvoice(params: unknown): Promise<unknown>;

  /**
   * Pay a lightning invoice
   * @param params Payment parameters (to be defined)
   */
  payInvoice(params: unknown): Promise<unknown>;
}

export class SelfCustodialLightningWallet implements ILightningWallet {
  public wallet: IWallet;

  constructor(wallet: IWallet) {
    this.wallet = wallet;
  }

  async createInvoice(params: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }

  async payInvoice(params: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
}
