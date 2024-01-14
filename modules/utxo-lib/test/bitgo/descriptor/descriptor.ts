import * as assert from 'assert';
import * as crypto from 'crypto';
import { ecc, bip32 } from '../../../src';
import {
  assertDescriptor,
  compilePolicy,
  createOutputDescriptor,
  parsePsbtWithDescriptor,
  satisfier,
} from '../../../src/bitgo/Descriptor/Descriptor';
import { Psbt } from 'bitcoinjs-lib/src/psbt';
import { networks } from 'bitcoinjs-lib';
import { DescriptorChecksum } from '@saravanan7mani/descriptors/dist/checksum';

const network = networks.regtest;
const policy = `or(pk(key),and(pk(recovery_key),older(100)))`;
const descriptor = `wsh(andor(pk([7156507b/1/2]tpubDBHyovnQxssQo9MvYrLKiyeinqRev16rpopptW1QFvv51hCbffXXPULEDurtytS9KyzUSJLdDmkZ1Jj6xr1FdU3cf56RD1vvNjc8NKLLMrF/0/*),older(100),pk([08854c62/1/2]tpubDAro1rr58Bijo2Kgob5rdprHMyKFS5Fup4S624JGuErfigJcEcN8TeT4kbFsuTefRXo9rcES5jkiv7aNiPjNcWW47CC7Q1kH6FQAAh8AqoK/0/*)))`;
// root xprv of recovery key
const rootSignerPrivateKey = `tprv8ZgxMBicQKsPemXv15wM5P4wwki72XKfqYMiByarQdSnetQw4XLKKnjggrRqqHySMszxxHgffGERAeW6Sc9r5vu9Zvy2tvZ94BonUWu9Ya5`;
const toAddrDescriptor = `wpkh([4942c6d0/1/2]tpubDBHyovnQxssQo9MvYrLKiyeinqRev16rpopptW1QFvv51hCbffXXPULEDurtytS9KyzUSJLdDmkZ1Jj6xr1FdU3cf56RD1vvNjc8NKLLMrF/0/*)`;

