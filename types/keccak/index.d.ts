declare namespace keccak {
  class Keccak extends Transform {
    constructor(
      rate: number,
      capacity: number,
      delimitedSuffix: number | null,
      hashBitLength: number,
      options: TransformOptions
    );
    update(data: string | Buffer, encoding?: BufferEncoding): Keccak;
    digest(): Buffer;
    digest(encoding: BufferEncoding): string;
    // The @types/keccak package is missing the copy declaration of the Keccak class.
    //   https://github.com/cryptocoinjs/keccak/blob/v3.0.2/lib/keccak.js
    copy(dest: Buffer): void;
  }
  function create(algorithm: KeccakAlgorithm | Sha3Algorithm, options?: TransformOptions): Keccak;

  function create(algorithm: ShakeAlgorithm, options?: TransformOptions): Shake;

  export = create;
}
