import { createHash } from 'crypto';
import nacl from 'tweetnacl';

import {
  Eddsa,
  bigIntFromBufferLE,
  bigIntToBufferLE,
  clamp,
  Ed25519BIP32,
  bigIntFromBufferBE,
  getDerivationPath,
} from '../mpc';

export type RootKeys = {
  prv: string;
  pub: string;
};

export class EddsaKeyDeriver {
  static readonly ROOT_PUB_KEY_PREFIX = 'rpub';
  static readonly ROOT_PRV_KEY_PREFIX = 'rprv';

  static async createRootKeys(seed?: Buffer): Promise<RootKeys> {
    if (seed && seed.length !== 64) {
      throw new Error('Invalid seed length, requires 64 bytes Buffer');
    }
    await Eddsa.initialize();
    const startingSeed = seed || Buffer.from(nacl.randomBytes(64));
    const hash = createHash('sha512').update(startingSeed.slice(0, 32)).digest();

    const chaincode = startingSeed.slice(32).toString('hex');
    const prefix = hash.slice(32).toString('hex');

    const sk = clamp(bigIntFromBufferLE(hash.slice(0, 32)));
    const skString = bigIntToBufferLE(sk).toString('hex');
    const pkString = bigIntToBufferLE(Eddsa.curve.basePointMult(sk)).toString('hex');

    return {
      prv: this.formatRootPrvKey(skString, chaincode, prefix),
      pub: this.formatRootPubKey(pkString, chaincode),
    };
  }

  private static formatRootPubKey(pub: string, chaincode: string): string {
    return this.ROOT_PUB_KEY_PREFIX + pub + ':' + chaincode;
  }

  private static formatRootPrvKey(prv: string, chaincode: string, prefix: string): string {
    return this.ROOT_PRV_KEY_PREFIX + prv + ':' + chaincode + ':' + prefix;
  }

  private static parseRootPubKey(pub: string): { pub: string; chaincode: string } {
    const parts = pub.replace(this.ROOT_PUB_KEY_PREFIX, '').split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid public key');
    }
    return {
      pub: parts[0],
      chaincode: parts[1],
    };
  }

  private static parseRootPrvKey(prv: string): { prv: string; chaincode: string; prefix: string } {
    const parts = prv.replace(this.ROOT_PRV_KEY_PREFIX, '').split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid private key');
    }
    return {
      prv: parts[0],
      chaincode: parts[1],
      prefix: parts[2],
    };
  }

  static async deriveKeyWithSeed(key: string, seed: string): Promise<{ key: string; derivationPath: string }> {
    const hdTree = await Ed25519BIP32.initialize();
    const derivationPath = getDerivationPath(seed);

    if (key.startsWith(this.ROOT_PUB_KEY_PREFIX)) {
      const { pub, chaincode } = this.parseRootPubKey(key);

      const publicKeychain = {
        pk: bigIntFromBufferLE(Buffer.from(pub, 'hex')),
        chaincode: bigIntFromBufferBE(Buffer.from(chaincode, 'hex')),
      };

      const derivedKeychain = hdTree.publicDerive(publicKeychain, derivationPath);
      const derivedPub = bigIntToBufferLE(derivedKeychain.pk).toString('hex');

      return { key: derivedPub, derivationPath };
    } else if (key.startsWith(EddsaKeyDeriver.ROOT_PRV_KEY_PREFIX)) {
      await Eddsa.initialize();

      const { prv, chaincode, prefix } = this.parseRootPrvKey(key);
      const skBI = bigIntFromBufferLE(Buffer.from(prv, 'hex'));

      const privateKeychain = {
        sk: skBI,
        pk: Eddsa.curve.basePointMult(skBI),
        chaincode: bigIntFromBufferBE(Buffer.from(chaincode, 'hex')),
        prefix: bigIntFromBufferBE(Buffer.from(prefix, 'hex')),
      };
      const derivedKeychain = hdTree.privateDerive(privateKeychain, derivationPath);
      const derivedPrv = bigIntToBufferLE(derivedKeychain.sk).toString('hex');
      const derivedPub = bigIntToBufferLE(derivedKeychain.pk).toString('hex');

      return { key: derivedPrv + derivedPub, derivationPath };
    } else {
      throw new Error('Invalid key format');
    }
  }
}
