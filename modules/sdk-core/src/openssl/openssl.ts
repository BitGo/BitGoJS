import { init, WASI } from '@wasmer/wasi';

import path from 'path';
import fs from 'fs';

// import { lowerI64Imports } from '@wasmer/wasm-transformer';

export class OpenSSL {
  wasmBinaryPath: string;
  constructor() {
    this.wasmBinaryPath = './openssl.wasm';
  }

  async init() {
    // This is needed to load the WASI library first (since is a Wasm module)
    await init();
  }

  async runCommand(openSslCommand: string | string[]): Promise<string> {
    const command = Array.isArray(openSslCommand) ? openSslCommand : openSslCommand.split(/[\s]{1,}/g).filter(Boolean);
    console.log(`Going to run ${command}`);
    // Async function to run our Wasm module/instance
    const startWasiTask = async (pathToWasmFile) => {
      const wasi = new WASI({
        env: {},
        args: command,
      });

      const wasmBytes = new Uint8Array(fs.readFileSync(path.resolve(__dirname, pathToWasmFile)));
      // const moduleBytes = await lowerI64Imports(wasmBytes);
      const module = await WebAssembly.compile(wasmBytes);
      // Instantiate the WASI module
      await wasi.instantiate(module, {});

      // Run the start function
      wasi.start();
      const result = wasi.getStdoutString();
      console.log(`stdout was: ${result}`);
      return result;
    };

    // Everything starts here
    return startWasiTask(this.wasmBinaryPath).then((result) => {
      console.log(result);
      return result;
    });
  }
}
