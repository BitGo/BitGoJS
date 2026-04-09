/**
 * Core types for SDK Coin Generator V2
 */

export interface CoinConfig {
  coinName: string;
  symbol: string;
  testnetSymbol: string;
  baseFactor: string;
  keyCurve: 'ed25519' | 'secp256k1';
  supportsTss: boolean;
  mpcAlgorithm?: 'eddsa' | 'ecdsa';
  chainType: string;
  withTokenSupport: boolean;
}

export interface TemplateData {
  coin: string;
  coinLowerCase: string;
  symbol: string;
  testnetSymbol: string;
  constructor: string;
  testnetConstructor: string;
  baseFactor: string;
  keyCurve: string;
  supportsTss: boolean;
  mpcAlgorithm: string;
  withTokenSupport: boolean;
}

export interface DependencySet {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface ChainTypeOption {
  value: string;
  label: string;
  hint: string;
}

export interface PluginContext {
  contextRoot: string;
  templateRoot: string;
  destRoot: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}
