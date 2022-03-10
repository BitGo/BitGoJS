import React, { useState, useEffect } from "react";
import { BitGo } from "bitgo";

const bitgo = new BitGo({ env: "test" });

function App() {
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    const accessToken = process.env.ACCESS_TOKEN;
    bitgo.authenticateWithAccessToken({
      accessToken,
    });
  }, []);

  function _createWallet() {
    console.log("bitgo", bitgo);
    const walletOptions = {
      label: "Example Test Wallet",
      passphrase: "test_wallet_passphrase",
    };

    const wallet = bitgo.coin("tltc").wallets().generateWallet(walletOptions);

    console.log("wallet", wallet);

    setWallets((prev) => [...prev, wallet.wallet]);
  }

  return (
    <>
      <button type="button" onClick={_createWallet}>
        Create Wallet
      </button>
      {wallets.map((wallet) => (
        <>
          <ul key={wallet.id()}>
            <li>Wallet ID: {wallet.id()}</li>
            <li>Receive Address: {wallet.receiveAddress()}</li>
            <li>
              User keychain encrypted xPrv: {wallet.userKeychain.encryptedPrv}
            </li>
            <li>Backup keychain xPrv: {wallet.backupKeychain.prv}</li>
          </ul>
          <hr />
        </>
      ))}
    </>
  );
}

export default App;
