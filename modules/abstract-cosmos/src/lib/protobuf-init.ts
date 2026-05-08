/**
 * Initialize and patch protobuf modules to ensure proper namespace binding
 */
export function initializeProtobufModules(): { MsgCompiled: any; ProposalCompiled: any; unifiedRoot: any } {
  const MsgCompiled = require('../../resources/MsgCompiled');

  // Store cosmos.base before loading ProposalCompiled (both modules share the same $root object)
  const cosmosBase = MsgCompiled.cosmos?.base;
  const ProposalCompiled = require('../../resources/ProposalCompiled');

  // Fix namespace collision by restoring cosmos.base
  if (cosmosBase && !MsgCompiled.cosmos.base) {
    MsgCompiled.cosmos.base = cosmosBase;
  }

  if (ProposalCompiled.cosmos?.group && !MsgCompiled.cosmos.group) {
    MsgCompiled.cosmos.group = ProposalCompiled.cosmos.group;
  }

  return {
    MsgCompiled,
    ProposalCompiled,
    unifiedRoot: MsgCompiled,
  };
}
