import { RpcClient, RpcClientWithWallet, RpcError } from './RpcClient';

const walletName = 'utxolib-faucet';

const errWalletNotFound = -18;

let faucetWallet: RpcClientWithWallet;

async function initFaucetRpc(rpc: RpcClient, { create }: { create: boolean }): Promise<RpcClientWithWallet> {
  try {
    await rpc.withWallet(walletName).getWalletInfo();
    return rpc.withWallet(walletName);
  } catch (e) {
    if (!RpcError.isRpcErrorWithCode(e, errWalletNotFound)) {
      throw e;
    }
  }

  if (!create) {
    throw new Error(`could not load faucet wallet and create=false.`);
  }

  try {
    await rpc.loadWallet(walletName);
  } catch (e) {
    if (!RpcError.isRpcErrorWithCode(e, errWalletNotFound)) {
      throw e;
    }
    await rpc.createWallet(walletName);
  }
  return await initFaucetRpc(rpc, { create: false });
}

async function getFaucetRpc(rpc: RpcClient): Promise<RpcClientWithWallet> {
  if (!faucetWallet) {
    faucetWallet = await initFaucetRpc(rpc, { create: true });
  }
  return faucetWallet;
}

export async function sendFromFaucet(rpc: RpcClient, address: string, amount: number | string): Promise<string> {
  const faucetWallet = await getFaucetRpc(rpc);
  return await faucetWallet.sendToAddress(address, amount);
}

export async function generateToFaucet(rpc: RpcClient, nBlocks: number): Promise<void> {
  const faucetRpc = await getFaucetRpc(rpc);
  const address = await faucetRpc.getNewAddress();
  await faucetRpc.generateToAddress(nBlocks, address);
}
