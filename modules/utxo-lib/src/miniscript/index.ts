import type {
  ast as AstType,
  Descriptor as DescriptorType,
  Miniscript as MiniscriptType,
  Psbt as PsbtType,
} from '@bitgo/wasm-miniscript';

interface WasmModule {
  ast: typeof AstType;
  Descriptor: typeof DescriptorType;
  Miniscript: typeof MiniscriptType;
  Psbt: typeof PsbtType;
}

/**
 * Shim class that provides synchronous access to the WASM module exports
 */
export class MiniscriptShim {
  private static _instance: MiniscriptShim | null = null;
  private _module: WasmModule | null = null;

  static getInstance(): MiniscriptShim {
    if (!MiniscriptShim._instance) {
      MiniscriptShim._instance = new MiniscriptShim();
    }
    return MiniscriptShim._instance;
  }

  /**
   * Initialize the shim by loading the WASM module
   */
  initialize(module: WasmModule): void {
    this._module = module;
  }

  private get module(): WasmModule {
    if (!this._module) {
      throw new Error('MiniscriptShim not initialized. Call initializeMiniscript() first.');
    }
    return this._module;
  }

  get ast(): typeof AstType {
    return this.module.ast;
  }
  get Descriptor(): typeof DescriptorType {
    return this.module.Descriptor;
  }
  get Miniscript(): typeof MiniscriptType {
    return this.module.Miniscript;
  }
  get Psbt(): typeof PsbtType {
    return this.module.Psbt;
  }
  get isInitialized(): boolean {
    return this._module !== null;
  }
}

// Create singleton instance
export const miniscript = MiniscriptShim.getInstance();

// Export initialization function for consumers
export function initializeMiniscript(module: WasmModule): void {
  miniscript.initialize(module);
}
