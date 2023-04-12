import { init, WASI } from '@wasmer/wasi';
import { loadWebAssembly } from './opensslbytes';

export const isNode = !!(typeof process !== 'undefined' && process.versions && process.versions.node);
export class OpenSSL {
  wasmBinaryPath: string;

  async init(): Promise<void> {
    await init();
  }

  async runCommand(openSslCommand: string | string[]): Promise<string> {
    const command = Array.isArray(openSslCommand) ? openSslCommand : openSslCommand.split(/[\s]{1,}/g).filter(Boolean);
    // Async function to run our Wasm module/instance
    const wasi = new WASI({
      args: command,
    });
    const waModule = await WebAssembly.compile(await this.getWasmBytes());

    // Instantiate the WASI module
    // cannot use wasi.instantiate(module, {}); due to the size of the module
    const instance = await WebAssembly.instantiate(waModule, {
      ...wasi.getImports(waModule),
    });
    // Run the start function
    wasi.start(instance);
    const result = wasi.getStdoutString();
    return result;
  }

  async getWasmBytes(): Promise<Uint8Array> {
    const waBuffer = loadWebAssembly();
    if (!waBuffer) {
      throw new Error('Cannot load openssl web-assembly!');
    }
    return waBuffer.buffer;
  }
}
