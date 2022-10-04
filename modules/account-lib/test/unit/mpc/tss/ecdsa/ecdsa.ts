import { Ecdsa, ECDSA } from '@bitgo/sdk-core';
import * as sinon from 'sinon';
import createKeccakHash from 'keccak';
import * as paillierBigint from 'paillier-bigint';
import { paillerKeys, mockNShares, mockPShare, mockDKeyShare, mockEKeyShare, mockFKeyShare } from '../fixtures/ecdsa';
import { Hash, randomBytes } from 'crypto';
import { KeyPair as EthKeyPair } from '@bitgo/sdk-coin-eth';

import { addHexPrefix, BN, bufferToHex, ecrecover } from 'ethereumjs-util';
import { TransactionFactory, FeeMarketEIP1559Transaction, Transaction as LegacyTransaction } from '@ethereumjs/tx';
import { default as Common } from '@ethereumjs/common';
import { Signature } from '../../../../../../sdk-core/src/account-lib/mpc/tss/ecdsa/types';

/**
 * @prettier
 */
// testmeandonlyme
describe('TSS ECDSA TESTS', function () {
  const MPC = new Ecdsa();
  const base = BigInt('0x010000000000000000000000000000000000000000000000000000000000000000'); // 2^256
  let keyShares: ECDSA.KeyCombined[];
  let commonPublicKey: string;
  const seed = Buffer.from(
    '4f7e914dc9ec696398675d1544aab61cb7a67662ffcbdb4079ec5d682be565d87c1b2de75c943dec14c96586984860268779498e6732473aed9ed9c2538f50bea0af926bdccc0134',
    'hex',
  );
  before(async () => {
    const pallierMock = sinon
      .stub(paillierBigint, 'generateRandomKeys')
      .onCall(0)
      .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair)
      .onCall(1)
      .resolves(paillerKeys[1] as unknown as paillierBigint.KeyPair)
      .onCall(2)
      .resolves(paillerKeys[2] as unknown as paillierBigint.KeyPair)
      .onCall(3)
      .resolves(paillerKeys[0] as unknown as paillierBigint.KeyPair)
      .onCall(4)
      .resolves(paillerKeys[1] as unknown as paillierBigint.KeyPair)
      .onCall(5)
      .resolves(paillerKeys[2] as unknown as paillierBigint.KeyPair);
    const [A, B, C] = await Promise.all([MPC.keyShare(1, 2, 3), MPC.keyShare(2, 2, 3), MPC.keyShare(3, 2, 3)]);

    // Needs to run this serially for testing deterministic key generation
    // to get specific pallier keys to be assigned
    const D = await MPC.keyShare(1, 2, 3, seed);
    const E = await MPC.keyShare(2, 2, 3, seed);
    const F = await MPC.keyShare(3, 2, 3, seed);

    const aKeyCombine = MPC.keyCombine(A.pShare, [B.nShares[1], C.nShares[1]]);
    const bKeyCombine = MPC.keyCombine(B.pShare, [A.nShares[2], C.nShares[2]]);
    const cKeyCombine = MPC.keyCombine(C.pShare, [A.nShares[3], B.nShares[3]]);

    // Shares with specific seeds
    const dKeyCombine = MPC.keyCombine(D.pShare, [E.nShares[1], F.nShares[1]]);
    const eKeyCombine = MPC.keyCombine(E.pShare, [D.nShares[2], F.nShares[2]]);
    const fKeyCombine = MPC.keyCombine(F.pShare, [D.nShares[3], E.nShares[3]]);

    // these keyshares are the private x share + 2 y shares that each party now has
    // a, b, c are one group of signers, d, e, f are another
    keyShares = [aKeyCombine, bKeyCombine, cKeyCombine, dKeyCombine, eKeyCombine, fKeyCombine];
    commonPublicKey = aKeyCombine.xShare.y;
    pallierMock.reset();
  });

  describe('Ecdsa Key Generation Test', function () {
    it('should generate keys with correct threshold and share number', async function () {
      for (let index = 0; index < 3; index++) {
        const participantOne = (index % 3) + 1;
        const participantTwo = ((index + 1) % 3) + 1;
        const participantThree = ((index + 2) % 3) + 1;
        keyShares[index].xShare.i.should.equal(participantOne);
        keyShares[index].xShare.y.should.equal(commonPublicKey);
        keyShares[index].xShare.m.should.not.be.Null;
        keyShares[index].xShare.l.should.not.be.Null;
        keyShares[index].xShare.n.should.not.be.Null;

        const chaincode = BigInt('0x' + keyShares[index].xShare.chaincode);
        const isChainCodeValid = chaincode > BigInt(0) && chaincode <= base;
        isChainCodeValid.should.equal(true);

        keyShares[index].yShares[participantTwo].i.should.equal(participantOne);
        keyShares[index].yShares[participantThree].i.should.equal(participantOne);
        keyShares[index].yShares[participantTwo].j.should.equal(participantTwo);
        keyShares[index].yShares[participantThree].j.should.equal(participantThree);
        keyShares[index].yShares[participantTwo].n.should.not.be.Null;
        keyShares[index].yShares[participantThree].n.should.not.be.Null;

        const publicKeyPrefix = keyShares[index].xShare.y.slice(0, 2);
        const isRightPrefix = publicKeyPrefix === '03' || publicKeyPrefix === '02';
        isRightPrefix.should.equal(true);
      }
    });

    it('should generate keyshares with specific seed', async function () {
      // Keys should be deterministic when using seed
      const [, , , D, E, F] = keyShares;
      mockDKeyShare.should.deepEqual(D);
      mockEKeyShare.should.deepEqual(E);
      mockFKeyShare.should.deepEqual(F);
    });

    it('should fail if seed is not length 72', async function () {
      await MPC.keyShare(1, 2, 3, randomBytes(33)).should.be.rejectedWith('Seed must have length 72');
      await MPC.keyShare(1, 2, 3, randomBytes(66)).should.be.rejectedWith('Seed must have length 72');
    });

    it('should calculate correct chaincode while combining', async function () {
      const keyCombine = MPC.keyCombine(mockPShare, mockNShares);
      keyCombine.xShare.chaincode.should.equal('fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc32');
    });

    it('should fail to generate keys with invalid threshold and share number', async function () {
      const invalidConfigs = [
        { index: 1, threshold: 5, numShares: 3 },
        { index: -1, threshold: 2, numShares: 3 },
        { index: 1, threshold: 2, numShares: 1 },
      ];
      for (let index = 0; index < invalidConfigs.length; index++) {
        try {
          await MPC.keyShare(
            invalidConfigs[index].index,
            invalidConfigs[index].threshold,
            invalidConfigs[index].numShares,
          );
        } catch (e) {
          e.should.equal('Invalid KeyShare Config');
        }
      }
    });
  });

  describe('ECDSA Signing', async function () {
    let config: { signerOne: ECDSA.KeyCombined; signerTwo: ECDSA.KeyCombined; hash?: string; shouldHash?: boolean }[];
    let DKeyCombine;

    before(async () => {
      const [A, B, C, D, E, F] = keyShares;
      DKeyCombine = D;

      config = [
        { signerOne: A, signerTwo: B },
        { signerOne: B, signerTwo: C },
        { signerOne: C, signerTwo: A },

        // Checks signing with specific seed
        { signerOne: D, signerTwo: E },
        { signerOne: E, signerTwo: F },
        { signerOne: F, signerTwo: D },

        // Checks with specific hashing algorithm
        { signerOne: A, signerTwo: B, hash: 'keccak256' },

        // checks with no hashing
        { signerOne: A, signerTwo: B, shouldHash: false },
      ];
    });

    for (let index = 7; index < 8; index++) {
      it(`should properly sign the message case ${index}`, async function () {
        // Step One
        // signerOne, signerTwo have decided to sign the message
        const signerOne = config[index].signerOne;
        const signerOneIndex = config[index].signerOne.xShare.i;
        const signerTwo = config[index].signerTwo;
        const signerTwoIndex = config[index].signerTwo.xShare.i;
        console.log(`signerOne ${JSON.stringify(signerOne)}`);
        console.log(`signerTwo ${JSON.stringify(signerTwo)}`);

        // Step Two
        // Sign Shares are created by one of the participants (signerOne)
        // with its private XShare and YShare corresponding to the other participant (signerTwo)
        // This step produces a private WShare which signerOne saves and KShare which signerOne sends to signerTwo
        const signShares: ECDSA.SignShareRT = MPC.signShare(signerOne.xShare, signerOne.yShares[signerTwoIndex]);
        console.log(`signShares ${JSON.stringify(signShares)}`);
        // Step Three
        // signerTwo receives the KShare from signerOne and uses it produce private
        // BShare (Beta Share) which signerTwo saves and AShare (Alpha Share)
        // which is sent to signerOne
        let signConvertS21: ECDSA.SignConvertRT = MPC.signConvert({
          xShare: signerTwo.xShare,
          yShare: signerTwo.yShares[signerOneIndex], // YShare corresponding to the other participant signerOne
          kShare: signShares.kShare,
        });
        console.log(`signConvertS21 ${JSON.stringify(signConvertS21)}`);

        // Step Four
        // signerOne receives the AShare from signerTwo and signerOne using the private WShare from step two
        // uses it produce private GShare (Gamma Share) and MUShare (Mu Share) which
        // is sent to signerTwo to produce its Gamma Share
        const signConvertS12: ECDSA.SignConvertRT = MPC.signConvert({
          aShare: signConvertS21.aShare,
          wShare: signShares.wShare,
        });
        console.log(`signConvertS12 ${JSON.stringify(signConvertS12)}`);

        // Step Five
        // signerTwo receives the MUShare from signerOne and signerOne using the private BShare from step three
        // uses it produce private GShare (Gamma Share)

        signConvertS21 = MPC.signConvert({
          muShare: signConvertS12.muShare,
          bShare: signConvertS21.bShare,
        });
        console.log(`signConvertS21 after signconvert ${JSON.stringify(signConvertS21)}`);

        // Step Six
        // signerOne and signerTwo both have successfully generated GShares and they use
        // the sign combine function to generate their private omicron shares and
        // delta shares which they share to each other

        const [signCombineOne, signCombineTwo] = [
          MPC.signCombine({
            gShare: signConvertS12.gShare as ECDSA.GShare,
            signIndex: {
              i: (signConvertS12.muShare as ECDSA.MUShare).i,
              j: (signConvertS12.muShare as ECDSA.MUShare).j,
            },
          }),
          MPC.signCombine({
            gShare: signConvertS21.gShare as ECDSA.GShare,
            signIndex: {
              i: (signConvertS21.muShare as ECDSA.MUShare).i,
              j: (signConvertS21.muShare as ECDSA.MUShare).j,
            },
          }),
        ];
        console.log(`signCombineOne ${JSON.stringify(signCombineOne)}`);
        console.log(`signCombineTwo ${JSON.stringify(signCombineTwo)}`);

        // const MESSAGE = Buffer.from('random message');//Buffer.from(txHex, 'hex');
        const txData = getTxBuffer();
        const MESSAGE = txData;

        // Step Seven
        // signerOne and signerTwo shares the delta share from each other
        // and finally signs the message using their private OShare
        // and delta share received from the other signer

        const hashGenerator = (hashType?: string): Hash | undefined => {
          return hashType === 'keccak256' ? createKeccakHash('keccak256') : undefined;
        };
        const [signA, signB] = [
          MPC.sign(
            MESSAGE,
            signCombineOne.oShare,
            signCombineTwo.dShare,
            hashGenerator(config[index].hash),
            config[index].shouldHash,
          ),
          MPC.sign(
            MESSAGE,
            signCombineTwo.oShare,
            signCombineOne.dShare,
            hashGenerator(config[index].hash),
            config[index].shouldHash,
          ),
        ];
        console.log(`signA ${JSON.stringify(signA)}`);
        console.log(`signB ${JSON.stringify(signB)}`);

        // Step Eight
        // Construct the final signature

        const signature = MPC.constructSignature([signA, signB]);
        console.log(`signature ${JSON.stringify(signature)}`);

        // Step Nine
        // Verify signature

        const isValid = MPC.verify(MESSAGE, signature, hashGenerator(config[index].hash), config[index].shouldHash);
        isValid.should.equal(true);

        validateEthereumSignature(
          signature,
          '02eb0580847735940084b2d05e0083030d4094ab100912e133aa06ceb921459aaddbd62381f5a30180c0808080',
          DKeyCombine,
        );
      });
    }
  });

  const common = new Common({ chain: 5, hardfork: 'london' });

  enum EthereumJsTransactionType {
    LEGACY = '0x00', // Set by default when building a tx
    ACCESS_LIST_EIP2930 = '0x01',
    FEE_MARKET_EIP1559 = '0x02',
  }

  function stripHexPrefix(str: string): string {
    return str.replace(/^0x/i, '');
  }

  function getTxBuffer(): Buffer {
    const txHex = '02eb0580847735940084b2d05e0083030d4094ab100912e133aa06ceb921459aaddbd62381f5a30180c0808080';
    const parsedTxn = TransactionFactory.fromSerializedData(Buffer.from(txHex, 'hex'));

    return parsedTxn.getMessageToSign(true);
  }

  function validateEthereumSignature(signature: Signature, txHex: string, DKeyCombine: any) {
    console.log(`Validating signature ${JSON.stringify(signature)}`);
    const parsedTxn = TransactionFactory.fromSerializedData(Buffer.from(txHex, 'hex'), { common });
    const txData = parsedTxn.toJSON();
    console.log(`unsigned tx ${JSON.stringify(txData)}`);

    // const yParity = signature.recid;
    const b = parsedTxn.getMessageToSign(true).toString('hex');
    const message = Buffer.from(b, 'hex');
    const publicKeyBuffer = ecrecover(message, 27, Buffer.from(signature.r, 'hex'), Buffer.from(signature.s, 'hex'));
    const publicKey = bufferToHex(publicKeyBuffer);
    const yParity = publicKey.slice(2, 66) === signature.y.slice(2) ? 0 : 1;

    const baseParams = {
      to: txData.to,
      nonce: new BN(stripHexPrefix(txData.nonce!), 'hex'),
      value: new BN(stripHexPrefix(txData.value!), 'hex'),
      gasLimit: new BN(stripHexPrefix(txData.gasLimit!), 'hex'),
      data: txData.data,
      r: addHexPrefix(signature.r),
      s: addHexPrefix(signature.s),
    };

    let tx: LegacyTransaction | FeeMarketEIP1559Transaction;
    if (txData.maxFeePerGas && txData.maxPriorityFeePerGas) {
      tx = FeeMarketEIP1559Transaction.fromTxData(
        {
          ...baseParams,
          maxPriorityFeePerGas: new BN(stripHexPrefix(txData.maxPriorityFeePerGas!), 'hex'),
          maxFeePerGas: new BN(stripHexPrefix(txData.maxFeePerGas!), 'hex'),
          v: new BN(yParity.toString()),
        },
        { common },
      );
    } else if (txData.gasPrice) {
      // v is simple replay attack protection that's calculated using the following formula
      // v = {0,1} + CHAIN_ID * 2 + 35 where {0, 1} is the remainder of the signature's public key mod by 2
      // for more details on this read EIP-155 https://eips.ethereum.org/EIPS/eip-155
      const v = BigInt(35) + BigInt(yParity) + BigInt(common!.chainIdBN().toNumber()) * BigInt(2);
      tx = LegacyTransaction.fromTxData(
        {
          ...baseParams,
          v: new BN(v.toString()),
          gasPrice: new BN(stripHexPrefix(txData.gasPrice!.toString()), 'hex'),
          type: EthereumJsTransactionType.LEGACY,
        },
        { common },
      );
    } else {
      throw new Error(`Expected either a legacy or an EIP1559 tx, received ${JSON.stringify(txData)}`);
    }

    const printSerializedTxHex = tx.serialize().toString('hex');
    console.log(`******** getSignedTx 2 serializedTxHex ${printSerializedTxHex}`);

    const final = {
      id: addHexPrefix(tx.hash().toString('hex')),
      tx: addHexPrefix(tx.serialize().toString('hex')),
    };
    console.log(`signed tx ${JSON.stringify(final)}`);

    const commonKeychain = DKeyCombine.xShare.y;
    const mypublicKey = commonKeychain.slice(0, 66);
    const keyPair = new EthKeyPair({ pub: mypublicKey });
    const senderAddress = keyPair.getAddress();
    console.log(`expected sender address from user share ${senderAddress}`);

    const address = bufferToHex(tx.getSenderAddress().toBuffer());
    console.log(`actual sender address from tx obj ${address.toString()}`);

    console.log(`expected public key from user share ${DKeyCombine.xShare.y}`);
    console.log(`actual public key from signature ${signature.y}`);

    const txPublicKey = bufferToHex(tx.getSenderPublicKey());
    console.log(`actual public key from tx obj ${txPublicKey.toString()}`);
  }
});
