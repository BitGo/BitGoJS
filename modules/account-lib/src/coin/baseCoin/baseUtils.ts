export interface BaseUtils {
  /**
   * Returns whether or not the string is a valid protocol address
   *
   * @param {string} address - the address to be validated
   * @returns {boolean} - the validation result
   */
  isValidAddress(address: string): boolean;

  /**
   * Returns whether or not the string is a valid protocol transaction id or not
   *
   * @param {string} txId - the transaction id to be validated
   * @returns {boolean} - the validation result
   */
  isValidTransactionId(txId: string): boolean;

  /**
   * Returns whether or not the string is a valid protocol public key
   *
   * @param {string} key - the  public key to be validated
   * @returns {boolean} - the validation result
   */
  isValidPublicKey(key: string): boolean;

  /**
   * Returns whether or not the string is a valid protocol private key
   *
   * @param {string} key - the  private key to be validated
   * @returns {boolean} - the validation result
   */
  isValidPrivateKey(key: string): boolean;

  /**
   * Returns whether or not the string is a valid protocol signature
   *
   * @param {string} signature - the signature to validate
   * @returns {boolean} - the validation result
   */
  isValidSignature(signature: string): boolean;

  /**
   * Returns whether or not the string is a valid protocol block hash
   *
   * @param {string} hash - the address to validate
   * @returns {boolean} - the validation result
   */
  isValidBlockId(hash: string): boolean;
}
