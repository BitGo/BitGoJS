// Get the test data by running the scripts for the particular coin from coin-sandbox repo.

export const TEST_ACCOUNT = {
  pubAddress: 'core1xrh89ced02ea6928kcwectgtkk7k4954c5fsvg',
  testnetPubAddress: 'testcore1xrh89ced02ea6928kcwectgtkk7k4954wqjdr7',
  compressedPublicKey: '0371b155f21bf4426d9adeda30c858f523da3d20ca9c2a1c27b83baeac3ed6f184',
  compressedPublicKeyTwo: '02e04ea328d98de663224a126a1c64740e341976f0360d45511c954e61fba30466',
  uncompressedPublicKey:
    '0471b155f21bf4426d9adeda30c858f523da3d20ca9c2a1c27b83baeac3ed6f1843a0b64237e638ba7129d2dbe86a5c5cbd1e85f6e5ba6606b6c1f98e1b5d23b87',
  privateKey: 'c9cfbf9d86f86d55ce358b15402bd4f9e274b5249ff9be1b852553a36681a798',
  extendedPrv:
    'xprv9s21ZrQH143K4CFciZ9dkVK2gyAj8ag8PUPm7vVZhbUhA9mQPK9f4BhzqkDsKojLhJWQndiRKPbwFaEy6dGv6eDBZkMimpiDX8ZvNN2kCVH',
  extendedPub:
    'xpub661MyMwAqRbcGgL5page7dFmF11DY3PykhKMvJuBFw1g2x6YvrTubz2Uh2Xa4qmBvtxVPxy2YCpRAQQCQQYz5MctWsCdWvDwybRJvaGubjL',
};

export const mainnetAddress = {
  address1: 'core1v7n3mrjg58udt7cyhv9gs62t8wcf9sh8w604y5',
  address2: 'core1ssh2d2ft6hzrgn9z6k7mmsamy2hfpxl9y8re5x',
  address3: 'core35udp7m30va5njkdrguj27wvk9lnutfwkevk7n9',
  address4: 'core13ku0s7gtzgxl2560l8ld7czmskvwcn5dkk4w29',
  validatorAddress1: 'corevaloper1gsaxrwfu5glgw764mqhc4t8f3yxg2h07rmwt0k',
  validatorAddress2: 'corevaloper1x9hd9r7duv2gagztvvqlw94v5gy4zd9xwhqnlm',
  validatorAddress3: 'corevaloper2flaz3hzgg3tjszl372lu2zz5jsmxd8pvydl7gg',
  validatorAddress4: 'corevaloder1xprcq3xdcuht0a8p082l3srgtwfgl57h2avmsq',
  noMemoIdAddress: 'core1v7n3mrjg58udt7cyhv9gs62t8wcf9sh8w604y5',
  validMemoIdAddress: 'core1v7n3mrjg58udt7cyhv9gs62t8wcf9sh8w604y5?memoId=2',
  invalidMemoIdAddress: 'core1v7n3mrjg58udt7cyhv9gs62t8wcf9sh8w604y5?memoId=xyz',
  multipleMemoIdAddress: 'core1v7n3mrjg58udt7cyhv9gs62t8wcf9sh8w604y5?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: '8DEF41FB464B4EAE9E11FA6CC4D08A9F83D73ED173B866A9F1BBEA4760CA1258',
  hash2: '6420B2FBF0D0B29BD6889DCBEB24552AA1DDA99EA634AEEF021222BF9218B6E6',
};

export const txIds = {
  hash1: '0A1997BE7349A0DE2EB35F406432A7A146938508AB15A655C371321891E658E3',
  hash2: 'D75BD715081ED646E4453DCC1573F362C7577AA49B81B5F39919EC73DD48F134',
  hash3: 'ECC3DEC2462033256501B24B37CAB34DB4BD5179B06BAD0AF23BDB0C9DE406CC',
};

export const mainnetCoinAmounts = {
  amount1: { amount: '100000', denom: 'ucore' },
  amount2: { amount: '1000000', denom: 'ucore' },
  amount3: { amount: '10000000', denom: 'ucore' },
  amount4: { amount: '-1', denom: 'ucore' },
  amount5: { amount: '1000000000', denom: 'acore' },
};
