/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import { BitGoBase } from '../bitgoBase';
import { BuildPayloadParameters, ITradingAccount, SignPayloadParameters } from '../trading';
import {
  Settlements,
  ISettlements,
  SettlementVersion,
  SettlementTradePayload,
  ISettlementAffirmations,
  SettlementAffirmations,
  SettlementTradingPartners,
} from '../settlements';
import { IWallet } from '../wallet';

const TRADE_PAYLOAD_VERSION: SettlementVersion = '2.0.0';

export class TradingAccount implements ITradingAccount {
  private readonly _bitgo: BitGoBase;
  private readonly _enterpriseId: string;
  private readonly _settlements: ISettlements;
  private readonly _wallet: IWallet;

  constructor(enterpriseId: string, wallet: IWallet, bitgo: BitGoBase) {
    this._bitgo = bitgo;
    this._enterpriseId = enterpriseId;
    this._wallet = wallet;
    this._settlements = new Settlements(bitgo, enterpriseId, wallet.id());
  }

  get id(): string {
    return this._wallet.id();
  }

  /**
   * Builds a payload authorizing trade from this trading account.
   * @param params
   * @param params.amounts[] array of amounts that will be traded as part of the settlement
   * @param params.amounts[].accountId the accountId corresponding with the sending and receiving amounts for the settlement
   * @param params.amounts[].sendAmount amount of currency sent by trading account of given accountId
   * @param params.amounts[].sendCurrency currency of amount sent by trading account of given accountId
   * @param params.amounts[].receiveAmount amount of currency received by trading account of given accountId
   * @param params.amounts[].receiveCurrency currency of amount received by trading account of given accountId
   * @returns unsigned trade payload for the given parameters. This object should be stringified with JSON.stringify() before being submitted
   */
  async buildPayload(params: BuildPayloadParameters): Promise<SettlementTradePayload> {
    const response = await this._settlements.getTradePayload({
      version: TRADE_PAYLOAD_VERSION,
      amountsList: params.amounts,
    });

    if (!this.verifyPayload(params, response.payload)) {
      throw new Error(
        'Unable to verify trade payload. You may need to update the BitGo SDK, or the payload may have been tampered with.'
      );
    }

    return JSON.parse(response.payload);
  }

  /**
   * Verifies that a payload received from BitGo sufficiently matches the expected parameters. This is used to prevent
   * man-in-the-middle attacks which could maliciously alter the contents of a payload.
   * @param params parameters used to build the payload
   * @param payload payload received from the BitGo API
   * @returns true if the payload's sensitive fields match, false if the payload may have been tampered with
   */
  verifyPayload(params: BuildPayloadParameters, payload: string): boolean {
    const payloadObj = JSON.parse(payload);
    const paramsCopy = JSON.parse(JSON.stringify(params)); // needs to be a deep copy

    // Verifies that for each party in the payload, we requested a matching party, only checking sensitive fields
    let validAmounts = 0;
    for (const amount of payloadObj.amounts) {
      const matchingExpectedParty = paramsCopy.amounts.findIndex(
        (expectedAmount) =>
          amount.accountId === expectedAmount.accountId &&
          amount.sendCurrency === expectedAmount.sendCurrency &&
          amount.sendSubtotal === expectedAmount.sendAmount &&
          amount.receiveAmount === expectedAmount.receiveAmount &&
          amount.receiveCurrency === expectedAmount.receiveCurrency
      );

      if (matchingExpectedParty === -1) {
        // matchingExpectedParty not found to the payloadObject
        // payload is not valid
        break;
      }

      if (amount.fees && amount.fees.length > 0) {
        let feeTotal = new BigNumber(0);
        for (const fee of amount.fees) {
          feeTotal = feeTotal.plus(new BigNumber(fee.feeAmount));
        }

        const expectedTotalAmount = new BigNumber(paramsCopy.amounts[matchingExpectedParty].sendAmount).plus(feeTotal);
        if (expectedTotalAmount.toString() !== amount.sendAmount) {
          // expected total does not match the sendAmount of the payload
          // payload is not valid
          break;
        }
      }

      // matching party found, and fee found
      validAmounts = validAmounts + 1;
      // delete so we ensure no duplicates
      paramsCopy.amounts.splice(matchingExpectedParty, 1);
    }

    return (
      payloadObj.accountId === this.id &&
      payloadObj.amounts.length === params.amounts.length &&
      validAmounts === payloadObj.amounts.length
    );
  }

  /**
   * Signs an arbitrary payload with the user key on this trading account
   * @param params
   * @param params.payload arbitrary payload object (string | Record<string, unknown>)
   * @param params.walletPassphrase passphrase on this trading account, used to unlock the account user key
   * @returns hex-encoded signature of the payload
   */
  async signPayload(params: SignPayloadParameters): Promise<string> {
    const key = (await this._wallet.baseCoin.keychains().get({ id: this._wallet.keyIds()[0] })) as any;
    const prv = this._wallet.bitgo.decrypt({
      input: key.encryptedPrv,
      password: params.walletPassphrase,
    });
    const payload = typeof params.payload === 'string' ? params.payload : JSON.stringify(params.payload);
    return ((await this._wallet.baseCoin.signMessage({ prv }, payload)) as any).toString('hex');
  }

  /**
   * Create an instance of a wallet's settlement affirmations class
   * @deprecated Better accessed through wallet().settlements.affirmations
   * @returns SettlementAffirmations
   */
  affirmations(): ISettlementAffirmations {
    return new SettlementAffirmations(this._bitgo, this._enterpriseId, this._wallet.id());
  }

  /**
   * Create an instance of a wallet's settlement class
   * @deprecated Better accessed through wallet().settlements
   * @returns Settlements
   */
  settlements(): Settlements {
    return new Settlements(this._bitgo, this._enterpriseId, this._wallet.id());
  }

  /**
   * Create an instance of a wallet's settlement trading partners class
   * @deprecated Better accessed through wallet().settlements.tradingPartners
   * @returns SettlementTradingPartners
   */
  partners(): SettlementTradingPartners {
    return new SettlementTradingPartners(this._bitgo, this._enterpriseId, this._wallet.id());
  }
}
