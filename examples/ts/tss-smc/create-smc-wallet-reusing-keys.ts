import { BitGo, KeyType } from "bitgo";
import { writeFileSync } from "fs";

// This script creates a self-managed cold wallet reusing the same keys but requires a seed
// This outputs a file with the wallet information

// Set the environment variables here
const bitgo = new BitGo({ env: "test" }); // "test" or "prod"
const accessToken = "v2..."; // Access token
const enterpriseId = "641dde3decfa200008a6a38826b2793e"; // Enterprise ID
const coinName = "tsol"; // "tsol" for testnet, "sol" for mainnet
const walletName = "SMC Solana 2"; // Name of the wallet to be created

// Set the seed for the new wallet derivation (it can be any random string but must be unique)
// *IMPORTANT* make sure to save the seed for each wallet, it will be needed to recover the wallet
const derivedFromParentWithSeed = undefined // 'random seed'

// Set user common keychain from the OVC User public key
const userCommonKeyChain = "6e1bf...9c967"

// Set the bitgo key id (you can get this from wallet json file, is the third key in the array of keys)
const bitgoKeyId = "649b69a0d2521600089f16044cd5e5cb";

async function createSMCWalletStep2() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const bitgoCoin = bitgo.coin(coinName);

  const bitgoKeyChain = await bitgoCoin.keychains().get({ id: bitgoKeyId })

  if (!bitgoKeyChain || !bitgoKeyChain.commonKeychain) {
    throw new Error("BitGo keychain not found")
  }

  if (bitgoKeyChain.commonKeychain !== userCommonKeyChain) {
    throw new Error("Common keychain mismatch between the User and Bitgo key");
  }

  if (!derivedFromParentWithSeed) {
    throw new Error("derivedFromParentWithSeed is required")
  }

  const userKeychainParams = {
    source: "user",
    keyType: "tss" as KeyType,
    commonKeychain: userCommonKeyChain,
    derivedFromParentWithSeed
  };
  const userKeychain = await bitgoCoin.keychains().add(userKeychainParams);

  const backupKeyChainParams = {
    source: "backup",
    keyType: "tss" as KeyType,
    commonKeychain: userCommonKeyChain,
    derivedFromParentWithSeed
  };

  const backupKeyChain = await bitgoCoin.keychains().add(backupKeyChainParams);

  const walletParams = {
    label: walletName,
    walletVersion: 2,
    m: 2,
    n: 3,
    keys: [userKeychain.id, backupKeyChain.id, bitgoKeyChain.id],
    isCold: true,
    multisigType: "tss" as any,
    enterprise: enterpriseId,
  };

  const wallet = await bitgoCoin.wallets().add(walletParams);
  const stringifiedWallet = JSON.stringify(wallet);
  console.log('Wallet created sucessfully:')
  console.log(stringifiedWallet);
  writeFileSync(`./json/wallet-${walletName}.json`, stringifiedWallet)
}

createSMCWalletStep2().catch((e) => console.error(e));