import * as fs from 'fs';
import assert from 'assert';
import crypto from 'crypto';

import * as t from 'io-ts';
import * as utxolib from '@bitgo/utxo-lib';

import { createHalfSigned } from '../../src/offlineVault';
import { DescriptorTransaction } from '../../src/offlineVault/descriptor';

function getFixturesNames(): string[] {
  // I'm using sync here because mocha cannot do async setup
  // eslint-disable-next-line no-sync
  return fs.readdirSync(__dirname + '/fixtures').filter((f) => f.endsWith('.json'));
}

const Fixture = t.type({
  walletKeys: t.array(t.string),
  response: t.unknown,
});

type Fixture = t.TypeOf<typeof Fixture>;

async function readFixture(name: string): Promise<Fixture> {
  const data = JSON.parse(await fs.promises.readFile(__dirname + '/fixtures/' + name, 'utf-8'));
  if (!Fixture.is(data)) {
    throw new Error(`Invalid fixture ${name}`);
  }
  return data;
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

describe('OfflineVaultHalfSigned', function () {
  for (const fixtureName of getFixturesNames()) {
    it(`can sign fixture ${fixtureName}`, async function () {
      const { walletKeys, response } = await readFixture(fixtureName);
      const prv = utxolib.bip32.fromBase58(walletKeys[0]);
      createHalfSigned('btc', prv, response);

      assert(DescriptorTransaction.is(response));
      const mutations = [withRotatedXpubs(response), withRandomXpubs(response), withoutDescriptors(response)];
      for (const mutation of mutations) {
        assert.throws(() => createHalfSigned('btc', prv, mutation));
      }
    });
  }
});
