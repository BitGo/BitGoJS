export function pathToIndices(path: string): number[] {
  return path
    .replace(/^m?\//, '')
    .split('/')
    .map((index) => parseInt(index, 10));
}

export function auditEddsaPrivateKey(
  privateKey: string,
  commonKeychain: string
): { isValid: boolean; isPrivateKeyValid?: boolean; isCommonKeychainValid?: boolean } {
  // For TSS validation, we would need GPG private key for full implementation
  // This is a simplified validation of key format
  if (commonKeychain.length !== 128) {
    return { isValid: false, isCommonKeychainValid: false };
  }

  try {
    const parsedKey = JSON.parse(privateKey);
    if ('uShare' in parsedKey) {
      // If the key is in JSON format, we need to check the private key length
      const privateKeyLength = parsedKey.uShare.seed.length + parsedKey.uShare.chaincode.length;
      if (privateKeyLength !== 128) {
        return { isValid: false, isPrivateKeyValid: false, isCommonKeychainValid: true };
      }
    } else {
      // If the key is not in JSON format, we need to check the length directly
      if (privateKey.length !== 128) {
        return { isValid: false, isPrivateKeyValid: false, isCommonKeychainValid: true };
      }
    }
  } catch (e) {
    return { isValid: false, isPrivateKeyValid: false, isCommonKeychainValid: true };
  }

  return {
    isValid: true,
  };
}

export function auditEcdsaPrivateKey(
  privateKey: string,
  commonKeychain: string
): { isValid: boolean; isPrivateKeyValid?: boolean; isCommonKeychainValid?: boolean } {
  if (commonKeychain.length !== 130 && commonKeychain.length !== 0) {
    return { isValid: false, isCommonKeychainValid: false };
  }

  // DKLs key chains do not have a fixed length but we know for sure they are greater than 192 in length
  if (privateKey.length !== 128 && privateKey.length !== 192 && privateKey.length <= 192) {
    return { isValid: false, isPrivateKeyValid: false, isCommonKeychainValid: true };
  }

  return {
    isValid: true,
    isPrivateKeyValid: true,
    isCommonKeychainValid: true,
  };
}
