/* eslint-disable */
/**
 * @prettier
 */
import 'should';
import { KeyPair, TransferBuilder } from '../../../src/coin/dot';
import { construct, getRegistry } from '@substrate/txwrapper-polkadot';
import Eddsa from '../../../src/mpc/tss';
import { buildTestConfig } from '../coin/dot/transactionBuilder/base';
import utils from '../../../src/coin/dot/utils';
import { HexString } from "@polkadot/util/types";

describe('TSS EDDSA key generation and signing', () => {
  it('should produce valid signature', async function () {
    const config = buildTestConfig();
    const material = utils.getMaterial(config);

    const MPC = await Eddsa();
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
    const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
    // const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

    const dotKeyPair = new KeyPair({ pub: A_combine.pShare.y });

    const builder = new TransferBuilder(config).material(material);
    builder
      .amount('90034235235322')
      .to({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
      .sender({ address: dotKeyPair.getAddress() })
      .validity({ firstValid: 3933, maxDuration: 64 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
      .fee({ amount: 0, type: 'tip' });
    const tx = await builder.build();
    const registry = getRegistry({
      chainName: material.chainName,
      specName: material.specName,
      specVersion: material.specVersion,
      metadataRpc: material.metadata,
    });

    // tx.toBroadcastFormat() generates a signing payload
    // construct.signingPayload(this._dotTransaction, {
    //   registry: this._registry,
    // });

    // create a buffer out of the txHex
    const message_buffer = Buffer.from(tx.toBroadcastFormat(), 'hex');

    // signing with A and B
    const A_sign_share = MPC.signShare(message_buffer, A_combine.pShare, [A_combine.jShares[2]]);
    const B_sign_share = MPC.signShare(message_buffer, B_combine.pShare, [B_combine.jShares[1]]);
    const A_sign = MPC.sign(message_buffer, A_sign_share.xShare, [B_sign_share.rShares[1]]);
    const B_sign = MPC.sign(message_buffer, B_sign_share.xShare, [A_sign_share.rShares[2]]);
    // sign the message_buffer (unsigned txHex)
    const signature = MPC.signCombine([A_sign, B_sign]);
    const rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
    const rawSignatureString = rawSignature.toString('hex');
    const signaturePayload = `0x00${rawSignatureString}`;

    // signature can be verified
    dotKeyPair.verifySignature(message_buffer, rawSignature).should.be.true();

    //the equivalent of this has to be done using account-builder
    // something like builder.from('unsigned txHex').addSignature(rawSignature?? what params ?).build()

    // @ts-ignore
    const txHex = construct.signedTx(tx._dotTransaction, signaturePayload as HexString, {
      // @ts-ignore
      metadataRpc: tx._dotTransaction.metadataRpc,
      registry: registry,
    });
    console.log(txHex);
  });
});
