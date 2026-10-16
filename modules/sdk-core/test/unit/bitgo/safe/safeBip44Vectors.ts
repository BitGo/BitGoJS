import should from 'should';
import { bip32 } from '@bitgo/utxo-lib';
import { coins, isBip44Derivable, SAFE_ROOT_SLOT_ORDINALS } from '@bitgo/statics';
import { DklsVrfUtils } from '@bitgo/sdk-lib-mpc';
import type { RootKeyType } from '@bitgo/public-types';
import {
  buildSafeBip44Path,
  decodeEd25519StrKeySecretSeed,
  deriveSafeChildEd25519Hardened,
  deriveSafeChildHardenedFromXprv,
  deriveSafeChildTriplet,
  encodeDerivableEd25519Pub,
  encodeEd25519ChainCode,
  encodeEd25519StrKeyPublicKey,
  getSafeBip44CoinType,
  isDerivedFromParentWithHardenedPath,
  isDerivedFromParentWithSoftPath,
  parseSafeBip44Path,
  softDeriveChildPrvEd25519AtPath,
  softDeriveChildPubEd25519AtPath,
  toSoftTwinPath,
  type DerivedFromParentWithHardenedPath,
} from '../../../../src';

// Cross-repo fixture: byte-identical to wallet-platform
// test/unit/base/safes/fixtures/safeBip44Vectors.json. Two independent implementations of the safe
// BIP44 child-derivation scheme will otherwise drift, and the failure mode is co-signer keys
// nobody else can reproduce — unrecoverable wallets.
import * as fixture from './fixtures/safeBip44Vectors.json';

