import { PsbtOutput } from "bip174/src/lib/interfaces";
export type PsbtOutputExtended = PsbtOutputExtendedAddress | PsbtOutputExtendedScript;
interface PsbtOutputExtendedAddress extends PsbtOutput {
    address: string;
    value: number;
}
interface PsbtOutputExtendedScript extends PsbtOutput {
    script: Buffer;
    value: number;
}
export declare const isPsbtOutputExtendedAddress: (output: PsbtOutputExtended) => output is PsbtOutputExtendedAddress;
export type TransactionOutput = {
    scriptPubKey: Buffer;
    value: number;
};
export {};
