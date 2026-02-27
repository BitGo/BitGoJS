import { ITokenEnablement } from '@bitgo/sdk-core';
import { Transaction, parseTransaction, type ParsedTransaction, type InstructionParams } from '@bitgo/wasm-solana';
import { UNAVAILABLE_TEXT } from './constants';
import { StakingAuthorizeParams, TransactionExplanation as SolLibTransactionExplanation } from './iface';
import { findTokenName } from './instructionParamsFactory';

export interface ExplainTransactionWasmOptions {
  txBase64: string;
  feeInfo?: { fee: string };
  tokenAccountRentExemptAmount?: string;
  coinName: string;
}

// =============================================================================
// Transaction type derivation (ported from @bitgo/wasm-solana explain.ts)
// =============================================================================

enum TransactionType {
  Send = 'Send',
  StakingActivate = 'StakingActivate',
  StakingDeactivate = 'StakingDeactivate',
  StakingWithdraw = 'StakingWithdraw',
  StakingAuthorize = 'StakingAuthorize',
  StakingDelegate = 'StakingDelegate',
  WalletInitialization = 'WalletInitialization',
  AssociatedTokenAccountInitialization = 'AssociatedTokenAccountInitialization',
  CustomTx = 'CustomTx',
}

// =============================================================================
// Combined instruction pattern detection
// =============================================================================

// Solana native staking requires 3 separate instructions:
//   CreateAccount (fund) + StakeInitialize (set authorities) + DelegateStake (pick validator)
// Marinade staking uses only CreateAccount + StakeInitialize (no Delegate).
// Wallet init uses CreateAccount + NonceInitialize.

interface CombinedStakeActivate {
  kind: 'StakingActivate';
  fromAddress: string;
  stakingAddress: string;
  amount: bigint;
}

interface CombinedWalletInit {
  kind: 'WalletInitialization';
  fromAddress: string;
  nonceAddress: string;
  amount: bigint;
}

type CombinedPattern = CombinedStakeActivate | CombinedWalletInit;

function detectCombinedPattern(instructions: InstructionParams[]): CombinedPattern | null {
  for (let i = 0; i < instructions.length - 1; i++) {
    const curr = instructions[i];
    const next = instructions[i + 1];

    if (curr.type === 'CreateAccount' && next.type === 'StakeInitialize') {
      return {
        kind: 'StakingActivate',
        fromAddress: curr.fromAddress,
        stakingAddress: curr.newAddress,
        amount: curr.amount,
      };
    }

    if (curr.type === 'CreateAccount' && next.type === 'NonceInitialize') {
      return {
        kind: 'WalletInitialization',
        fromAddress: curr.fromAddress,
        nonceAddress: curr.newAddress,
        amount: curr.amount,
      };
    }
  }

  return null;
}

// =============================================================================
// Transaction type derivation
// =============================================================================

const BOILERPLATE_TYPES = new Set(['NonceAdvance', 'Memo', 'SetComputeUnitLimit', 'SetPriorityFee']);

function deriveTransactionType(
  instructions: InstructionParams[],
  combined: CombinedPattern | null,
  memo: string | undefined
): TransactionType {
  if (combined) return TransactionType[combined.kind];

  // Marinade deactivate: Transfer + memo containing "PrepareForRevoke"
  if (memo?.includes('PrepareForRevoke')) return TransactionType.StakingDeactivate;

  // Jito pool operations
  if (instructions.some((i) => i.type === 'StakePoolDepositSol')) return TransactionType.StakingActivate;
  if (instructions.some((i) => i.type === 'StakePoolWithdrawStake')) return TransactionType.StakingDeactivate;

  // ATA-only transactions (ignoring boilerplate)
  const meaningful = instructions.filter((i) => !BOILERPLATE_TYPES.has(i.type));
  if (meaningful.length > 0 && meaningful.every((i) => i.type === 'CreateAssociatedTokenAccount')) {
    return TransactionType.AssociatedTokenAccountInitialization;
  }

  // Direct staking instruction mapping
  const staking = instructions.find((i) => i.type in TransactionType);
  if (staking) return TransactionType[staking.type as keyof typeof TransactionType];

  // Unknown instructions indicate a custom/unrecognized transaction
  if (instructions.some((i) => i.type === 'Unknown')) return TransactionType.CustomTx;

  return TransactionType.Send;
}

