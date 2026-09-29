import should from 'should';
import * as bs58 from 'bs58';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils, Transaction } from '../../../src';
import * as testData from '../../resources/sol';
import { ComputeBudgetInstruction, TransactionInstruction } from '@solana/web3.js';
import { TransactionBuilder } from '../../../src/lib/transactionBuilder';

const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111';

/**
 * Returns the on-chain instruction types of a built transaction in the order they appear
 * in the compiled message, which is what the network executes. The compiled message
 * includes the durable-nonce AdvanceNonceAccount instruction that web3.js serializes
 * first, so a sponsored transaction with a compute unit limit, priority fee and durable
 * nonce starts with [AdvanceNonceAccount, SetComputeUnitLimit, SetPriorityFee, ...].
 */
function compiledInstructionTypes(tx: Transaction): string[] {
  const message = tx.solTransaction.compileMessage();
  return message.instructions.map((compiledInstruction) => {
    const instruction = new TransactionInstruction({
      programId: message.accountKeys[compiledInstruction.programIdIndex],
      keys: compiledInstruction.accounts.map((accountKeyIndex) => ({
        pubkey: message.accountKeys[accountKeyIndex],
        isSigner: message.isAccountSigner(accountKeyIndex),
        isWritable: message.isAccountWritable(accountKeyIndex),
      })),
      data: Buffer.from(bs58.decode(compiledInstruction.data)),
    });
    return Utils.getInstructionType(instruction) as string;
  });
}

/**
 * Returns the compute-unit limits requested by the SetComputeUnitLimit instructions of
 * the built transaction.
 */
function computeUnitLimits(tx: Transaction): number[] {
  return tx.solTransaction.instructions
    .filter(
      (instruction) =>
        instruction.programId.toString() === COMPUTE_BUDGET_PROGRAM_ID &&
        Utils.getInstructionType(instruction) === 'SetComputeUnitLimit'
    )
    .map((instruction) => ComputeBudgetInstruction.decodeSetComputeUnitLimit(instruction).units);
}

/**
 * Raw transaction bytes of each builder intent below when no compute unit limit is set.
 * Captured from the builders before the compute-unit-limit work, so any change to the
 * no-limit build path (which must stay byte-identical) fails these comparisons.
 */
