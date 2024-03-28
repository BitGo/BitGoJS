import { generatePrime } from 'crypto';

export async function generateSafePrime(bitlength: number): Promise<bigint> {
  return new Promise<bigint>((resolve, reject) => {
    generatePrime(
      bitlength,
      {
        safe: true,
        bigint: true,
      },
      (err, prime) => {
        if (err) {
          reject(err);
        }
        resolve(prime);
      }
    );
  });
}
export function generateSafePrimes(bitLengths: number[]): Promise<bigint[]> {
  return Promise.all(bitLengths.map(generateSafePrime));
}