// =============================================================================
// Transaction ID extraction
// =============================================================================

// Base58 encoding of 64 zero bytes (unsigned transactions have all-zero signatures)
const ALL_ZEROS_BASE58 = '1111111111111111111111111111111111111111111111111111111111111111';

function extractTransactionId(signatures: string[]): string | undefined {
  const sig = signatures[0];
  if (!sig || sig === ALL_ZEROS_BASE58) return undefined;
  return sig;
}

// =============================================================================
// Staking authorize mapping
// =============================================================================

/**
 * Map WASM StakingAuthorize instruction to the legacy BitGoJS shape.
 * BitGoJS uses different field names for Staker vs Withdrawer authority changes.
 */
function mapStakingAuthorize(instr: {
  stakingAddress: string;
  oldAuthorizeAddress: string;
  newAuthorizeAddress: string;
  authorizeType: 'Staker' | 'Withdrawer';
  custodianAddress?: string;
}): StakingAuthorizeParams {
  if (instr.authorizeType === 'Withdrawer') {
    return {
      stakingAddress: instr.stakingAddress,
      oldWithdrawAddress: instr.oldAuthorizeAddress,
      newWithdrawAddress: instr.newAuthorizeAddress,
      custodianAddress: instr.custodianAddress,
    };
  }
  // Staker authority change
  return {
    stakingAddress: instr.stakingAddress,
    oldWithdrawAddress: '',
    newWithdrawAddress: '',
    oldStakingAuthorityAddress: instr.oldAuthorizeAddress,
    newStakingAuthorityAddress: instr.newAuthorizeAddress,
  };
}

// =============================================================================
// Main explain function
// =============================================================================

/**
 * Standalone WASM-based transaction explanation.
 *
 * Parses the transaction via `parseTransaction(tx)` from @bitgo/wasm-solana,
 * then derives the transaction type, extracts outputs/inputs, computes fees,
 * and maps to BitGoJS TransactionExplanation format.
 *
 * The explain logic was ported from wasm-solana per the convention that
 * `explainTransaction` belongs in BitGoJS, not in wasm-* packages.
 */
