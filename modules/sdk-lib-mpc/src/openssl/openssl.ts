import { init, WASI } from '@wasmer/wasi';
import { loadWebAssembly } from './opensslbytes';

export class OpenSSL {
  private waModule: WebAssembly.Module;
  private isInitialized = false;

  async init(): Promise<void> {
    await init();
    this.waModule = await WebAssembly.compile(await this.getWasmBytes());
    this.isInitialized = true;
  }

  async generateSafePrime(bitLength: number): Promise<bigint> {
    const bigIntString = await this.runCommand(`prime -bits ${bitLength} -generate -safe`);
    return BigInt(bigIntString);
  }
  private async runCommand(openSslCommand: string | string[]): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('The OpenSSl class is not initialized! Please call OpenSSL.init().');
    }
    const command = Array.isArray(openSslCommand) ? openSslCommand : openSslCommand.split(/[\s]{1,}/g).filter(Boolean);
    const wasi = new WASI({
      args: command,
    });

    // Instantiate the WASI module
    // cannot use wasi.instantiate(module, {}); due to the size of the module
    const instance = await WebAssembly.instantiate(this.waModule, {
      ...wasi.getImports(this.waModule),
    });
    // Run the start function
    wasi.start(instance);
    return wasi.getStdoutString();
  }

  private async getWasmBytes(): Promise<Uint8Array> {
    const waBuffer = loadWebAssembly();
    if (!waBuffer) {
      throw new Error('Cannot load openssl web-assembly!');
    }
    return waBuffer.buffer;
  }
}
