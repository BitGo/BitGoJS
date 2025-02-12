export const apiData = {
  initWalletRequestBody: {
    walletId: 'fakeid',
    passphrase: 'password123',
    expressIp: '127.0.0.1',
    signerIp: '127.0.0.1',
    signerTlsCert:
      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNQRENDQWVLZ0F3SUJBZ0lSQU02TEFoaGxOMGo4ZlhxV2dLTWdENmN3Q2dZSUtvWkl6ajBFQXdJd09ERWYKTUIwR0ExVUVDaE1XYkc1a0lHRjFkRzluWlc1bGNtRjBaV1FnWTJWeWRERVZNQk1HQTFVRUF4TU1aV1UxTVdZeApOREV4TUdVMk1CNFhEVEkwTURneE9ERXlNVE14TWxvWERUSTFNVEF4TXpFeU1UTXhNbG93T0RFZk1CMEdBMVVFCkNoTVdiRzVrSUdGMWRHOW5aVzVsY21GMFpXUWdZMlZ5ZERFVk1CTUdBMVVFQXhNTVpXVTFNV1l4TkRFeE1HVTIKTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFclA0d2NXWFEwUWFFazhsVFNVTXBCa1d3ditFbQpxNTNyOWVSeVJUOTRkZGdVR0tTMFlRK0liZzFseVBRU3hiN0dXYloyWG9GUFdiK1VOM0lFMVlMQ2thT0J6RENCCnlUQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0V3WURWUjBsQkF3d0NnWUlLd1lCQlFVSEF3RXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVb3JmUkNVQytmaUNjZlE4cEhEUTFWaE1uMXBBd2NnWURWUjBSQkdzdwphWUlNWldVMU1XWXhOREV4TUdVMmdnbHNiMk5oYkdodmMzU0NDbk5wWjI1bGNtNXZaR1dDQ1d4dlkyRnNhRzl6CmRJSUVkVzVwZUlJS2RXNXBlSEJoWTJ0bGRJSUhZblZtWTI5dWJvY0Vmd0FBQVljUUFBQUFBQUFBQUFBQUFBQUEKQUFBQUFZY0VyQlFBQWpBS0JnZ3Foa2pPUFFRREFnTklBREJGQWlFQXJuQ0xRTlgzeDZ1NjhIM2xCOG9wOUFKaApBd2RrUjhXOXNSaUZnZDJKM2tZQ0lHczFOVGM0T0toRzByNzVHUWpXb2x0SkJyOUtjWWVyR1V3aklCaCtvZ1h0Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
    signerTlsKey:
      'LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0tCk1IY0NBUUVFSUFFamQ0Qng3M3VPYllGSW42VlZpZTJmeG9lbXVYZFBob2FkS2JscHpnaTBvQW9HQ0NxR1NNNDkKQXdFSG9VUURRZ0FFclA0d2NXWFEwUWFFazhsVFNVTXBCa1d3ditFbXE1M3I5ZVJ5UlQ5NGRkZ1VHS1MwWVErSQpiZzFseVBRU3hiN0dXYloyWG9GUFdiK1VOM0lFMVlMQ2tRPT0KLS0tLS1FTkQgRUMgUFJJVkFURSBLRVktLS0tLQo=',
  },
  signerMacaroonRequestBody: {
    walletId: 'fakeid',
    passphrase: 'password123',
    watchOnlyIp: '127.0.0.1',
  },
  unlockWalletRequestBody: {
    walletId: 'fakeid',
    passphrase: 'password123',
  },
  wallet: {
    id: 'fakeid',
    coin: 'tlnbtc',
    keys: ['abc'],
    coinSpecific: {
      keys: ['def', 'ghi'],
      encryptedSignerAdminMacaroon:
        '{"iv":"mf/5PSEGdLTKlc8t1IwOBA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"mZcamRzITwg=","ct":"KCCc+/ly37EZPRoVBgE9T2mAUufWuqmtSadZAAcECevmNbGgGtAhi7P8/zpge49EdsKOP1Mx1DkwnZBMqCVQBTIWZO4XrFI+OOI0YWDrJIaGcnXDFgZWCbgGaomzYNRvt3EoJ1+yMn1EsYdFYgM0NBS0YsvNHx6PsK2eSLpAK2UrhHAkm9X2uhVRMOjjiGr0UW6r4BKuzxCA06fKKQk6bb8LEF54EZFwigjLSztebW5ivNVT/6MxMnjlO7YPW1ClwM9cqJy1oNLUuRK1vnr6hHCas+3F0PCt5XhJJlsgsm1Vz45wWEGdZiyb0XbqOKHyxCI2WOF5Nj1ALiA0D4o9bqfzasNgrvYlMJ4Ld7ayHDtfhiFve/cUZkcQdVqNbS1TPuyvYT8vPKmL5JwuABoTkLH2LtBOh0afz9UFZajo7pxmJ9TtN+B+/GUoiR9v4e2Jw+IpMIIv3ATMqQl9Kot6yefiuP+1DfYNBPvcUqJMc8ibpP56BUA0qWLoAIg5DoocoMybXi0+eA1S0c8Lhe0PsA=="}',
    },
    source: 'user',
  },
  userKey: {
    id: 'abc',
    pub: 'xpub661MyMwAqRbcGTnAqrXTV1ZCxrjQuHG87GjDEaeH4VLyxq6LGPJyj3KmDybAiHkJPpRXgp8dMW3iJdFYDmQmNAEVwKLJbimaNua8XzYUJCh',
    encryptedPrv:
      '{"iv":"lByUPi8LsNP/3wpLGEcglg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"Z/J2QDtyU84=","ct":"ShhLIUyG0GoxwzjpH/zuGss8SXEgnPyZQBlntRum2zkhoagIB0zptMOik9KFSll/fi5Z8b6huAmEo922/ZJsszLhlKQqW7PHvzFE19dCbv0WSriZCElpJpZRgRpE2GQ2AbPBLu7ddqf4+5/8/lRhRC1NaKxOQCo="}\n',
    source: 'user',
  },
  userAuthKey: {
    id: 'def',
    pub: 'xpub661MyMwAqRbcGYjYsnsDj1SHdiXynWEXNnfNgMSpokN54FKyMqbu7rWEfVNDs6uAJmz86UVFtq4sefhQpXZhSAzQcL9zrEPtiLNNZoeSxCG',
    encryptedPrv:
      '{"iv":"zYhhaNdW0wPfJEoBjZ4pvg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"tgAMua9jjhw=","ct":"HcrbxQvNlWG5tLMndYzdNCYa1l+1h7o+vSsweA0+q1le3tWt6jLUJSEjZN+JI8lTZ2KPFQgLulQQhsUa+ytUCBi0vSgjF7x7CprT7l2Cfjkew00XsEd7wnmtJUsrQk8m69Co7tIRA3oEgzrnYwy4qOM81lbNNyQ="}',
    source: 'user',
    coinSpecific: {
      tlnbtc: {
        purpose: 'userAuth',
      },
    },
  },
  nodeAuthKey: {
    id: 'ghi',
    pub: 'xpub661MyMwAqRbcG9xnTnAnRbJPo3MAHyRtH4zeehN8exYk4VFz5buepUzebhix33BKhS5Eb4V3LEfW5pYiSR8qmaEnyrpeghhKY8JfzAsUDpq',
    encryptedPrv:
      '{"iv":"bH6eGbnl9x8PZECPrgvcng==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"o8yknV6nTI8=","ct":"nGyzAToIzYkQeIdcVafoWHtMx7+Fgj0YldCme3WA1yxJAA0QulZVhblMZN/7efCRIumA0NNmpH7dxH6n8cVlz/Z+RUgC2q9lgvZKUoJcYNTjWUfkmkJutXX2tr8yVxm+eC/hnRiyfVLZ2qPxctvDlBVBfgLuPyc="}',
    source: 'user',
    coinSpecific: {
      tlnbtc: {
        purpose: 'nodeAuth',
      },
    },
  },
};

