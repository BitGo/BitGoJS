import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { Any } from 'cosmjs-types/google/protobuf/any.js';
import { MsgSubmitProposal, Exec } from 'cosmjs-types/cosmos/group/v1/tx.js';

/**
 * Wraps an inner message in a MsgSubmitProposal for group transactions
 * @param innerMsgBase64 - The base64 encoded inner message
 * @param proposer - The proposer address
 * @param groupPolicyAddress - The group policy address
 * @returns The wrapped message with base64 value for better debugging
 */
export function wrapInGroupProposal(
  innerMsgBase64: string,
  proposer: string,
  groupPolicyAddress: string
): {
  typeUrl: string;
  value: string;
} {
  const innerMsg = Any.decode(fromBase64(innerMsgBase64));
  const proposal = MsgSubmitProposal.fromPartial({
    groupPolicyAddress,
    proposers: [proposer],
    metadata: 'exchange-commit',
    messages: [innerMsg],
    exec: Exec.EXEC_TRY,
  });

  return {
    typeUrl: '/cosmos.group.v1.MsgSubmitProposal',
    value: toBase64(MsgSubmitProposal.encode(proposal).finish()),
  };
}
