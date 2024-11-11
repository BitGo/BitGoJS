export type Output = {
  script: Buffer;
  amount: bigint;
};

export type UtxoStakingTransaction = {
  psbt: string;
};

export interface IUtxoStakingBuilder {
  prepareStakingTransaction(
    createStakingOutputs: () => Output[],
    feeRateSatKB: number,
    changeAddress: string
  ): UtxoStakingTransaction;
}