const RAW_TX_WITHOUT_COMPUTE_UNIT_LIMIT: Record<string, string> = {
  'transfer builder':
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAQHReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0Fv+hKJ+pxZaLwHGEyk2Svp5PfAC5ZEi/wYI1tPTHHhbqkYG1L37ZDq6w2tS3G+tFODYWdhMXF+kwlYEF+3o4nVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAVKU1qZKSEGTSTocWDaOHx8NbXdvJK7geQfqEBBBUSNBqfVFxksVo7gioRfc9KXiM8DXDFFshqzRNgGLqlAAADjMtr5L6vs6LY/96RABeX9/Zr6FYdWthxalfkEs7jQgQQDAwEGAAQEAAAABAAJAxAnAAAAAAAAAwIAAgwCAAAA4JMEAAAAAAAFAAl0ZXN0IG1lbW8=',
  'transfer builder v2':
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAMGReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0Fv+hKJ+pxZaLwHGEyk2Svp5PfAC5ZEi/wYI1tPTHHhbqkYG1L37ZDq6w2tS3G+tFODYWdhMXF+kwlYEF+3o4nVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAan1RcZLFaO4IqEX3PSl4jPA1wxRbIas0TYBi6pQAAA4zLa+S+r7Oi2P/ekQAXl/f2a+hWHVrYcWpX5BLO40IEDAwMBBQAEBAAAAAQACQMQJwAAAAAAAAMCAAIMAgAAAOCTBAAAAAAA',
  'token transfer builder':
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAUJAGymKVqOJEQemBHH67uu8ISJV4rtwTejLrjw7VSeW6dv+hKJ+pxZaLwHGEyk2Svp5PfAC5ZEi/wYI1tPTHHhbpXS8VwMObd6fTnfCKrnxvwQ5LFhipVbiG+aiTNM1eFsqRgbUvftkOrrDa1Lcb60U4NhZ2ExcX6TCVgQX7ejidUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAA0QOJ+87lKPIIYR3MxzSzEJJUDLK41Y0QDy6qLO202l4Gp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp4zLa+S+r7Oi2P/ekQAXl/f2a+hWHVrYcWpX5BLO40IEDBAMBBwAEBAAAAAUACQMQJwAAAAAAAAgEAgYDAAoM4JMEAAAAAAAJ',
  'ata initialization builder':
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAYJReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0EAxPE0fqi8zYGKbihafYdJgknwg8wIfK86jxD3ILOvGW/6Eon6nFlovAcYTKTZK+nk98ALlkSL/BgjW09MceFuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAA0QOJ+87lKPIIYR3MxzSzEJJUDLK41Y0QDy6qLO202l4Gp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp4zLa+S+r7Oi2P/ekQAXl/f2a+hWHVrYcWpX5BLO40IEDAwMCBwAEBAAAAAUACQMQJwAAAAAAAAQGAAEABgMIAQE=',
  'close ata builder':
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAMFReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0Fv+hKJ+pxZaLwHGEyk2Svp5PfAC5ZEi/wYI1tPTHHhbgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABqfVFxksVo7gioRfc9KXiM8DXDFFshqzRNgGLqlAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqeMy2vkvq+zotj/3pEAF5f39mvoVh1a2HFqV+QSzuNCBAgIDAQMABAQAAAAEAwEAAAEJ',
  'staking activate builder':
    'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAJDEXlebz5JTz2i0ff8fs6OlwsIbrFsjwJrhKm4FVr8ItBYnsvugEnYfm5Gbz5TLtMncgFHZ8JMpkxTTlJIzJovelv+hKJ+pxZaLwHGEyk2Svp5PfAC5ZEi/wYI1tPTHHhbgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACx+Xl4mhxH0TxI2HovJxcQ63+TJglRFzFikL1sKdr12Qah2BeRN1QqmDQ3vf4qerJVf1NcinhyK2ikncAAAAAABqHYF6UCBQtoB5Hmzm24jh5bcVD2H8Z5Ck600QAAAAAGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAAan1RcZLFaO4IqEX3PSl4jPA1wxRbIas0TYBi6pQAAABqfVFxksXFEhjMlMPUrxf1ja7gibof1E49vZigAAAAAGp9UXGTWE0P7tm7NDHRMga+VEKBtXuFZsxTdf9AAAAOMy2vkvq+zotj/3pEAF5f39mvoVh1a2HFqV+QSzuNCBBQMDAgkABAQAAAAEAAkDECcAAAAAAAADAgABNAAAAADgkwQAAAAAAMgAAAAAAAAABqHYF5E3VCqYNDe9/ip6slV/U1yKeHIraKSdwAAAAAAGAgEKdAAAAABF5Xm8+SU89otH3/H7OjpcLCG6xbI8Ca4SpuBVa/CLQUXlebz5JTz2i0ff8fs6OlwsIbrFsjwJrhKm4FVr8ItBAAAAAAAAAAAAAAAAAAAAAEXlebz5JTz2i0ff8fs6OlwsIbrFsjwJrhKm4FVr8ItBBgYBBQgLBwAEAgAAAA==',
  'staking deactivate builder':
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAUIReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0Fiey+6ASdh+bkZvPlMu0ydyAUdnwkymTFNOUkjMmi96W/6Eon6nFlovAcYTKTZK+nk98ALlkSL/BgjW09MceFuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAah2BeRN1QqmDQ3vf4qerJVf1NcinhyK2ikncAAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAOMy2vkvq+zotj/3pEAF5f39mvoVh1a2HFqV+QSzuNCBAwMDAgcABAQAAAAEAAkDECcAAAAAAAAFAwEGAAQFAAAA',
  'staking delegate builder':
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAgLReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0Fiey+6ASdh+bkZvPlMu0ydyAUdnwkymTFNOUkjMmi96W/6Eon6nFlovAcYTKTZK+nk98ALlkSL/BgjW09MceFuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAALH5eXiaHEfRPEjYei8nFxDrf5MmCVEXMWKQvWwp2vXZBqHYF5E3VCqYNDe9/ip6slV/U1yKeHIraKSdwAAAAAAGodgXpQIFC2gHkebObbiOHltxUPYfxnkKTrTRAAAAAAan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAABqfVFxksVo7gioRfc9KXiM8DXDFFshqzRNgGLqlAAAAGp9UXGTWE0P7tm7NDHRMga+VEKBtXuFZsxTdf9AAAAOMy2vkvq+zotj/3pEAF5f39mvoVh1a2HFqV+QSzuNCBAwMDAgkABAQAAAAEAAkDECcAAAAAAAAGBgEFCAoHAAQCAAAA',
  'staking withdraw builder':
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAYJReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0Fiey+6ASdh+bkZvPlMu0ydyAUdnwkymTFNOUkjMmi96W/6Eon6nFlovAcYTKTZK+nk98ALlkSL/BgjW09MceFuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAah2BeRN1QqmDQ3vf4qerJVf1NcinhyK2ikncAAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAAan1RcZNYTQ/u2bs0MdEyBr5UQoG1e4VmzFN1/0AAAA4zLa+S+r7Oi2P/ekQAXl/f2a+hWHVrYcWpX5BLO40IEDAwMCBwAEBAAAAAQACQMQJwAAAAAAAAUFAQAGCAAMBAAAAOCTBAAAAAAA',
  'wallet initialization builder':
    'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgADBUXlebz5JTz2i0ff8fs6OlwsIbrFsjwJrhKm4FVr8ItBb/oSifqcWWi8BxhMpNkr6eT3wAuWRIv8GCNbT0xx4W4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAan1RcZLFaO4IqEX3PSl4jPA1wxRbIas0TYBi6pQAAABqfVFxksXFEhjMlMPUrxf1ja7gibof1E49vZigAAAADjMtr5L6vs6LY/96RABeX9/Zr6FYdWthxalfkEs7jQgQICAgABNAAAAADgkwQAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAwEDBCQGAAAAReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0E=',
};

