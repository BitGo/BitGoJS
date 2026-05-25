import axios from 'axios';

// TODO: set your local external signer url
const LOCAL_EXTERNAL_SIGNER_URL = 'http://localhost:3080';
// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';
// TODO: set your wallet id
const walletId = '';
const options = {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
};

async function consolidateReceiveAddresses(coin: string, receiveAddresses?: string[]) {
  const consolidateUrl = `${LOCAL_EXTERNAL_SIGNER_URL}/api/v2/${coin}/wallet/${walletId}/consolidateAccount`;
  const response = receiveAddresses
    ? await axios.post(
        consolidateUrl,
        {
          consolidateAddresses: receiveAddresses,
        },
        options
      )
    : await axios.post(consolidateUrl, {}, options);

  const txids = response.data.success.map((item) => item.txid);
  console.info(`Succeeded to consolidate receive addresses. Txids: ${txids}`);
}

async function main() {
  try {
    const unlockUrl = `${LOCAL_EXTERNAL_SIGNER_URL}/api/v2/user/unlock`;
    const unlockData = {
      duration: 3600,
      otp: '000000',
    };
    await axios.post(unlockUrl, unlockData, options);
    console.info(`Succeeded to unlock with OTP`);

    // Consolidate native token at specific receive addresses
    await consolidateReceiveAddresses('ttrx', ['receiveAddress1']);

    // Consolidate TRC20 token at specific receive addresses
    await consolidateReceiveAddresses('ttrx:usdt', ['receiveAddress1', 'receiveAddress2']);

    // Consolidate native token at all receive addresses
    await consolidateReceiveAddresses('ttrx');

    // Consolidate TRC20 token at all receive addresses
    await consolidateReceiveAddresses('ttrx:usdt');
  } catch (e) {
    console.error(`Failed to consolidate receive addresses error: ${e.message}`);
  }
}

main().catch((e) => console.error(e));
