import { OpenSSL } from './openssl';

export async function generateSafePrime(bitlength: number, openSSLBytes: Uint8Array): Promise<bigint> {
  const openSSL = new OpenSSL();
  await openSSL.init(openSSLBytes);
  return openSSL.generateSafePrime(bitlength);
}

export async function generateSafePrimes(bitLengths: number[], openSSLBytes: Uint8Array): Promise<bigint[]> {
  const openSSL = new OpenSSL();
  await openSSL.init(openSSLBytes);
  const promises: Promise<bigint>[] = bitLengths.map((bitlength: number) => {
    return openSSL.generateSafePrime(bitlength);
  });
  return await Promise.all(promises);
}
