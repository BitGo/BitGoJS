import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import should from 'should';
import { coins } from '@bitgo/statics';
import { KeyPair, Transaction, TransactionBuilderFactory } from '../../src';
import { privateKeys, rawTx } from '../resources';

const OWNER_ADDRESS =
  'addr_test1qrup3yp2jre7e29kt4frmqcsh9xyjrx6t8m720kj4uty5jhcrzgz4y8naj5tvh2j8kp3pw2vfyxd5k0hu5ld9tckff9qhc6er7';
const UNLOCK_SLOT = '134571338';

/**
 * Builds a synthetic RealFi timelock-claim transaction shaped like the partner SDK's
 * buildClaimTimelockTx output: validity start at the unlock slot, an
 * AllOf { Signature, After } native script, a required signer, and no TTL.
 */
function buildTimelockClaimFixtureHex({ withNativeScript = true } = {}): string {
  const ownerKeyHash = CardanoWasm.BaseAddress.from_address(CardanoWasm.Address.from_bech32(OWNER_ADDRESS))!
    .payment_cred()
    .to_keyhash()!;

  const inputs = CardanoWasm.TransactionInputs.new();
  inputs.add(CardanoWasm.TransactionInput.new(CardanoWasm.TransactionHash.from_bytes(Buffer.alloc(32, 7)), 0));

  const outputs = CardanoWasm.TransactionOutputs.new();
  outputs.add(
    CardanoWasm.TransactionOutput.new(
      CardanoWasm.Address.from_bech32(OWNER_ADDRESS),
      CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('2000000'))
    )
  );

  const body = CardanoWasm.TransactionBody.new_tx_body(inputs, outputs, CardanoWasm.BigNum.from_str('200000'));
  body.set_validity_start_interval_bignum(CardanoWasm.BigNum.from_str(UNLOCK_SLOT));
  const requiredSigners = CardanoWasm.Ed25519KeyHashes.new();
  requiredSigners.add(ownerKeyHash);
  body.set_required_signers(requiredSigners);

  const witnessSet = CardanoWasm.TransactionWitnessSet.new();
  if (withNativeScript) {
    const parts = CardanoWasm.NativeScripts.new();
    parts.add(CardanoWasm.NativeScript.new_script_pubkey(CardanoWasm.ScriptPubkey.new(ownerKeyHash)));
    parts.add(
      CardanoWasm.NativeScript.new_timelock_start(
        CardanoWasm.TimelockStart.new_timelockstart(CardanoWasm.BigNum.from_str(UNLOCK_SLOT))
      )
    );
    const nativeScripts = CardanoWasm.NativeScripts.new();
    nativeScripts.add(CardanoWasm.NativeScript.new_script_all(CardanoWasm.ScriptAll.new(parts)));
    witnessSet.set_native_scripts(nativeScripts);
  }

  return CardanoWasm.Transaction.new(body, witnessSet).to_hex();
}

function bodyHash(hex: string): string {
  return CardanoWasm.hash_transaction(CardanoWasm.Transaction.from_hex(hex).body()).to_hex();
}

describe('ADA Native Script Passthrough Builder', () => {
  const claimFixtureHex = buildTimelockClaimFixtureHex();

  it('should detect native script data on a timelock claim transaction', () => {
    const tx = new Transaction(coins.get('tada'));
    tx.fromRawTransaction(claimFixtureHex);
    tx.hasNativeScriptData().should.be.true();
    tx.hasPlutusData().should.be.false();
  });

  it('should detect a validity start slot without a native script', () => {
    const tx = new Transaction(coins.get('tada'));
    tx.fromRawTransaction(buildTimelockClaimFixtureHex({ withNativeScript: false }));
    tx.hasNativeScriptData().should.be.true();
  });

  it('should not detect native script data on existing raw transaction fixtures', () => {
    for (const [name, hex] of Object.entries(rawTx)) {
      if (typeof hex !== 'string') {
        continue;
      }
      const tx = new Transaction(coins.get('tada'));
      try {
        tx.fromRawTransaction(hex);
      } catch {
        continue;
      }
      should(tx.hasNativeScriptData()).equal(false, `fixture ${name} should keep the generic build path`);
    }
  });

  it('should round-trip a TTL-less timelock claim transaction byte-for-byte', async () => {
    const factory = new TransactionBuilderFactory(coins.get('tada'));
    const tx = (await factory.from(claimFixtureHex).build()) as Transaction;
    tx.toBroadcastFormat().should.equal(claimFixtureHex);
  });

  it('should preserve validity start, required signers and native scripts when signing', async () => {
    const factory = new TransactionBuilderFactory(coins.get('tada'));
    const txBuilder = factory.from(claimFixtureHex);
    txBuilder.sign({ key: privateKeys.prvKey4 });
    const tx = (await txBuilder.build()) as Transaction;

    const original = CardanoWasm.Transaction.from_hex(claimFixtureHex);
    const reparsed = CardanoWasm.Transaction.from_hex(tx.toBroadcastFormat());
    const body = reparsed.body();

    bodyHash(tx.toBroadcastFormat()).should.equal(bodyHash(claimFixtureHex));
    body.validity_start_interval_bignum()!.to_str().should.equal(UNLOCK_SLOT);
    should.not.exist(body.ttl_bignum());
    body.required_signers()!.to_bytes().should.deepEqual(original.body().required_signers()!.to_bytes());
    reparsed
      .witness_set()
      .native_scripts()!
      .to_bytes()
      .should.deepEqual(original.witness_set().native_scripts()!.to_bytes());

    const keyPair = new KeyPair({ prv: privateKeys.prvKey4 });
    const expected = CardanoWasm.make_vkey_witness(
      CardanoWasm.hash_transaction(body),
      CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(keyPair.getKeys().prv!, 'hex'))
    );
    const vkeys = reparsed.witness_set().vkeys()!;
    vkeys.len().should.equal(1);
    vkeys.get(0).vkey().public_key().to_hex().should.equal(keyPair.getKeys().pub);
    vkeys.get(0).signature().to_hex().should.equal(expected.signature().to_hex());
  });

  it('should keep the body hash when an external signature is added', async () => {
    const keyPair = new KeyPair({ prv: privateKeys.prvKey4 });
    const signature = Buffer.from(
      CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(keyPair.getKeys().prv!, 'hex'))
        .sign(Buffer.from(bodyHash(claimFixtureHex), 'hex'))
        .to_bytes()
    );

    const factory = new TransactionBuilderFactory(coins.get('tada'));
    const txBuilder = factory.from(claimFixtureHex);
    txBuilder.addSignature({ pub: keyPair.getKeys().pub }, signature);
    const tx = (await txBuilder.build()) as Transaction;

    const reparsed = CardanoWasm.Transaction.from_hex(tx.toBroadcastFormat());
    bodyHash(tx.toBroadcastFormat()).should.equal(bodyHash(claimFixtureHex));
    reparsed.witness_set().vkeys()!.len().should.equal(1);
    should.exist(reparsed.witness_set().native_scripts());
    tx.signature.should.deepEqual([signature.toString('hex')]);
  });
});
