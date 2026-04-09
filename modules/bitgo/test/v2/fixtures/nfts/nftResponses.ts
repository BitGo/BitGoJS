export const nftResponse = {
  nfts: {
    '0x8397b091514c1f7bebb9dea6ac267ea23b570605': {
      type: 'ERC721',
      metadata: {
        name: 'terc721:bitgoerc721',
        tokenContractAddress: '0x8397b091514c1f7bebb9dea6ac267ea23b570605',
      },
      collections: {},
      balanceString: '0',
      confirmedBalanceString: '0',
      spendableBalanceString: '0',
      transferCount: 0,
    },
    '0x87cd6a40640befdd96e563b788a6b1fb3e07a186': {
      type: 'ERC1155',
      metadata: {
        name: 'terc1155:bitgoerc1155',
        tokenContractAddress: '0x87cd6a40640befdd96e563b788a6b1fb3e07a186',
      },
      collections: {},
      balanceString: '0',
      confirmedBalanceString: '0',
      spendableBalanceString: '0',
      transferCount: 0,
    },
    '0xtnonstandard:token': {
      type: 'NONSTANDARD',
      metadata: {
        name: 'tnonstandard:token',
        tokenContractAddress: '0xtnonstandard:token',
      },
      collections: {},
      balanceString: '0',
      confirmedBalanceString: '0',
      spendableBalanceString: '0',
      transferCount: 0,
    },
    '0xterc721:token': {
      type: 'ERC721',
      metadata: { name: 'terc721:token', tokenContractAddress: '0xterc721:token' },
      collections: {},
      balanceString: '0',
      confirmedBalanceString: '0',
      spendableBalanceString: '0',
      transferCount: 6,
    },
    '0xterc1155:token': {
      type: 'ERC1155',
      metadata: {
        name: 'terc1155:token',
        tokenContractAddress: '0xterc1155:token',
      },
      collections: {},
      balanceString: '0',
      confirmedBalanceString: '0',
      spendableBalanceString: '0',
      transferCount: 0,
    },
  },
};

export const unsupportedNftResponse = {
  unsupportedNfts: {
    '0xd000f000aa1f8accbd5815056ea32a54777b2fc4': {
      type: 'ERC721',
      collections: { 4054: '1' },
      metadata: {
        name: 'TestToadz',
        tokenContractAddress: '0xd000f000aa1f8accbd5815056ea32a54777b2fc4',
      },
    },
    '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b': {
      type: 'ERC721',
      collections: {
        1186703: '1',
        1186705: '1',
        1294856: '1',
        1294857: '1',
        1294858: '1',
        1294859: '1',
        1294860: '1',
      },
      metadata: {
        name: 'MultiFaucet NFT',
        tokenContractAddress: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
      },
    },
  },
};
