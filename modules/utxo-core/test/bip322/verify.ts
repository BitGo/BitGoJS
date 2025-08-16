import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import * as bip322 from '../../src/bip322';
import { addBip322InputWithChainAndIndex, VerificationInfo, verifyFixedScriptToSignTxWithInfo } from '../../src/bip322';

describe('Verify BIP322 to_sign transactions', function () {
  it('should verify a correctly signed BIP322 to_sign transaction with multiple messages', function () {
    function createMessage(messageBase: string, index: number): string {
      return messageBase + index.toString();
    }

    const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
    const network = utxolib.networks.bitcoin;
    const messageBase = 'I can believe it is not butter ';

    const toSignPsbt = bip322.createBaseToSignPsbt(rootWalletKeys);

    const verificationInfo: VerificationInfo[] = [];
    utxolib.bitgo.chainCodes
      .filter((chain) => chain !== 30 && chain !== 31)
      .forEach((chain, index) => {
        const message = createMessage(messageBase, index);
        const walletKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
        const address = utxolib.address.fromOutputScript(
          utxolib.bitgo.outputScripts.createOutputScript2of3(
            walletKeys.publicKeys,
            utxolib.bitgo.scriptTypeForChain(chain),
            network
          ).scriptPubKey,
          network
        );
        verificationInfo.push({ message, address });
        addBip322InputWithChainAndIndex(toSignPsbt, message, rootWalletKeys, { chain, index });
      });
    toSignPsbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
    toSignPsbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
    toSignPsbt.signAllInputsHD(rootWalletKeys.user);
    toSignPsbt.signAllInputsHD(rootWalletKeys.bitgo);

    const tx = toSignPsbt.finalizeAllInputs().extractTransaction();

    assert.doesNotThrow(() => {
      verifyFixedScriptToSignTxWithInfo(tx, verificationInfo, network);
    });
  });
});
