import { KeyPair } from '@bitgo/abstract-eth';

export const PRIVATE_KEY_1 = '950d23766c0d0adad45a7dcf0db7a93b2c91fe411a5154c9a4ac23758c2ae4d5';

export const KEYPAIR_PRV = new KeyPair({ prv: PRIVATE_KEY_1 });

export const SEND_TX_BROADCAST_LEGACY =
  '0xf901cc02843b9aca0083b8a1a0948f977e912ef500548a0c3be6ddde9899f1199b8180b901643912521500000000000000000000000019645032c7f1533395d44a629462e751084d3e4c000000000000000000000000000000000000000000000000000000003b9aca0000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000005ec67da8000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004100dd3c4df19cf8156e9ad14db46d8ffd07c943ebbbab691ebaee58535fb1b0890e70a6cd300f2c4088d2cebec99ba24ae9495468c3091ac6a884efd780d353361c000000000000000000000000000000000000000000000000000000000000008208d4a0fa51ffcbc4d852a5f2f7870f5706b8798d81939fe77aead4052335bcd497f145a045493236056765d1cd847aca650bbe97f7148c1ea41143154ed1a5973184ba15';

export const SEND_TX_AMOUNT_ZERO_BROADCAST =
  '0xf901cc02843b9aca0083b8a1a0948f977e912ef500548a0c3be6ddde9899f1199b8180b901643912521500000000000000000000000019645032c7f1533395d44a629462e751084d3e4c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000005ec67da8000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000411badc5af505b10ebf6bc80322567ac71af7970a9ac1ebdf33f656bbfa2b40f652239e4ecd9b7b391db68fb84467e11dacb5d54f38770d79f4c95c9c1d4eba0a21c000000000000000000000000000000000000000000000000000000000000008208d3a01c830bee5c43a339f4f6bec2e705045986482d72cf0c504183c121a4c246a57ba068b7460d6e0b0e5b354053c78cd412286adc79e21ec3bb9169930b47e455b071';

const getTxListRequestUnsignedSweep: Record<string, string> = {
  chainid: '1112',
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
  chainid: '1112',
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
  chainid: '1112',
  module: 'account',
  action: 'txlist',
  address: '0xcf05f9c25579832d2237e52ffb4d16ca3153bb15',
};

const getTxListResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0xcf05f9c25579832d2237e52ffb4d16ca3153bb15',
    },
  ],
  message: 'OK',
};

const getBalanceRequestNonBitGoRecovery: Record<string, string> = {
  chainid: '1112',
  module: 'account',
  action: 'balance',
  address: '0xcf05f9c25579832d2237e52ffb4d16ca3153bb15',
};

const getBalanceResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataNonBitGoRecovery = {
  recoveryDestination: '0x26efa259beeb4373aff0f0e37167a7b6255fe34e',
  userKeyData:
    '{"iv":"LkXud+OJjiSgFSz2GUF90g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"qpjtz9Fp4u8=","ct":"syqUtFTqWy/itfdnwckTSSk8a2tYVQIApUP811rfWBth0ODZzjLzWs+pM0IYi9IM9boQ5E94/Kutk1HVNWC7q1vG88B/ZI5wVc5Scr2wgOJ62TifS6VNgmaGfAlMfke0tL+2icn/NqiEAPXlan4VpiSIzGV50V+BPW6x/zWOqzA8OiZ7WApsqpIMiNHal+27g1F41ALGnpVhuDBr/M67FLvzdCz38dZoqcbV67CncqXzGFvDmw4Z2h86DP4jJFhGQUkgJqwKjFVOFREnFClkg1VgPryYpWvx5liHZv4URTSlqTUj7VS/FtYoJFobilSnHz0tCKM8q81sJ4hz9mzxsQRL6xuV4SoM44TGSPutQfCTNWyXqq9PNe4er3BpRS4FGl6qrBFkyAkx4zF8NJDI3+miFlG1YmLSq7aLRuU5RAnQTTY+XnvbE7xsF9zhAzTsJk9zjZUQVDZDAC+kOiaYtZBC8wsJ26i1zbo9g6V9O+9X5tVFauCt47W9kodi+PNservj8tBYvG6YjjJ1SK/l2SQAffa+PZX4+b51Qf8FBawdcRkCfasZPjUYjYZ0KiiRQmSg3OMz3AqEw8yelxJ/lkbBOccrNcbVpYZh+OTB2Kjvvhk5aAs4WiaO+7PM3YrhjGhjln1eAvh4ABzXlOHV31f41p5/MeOgWwf0SH2aZocM1erCpk0+dk6Mu4Z46D9NTYY0JoaljKsvxpWidtRHp93YkuNjVI1qIaMyJj3O8pe6782JfT+sRQfJJxTvLThzm0ljy9hQGHK98GRejge4T1p66Jkhu94kmKpJJHOt9iVuU5mbc3kA0pi148B5HTRzH6/I0v2m25tcspsagvaiQeaU4+RAsoTrWiFtHG3UByCMaS6jiIU0b5zKKPbWqoQV85ywyZOi4xtIQoqFUte7v1ziTzaywGb3tG2iAHYRrJgAPg2wNYDYVOOIJWdhtxw8G/uKMq9EZ8+l2FLdXpUHDc1UJzNqf6ijYbixMv0RHDMXtPC+870ciyVjGAAfPwWrnXafgJewRsYpeUxiJvf1A9DEZ0IyVKT4TjohEmuHlUxT5d0QJ1e1Pxa0qaeLrNoU"}',
  backupKeyData:
    '{"iv":"j01iJ6D6yrIAvQG39rUK7A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"FZhlN/ZL7EQ=","ct":"l8rWds8F0MUrnyvIkfoU9Pcf5rR9eJwZkyjzzrrQaor4oIYcqNl3+OfuXYFssSMhor3AuylZ85hLaovqndvfYtPBC2AZ1sM1AAMmwmptGWeuRuzIjd9bVUzGJdAljDZ3/ikcmMbV/drT7HSu6l2Z2tsc5XJwJujO2YobCOlBBGWM8lIqCcCORa+oliLXW2YxsRzEEM5b2H/RqqQKpZeJvYK3l5EX8aAyTIMqrIv2ZS9MaWXcY95/IYB5xO/a1zZRfxDv5WBu4RsVtS5uIH99PPNJIcAXAAFN+n58EsfZbtJ6aDWCDngtEaghiwlSUhcdwU59P6eUmzEjEvY4RJwDMX0Mq9C1kfwRxNn9+BwdaO24HaH4uWsJlHNp++onlTEb9pDp0nmMgWLQjh1n0CrF5XThSt9i5s2jMFNEE7LruwRT+TKzpN48If2L8IvwFiFWLuUtQDJ0jdl/8pRB0C0yc443DIxROBluh8hwmYqglK5YtaBZitXl++jSaXdRlgJ4wBfTuDp4Lg62wWgprPhaRFWfMJpXedDfzZEDjc2UFZvKKe7V1+f7kSB9ol18aE4xpEN5vta6L81ZMgVWkbWu7Ascu4P4vOl1M8tPWkLmg6SpPbbxYdp5Q52DMkhLz8zuAaUD5tbt6tVKTCd0USEus2s+r4VJd6WImdvNUsg9anSpWQp48jWx0ZcLHnACOyT1bRC/VcYwEB6XE81uyhWdZYrhly/MKcJNO9Auij/RxNPpELYNL1Ru+Vh7ZNSE3EotzoRba0+QkHCOq3xGi2tSzZlmJe329LZEjpiQyGM7tLV8ZnSngXXUEXGQXVDaCeQQz82VYhZpKeC9xCTPLCUMETWfiqU4XhFfRzyLjIAZKlzq6yOMsLrXFpsA85XpJciyYhO9MHd2/8yEyZfernqN3qLY0dl4dVR53E4UwWSwLSbXFV6dD1ZheB4G8tSp2oq/IRHw7ZuQlRcW0Bn5kaDr3gs5+7enQ9SSBLkPrAYfeloAVyz/ugKJ3+ZtEBFkTbobORUHtfsrjYqxb7fn6/n5kvrm8fZzy3Oq+SG//B1guuyElM/cJ8J+yHQvNv0AKQCm"}',
  walletPassphrase: 'prithvi-bitgo',
  walletRootAddress: '0xcf05f9c25579832d2237e52ffb4d16ca3153bb15',
  getTxListRequest: getTxListRequestNonBitGoRecovery,
  getTxListResponse: getTxListResponseNonBitGoRecovery,
  getBalanceRequest: getBalanceRequestNonBitGoRecovery,
  getBalanceResponse: getBalanceResponseNonBitGoRecovery,
};
