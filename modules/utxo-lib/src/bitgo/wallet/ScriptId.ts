import { ChainCode, isChainCode } from './chains';

export function getChainAndIndexFromPath(path: string): {
  chain: ChainCode;
  index: number;
} {
  const parts = path.split('/');
  if (parts.length <= 2) {
    throw new Error(`invalid path "${path}"`);
  }
  const chain = Number(parts[parts.length - 2]);
  const index = Number(parts[parts.length - 1]);
  if (!isChainCode(chain)) {
    throw new Error(`invalid chain "${chain}"`);
  }
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`invalid index "${index}"`);
  }

  return { chain, index };
}
