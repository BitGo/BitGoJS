import * as fs from 'fs';
import assert from 'assert';
import crypto from 'crypto';

import * as t from 'io-ts';
import { decodeOrElse } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { createHalfSigned } from '../../src/offlineVault';
import { DescriptorTransaction } from '../../src/offlineVault/descriptor';

function getFixturesNames(): string[] {
  // I'm using sync here because mocha cannot do async setup
  // eslint-disable-next-line no-sync
  return fs.readdirSync(__dirname + '/fixtures').filter((f) => f.endsWith('.json'));
}

const KeyPair = t.intersection([t.type({ xpub: t.string }), t.partial({ xprv: t.string })]);

const KeyWithParent = t.intersection([KeyPair, t.partial({ parent: KeyPair })]);
type KeyWithParent = t.TypeOf<typeof KeyWithParent>;

const Fixture = t.type({
  walletKeys: t.array(KeyWithParent),
  response: t.unknown,
});

type Fixture = t.TypeOf<typeof Fixture>;

async function readFixture(name: string): Promise<Fixture> {
  const data = JSON.parse(await fs.promises.readFile(__dirname + '/fixtures/' + name, 'utf-8'));
  return decodeOrElse('Fixture', Fixture, data, (e) => {
    throw new Error(`failed to decode fixture ${name}: ${e}`);
  });
}

function withRotatedXpubs(tx: DescriptorTransaction): DescriptorTransaction {
  const { user, backup, bitgo } = tx.xpubsWithDerivationPath;
  return {
    ...tx,
    xpubsWithDerivationPath: {
      user: bitgo,
      backup: user,
      bitgo: backup,
    },
  };
}

function withRandomXpubs(tx: DescriptorTransaction) {
  function randomXpub() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return utxolib.bip32.fromSeed(Buffer.from(bytes)).neutered().toBase58();
  }
  return {
    ...tx,
    xpubsWithDerivationPath: {
      user: randomXpub(),
      backup: randomXpub(),
      bitgo: randomXpub(),
    },
  };
}

function withoutDescriptors(tx: DescriptorTransaction): DescriptorTransaction {
  return {
    ...tx,
    descriptors: [],
  };
}

function getDerivationId(v: DescriptorTransaction['xpubsWithDerivationPath']): string {
  const id = v.user.derivedFromParentWithSeed;
  assert(id);
  return id;
}

function getRootPrv(walletKeys: KeyWithParent[]): utxolib.BIP32Interface {
  assert(walletKeys[0]);
  assert(walletKeys[0].parent);
  assert(walletKeys[0].parent.xprv);
  return utxolib.bip32.fromBase58(walletKeys[0].parent.xprv);
}

describe('OfflineVaultHalfSigned', function () {
  for (const fixtureName of getFixturesNames()) {
    it(`can sign fixture ${fixtureName}`, async function () {
      const { walletKeys, response } = await readFixture(fixtureName);
      assert(DescriptorTransaction.is(response));
      const rootPrv = getRootPrv(walletKeys);
      const derivationId = getDerivationId(response.xpubsWithDerivationPath);
      createHalfSigned('btc', rootPrv, derivationId, response);
      const mutations = [withRotatedXpubs(response), withRandomXpubs(response), withoutDescriptors(response)];
      for (const mutation of mutations) {
        assert.throws(() => createHalfSigned('btc', rootPrv, derivationId, mutation));
      }
    });
  }
});