describe('Sol Transaction Builder compute unit limit', () => {
  const factory = getBuilderFactory('tsol');
  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
  const otherAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const validator = testData.validator;
  const walletPK = testData.associatedTokenAccounts.accounts[0].pub;
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const amount = '300000';
  const tokenAmount = testData.tokenTransfers.amount.toString();
  const nameUSDC = testData.tokenTransfers.nameUSDC;
  const durableNonce = { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub };
  const priorityFee = { amount: 10000 };
  const computeUnitLimit = 200000;

  interface BuilderCase {
    name: string;
    /** expected compiled instruction types of the built transaction, in order */
    expectedTypes: string[];
    makeBuilder: () => TransactionBuilder;
  }

  const builderCases: BuilderCase[] = [
    {
      name: 'transfer builder',
      expectedTypes: ['AdvanceNonceAccount', 'SetComputeUnitLimit', 'SetPriorityFee', 'Transfer', 'Memo'],
      makeBuilder: () => {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.nonce(recentBlockHash, durableNonce);
        txBuilder.sender(authAccount.pub);
        txBuilder.send({ address: otherAccount.pub, amount });
        txBuilder.setPriorityFee(priorityFee);
        txBuilder.memo('test memo');
        return txBuilder;
      },
    },
    {
      name: 'transfer builder v2',
      expectedTypes: ['AdvanceNonceAccount', 'SetComputeUnitLimit', 'SetPriorityFee', 'Transfer'],
      makeBuilder: () => {
        const txBuilder = factory.getTransferBuilderV2();
        txBuilder.nonce(recentBlockHash, durableNonce);
        txBuilder.sender(authAccount.pub);
        txBuilder.send({ address: otherAccount.pub, amount });
        txBuilder.setPriorityFee(priorityFee);
        return txBuilder;
      },
    },
    {
      name: 'token transfer builder',
      expectedTypes: ['AdvanceNonceAccount', 'SetComputeUnitLimit', 'SetPriorityFee', 'TokenTransfer'],
      makeBuilder: () => {
        const txBuilder = factory.getTokenTransferBuilder();
        txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
        txBuilder.sender(walletPK);
        txBuilder.send({ address: otherAccount.pub, amount: tokenAmount, tokenName: nameUSDC });
        txBuilder.setPriorityFee(priorityFee);
        return txBuilder;
      },
    },
    {
      name: 'ata initialization builder',
      expectedTypes: [
        'AdvanceNonceAccount',
        'SetComputeUnitLimit',
        'SetPriorityFee',
        'InitializeAssociatedTokenAccount',
      ],
      makeBuilder: () => {
        const txBuilder = factory.getAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash, durableNonce);
        txBuilder.sender(authAccount.pub);
        txBuilder.mint('tsol:usdc');
        txBuilder.owner(authAccount.pub);
        txBuilder.setPriorityFee(priorityFee);
        return txBuilder;
      },
    },
    {
      // the close ATA builder does not emit a priority fee instruction
      name: 'close ata builder',
      expectedTypes: ['AdvanceNonceAccount', 'SetComputeUnitLimit', 'CloseAssociatedTokenAccount'],
      makeBuilder: () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash, durableNonce);
        txBuilder.sender(authAccount.pub);
        txBuilder.accountAddress(nonceAccount.pub);
        txBuilder.destinationAddress(authAccount.pub);
        txBuilder.authorityAddress(authAccount.pub);
        return txBuilder;
      },
    },
    {
      name: 'staking activate builder',
      expectedTypes: [
        'AdvanceNonceAccount',
        'SetComputeUnitLimit',
        'SetPriorityFee',
        'Create',
        'Initialize',
        'Delegate',
      ],
      makeBuilder: () => {
        const txBuilder = factory.getStakingActivateBuilder();
        txBuilder.nonce(recentBlockHash, durableNonce);
        txBuilder.sender(authAccount.pub);
        txBuilder.stakingAddress(stakeAccount.pub);
        txBuilder.amount(amount);
        txBuilder.validator(validator.pub);
        txBuilder.setPriorityFee(priorityFee);
        return txBuilder;
      },
    },
    {
      name: 'staking deactivate builder',
      expectedTypes: ['AdvanceNonceAccount', 'SetComputeUnitLimit', 'SetPriorityFee', 'Deactivate'],
      makeBuilder: () => {
        const txBuilder = factory.getStakingDeactivateBuilder();
        txBuilder.nonce(recentBlockHash, durableNonce);
        txBuilder.sender(authAccount.pub);
        txBuilder.stakingAddress(stakeAccount.pub);
        txBuilder.setPriorityFee(priorityFee);
        return txBuilder;
      },
    },
    {
      name: 'staking delegate builder',
      expectedTypes: ['AdvanceNonceAccount', 'SetComputeUnitLimit', 'SetPriorityFee', 'Delegate'],
      makeBuilder: () => {
        const txBuilder = factory.getStakingDelegateBuilder();
        txBuilder.nonce(recentBlockHash, durableNonce);
        txBuilder.sender(authAccount.pub);
        txBuilder.stakingAddress(stakeAccount.pub);
        txBuilder.validator(validator.pub);
        txBuilder.setPriorityFee(priorityFee);
        return txBuilder;
      },
    },
    {
      name: 'staking withdraw builder',
      expectedTypes: ['AdvanceNonceAccount', 'SetComputeUnitLimit', 'SetPriorityFee', 'Withdraw'],
      makeBuilder: () => {
        const txBuilder = factory.getStakingWithdrawBuilder();
        txBuilder.nonce(recentBlockHash, durableNonce);
        txBuilder.sender(authAccount.pub);
        txBuilder.stakingAddress(stakeAccount.pub);
        txBuilder.amount(amount);
        txBuilder.setPriorityFee(priorityFee);
        return txBuilder;
      },
    },
    {
      // the wallet initialization builder is not a sponsored intent, but its parser
      // accepts leading compute-budget instructions so the tx still classifies and
      // round trips when a caller sets a limit
      name: 'wallet initialization builder',
      expectedTypes: ['SetComputeUnitLimit', 'Create', 'InitializeNonceAccount'],
      makeBuilder: () => {
        const txBuilder = factory.getWalletInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.sender(authAccount.pub);
        txBuilder.address(nonceAccount.pub);
        txBuilder.amount('300000');
        return txBuilder;
      },
    },
  ];

  describe('setComputeUnitLimit validation', () => {
    it('rejects limits that are not integers between 1 and 1,400,000', () => {
      const txBuilder = factory.getTransferBuilder();
      for (const invalid of [0, -1, 1.5, 1400001, NaN]) {
        should(() => txBuilder.setComputeUnitLimit(invalid)).throwError(
          `Invalid compute unit limit, expected an integer between 1 and 1400000, got: ${invalid}`
        );
      }
    });

    it('accepts the boundary limits 1 and 1,400,000', () => {
      const txBuilder = factory.getTransferBuilder();
      should.doesNotThrow(() => txBuilder.setComputeUnitLimit(1));
      should.doesNotThrow(() => txBuilder.setComputeUnitLimit(1400000));
    });
  });

  for (const { name, expectedTypes, makeBuilder } of builderCases) {
    describe(name, () => {
      it('builds [AdvanceNonce, SetComputeUnitLimit, SetComputeUnitPrice, ...] with a limit', async () => {
        const tx = (await makeBuilder().setComputeUnitLimit(computeUnitLimit).build()) as Transaction;

        compiledInstructionTypes(tx).should.deepEqual(expectedTypes);
        computeUnitLimits(tx).should.deepEqual([computeUnitLimit]);
        // the instruction is recorded for explain and parsing, exactly once
        tx.toJson()
          .instructionsData.filter((instruction) => instruction.type === 'SetComputeUnitLimit')
          .should.deepEqual([{ type: 'SetComputeUnitLimit', params: { units: computeUnitLimit } }]);
      });

      it('rebuilds byte-identically from raw and preserves the limit', async () => {
        const tx = (await makeBuilder().setComputeUnitLimit(computeUnitLimit).build()) as Transaction;
        const rawTx = tx.toBroadcastFormat();

        const rebuiltBuilder = factory.from(rawTx);
        const restoredLimit = (rebuiltBuilder as unknown as { _computeUnitLimit?: number })._computeUnitLimit;
        should.equal(restoredLimit, computeUnitLimit);

        const rebuiltTx = (await rebuiltBuilder.build()) as Transaction;
        // the signing-phase rebuild must be byte-identical and keep exactly one
        // SetComputeUnitLimit instruction with the original limit
        rebuiltTx.toBroadcastFormat().should.equal(rawTx);
        computeUnitLimits(rebuiltTx).should.deepEqual([computeUnitLimit]);
      });

      it('does not duplicate the instruction when the same builder builds twice', async () => {
        const txBuilder = makeBuilder().setComputeUnitLimit(computeUnitLimit);
        await txBuilder.build();
        const rebuiltTx = (await txBuilder.build()) as Transaction;

        computeUnitLimits(rebuiltTx).should.deepEqual([computeUnitLimit]);
        rebuiltTx
          .toJson()
          .instructionsData.filter((instruction) => instruction.type === 'SetComputeUnitLimit')
          .should.deepEqual([{ type: 'SetComputeUnitLimit', params: { units: computeUnitLimit } }]);
      });

      it('leaves the transaction bytes unchanged without a limit', async () => {
        const tx = (await makeBuilder().build()) as Transaction;
        tx.toBroadcastFormat().should.equal(RAW_TX_WITHOUT_COMPUTE_UNIT_LIMIT[name]);
      });
    });
  }

  describe('instruction order variants', () => {
    it('places the limit first when no durable nonce is used', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.setPriorityFee(priorityFee);
      txBuilder.setComputeUnitLimit(computeUnitLimit);
      const tx = (await txBuilder.build()) as Transaction;

      compiledInstructionTypes(tx).should.deepEqual(['SetComputeUnitLimit', 'SetPriorityFee', 'Transfer']);
    });

    it('places the limit before the transfer when no priority fee is used', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash, durableNonce);
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.setComputeUnitLimit(computeUnitLimit);
      const tx = (await txBuilder.build()) as Transaction;

      compiledInstructionTypes(tx).should.deepEqual(['AdvanceNonceAccount', 'SetComputeUnitLimit', 'Transfer']);
    });
  });

  describe('signed rebuild', () => {
    it('rebuilds a signed transaction byte-identically from raw with the limit', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.nonce(recentBlockHash, durableNonce);
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.setPriorityFee(priorityFee);
      txBuilder.setComputeUnitLimit(computeUnitLimit);
      txBuilder.sign({ key: authAccount.prv });
      const tx = (await txBuilder.build()) as Transaction;
      const rawTx = tx.toBroadcastFormat();

      const rebuiltTx = (await factory.from(rawTx).build()) as Transaction;
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      computeUnitLimits(rebuiltTx).should.deepEqual([computeUnitLimit]);
      rebuiltTx.signature.should.deepEqual(tx.signature);
    });
  });
});