describe('Descriptors and Miniscript', function () {
  it(`Create key`, function () {
    const node = bip32.fromSeed(crypto.randomBytes(32), network);
    console.log(node.fingerprint.toString('hex'));
    console.log(node.toBase58());
    console.log(node.neutered().toBase58());
    console.log(node.derivePath('m/1/2').toBase58());
    console.log(node.derivePath('m/1/2').neutered().toBase58());

    // Key:
    // 08854c62
    // tprv8ZgxMBicQKsPe8WLCCYZW72dvFrUHsjtCkDj9TPRXBjdf7H5bZLcC8ao8oMerj2JHUXrTrnQKDpg22G3ay2HnwCaMwmVUujA1sDK5mRqp6r
    // tpubD6NzVbkrYhZ4XbY85rD9uWgkVHNQTCvnn3pWRyRiwTY2VbXrDxACNdCfJwaycKMbZiXNG2MyCNzFHmGfbQECvEQqKV3H4KLUw1rvkSDKE4d
    // tprv8eAksSopyp34uZHtuwRGERCAnwoKGk51EkqJjYFyUy4GtC3qcDYYH9qCaS3homz7CFiSe3BgKvEut7kuEPtZ7Ht252a8QyqGi4udYQTsYk2
    // tpubDAro1rr58Bijo2Kgob5rdprHMyKFS5Fup4S624JGuErfigJcEcN8TeT4kbFsuTefRXo9rcES5jkiv7aNiPjNcWW47CC7Q1kH6FQAAh8AqoK
    // [08854c62/1/2]tpubDAro1rr58Bijo2Kgob5rdprHMyKFS5Fup4S624JGuErfigJcEcN8TeT4kbFsuTefRXo9rcES5jkiv7aNiPjNcWW47CC7Q1kH6FQAAh8AqoK/0/*

    // Recovery Key:
    // 7156507b
    // tprv8ZgxMBicQKsPemXv15wM5P4wwki72XKfqYMiByarQdSnetQw4XLKKnjggrRqqHySMszxxHgffGERAeW6Sc9r5vu9Zvy2tvZ94BonUWu9Ya5
    // tpubD6NzVbkrYhZ4YEZhtjbwUnj4WnE3BrWaQqxVUVd9puFBVNfhgv9uWHMYrxwQWpFi7kg6x6mZtBWFJTJp7E8FxvgVNsS5qnaTg6egwyr9eqs
    // tprv8ebwfWkApWBjugL8fCfjKZzcDouikfuxFWE3byy6qf7gBCwq3GhwCyiN3mTSp2PMSWeUzhsoVfCcHTv4GKDLzRrjYHP3U5irh6GrKrHzW6o
    // tpubDBHyovnQxssQo9MvYrLKiyeinqRev16rpopptW1QFvv51hCbffXXPULEDurtytS9KyzUSJLdDmkZ1Jj6xr1FdU3cf56RD1vvNjc8NKLLMrF
    // [7156507b/1/2]tpubDBHyovnQxssQo9MvYrLKiyeinqRev16rpopptW1QFvv51hCbffXXPULEDurtytS9KyzUSJLdDmkZ1Jj6xr1FdU3cf56RD1vvNjc8NKLLMrF/0/*

    // To address key:
    // 4942c6d0
    // tprv8ZgxMBicQKsPeAMvAJsE7xTfFTrAokbiuAxrDqXW8MoaiQWz2uSvh7LTc4zvx1qZsj6j2S8sYeEe15T3p24VfuohQFoeeDNjeEXXiGPK7RY
    // tpubD6NzVbkrYhZ4XdPi3xXpXN7mpVN6y5ndUUZdWMZoYdbyYtmkfJGWsbxKnDrkUYe7BFn3wmmoZieX4Afe5YzmnyiY9t7WEoKyHDA2rrJMe6z
    // tprv8dUyvHCCVEeW6AN4xEnU15AfYEzYQNYQgd95r68CtBZxRLrEoa7kbxEb5UsByY3SLikemZYcAtybEEspgS4LCRfzk4ngmm6tCJRwcndWqqz
    // tpubDAB24hESdcLAydPrqtT4QUpn7GWUZhjKFvjs8cAWJTNMFq71RxwLnSrTFbGeS9nAuhciEZ2RcLb1mCJLB1mPtHvMhqE75L6ZMmVCFMj5msv
    // [4942c6d0/1/2]tpubDBHyovnQxssQo9MvYrLKiyeinqRev16rpopptW1QFvv51hCbffXXPULEDurtytS9KyzUSJLdDmkZ1Jj6xr1FdU3cf56RD1vvNjc8NKLLMrF/0/*
  });

  it(`Get checksum`, function () {
    const checksum = DescriptorChecksum(descriptor);
    console.log(descriptor + '#' + checksum);
  });

  it(`Miniscript`, function () {
    // const policy = `thresh(2,pk(key_1),pk(key_2),pk(key_3))`;
    const { miniscript, issane, asm } = compilePolicy(policy);
    console.log('miniscript: ' + miniscript);
    console.log('issane: ' + issane);
    console.log('asm: ' + asm);

    const { nonMalleableSats, malleableSats, unknownSats } = satisfier(miniscript);
    console.log('nonMalleableSats: ' + JSON.stringify(nonMalleableSats));
    console.log('malleableSats: ' + JSON.stringify(malleableSats));
    console.log('unknownSats: ' + JSON.stringify(unknownSats));
  });

  it(`Create address`, function () {
    assertDescriptor({
      descriptor,
      network,
      checksumRequired: false,
    });

    const outputDescriptor = createOutputDescriptor({ descriptor, index: 0, network, checksumRequired: false });
    console.log('From address: ' + outputDescriptor.getAddress());
  });

  it(`Create PSBT, Sign, Get Signed Transaction`, function () {
    const psbt = new Psbt({ network });

    // replace this with the actual unspent tx output
    const txHex = `0200000000010159a8e267f819e57fde4fd005169801134b6a92470698b91b8751ae79df34d6780000000000fdffffff021c80380c010000002251203c1440177873573c280ad59de846b113c6bc64feb653dee186230060b9946f7d0065cd1d000000002200207d4691cc33ba2c782e6bf6478e1e7ec006c328610d20c7265a7e8de275e516f802473044022000e1435bc0756f2e3ba25291be027ec0bfe4bb04e18465ee5f2001dce00d4f270220654b15caa63d0ea58ac42b75542633dfc56883262d908c6e27577ed5d68d9ad5012102e40f73ad41dbd96a56221e14b42587b3590358ebae040d130a48647b47b70b0f65000000`;
    const vout = 1;
    const amount = 500000000;
    const outputAmount = 300000000;
    const fee = 10000;
    const changeAmount = amount - outputAmount - fee;

    const rootSignerHdKeyPair = bip32.fromBase58(rootSignerPrivateKey, network);
    const signerHdKeyPair = rootSignerHdKeyPair.derivePath(`m/1/2/0/0`);
    const signerPublicKey = signerHdKeyPair.publicKey;

    const outputDescriptor = createOutputDescriptor({
      descriptor,
      index: 0,
      network,
      checksumRequired: false,
      signersPubKeys: [signerPublicKey],
    });
    outputDescriptor.updatePsbtAsInput({ psbt, txHex, vout });

    const inputWeight = outputDescriptor.inputWeight(true, 'DANGEROUSLY_USE_FAKE_SIGNATURES');
    console.log('inputWeight: ' + inputWeight);

    const toAddrOutputDescriptor = createOutputDescriptor({
      descriptor: toAddrDescriptor,
      index: 0,
      network,
      checksumRequired: false,
    });
    console.log('To address:' + toAddrOutputDescriptor.getAddress());
    toAddrOutputDescriptor.updatePsbtAsOutput({ psbt, value: BigInt(outputAmount) });

    const outputWeight = toAddrOutputDescriptor.outputWeight();
    console.log('outputWeight: ' + outputWeight);

    const changeOutputDescriptor = createOutputDescriptor({
      descriptor,
      index: 5,
      network,
      checksumRequired: false,
    });
    console.log('Change output address:' + changeOutputDescriptor.getAddress());
    changeOutputDescriptor.updatePsbtAsOutput({ psbt, value: BigInt(changeAmount) });

    const changeOutputWeight = changeOutputDescriptor.outputWeight();
    console.log('changeOutputWeight: ' + changeOutputWeight);

    psbt.signAllInputsHD(rootSignerHdKeyPair);

    assert(psbt.validateSignaturesOfAllInputs((p, m, s) => ecc.verify(m, p, s, true)));

    console.log(
      'PSBT inputs:\n' + JSON.stringify(parsePsbtWithDescriptor({ psbt, descriptors: [descriptor], network }))
    );

    outputDescriptor.finalizePsbtInput({ psbt, index: 0 });

    const signedTx = psbt.extractTransaction();

    const signedTxHex = signedTx.toHex();

    console.log(`signed Tx Id:` + signedTx.getId());
    console.log(`signed Tx Hex:` + signedTxHex);
  });
});
