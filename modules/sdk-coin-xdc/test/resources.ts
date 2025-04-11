const getTxListRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'txlist',
  address: '0x742838193c4169f6b2ba7b0e03f723c3ba0928e1',
};

const getTxListResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0x742838193c4169f6b2ba7b0e03f723c3ba0928e1',
    },
  ],
  message: 'OK',
};

const getBalanceRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0x742838193c4169f6b2ba7b0e03f723c3ba0928e1',
};

const getBalanceResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataUnsignedSweep = {
  userKey:
    '029d2ded2d39ee7cd8d8bbba8b25e4c60bb09297936fa6b223de1f495b5ee20dcaf762367f9691f7719cb5e13e59d725669a18aad1e2522dd141fa4c7fd3d25c17',
  backupKey:
    '029d2ded2d39ee7cd8d8bbba8b25e4c60bb09297936fa6b223de1f495b5ee20dcaf762367f9691f7719cb5e13e59d725669a18aad1e2522dd141fa4c7fd3d25c17',
  derivationPath: 'm/0',
  derivationSeed: '',
  walletBaseAddress: '0x742838193c4169f6b2ba7b0e03f723c3ba0928e1',
  recoveryDestination: '0xd76b586901850f2c656db0cbef795c0851bbec35',
  getTxListRequest: getTxListRequestUnsignedSweep,
  getTxListResponse: getTxListResponseUnsignedSweep,
  getBalanceRequest: getBalanceRequestUnsignedSweep,
  getBalanceResponse: getBalanceResponseUnsignedSweep,
};

const getTxListRequestNonBitGoRecovery: Record<string, string> = {
  module: 'account',
  action: 'txlist',
  address: '0x4477bc3e2472b2c5580c010526dfc5614871952d',
};

const getTxListResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0x4477bc3e2472b2c5580c010526dfc5614871952d',
    },
  ],
  message: 'OK',
};

const getBalanceRequestNonBitGoRecovery: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0x4477bc3e2472b2c5580c010526dfc5614871952d',
};

const getBalanceResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataNonBitGoRecovery = {
  recoveryDestination: '0xd76b586901850f2c656db0cbef795c0851bbec35',
  userKeyData:
    '{"iv":"XeXwD5B465wYvao9WFZC7A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"caDtzBCF3IA=","ct":"0qr0YV2DgN68F9luNpjFQhwDTIXwyTTYdQirvbgITHqIDmITmV1IMgkKIdzSZBfmLkB6bG46oVF4snVG7lXEJz2twrutI01g59xjw88ULgR5wV5ZdFrGcmNZvOQ1H5imoWGS8bVKONmeF55TBgi49r9x3dsmgWvJ/EHeApj/FrAP1BLX/Rgl57kZqnNoryl55P8L2cJtJE1weDBD+/GsggdrO/dYBmihKTWyTBVa7UBIIgV5wOd4RXbZN1Hg2Vc0bY56KrpZbY1CsdQiIwH3tkKFPdqthlHVEfS8XViaYVl0Go3C/mUMYZH7CTg/s4LMpdlWzh3iRnmGercvIFZBfcehgNVv9H/OctYZnKfUdI5mZsVGxQRIMWr8oFbmjR3pYJ94oxS8assAzl7hNI4RJi/u4N9/5VJIi//069zsMsgA+k4b3u3xvivkTjO5sscAPs/Sp0mb5QLQhP48D/sHIYwhQiThJaH+flSoUQu5LNWmucmYr08lRRiI07O7DZAY2pplLSvBfkrBtgTgi+rLN95lKkxi7PYTGWuek1Sd/XiXit6EJ5FImYH2eKEVgatYvKfj/BdNJ2iHmeaykajtjpr21lt0Iqk98iZLZfCp5w4hfHHHB4QCrBzCAeG2MEPqmrAN67z4gMxUbkI+j9lYp5SyvlFmDIm78SyQ60371Wfr+7b4+wFqPq9fumXBZ4i0xYbcWTrKjYrn5bO5o3LWiRoh7EW8mzbMIC2m/DwIwdCHodbz4g31Psnk6Yk6UqEMq5JhOoUJYuVhYthNmbRlI59UDg+rz/HO9nYnZqsUgubSKcZArqM1J4T4+EDKuHtgnCQm2hqHlsJu+/n73jU33GEm86pDdcb8udHsfPCvhEIuLw6ZyThiX8JEOCi8Ueb0GPL31MSkJ7L7cOizgp6lHgs4nZorZfUIKjDd3twcpBNXjT15KEQbrW8RQChXmVl0b5N8BAom6e9Xpz2kDRGbvbYfBOdiht5Vr5Sm7prAQVVCZTWq6/qOZFWr7LJ+Cdw1qYt64UFcBHNtaX3d5WOMNNMqesrglVTW7w2Gscu7XaxoA4cTOKvMemG1cWTag3kr8oNgtz5gXsfbSo7CJrN8vw=="}',
  backupKeyData:
    '{"iv":"J32VIJhO9Cbf5bqcv75Kag==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"ZQ5VsHdXM4Q=","ct":"XTgAUy8TZALKtt/PtJGAWbHfuExH5C5yw3y8EryrcY3uZdektl3WkL4KHHGTtL9yzssCTOWUMTemoAKipd+W/3mpZuQ88p+lloIgU7Tce3RLBG+gu665bsvTUuVpfMrpZHxDXXVMzwoUVHaxwfvu2tgduDnpkD/BX2RN5qfI6P6zz5r8UuWbiDPKEaqpcAHQ+RBitBQiOxNAlRNYexnUx1pCqcK08hqrqdQvx7elXXdCI3TwepGW7QwRzWa9pxvM9d85AWESueJ2B4JrZ5bkrIzXixGJcoUAJVvGfD69zoLUH9einnMafpocETBUDQyevC/j/1FwgZUCeGcb4U9N9tQJtR0fozzgpAo91nWA5UfkD2+hzRvz2p1Dmc+4bNb6s/7vK+BIOdpe4blzI43PxMLoBGkEQHlGHYCrOUnbV7dcxlyPv0qfom8K4f6/74YEKiMPjwA3sCcntWboW8gUPHF2xx/WAgmHI9DOiXsCJZMHx4GiZmY/pR9RVe/OeFAqPLWJoT6KaizTJD3So4/G5oHKPgTQbMIPi1lYtqKdOuhycISsaEgnkG1a8Tq5CN0tk5VywSmj4kSrqqjcp7kbAW+ViaNkZLuSibomK9AvuOGkEZBqDEuyFJnS4oayQTLxnstzO1JJGhmrCskH9B/QIIrUVl1IOv/IVyPg4M7T1g0+YfHdAXduLXu9bjHkqzGaSQZu35bs5QKy0bKEhAwoj+zgYAF/gZBH0/iPzrWM2xu/HMeQKwI0KFLOiBx3cMmNYE+Fb6vCjpVXBTYYUCBOjRnrAuR/lc3AnjAefCMAD89+FQ+QW5IzZv97lrSw0Rb+DIctfXddUKK7yyBe8CcZWU1dGAYsb/hk+H5lTZJBur5M3a1vzPMi68HKnRt7XZmyBsvPA8t0JVJmlc0RejqDrcps4uKjKdMaDNOvBzmEijdVv8N5q0Ng+yHwq3BolqoYn4mVJOrMuRlZt4pODkI8uOU1Ha/VStLzhT2HFexZ+Y0JzM0DS5hsygHt4Dz6/RfZTKHYvxzuRiHNLbmNcOBvVbBOL2Lm+Dlo3fFuVD3fS08vJuafc/uAfatpRwRqgE/EzvZOpnZyHcr4lUVEhRrDYw=="}',
  walletPassphrase: 'prithvishet2503',
  walletRootAddress: '0x4477bc3e2472b2c5580c010526dfc5614871952d',
  getTxListRequest: getTxListRequestNonBitGoRecovery,
  getTxListResponse: getTxListResponseNonBitGoRecovery,
  getBalanceRequest: getBalanceRequestNonBitGoRecovery,
  getBalanceResponse: getBalanceResponseNonBitGoRecovery,
};
