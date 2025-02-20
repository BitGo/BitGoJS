const getTxListRequestNonBitGoRecovery: Record<string, string> = {
  module: 'account',
  action: 'txlist',
  sort: 'desc',
  address: '0x594886d686261172b95fae7401841843504f156b',
};

const getTxListResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0x594886d686261172b95fae7401841843504f156b',
    },
  ],
  message: 'OK',
};

const getBalanceRequestNonBitGoRecovery: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0x594886d686261172b95fae7401841843504f156b',
};

const getBalanceResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: 100000000000000000,
  message: 'OK',
};

export const mockDataNonBitGoRecovery = {
  recoveryDestination: '0x224056675da79dac836c330704e9b091a7fc2e1c',
  userKeyData:
    '{"iv":"1j/pXswlTT5JEkqmopflwA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"yA1ls3UYGwk=","ct":"DWf+iaYWSig20VhHWiNYurPyONJO4rAMC0Erxp06SUlLVdLAiD4bHsjNhh3t8OeuVQLlAkfqDBOufVV6DGFcRaBK5KE/mjON2XSIVk+GW8K/ZbdxYpvyFX2zKQtONUP4OXhSrKghgJb7nHCTWtHFPuP734IIKTA1s+iPp4Ojafd7nwXh9uKV5lfD8hSKKt6oWcAqGIeyTk2EUl948wbKdxECgXA3noGHGeDEd4i17VnR44gu9A7A2YB2hQamrn5u1T6uAbNJomYcvD2szzo3bqEi9vFA8WMrX6MYvmTlH21NM5KsxZPPSIHaBlBL/w1bnwgrC6qLEQChnWOIinVepUmWj+NQWkRADbyz9gJLQZtYIcOO1YOoNMKr96a/0zKoktjOrL4d6e617RSWyeOC+OMCtIwBw/LHaQyFzCtuwdtSaG6xoDJIkT0mW7AFX6veu6xK6DM2S2/dNrFlF2cT8a0KO+L4uiA5QcsznPiYv7uUmC2SbX2nskBd2xe6+TpF9VcMMYNk6P01YXj+w9zVUtZRNRv9ke8rMq0Tg8LdorfDqCS15TB86P5iSEOgjP4xXzw5s+5QVhO1Y+4RQuDFW7tDRto0XWZlY7jFg/ NJ7PXOipNPasFjBKHROhM9gq5V4sT5opjbetUHqFGaJC4sRY4HvO9Y+oxFk7khJkK40EFlQzvDCkmDOTjVv/fb5N2kJjq7IGeZTsEeFA90fogUM2DGvwnBB0icggHLS2px40/RHlK2jz3V1XQp5ecddhLzc38/lik9MUsmtTlK3VB5WjGfDRSLBZqy1hjsvKlvKTbpVkg937X/Wun62c4kquYzSJIHd0UanAKd5D7O+oIoUZR7FgpbDQoutRhVflDTyYpOq7tSJOrYbjA1qEJVWJqeFIKdfQ9ZboT9aFq3aGQxuk7mz9CyrKVRQfPBrjzEbW8mKCqpJLUshKXkcETnlNzSBbOuPokIRz+nM3rlYFevk4oiA418QdH3rK+gPQv4NkKHGcZlb3Vzro85seOZVqzgITXadXUznBG0/mYmY+Iqe1zHI1nDDGrxCqzpK4v31M2e7xyPu/kMHZYKNvM0k2jy"}',
  backupKeyData:
    '{"iv":"LYD8I6UEfqMEmFgwC/YR+w==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"IxVKifwPPWU=","ct":"qw+MmwAoinYPgyAbVKGbKDKFaNv+tyj9W1ird+MdVrLBurYoccf1wESdBpLVIIEaljXHZD/uxXSxOHtIjM4tUpnwajI5fSG0pYa2p048uN4K54tBtCJqj1W1jPyDVdaGEi6TheI5jGjKPEnI3J4ZPbQ7BfeT0WceIX3S9dT+VETug6vAf4axU8phIejCRuHgnvtErx/xiKH3zSDnc3oOSjHfoz0ujR/ZLtb4FRPaXujgRDISqoR4CtN7io3myq2NArzNsYi6PluD/jp80My+1jImIrmDqY+DVgGTDBAOz97eL9lXS2uiw3VuoPUSsQCdCrIjnhsq0BtL/W53eZbrXH565Bykm6L6DqJLJeVOrIMUAG/An1X9iUSqmHDFr7SW2z6NCy624vC3ulBRUcji44XHcmm4eVU1SgZDlzB00wBTNxHObIVJwWX8ZP33bYjeav3WBClXrC3b0CqEVzY7F3nLT8I6q1bb0WrRzB3blX7Avf0FylnUN0QbN1mQLUA01LZYof3+gPFCfDEzT/qX8EpgcxLpGgd8T4sj7RKjv0rHBZ462l1yh4lN2PqmZW/10UkyTYYqr0Jw3neYFHQTLoS2FqBNkftyBYkO8eiVXvbeaHuCugiDBB963cNR3nE1a6UqHH1Ime1K6chAoUZlq5arfT3OPR4lPpWXXwigznNcUMMJVQhGVJI1siEOXR1b78fe12VTD1PKhRQC5J9UvE3nBRoXoEWkj1b3/UQfUF6ITQQYDg8lZYKdRYyOlrQDS56oVI1HF8uR0+IQSbtshWSw4OrN6FPHf6ZuhcwX3PSvZwXpNVndxKII8pgFAn0SyQAFsWVY/4OKCO/O+PJkg7ODcJo/S9BAqcxmInBWgnaLMEhCGl77xVELW/B8wVOEVC3ApGtQsjg1CQg/PWsJY5EDkVykejiRTZyim9C84hZSL6bSpDCGOWnEEkI1U9gQlE0kkj1ZBQpe7xxOJ7jhWqNC800orDNsSIdOlDvD/SXX1zHf88aby9VNkUUwb6D9cUItuVkL4gllk/7aTnt0UIoiy8X6Z3w3z3tQi4i9pEZNeM3kG0nlQX12Q7788YNR"}',
  walletRootAddress: '0x594886d686261172b95fae7401841843504f156b',
  walletPassphrase: 'test_1234_test',
  getTxListRequest: getTxListRequestNonBitGoRecovery,
  getTxListResponse: getTxListResponseNonBitGoRecovery,
  getBalanceRequest: getBalanceRequestNonBitGoRecovery,
  getBalanceResponse: getBalanceResponseNonBitGoRecovery,
};
