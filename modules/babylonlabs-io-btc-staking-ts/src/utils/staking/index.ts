import { address, networks, payments, Transaction } from "bitcoinjs-lib";
import { Taptree } from "bitcoinjs-lib/src/types";
import { internalPubkey } from "../../constants/internalPubkey";
import { StakingError, StakingErrorCode } from "../../error";
import { TransactionOutput } from "../../types/psbtOutputs";
export interface OutputInfo {
  scriptPubKey: Buffer;
  outputAddress: string;
}

/**
 * Build the staking output for the transaction which contains p2tr output
 * with staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @param {number} amount - The amount to stake.
 * @returns {TransactionOutput[]} - The staking transaction outputs.
 * @throws {Error} - If the staking output cannot be built.
 */
export const buildStakingTransactionOutputs = (
  scripts: {
    timelockScript: Buffer;
    unbondingScript: Buffer;
    slashingScript: Buffer;
    dataEmbedScript?: Buffer;
  },
  network: networks.Network,
  amount: number,
): TransactionOutput[] => {
  const stakingOutputInfo = deriveStakingOutputInfo(scripts, network);
  const transactionOutputs: { scriptPubKey: Buffer; value: number }[] = [
    {
      scriptPubKey: stakingOutputInfo.scriptPubKey,
      value: amount,
    },
  ];
  if (scripts.dataEmbedScript) {
    // Add the data embed output to the transaction
    transactionOutputs.push({
      scriptPubKey: scripts.dataEmbedScript,
      value: 0,
    });
  }
  return transactionOutputs;
};

/**
 * Derive the staking output address from the staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {StakingOutput} - The staking output address and scriptPubKey.
 * @throws {StakingError} - If the staking output address cannot be derived.
 */
export const deriveStakingOutputInfo = (
  scripts: {
    timelockScript: Buffer;
    unbondingScript: Buffer;
    slashingScript: Buffer;
  },
  network: networks.Network,
) => {
  // Build outputs
  const scriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    [{ output: scripts.unbondingScript }, { output: scripts.timelockScript }],
  ];

  // Create an pay-2-taproot (p2tr) output using the staking script
  const stakingOutput = payments.p2tr({
    internalPubkey,
    scriptTree,
    network,
  });

  if (!stakingOutput.address) {
    throw new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      "Failed to build staking output",
    );
  }

  return {
    outputAddress: stakingOutput.address,
    scriptPubKey: address.toOutputScript(stakingOutput.address, network),
  };
};

/**
 * Derive the unbonding output address and scriptPubKey from the staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {OutputInfo} - The unbonding output address and scriptPubKey.
 * @throws {StakingError} - If the unbonding output address cannot be derived.
 */
export const deriveUnbondingOutputInfo = (
  scripts: {
    unbondingTimelockScript: Buffer;
    slashingScript: Buffer;
  },
  network: networks.Network,
) => {
  const outputScriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    { output: scripts.unbondingTimelockScript },
  ];

  const unbondingOutput = payments.p2tr({
    internalPubkey,
    scriptTree: outputScriptTree,
    network,
  });

  if (!unbondingOutput.address) {
    throw new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      "Failed to build unbonding output",
    );
  }

  return {
    outputAddress: unbondingOutput.address,
    scriptPubKey: address.toOutputScript(unbondingOutput.address, network),
  };
};

/**
 * Derive the slashing output address and scriptPubKey from the staking scripts.
 *
 * @param {StakingScripts} scripts - The unbonding timelock scripts, we use the
 * unbonding timelock script as the timelock of the slashing transaction.
 * This is due to slashing tx timelock is the same as the unbonding timelock.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {OutputInfo} - The slashing output address and scriptPubKey.
 * @throws {StakingError} - If the slashing output address cannot be derived.
 */
export const deriveSlashingOutput = (
  scripts: {
    unbondingTimelockScript: Buffer;
  },
  network: networks.Network,
) => {
  const slashingOutput = payments.p2tr({
    internalPubkey,
    scriptTree: { output: scripts.unbondingTimelockScript },
    network,
  });
  const slashingOutputAddress = slashingOutput.address;

  if (!slashingOutputAddress) {
    throw new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      "Failed to build slashing output address",
    );
  }

  return {
    outputAddress: slashingOutputAddress,
    scriptPubKey: address.toOutputScript(slashingOutputAddress, network),
  };
};

/**
 * Find the matching output index for the given transaction.
 *
 * @param {Transaction} tx - The transaction.
 * @param {string} outputAddress - The output address.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {number} - The output index.
 * @throws {Error} - If the matching output is not found.
 */
export const findMatchingTxOutputIndex = (
  tx: Transaction,
  outputAddress: string,
  network: networks.Network,
) => {
  const index = tx.outs.findIndex((output) => {
    try {
      return address.fromOutputScript(output.script, network) === outputAddress;
    } catch (error) {
      return false;
    }
  });

  if (index === -1) {
    throw new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      `Matching output not found for address: ${outputAddress}`,
    );
  }

  return index;
};

/**
 * toBuffers converts an array of strings to an array of buffers.
 *
 * @param {string[]} inputs - The input strings.
 * @returns {Buffer[]} - The buffers.
 * @throws {StakingError} - If the values cannot be converted to buffers.
 */
export const toBuffers = (inputs: string[]): Buffer[] => {
  try {
    return inputs.map((i) => Buffer.from(i, "hex"));
  } catch (error) {
    throw StakingError.fromUnknown(
      error,
      StakingErrorCode.INVALID_INPUT,
      "Cannot convert values to buffers",
    );
  }
};


/**
 * Strips all signatures from a transaction by clearing both the script and
 * witness data. This is due to the fact that we only need the raw unsigned
 * transaction structure. The signatures are sent in a separate protobuf field
 * when creating the delegation message in the Babylon.
 * @param tx - The transaction to strip signatures from
 * @returns A copy of the transaction with all signatures removed
 */
export const clearTxSignatures = (tx: Transaction): Transaction => {
  tx.ins.forEach((input) => {
    input.script = Buffer.alloc(0);
    input.witness = [];
  });
  return tx;
};

/**
 * Derives the merkle proof from the list of hex strings. Note the
 * sibling hashes are reversed from hex before concatenation.
 * @param merkle - The merkle proof hex strings.
 * @returns The merkle proof in hex string format.
 */
export const deriveMerkleProof = (merkle: string[]) => {
  const proofHex = merkle.reduce((acc: string, m: string) => {
    return acc + Buffer.from(m, "hex").reverse().toString("hex");
  }, "");
  return proofHex;
};

/**
 * Extracts the first valid Schnorr signature from a signed transaction.
 *
 * Since we only handle transactions with a single input and request a signature
 * for one public key, there can be at most one signature from the Bitcoin node.
 * A valid Schnorr signature is exactly 64 bytes in length.
 *
 * @param singedTransaction - The signed Bitcoin transaction to extract the signature from
 * @returns The first valid 64-byte Schnorr signature found in the transaction witness data,
 *          or undefined if no valid signature exists
 */
export const extractFirstSchnorrSignatureFromTransaction = (
  singedTransaction: Transaction,
): Buffer | undefined => {
  // Loop through each input to extract the witness signature
  for (const input of singedTransaction.ins) {
    if (input.witness && input.witness.length > 0) {
      const schnorrSignature = input.witness[0];

      // Check that it's a 64-byte Schnorr signature
      if (schnorrSignature.length === 64) {
        return schnorrSignature; // Return the first valid signature found
      }
    }
  }
  return undefined;
};