export const signerApiData = {
  initWallet: {
    admin_macaroon:
      'AgEDbG5kAvgBAwoQMgwTCPxnm083LA4FNK6ihRIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYgKhT1l6GR8VcNdIpr1qSl464ykg+bxD/sjXweqLwxLfk=',
  },
  walletState: {
    state: 'NON_EXISTING',
  },
  bakeMacaroon: {
    macaroon:
      '0201036c6e64025f030a10330c1308fc679b4f372c0e0534aea2851201301a0f0a07616464726573731204726561641a100a076d657373616765120577726974651a100a076f6e636861696e120577726974651a120a067369676e6572120867656e657261746500000620542319d8958ea70a6a13f757e60b266c4bf6b6bfb48cd94db9a7f04d64d2499c',
  },
};

export const lightningSignerConfigs = {
  fakeid: {
    url: 'https://127.0.0.1:8080',
    tlsCert:
      'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNQRENDQWVLZ0F3SUJBZ0lSQU02TEFoaGxOMGo4ZlhxV2dLTWdENmN3Q2dZSUtvWkl6ajBFQXdJd09ERWYKTUIwR0ExVUVDaE1XYkc1a0lHRjFkRzluWlc1bGNtRjBaV1FnWTJWeWRERVZNQk1HQTFVRUF4TU1aV1UxTVdZeApOREV4TUdVMk1CNFhEVEkwTURneE9ERXlNVE14TWxvWERUSTFNVEF4TXpFeU1UTXhNbG93T0RFZk1CMEdBMVVFCkNoTVdiRzVrSUdGMWRHOW5aVzVsY21GMFpXUWdZMlZ5ZERFVk1CTUdBMVVFQXhNTVpXVTFNV1l4TkRFeE1HVTIKTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFclA0d2NXWFEwUWFFazhsVFNVTXBCa1d3ditFbQpxNTNyOWVSeVJUOTRkZGdVR0tTMFlRK0liZzFseVBRU3hiN0dXYloyWG9GUFdiK1VOM0lFMVlMQ2thT0J6RENCCnlUQU9CZ05WSFE4QkFmOEVCQU1DQXFRd0V3WURWUjBsQkF3d0NnWUlLd1lCQlFVSEF3RXdEd1lEVlIwVEFRSC8KQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVb3JmUkNVQytmaUNjZlE4cEhEUTFWaE1uMXBBd2NnWURWUjBSQkdzdwphWUlNWldVMU1XWXhOREV4TUdVMmdnbHNiMk5oYkdodmMzU0NDbk5wWjI1bGNtNXZaR1dDQ1d4dlkyRnNhRzl6CmRJSUVkVzVwZUlJS2RXNXBlSEJoWTJ0bGRJSUhZblZtWTI5dWJvY0Vmd0FBQVljUUFBQUFBQUFBQUFBQUFBQUEKQUFBQUFZY0VyQlFBQWpBS0JnZ3Foa2pPUFFRREFnTklBREJGQWlFQXJuQ0xRTlgzeDZ1NjhIM2xCOG9wOUFKaApBd2RrUjhXOXNSaUZnZDJKM2tZQ0lHczFOVGM0T0toRzByNzVHUWpXb2x0SkJyOUtjWWVyR1V3aklCaCtvZ1h0Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
  },
};
