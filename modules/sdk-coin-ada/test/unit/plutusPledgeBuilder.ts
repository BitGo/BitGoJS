import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import should from 'should';
import { coins } from '@bitgo/statics';
import { KeyPair, Transaction, TransactionBuilderFactory } from '../../src';
import { privateKeys, rawTx } from '../resources';

const TEST_ADDRESS = 'addr_test1vr8rakm66rcfv4fcxqykg5lf0yv7lsyk9mvapx369jpvtcgfcuk7f';

/**
 * Builds a synthetic Plutus transaction analogous to CBOR WP would hand BitGoJS
 * for RealFi pledge (parse -> sign -> re-serialize) flows.
 */
function buildPlutusFixtureHex(includeAuxiliaryData = false): string {
  const addr = CardanoWasm.Address.from_bech32(TEST_ADDRESS);

  const inputs = CardanoWasm.TransactionInputs.new();
  inputs.add(CardanoWasm.TransactionInput.new(CardanoWasm.TransactionHash.from_bytes(Buffer.alloc(32, 1)), 0));

  const datum = CardanoWasm.PlutusData.new_bytes(Buffer.from('deadbeef', 'hex'));

  const outputs = CardanoWasm.TransactionOutputs.new();
  const outputBuilder = CardanoWasm.TransactionOutputBuilder.new().with_address(addr).with_plutus_data(datum);
  const mainOutput = outputBuilder.next().with_coin(CardanoWasm.BigNum.from_str('2000000')).build();
  outputs.add(mainOutput);

  const body = CardanoWasm.TransactionBody.new_tx_body(inputs, outputs, CardanoWasm.BigNum.from_str('200000'));

  const collateral = CardanoWasm.TransactionInputs.new();
  collateral.add(CardanoWasm.TransactionInput.new(CardanoWasm.TransactionHash.from_bytes(Buffer.alloc(32, 2)), 0));
  body.set_collateral(collateral);

  const collateralReturn = CardanoWasm.TransactionOutput.new(
    addr,
    CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('1000000'))
  );
  body.set_collateral_return(collateralReturn);
  body.set_total_collateral(CardanoWasm.BigNum.from_str('1000000'));

  const referenceInputs = CardanoWasm.TransactionInputs.new();
  referenceInputs.add(CardanoWasm.TransactionInput.new(CardanoWasm.TransactionHash.from_bytes(Buffer.alloc(32, 3)), 0));
  body.set_reference_inputs(referenceInputs);
  body.set_script_data_hash(CardanoWasm.ScriptDataHash.from_bytes(Buffer.alloc(32, 4)));

  const witnessSet = CardanoWasm.TransactionWitnessSet.new();

  const plutusScripts = CardanoWasm.PlutusScripts.new();
  plutusScripts.add(CardanoWasm.PlutusScript.new(Buffer.from('510100003222253330033371e00c', 'hex')));
  witnessSet.set_plutus_scripts(plutusScripts);

  const plutusDataList = CardanoWasm.PlutusList.new();
  plutusDataList.add(datum);
  witnessSet.set_plutus_data(plutusDataList);

  const redeemers = CardanoWasm.Redeemers.new();
  redeemers.add(
    CardanoWasm.Redeemer.new(
      CardanoWasm.RedeemerTag.new_spend(),
      CardanoWasm.BigNum.from_str('0'),
      datum,
      CardanoWasm.ExUnits.new(CardanoWasm.BigNum.from_str('1000000'), CardanoWasm.BigNum.from_str('500000'))
    )
  );
  witnessSet.set_redeemers(redeemers);

  let auxiliaryData: CardanoWasm.AuxiliaryData | undefined;
  if (includeAuxiliaryData) {
    const metadata = CardanoWasm.GeneralTransactionMetadata.new();
    metadata.insert(CardanoWasm.BigNum.from_str('674'), CardanoWasm.TransactionMetadatum.new_text('realfi-test'));
    auxiliaryData = CardanoWasm.AuxiliaryData.new();
    auxiliaryData.set_metadata(metadata);
    body.set_auxiliary_data_hash(CardanoWasm.hash_auxiliary_data(auxiliaryData));
  }

  const tx =
    auxiliaryData !== undefined
      ? CardanoWasm.Transaction.new(body, witnessSet, auxiliaryData)
      : CardanoWasm.Transaction.new(body, witnessSet);
  return Buffer.from(tx.to_bytes()).toString('hex');
}

