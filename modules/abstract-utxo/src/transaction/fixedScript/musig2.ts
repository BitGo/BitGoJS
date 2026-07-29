export interface Musig2Participant<T> {
  getMusig2Nonces(psbt: T, walletId: string): Promise<T>;
}
