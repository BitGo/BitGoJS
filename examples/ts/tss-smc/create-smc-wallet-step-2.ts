import { AddKeychainOptions, BitGo, KeyType } from "bitgo";
import { readFileSync, writeFileSync } from "fs";

// This creates a self-managed cold wallet
// This validates that the commonKeychain matches between OVC 1, OVC 2, and BitGo
// Set the BitGo key ID from the step 1
// Put the public key file from the OVC 1 in the JSON folder and name it public-key-from-ovc1.json
// Put the public key file from the OVC 2 in the JSON folder and name it public-key-from-ovc2.json
// This outputs a file with the wallet information

// Set the environment variables here
const bitgo = new BitGo({ env: "test" }); // "test" or "prod"
const accessToken = "v2..."; // Access token
const enterpriseId = "641dde3decfa200008a6a38826b2793e"; // Enterprise ID
const coinName = "tsol"; // "tsol" for testnet, "sol" for mainnet
const walletName = "SMC Solana 2"; // Name of the wallet to be created

// Set the bitgo key id from the step 1
const bitgoKeyId = "649b69a0d2521600089f16044cd5e5cb";

// OPTIONAL - Set the seed for the new wallet derivation (it can be any random string but needs to be unique)
// *IMPORTANT* make sure to save the seed for each wallet, it will be needed to recover the wallet
const derivedFromParentWithSeed = undefined // 'random seed'

async function createSMCWalletStep2() {
  const ovc1CommonKeychain: { commonKeychain: string } =
    JSON.parse(readFileSync("./json/public-key-from-ovc1.json").toString());
  const ovc2CommonKeychain: { commonKeychain: string } =
    JSON.parse(readFileSync("./json/public-key-from-ovc2.json").toString());

  if (ovc1CommonKeychain.commonKeychain !== ovc2CommonKeychain.commonKeychain) {
    throw new Error("Common keychain mismatch between the two OVCs");
  }

  bitgo.authenticateWithAccessToken({ accessToken });
  const bitgoCoin = bitgo.coin(coinName);

  const bitgoKeyChain = await bitgoCoin.keychains().get({ id: bitgoKeyId })

  if (!bitgoKeyChain || !bitgoKeyChain.commonKeychain) {
    throw new Error("BitGo keychain not found")
  }

  if (bitgoKeyChain.commonKeychain !== ovc1CommonKeychain.commonKeychain) {
    throw new Error("Common keychain mismatch between the OVCs and BitGo");
  }

  const userKeychainParams: AddKeychainOptions = {
    source: "user",
    keyType: "tss" as KeyType,
    commonKeychain: ovc1CommonKeychain.commonKeychain,
  };

  const backupKeychainParams: AddKeychainOptions = {
    source: "backup",
    keyType: "tss" as KeyType,
    commonKeychain: ovc1CommonKeychain.commonKeychain,
  };


  if(derivedFromParentWithSeed) {
    userKeychainParams.derivedFromParentWithSeed = derivedFromParentWithSeed
    backupKeychainParams.derivedFromParentWithSeed = derivedFromParentWithSeed
  }
  const userKeychain = await bitgoCoin.keychains().add(userKeychainParams);

  const backupKeychain = await bitgoCoin.keychains().add(backupKeychainParams);

  const walletParams = {
    label: walletName,
    walletVersion: 2,
    m: 2,
    n: 3,
    keys: [userKeychain.id, backupKeychain.id, bitgoKeyChain.id],
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