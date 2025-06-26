import type { Descriptor as DescriptorType, Psbt as PsbtType } from '@bitgo/wasm-miniscript';

// Dynamic import cache
let wasmModuleCache: {
  ast: any;
  Descriptor: any;
  Miniscript: any;
  Psbt: any;
} | null = null;

// Promise to track the loading state
let loadingPromise: Promise<void> | null = null;

/**
 * Dynamically loads the WASM miniscript module and caches the exports
 */
async function loadWasmModule() {
  if (wasmModuleCache) {
    return wasmModuleCache;
  }

  if (loadingPromise) {
    await loadingPromise;
    return wasmModuleCache!;
  }

  loadingPromise = (async () => {
    const module = await import('@bitgo/wasm-miniscript');
    wasmModuleCache = {
      ast: module.ast,
      Descriptor: module.Descriptor,
      Miniscript: module.Miniscript,
      Psbt: module.Psbt,
    };
  })();

  await loadingPromise;
  return wasmModuleCache!;
}

/**
 * Shim class that provides synchronous access to the WASM module exports
 * The module is loaded lazily on first access
 */
export class MiniscriptShim {
  private static _instance: MiniscriptShim | null = null;
  private _loaded = false;
  private _ast: any = null;
  private _Descriptor: any = null;
  private _Miniscript: any = null;
  private _Psbt: any = null;

  static getInstance(): MiniscriptShim {
    if (!MiniscriptShim._instance) {
      MiniscriptShim._instance = new MiniscriptShim();
    }
    return MiniscriptShim._instance;
  }

  /**
   * Initialize the shim by loading the WASM module
   * This should be called once at application startup
   */
  async initialize(): Promise<void> {
    if (this._loaded) {
      return;
    }

    const module = await loadWasmModule();
    this._ast = module.ast;
    this._Descriptor = module.Descriptor;
    this._Miniscript = module.Miniscript;
    this._Psbt = module.Psbt;
    this._loaded = true;
  }

  /**
   * Get the ast export - throws if not initialized
   */
  get ast() {
    if (!this._loaded) {
      throw new Error('MiniscriptShim not initialized. Call initialize() first.');
    }
    return this._ast;
  }

  /**
   * Get the Descriptor export - throws if not initialized
   */
  get Descriptor() {
    if (!this._loaded) {
      throw new Error('MiniscriptShim not initialized. Call initialize() first.');
    }
    return this._Descriptor;
  }

  /**
   * Get the Miniscript export - throws if not initialized
   */
  get Miniscript() {
    if (!this._loaded) {
      throw new Error('MiniscriptShim not initialized. Call initialize() first.');
    }
    return this._Miniscript;
  }

  /**
   * Get the Psbt export - throws if not initialized
   */
  get Psbt() {
    if (!this._loaded) {
      throw new Error('MiniscriptShim not initialized. Call initialize() first.');
    }
    return this._Psbt;
  }

  /**
   * Check if the shim is initialized
   */
  get isInitialized(): boolean {
    return this._loaded;
  }
}

// Create singleton instance
const shimInstance = MiniscriptShim.getInstance();

// Export the individual modules through the shim
export const ast = new Proxy({} as any, {
  get(target, prop) {
    return shimInstance.ast[prop];
  },
});

export const Descriptor: typeof DescriptorType = new Proxy({} as any, {
  get(target, prop) {
    return shimInstance.Descriptor[prop];
  },
});

export const Miniscript = new Proxy({} as any, {
  get(target, prop) {
    return shimInstance.Miniscript[prop];
  },
});

export const Psbt: typeof PsbtType = new Proxy({} as any, {
  get(target, prop) {
    return shimInstance.Psbt[prop];
  },
});

// Export initialization function for consumers
export async function initializeMiniscript(): Promise<void> {
  await shimInstance.initialize();
}
