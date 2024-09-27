// Get the test data by running the scripts for the particular coin from coin-sandbox repo.
// B0C1C424ABA63C7401691F7AC777D080A1C4E59594CCBC74DC4B213D747AA1F1
// 1508B356B749AF309691E44D25CB4068794A3BFB0FDCF736EA453182B200EB09
export const TEST_TX_WITH_MEMO = {
  hash: 'C4CAB6C517A5A1A96ADF12322722A41733B99FBE549D3DB14A907ED65A0CABA2',
  signature: 'E4PZxdeEGQJ8In+cjPiEd979mXuQlDesucLoivVt0wljx9/0bXNeL5+2ecRironf0Fo3pa1vsBpp7wM0UNWM7A==',
  pubKey: 'AxLtvJO7WCAT1uNYriwGyxu678ck7+0ag5Pd589dtydC',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=', // check
  signedTxBase64:
    'ClMKTgoOL3R5cGVzLk1zZ1NlbmQSPAoUX+ummTeIOBAZHQ0YsPb1CZ040lQSFID5ph0o2N3lj2qmLDH59qRQag14Gg4KBHJ1bmUSBjEwMDAwMBIBMRJpClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDEu28k7tYIBPW41iuLAbLG7rvxyTv7RqDk93nz123J0ISBAoCCAEYAxIVCg4KBHJ1bmUSBjEwMDAwMBCA4esXGkATg9nF14QZAnwif5yM+IR33v2Ze5CUN6y5wuiK9W3TCWPH3/Rtc14vn7Z5xGKuid/QWjelrW+wGmnvAzRQ1Yzs',
  sender: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls',
  recipient: 'sthor1sru6v8fgmrw7trm25ckrr70k53gx5rtc4xhfgf',
  chainId: 'thorchain-stagenet-2',
  accountNumber: 3483,
  sequence: 3,
  memo: '1',
  sendAmount: '100000',
  feeAmount: '100000',
  sendMessage: {
    typeUrl: '/types.MsgSend',
    value: {
      amount: [
        {
          denom: 'rune',
          amount: '100000',
        },
      ],
      fromAddress: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls',
      toAddress: 'sthor1sru6v8fgmrw7trm25ckrr70k53gx5rtc4xhfgf',
    },
  },
  gasBudget: {
    amount: [{ denom: 'rune', amount: '100000' }],
    gasLimit: 50000000,
  },
};

export const TEST_SEND_TX = {
  hash: 'FA4635875A1A0E9175126AA6FF5D50B943F74C23B9A1C952808F1274ABC690C8',
  signature: 'aFAUTspGfdniC1x2Uia9VByLzSjtzzTSZKVZ7s45Otcp9cfx+kMxmjfd0VPIATKjoAOs55koaUPO3USdzVVkaQ==',
  pubKey: 'AxLtvJO7WCAT1uNYriwGyxu678ck7+0ag5Pd589dtydC',
  // privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'ClAKTgoOL3R5cGVzLk1zZ1NlbmQSPAoUX+ummTeIOBAZHQ0YsPb1CZ040lQSFID5ph0o2N3lj2qmLDH59qRQag14Gg4KBHJ1bmUSBjEwMDAwMBJpClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDEu28k7tYIBPW41iuLAbLG7rvxyTv7RqDk93nz123J0ISBAoCCAEYBBIVCg4KBHJ1bmUSBjEwMDAwMBCA4esXGkBoUBROykZ92eILXHZSJr1UHIvNKO3PNNJkpVnuzjk61yn1x/H6QzGaN93RU8gBMqOgA6znmShpQ87dRJ3NVWRp',
  sender: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls',
  recipient: 'sthor1sru6v8fgmrw7trm25ckrr70k53gx5rtc4xhfgf',
  chainId: 'thorchain-stagenet-2',
  accountNumber: 3483,
  sequence: 4,
  sendAmount: '100000',
  feeAmount: '100000',
  sendMessage: {
    typeUrl: '/types.MsgSend',
    value: {
      amount: [
        {
          denom: 'rune',
          amount: '100000',
        },
      ],
      fromAddress: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls',
      toAddress: 'sthor1sru6v8fgmrw7trm25ckrr70k53gx5rtc4xhfgf',
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'rune',
        amount: '100000',
      },
    ],
    gasLimit: 50000000,
  },
};

export const testnetAddress = {
  address1: 'sthor19phfqh3ce3nnjhh0cssn433nydq9shx76s8qgg',
  address2: 'sthor1cghgr0dneyymxx6fjq3e72q83z0qz7c3sjhtmc',
  address3: 'sthor1cghgr0dneyymxx6fjq3e72q83z0qz7c3sjhtm',
  address4: 'stho1cghgr0dneyymxx6fjq3e72q83z0qz7c3sjhtmc',
  validatorAddress1: 'sthor1skucxdq0fkwpx4hjkzn4g303hlzcf30nqduln0',
  validatorAddress2: 'sthor1z6z5v9xgzwxd9gytdkpve0g63mcfffjdzkpwue',
  validatorAddress3: 'sthor19k46y3nkra9q9a48wjgwac65ms385pcgpueue',
  validatorAddress4: 'stho1x9ths2nevz0e002hq93jfdpdt7rtmxwdq07fp5',
  noMemoIdAddress: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls',
  validMemoIdAddress: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls?memoId=2',
  invalidMemoIdAddress: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls?memoId=xyz',
  multipleMemoIdAddress: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls?memoId=3&memoId=12',
};

export const testnetCoinAmounts = {
  amount1: { amount: '100000', denom: 'rune' },
  amount2: { amount: '1000000', denom: 'rune' },
  amount3: { amount: '10000000', denom: 'rune' },
  amount4: { amount: '-1', denom: 'rune' },
  amount5: { amount: '1000000000', denom: 'arune' },
};