export function explainSolTransaction(params: ExplainTransactionWasmOptions): SolLibTransactionExplanation {
  const txBytes = Buffer.from(params.txBase64, 'base64');
  const tx = Transaction.fromBytes(txBytes);
  const parsed: ParsedTransaction = parseTransaction(tx);

  // --- Transaction ID ---
  const id = extractTransactionId(parsed.signatures);

  // --- Fee calculation ---
  const lamportsPerSignature = params.feeInfo ? BigInt(params.feeInfo.fee) : 0n;
  let fee = BigInt(parsed.numSignatures) * lamportsPerSignature;

  // Each CreateAssociatedTokenAccount creates a new token account requiring a rent deposit.
  const ataCount = parsed.instructionsData.filter((i) => i.type === 'CreateAssociatedTokenAccount').length;
  if (ataCount > 0 && params.tokenAccountRentExemptAmount) {
    fee += BigInt(ataCount) * BigInt(params.tokenAccountRentExemptAmount);
  }

  // --- Extract memo (needed before type derivation) ---
  let memo: string | undefined;
  for (const instr of parsed.instructionsData) {
    if (instr.type === 'Memo') {
      memo = instr.memo;
    }
  }

  // --- Detect combined patterns and derive type ---
  const combined = detectCombinedPattern(parsed.instructionsData);
  const txType = deriveTransactionType(parsed.instructionsData, combined, memo);

  // Marinade deactivate: Transfer + PrepareForRevoke memo.
  // The Transfer is a contract interaction, not real value transfer — skip from outputs.
  const isMarinadeDeactivate =
    txType === TransactionType.StakingDeactivate && memo !== undefined && memo.includes('PrepareForRevoke');

  // --- Extract outputs and inputs ---
  const outputs: { address: string; amount: bigint; tokenName?: string }[] = [];
  const inputs: { address: string; value: bigint }[] = [];

  if (combined?.kind === 'StakingActivate') {
    outputs.push({ address: combined.stakingAddress, amount: combined.amount });
    inputs.push({ address: combined.fromAddress, value: combined.amount });
  } else if (combined?.kind === 'WalletInitialization') {
    outputs.push({ address: combined.nonceAddress, amount: combined.amount });
    inputs.push({ address: combined.fromAddress, value: combined.amount });
  } else {
    for (const instr of parsed.instructionsData) {
      switch (instr.type) {
        case 'Transfer':
          if (isMarinadeDeactivate) break;
          outputs.push({ address: instr.toAddress, amount: instr.amount });
          inputs.push({ address: instr.fromAddress, value: instr.amount });
          break;
        case 'TokenTransfer':
          outputs.push({ address: instr.toAddress, amount: instr.amount, tokenName: instr.tokenAddress });
          inputs.push({ address: instr.fromAddress, value: instr.amount });
          break;
        case 'StakingActivate':
          outputs.push({ address: instr.stakingAddress, amount: instr.amount });
          inputs.push({ address: instr.fromAddress, value: instr.amount });
          break;
        case 'StakingWithdraw':
          // Withdraw: SOL flows FROM staking address TO the recipient (fromAddress)
          outputs.push({ address: instr.fromAddress, amount: instr.amount });
          inputs.push({ address: instr.stakingAddress, value: instr.amount });
          break;
        case 'StakePoolDepositSol':
          // Jito liquid staking deposit
          outputs.push({ address: instr.stakePool, amount: instr.lamports });
          inputs.push({ address: instr.fundingAccount, value: instr.lamports });
          break;
      }
    }
  }

  // --- Output amount (native SOL only, not token amounts) ---
  const outputAmount = outputs.filter((o) => !o.tokenName).reduce((sum, o) => sum + o.amount, 0n);

  // --- ATA owner mapping and token enablements ---
  const ataOwnerMap: Record<string, string> = {};
  const tokenEnablements: ITokenEnablement[] = [];
  for (const instr of parsed.instructionsData) {
    if (instr.type === 'CreateAssociatedTokenAccount') {
      ataOwnerMap[instr.ataAddress] = instr.ownerAddress;
      tokenEnablements.push({
        address: instr.ataAddress,
        tokenName: findTokenName(instr.mintAddress, undefined, true),
        tokenAddress: instr.mintAddress,
      });
    }
  }

  // --- Staking authorize ---
  let stakingAuthorize: StakingAuthorizeParams | undefined;
  for (const instr of parsed.instructionsData) {
    if (instr.type === 'StakingAuthorize') {
      stakingAuthorize = mapStakingAuthorize(instr);
      break;
    }
  }

  // --- Resolve token names and convert bigint to string at serialization boundary ---
  const resolvedOutputs = outputs.map((o) => ({
    address: o.address,
    amount: String(o.amount),
    ...(o.tokenName ? { tokenName: findTokenName(o.tokenName, undefined, true) } : {}),
  }));

  const resolvedInputs = inputs.map((i) => ({
    address: i.address,
    value: String(i.value),
  }));

  return {
    displayOrder: [
      'id',
      'type',
      'blockhash',
      'durableNonce',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'tokenEnablements',
      'fee',
      'memo',
    ],
    id: id ?? UNAVAILABLE_TEXT,
    // WASM returns "StakingAuthorize" but BitGoJS uses "StakingAuthorizeRaw"
    // when deserializing from bytes (the non-raw type only exists during building).
    type: txType === TransactionType.StakingAuthorize ? 'StakingAuthorizeRaw' : txType,
    changeOutputs: [],
    changeAmount: '0',
    outputAmount: String(outputAmount),
    outputs: resolvedOutputs,
    inputs: resolvedInputs,
    feePayer: parsed.feePayer,
    fee: {
      fee: params.feeInfo ? String(fee) : '0',
      feeRate: params.feeInfo ? Number(params.feeInfo.fee) : undefined,
    },
    memo,
    blockhash: parsed.nonce,
    durableNonce: parsed.durableNonce,
    tokenEnablements,
    ataOwnerMap,
    ...(stakingAuthorize ? { stakingAuthorize } : {}),
  };
}
