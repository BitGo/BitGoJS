import * as utxolib from '@bitgo/utxo-lib';
import { IUtxoStakingBuilder, IWallet, UtxoStakingTransaction } from '@bitgo/sdk-core';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { OpReturnParams, prepareStakingOutputs } from '@bitgo/utxo-coredao';

type Output = {
  script: Buffer;
  amount: bigint;
};

export class UtxoStakingBuilder implements IUtxoStakingBuilder {
  private readonly wallet: IWallet;
  private readonly coin: AbstractUtxoCoin;

  constructor(wallet: IWallet, coin: AbstractUtxoCoin) {
    this.wallet = wallet;
    this.coin = coin;
  }

  async prepareStakingTransaction(
    createStakingOutputs: () => Output[],
    feeRateSatKB: number,
    {
      changeAddressType = 'p2wsh',
    }: {
      changeAddressType?: utxolib.bitgo.outputScripts.ScriptType2Of3;
    }
  ): Promise<UtxoStakingTransaction> {
    const changeAddress = await this.wallet.createAddress({
      chain: utxolib.bitgo.getInternalChainCode(changeAddressType),
    });
    const stakingOutputs = createStakingOutputs();

    const target = stakingOutputs.reduce((acc, output) => acc + output.amount, BigInt(0)).toString();
    const unspents = await this.wallet.unspents({
      target,
      numRecipients: 2,
      changeAddressType,
    });
  }

  async prepareCoreDaoStakingTransaction(
    stakingOutput: { amount: bigint; descriptor: string },
    opReturnOutputParams: OpReturnParams,
    feeRateSatKB: number,
    changeAddress: string
  ): Promise<UtxoStakingTransaction> {
    return this.prepareStakingTransaction(
      () => prepareStakingOutputs(stakingOutput, opReturnOutputParams),
      feeRateSatKB
    );
  }
}
