import * as wasm from './wasm/wasm_miniscript';

export function miniscriptNodesFromString(script: string, contextType: 'tap' | 'segwit' | 'legacy') {
  return wasm.miniscript_nodes_from_string(script, contextType);
}

export function descriptorNodesFromString(descriptor: string) {
  return wasm.descriptor_nodes_from_string(descriptor);
}
