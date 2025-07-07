import { Transaction, address } from "bitcoinjs-lib";
import { findMatchingTxOutputIndex } from "../../../src/utils/staking";
import { testingNetworks } from "../../helper";
import { StakingError, StakingErrorCode } from "../../../src/error";

describe.each(testingNetworks)('findMatchingTxOutputIndex', (
  { network, networkName, datagen: { stakingDatagen: dataGenerator } }
) => {
  it(`${networkName} should find the correct output index for a valid address`, () => {
    // Create a transaction with multiple outputs
    const tx = new Transaction();
    const keyPair1 = dataGenerator.generateRandomKeyPair();
    const keyPair2 = dataGenerator.generateRandomKeyPair();
    const outputAddress1 = dataGenerator.getAddressAndScriptPubKey(keyPair1.publicKey).nativeSegwit.address;
    const outputAddress2 = dataGenerator.getAddressAndScriptPubKey(keyPair2.publicKey).nativeSegwit.address;
    
    // Add outputs to the transaction
    tx.addOutput(
      address.toOutputScript(outputAddress1, network),
      1000000
    );
    tx.addOutput(
      address.toOutputScript(outputAddress2, network),
      2000000
    );

    // Test finding the first output
    const index1 = findMatchingTxOutputIndex(tx, outputAddress1, network);
    expect(index1).toBe(0);

    // Test finding the second output
    const index2 = findMatchingTxOutputIndex(tx, outputAddress2, network);
    expect(index2).toBe(1);
  });

  it(`${networkName} should throw an error when no matching output is found`, () => {
    const tx = new Transaction();
    const keyPair1 = dataGenerator.generateRandomKeyPair();
    const keyPair2 = dataGenerator.generateRandomKeyPair();
    const outputAddress1 = dataGenerator.getAddressAndScriptPubKey(keyPair1.publicKey).nativeSegwit.address;
    const outputAddress2 = dataGenerator.getAddressAndScriptPubKey(keyPair2.publicKey).nativeSegwit.address;
    
    // Add an output with a different address
    tx.addOutput(
      address.toOutputScript(outputAddress1, network),
      1000000
    );

    // Try to find an address that doesn't exist in the outputs
    expect(() => {
      findMatchingTxOutputIndex(tx, outputAddress2, network);
    }).toThrow(new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      `Matching output not found for address: ${outputAddress2}`
    ));
  });

  it(`${networkName} should handle empty transaction outputs`, () => {
    const tx = new Transaction();
    const keyPair = dataGenerator.generateRandomKeyPair();
    const outputAddress = dataGenerator.getAddressAndScriptPubKey(keyPair.publicKey).nativeSegwit.address;

    expect(() => {
      findMatchingTxOutputIndex(tx, outputAddress, network);
    }).toThrow(new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      `Matching output not found for address: ${outputAddress}`
    ));
  });

  it(`${networkName} should handle no matching address from output scripts`, () => {
    const tx = new Transaction();
    const keyPair = dataGenerator.generateRandomKeyPair();
    const outputAddress = dataGenerator.getAddressAndScriptPubKey(
      keyPair.publicKey
    ).nativeSegwit.address;

    tx.addOutput(
      Buffer.from('OP_RETURN xyz'),
      1000000
    );

    expect(() => {
      findMatchingTxOutputIndex(tx, outputAddress, network);
    }).toThrow(new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      `Matching output not found for address: ${outputAddress}`
    ));
  });
}); 