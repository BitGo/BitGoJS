// import {
//   BaseCoin,
//   BitGoBase,
//   KeyPair,
//   ParsedTransaction,
//   ParseTransactionOptions,
//   SignedTransaction,
//   SignTransactionOptions,
//   VerifyAddressOptions,
//   VerifyTransactionOptions,
// } from '@bitgo/sdk-core';
// import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
//
// export class Aca extends BaseCoin {
//   verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
//     throw new Error('Method not implemented.');
//   }
//   isWalletAddress(params: VerifyAddressOptions): boolean {
//     throw new Error('Method not implemented.');
//   }
//   parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
//     throw new Error('Method not implemented.');
//   }
//   generateKeyPair(seed?: Buffer): KeyPair {
//     throw new Error('Method not implemented.');
//   }
//   isValidPub(pub: string): boolean {
//     throw new Error('Method not implemented.');
//   }
//   isValidAddress(address: string): boolean {
//     throw new Error('Method not implemented.');
//   }
//   signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
//     throw new Error('Method not implemented.');
//   }
//   protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
//
//   protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
//     super(bitgo);
//
//     if (!staticsCoin) {
//       throw new Error('missing required constructor parameter staticsCoin');
//     }
//
//     this._staticsCoin = staticsCoin;
//   }
//
//   static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
//     return new Aca(bitgo, staticsCoin);
//   }
//
//   getBaseFactor(): number {
//     return Math.pow(10, this._staticsCoin.decimalPlaces);
//   }
//
//   getChain() {
//     return this._staticsCoin.name;
//   }
//
//   /**
//    * Get the base chain that the coin exists on.
//    */
//   getBaseChain() {
//     return this.getChain();
//   }
//
//   getFamily(): CoinFamily {
//     return this._staticsCoin.family;
//   }
//
//   getFullName() {
//     return this._staticsCoin.fullName;
//   }
// }
