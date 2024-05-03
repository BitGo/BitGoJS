import { OpenSSL } from './openssl';

export async function generateSafePrime(bitlength: number): Promise<bigint> {
  const openSSL = new OpenSSL();
  await openSSL.init();
  return openSSL.generateSafePrime(bitlength);
}

export async function generateSafePrimes(bitLengths: number[]): Promise<bigint[]> {
  const openSSL = new OpenSSL();
  await openSSL.init();
  const promises: Promise<bigint>[] = bitLengths.map((bitlength: number) => {
    return openSSL.generateSafePrime(bitlength);
  });
  return await Promise.all(promises);
}
