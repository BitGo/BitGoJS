export const optionsWallet = {
  walletId: { type: 'string' },
  walletLabel: { type: 'string' },
} as const;

export type WalletArgs = {
  walletId?: string;
  walletLabel?: string;
};

export const optionWalletPassphrase = {
  xprv: { type: 'string' },
  walletPassphrase: { type: 'string', default: 'setec astronomy' },
} as const;

export type WalletPassphraseArgs = {
  xprv?: string;
  walletPassphrase: string;
};
