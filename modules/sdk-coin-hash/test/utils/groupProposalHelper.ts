import { fromBase64, toBase64 } from '@cosmjs/encoding';
// eslint-disable-next-line import/no-internal-modules
const ProposalCompiled = require('@bitgo/abstract-cosmos/dist/resources/ProposalCompiled');
const Any = ProposalCompiled.google.protobuf.Any;
const { MsgSubmitProposal, Exec } = ProposalCompiled.cosmos.group.v1;

export function wrapInGroupProposal(
  innerMsgBase64: string,
  proposer: string,
  groupPolicyAddress: string
): {
  typeUrl: string;
  value: string;
} {
  const innerMsg = Any.decode(fromBase64(innerMsgBase64));
  const proposal = MsgSubmitProposal.create({
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