describe('safe BIP44 golden vectors', function () {
  describe('slot ordinals', function () {
    it('pins the SAFE_ROOT_SLOT_ORDINALS mapping', function () {
      SAFE_ROOT_SLOT_ORDINALS.should.eql(fixture.slotOrdinals);
    });
  });

  describe('coin types', function () {
    for (const vector of fixture.coinTypes) {
      it(`resolves ${vector.name}`, function () {
        coins.get(vector.coin).family.should.equal(vector.family);
        should(coins.get(vector.coin).bip44CoinType).equal(vector.coinType);
        getSafeBip44CoinType(vector.coin).should.equal(vector.coinType);
        isBip44Derivable(coins.get(vector.coin)).should.equal(vector.derivable);
      });
    }

    for (const vector of fixture.notDerivable) {
      it(`rejects ${vector.name}`, function () {
        (() => getSafeBip44CoinType(vector.coin)).should.throw(/has no BIP44 coin type/);
      });
    }
  });

  describe('paths', function () {
    for (const vector of fixture.paths) {
      it(`builds and round-trips ${vector.name}`, function () {
        SAFE_ROOT_SLOT_ORDINALS[vector.slot as keyof typeof SAFE_ROOT_SLOT_ORDINALS].should.equal(vector.slotOrdinal);
        buildSafeBip44Path(vector.coinType, vector.slot as RootKeyType, vector.account).should.equal(vector.userPath);
        // End to end: coin name in, user path out.
        buildSafeBip44Path(getSafeBip44CoinType(vector.coin), vector.slot as RootKeyType, vector.account).should.equal(
          vector.userPath
        );
        toSoftTwinPath(vector.userPath as DerivedFromParentWithHardenedPath).should.equal(vector.cosignerPath);
        parseSafeBip44Path(vector.userPath as DerivedFromParentWithHardenedPath).should.eql({
          coinType: vector.coinType,
          slotOrdinal: vector.slotOrdinal,
          account: vector.account,
        });
        isDerivedFromParentWithHardenedPath(vector.userPath).should.equal(true);
        isDerivedFromParentWithHardenedPath(vector.cosignerPath).should.equal(false);
        isDerivedFromParentWithSoftPath(vector.cosignerPath).should.equal(true);
        isDerivedFromParentWithSoftPath(vector.userPath).should.equal(false);
      });
    }
  });

  describe('secp256k1 children', function () {
    const roots = {
      user: bip32.fromSeed(Buffer.from(fixture.secp256k1.roots.user.seedHex, 'hex')),
      backup: bip32.fromSeed(Buffer.from(fixture.secp256k1.roots.backup.seedHex, 'hex')),
      bitgo: bip32.fromSeed(Buffer.from(fixture.secp256k1.roots.bitgo.seedHex, 'hex')),
    };

    it('pins the published BIP32 test-vector roots', function () {
      roots.user.neutered().toBase58().should.equal(fixture.secp256k1.roots.user.rootXpub);
      roots.backup.neutered().toBase58().should.equal(fixture.secp256k1.roots.backup.rootXpub);
      roots.bitgo.neutered().toBase58().should.equal(fixture.secp256k1.roots.bitgo.rootXpub);
    });

    for (const vector of fixture.secp256k1.vectors) {
      it(`derives the pinned child triplet for ${vector.name}`, function () {
        // The descriptive fields resolve to the paths actually derived at.
        const userPath = buildSafeBip44Path(
          getSafeBip44CoinType(vector.coin),
          vector.slot as RootKeyType,
          vector.account
        );
        userPath.should.equal(vector.userPath);
        toSoftTwinPath(userPath).should.equal(vector.cosignerPath);
        const triplet = deriveSafeChildTriplet(
          {
            user: roots.user.toBase58(),
            backup: roots.backup.toBase58(),
            bitgo: roots.bitgo.neutered().toBase58(),
          },
          vector.userPath as DerivedFromParentWithHardenedPath
        );
        triplet.user.pub.should.equal(vector.userChildPub);
        triplet.backup.pub.should.equal(vector.backupChildPub);
        triplet.bitgo.pub.should.equal(vector.bitgoChildPub);
        // The private halves neuter back to the pinned public halves.
        bip32.fromBase58(triplet.user.prv).neutered().toBase58().should.equal(vector.userChildPub);
        bip32.fromBase58(triplet.backup.prv).neutered().toBase58().should.equal(vector.backupChildPub);
        // The triplet and the single-child entry point agree.
        deriveSafeChildHardenedFromXprv(
          roots.user.toBase58(),
          vector.userPath as DerivedFromParentWithHardenedPath
        ).pub.should.equal(vector.userChildPub);
      });
    }

    it('derives each co-signer pub from the neutered root alone', function () {
      // The property the server relies on to verify a co-signer without a private key.
      for (const vector of fixture.secp256k1.vectors) {
        roots.backup.neutered().derivePath(vector.cosignerPath).toBase58().should.equal(vector.backupChildPub);
        roots.bitgo.neutered().derivePath(vector.cosignerPath).toBase58().should.equal(vector.bitgoChildPub);
      }
    });
  });

  describe('ed25519 hardened children', function () {
    it('decodes the pinned root seed', function () {
      decodeEd25519StrKeySecretSeed(fixture.ed25519Hardened.rootSeedStrKey)
        .toString('hex')
        .should.equal(fixture.ed25519Hardened.rootRawSeedHex);
    });

    for (const vector of fixture.ed25519Hardened.vectors) {
      it(`derives ${vector.name} at ${vector.path}`, function () {
        getSafeBip44CoinType(vector.coin).should.equal(vector.coinType);
        buildSafeBip44Path(vector.coinType, 'ed25519Multisig', vector.account).should.equal(vector.path);
        deriveSafeChildEd25519Hardened(
          fixture.ed25519Hardened.rootSeedStrKey,
          vector.path as DerivedFromParentWithHardenedPath
        ).should.eql({
          prv: vector.childSeedHex,
          pub: vector.childPubStrKey,
          derivationPath: vector.path,
        });
        // The hex and StrKey public-key forms cannot drift apart.
        encodeEd25519StrKeyPublicKey(Buffer.from(vector.childPubHex, 'hex')).should.equal(vector.childPubStrKey);
      });
    }
  });

  describe('ed25519 soft co-signer children', function () {
    const chainCodeStr = encodeEd25519ChainCode(Buffer.from(fixture.ed25519Soft.rootChainCodeHex, 'hex'));

    it('encodes the pinned root composite', function () {
      encodeDerivableEd25519Pub(
        Buffer.from(fixture.ed25519Soft.rootPubHex, 'hex'),
        Buffer.from(fixture.ed25519Soft.rootChainCodeHex, 'hex')
      ).should.equal(fixture.ed25519Soft.rootComposite);
    });

    for (const vector of fixture.ed25519Soft.vectors) {
      it(`derives ${vector.name} at ${vector.path}`, async function () {
        getSafeBip44CoinType(vector.coin).should.equal(vector.coinType);
        SAFE_ROOT_SLOT_ORDINALS.ed25519Multisig.should.equal(vector.slotOrdinal);
        toSoftTwinPath(buildSafeBip44Path(vector.coinType, 'ed25519Multisig', vector.account)).should.equal(
          vector.path
        );
        const pub = await softDeriveChildPubEd25519AtPath(fixture.ed25519Soft.rootComposite, vector.path);
        pub.toString('hex').should.equal(vector.childPubHex);
        const prv = await softDeriveChildPrvEd25519AtPath({
          seedStrKey: fixture.ed25519Soft.rootSeedStrKey,
          chainCode: chainCodeStr,
          path: vector.path,
        });
        prv.kL.toString('hex').should.equal(vector.childKLHex);
        prv.kR.toString('hex').should.equal(vector.childKRHex);
        prv.pub.toString('hex').should.equal(vector.childPubHex);
        prv.pub.equals(pub).should.equal(true);
      });
    }
  });

  describe('MPC derive path bytes', function () {
    for (const vector of fixture.mpcPathBytes) {
      it(`encodes ${vector.name}`, function () {
        getSafeBip44CoinType(vector.coin).should.equal(vector.coinType);
        Buffer.from(
          DklsVrfUtils.buildSafeMpcDerivePath({
            coinType: vector.coinType,
            safeSlotOrdinal: vector.slotOrdinal,
            accountIndex: vector.account,
          })
        )
          .toString('hex')
          .should.equal(vector.pathBytesHex);
      });
    }
  });
});