describe('ADA Plutus Passthrough Builder', () => {
  const plutusFixtureHex = buildPlutusFixtureHex();

  it('should detect plutus data on the parsed transaction', () => {
    const tx = new Transaction(coins.get('tada'));
    tx.fromRawTransaction(plutusFixtureHex);
    tx.hasPlutusData().should.be.true();

    const plainTx = new Transaction(coins.get('tada'));
    plainTx.fromRawTransaction(rawTx.unsignedNewPledgeTx);
    plainTx.hasPlutusData().should.be.false();
  });

  it('should round-trip a plutus transaction byte-for-byte with no new signature', async () => {
    const factory = new TransactionBuilderFactory(coins.get('tada'));
    const txBuilder = factory.from(plutusFixtureHex);
    const tx = (await txBuilder.build()) as Transaction;
    tx.toBroadcastFormat().should.equal(plutusFixtureHex);
  });

  it('should preserve plutus fields and produce a valid vkey for the body hash', async () => {
    const factory = new TransactionBuilderFactory(coins.get('tada'));
    const txBuilder = factory.from(plutusFixtureHex);
    txBuilder.sign({ key: privateKeys.prvKey4 });
    const tx = (await txBuilder.build()) as Transaction;
    const broadcastHex = tx.toBroadcastFormat();
    broadcastHex.should.not.equal(plutusFixtureHex);

    const reparsed = CardanoWasm.Transaction.from_bytes(Buffer.from(broadcastHex, 'hex'));
    const body = reparsed.body();
    const witnessSet = reparsed.witness_set();

    should.exist(body.collateral());
    should.exist(body.collateral_return());
    should.exist(body.total_collateral());
    should.exist(body.reference_inputs());
    should.exist(body.script_data_hash());
    body.outputs().get(0).has_plutus_data().should.be.true();

    should.exist(witnessSet.plutus_scripts());
    should.exist(witnessSet.plutus_data());
    should.exist(witnessSet.redeemers());

    const originalTx = CardanoWasm.Transaction.from_bytes(Buffer.from(plutusFixtureHex, 'hex'));
    body.collateral()!.to_bytes().should.deepEqual(originalTx.body().collateral()!.to_bytes());
    body.collateral_return()!.to_bytes().should.deepEqual(originalTx.body().collateral_return()!.to_bytes());
    body.total_collateral()!.to_bytes().should.deepEqual(originalTx.body().total_collateral()!.to_bytes());
    body.reference_inputs()!.to_bytes().should.deepEqual(originalTx.body().reference_inputs()!.to_bytes());
    body.script_data_hash()!.to_bytes().should.deepEqual(originalTx.body().script_data_hash()!.to_bytes());
    witnessSet.plutus_scripts()!.to_bytes().should.deepEqual(originalTx.witness_set().plutus_scripts()!.to_bytes());
    witnessSet.plutus_data()!.to_bytes().should.deepEqual(originalTx.witness_set().plutus_data()!.to_bytes());
    witnessSet.redeemers()!.to_bytes().should.deepEqual(originalTx.witness_set().redeemers()!.to_bytes());

    const keyPair = new KeyPair({ prv: privateKeys.prvKey4 });
    const expected = CardanoWasm.make_vkey_witness(
      CardanoWasm.hash_transaction(body),
      CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(keyPair.getKeys().prv!, 'hex'))
    );
    const vkeys = witnessSet.vkeys();
    should.exist(vkeys);
    vkeys!.len().should.equal(1);
    vkeys!.get(0).vkey().public_key().to_hex().should.equal(keyPair.getKeys().pub);
    vkeys!.get(0).signature().to_hex().should.equal(expected.signature().to_hex());
  });

  it('should preserve auxiliary data through the passthrough path', async () => {
    const fixtureWithAux = buildPlutusFixtureHex(true);
    const factory = new TransactionBuilderFactory(coins.get('tada'));
    const txBuilder = factory.from(fixtureWithAux);
    txBuilder.sign({ key: privateKeys.prvKey4 });
    const tx = (await txBuilder.build()) as Transaction;

    const reparsed = CardanoWasm.Transaction.from_bytes(Buffer.from(tx.toBroadcastFormat(), 'hex'));
    const original = CardanoWasm.Transaction.from_bytes(Buffer.from(fixtureWithAux, 'hex'));
    should.exist(reparsed.auxiliary_data());
    reparsed.auxiliary_data()!.to_bytes().should.deepEqual(original.auxiliary_data()!.to_bytes());
    should.exist(reparsed.body().auxiliary_data_hash());
    reparsed
      .body()
      .auxiliary_data_hash()!
      .to_bytes()
      .should.deepEqual(original.body().auxiliary_data_hash()!.to_bytes());
  });
});
