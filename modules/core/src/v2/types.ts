export type NodeCallback<R> = (err: Error, res: R) => void;
export type V1Network = 'bitcoin' | 'testnet';
export type V1RmgNetwork = 'rmg' | 'rmgTest';

// https://bitgoinc.atlassian.net/browse/CT-717
declare module '@bitgo/unspents' {
  export enum UnspentType {
    p2pkh = "p2pkh",
    p2sh = "p2sh",
    p2shP2wsh = "p2shP2wsh",
    p2wpkh = "p2wpkh",
    p2wsh = "p2wsh"
  }
}
