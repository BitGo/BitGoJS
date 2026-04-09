import { PsbtOutput } from "bip174/src/lib/interfaces";

export type PsbtOutputExtended =
  | PsbtOutputExtendedAddress
  | PsbtOutputExtendedScript;

interface PsbtOutputExtendedAddress extends PsbtOutput {
  address: string;
  value: number;
}

interface PsbtOutputExtendedScript extends PsbtOutput {
  script: Buffer;
  value: number;
}

export const isPsbtOutputExtendedAddress = (
  output: PsbtOutputExtended,
): output is PsbtOutputExtendedAddress => {
  return (output as PsbtOutputExtendedAddress).address !== undefined;
};

export type TransactionOutput = {
  scriptPubKey: Buffer;
  value: number;
};
