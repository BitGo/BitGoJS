declare module 'cashaddress' {
  type ScriptType = 'scripthash' | 'pubkeyhash';
  function encode(prefix: string, scriptType: ScriptType, hash: Buffer): string;
  function decode(address: string): {
    version: ScriptType;
    prefix: string;
    hash: Buffer;
  };
}
