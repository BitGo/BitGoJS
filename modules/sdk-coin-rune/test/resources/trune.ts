// Get the test data by running the scripts for the particular coin from coin-sandbox repo.
export const TEST_TX_WITH_MEMO = {
  hash: 'B0C1C424ABA63C7401691F7AC777D080A1C4E59594CCBC74DC4B213D747AA1F1',
  signature: 'E4PZxdeEGQJ8In+cjPiEd979mXuQlDesucLoivVt0wljx9/0bXNeL5+2ecRironf0Fo3pa1vsBpp7wM0UNWM7A==',
  pubKey: 'AxLtvJO7WCAT1uNYriwGyxu678ck7+0ag5Pd589dtydC',
  privateKey: 'uz2P7K8xhtoHM1QAbXXWBx83uvyA/ulQTx4tM2qGXAE=',
  signedTxBase64:
    'ClMKTgoOL3R5cGVzLk1zZ1NlbmQSPAoUX+ummTeIOBAZHQ0YsPb1CZ040lQSFID5ph0o2N3lj2qmLDH59qRQag14Gg4KBHJ1bmUSBjEwMDAwMBIBMRJpClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDEu28k7tYIBPW41iuLAbLG7rvxyTv7RqDk93nz123J0ISBAoCCAEYAxIVCg4KBHJ1bmUSBjEwMDAwMBCA4esXGkATg9nF14QZAnwif5yM+IR33v2Ze5CUN6y5wuiK9W3TCWPH3/Rtc14vn7Z5xGKuid/QWjelrW+wGmnvAzRQ1Yzs',
  sender: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls',
  recipient: 'sthor1sru6v8fgmrw7trm25ckrr70k53gx5rtc4xhfgf',
  chainId: 'thorchain-stagenet-2',
  accountNumber: 15,
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
  privateKey: 'uz2P7K8xhtoHM1QAbXXWBx83uvyA/ulQTx4tM2qGXAE=',
  signedTxBase64:
    'ClAKTgoOL3R5cGVzLk1zZ1NlbmQSPAoUX+ummTeIOBAZHQ0YsPb1CZ040lQSFID5ph0o2N3lj2qmLDH59qRQag14Gg4KBHJ1bmUSBjEwMDAwMBJpClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDEu28k7tYIBPW41iuLAbLG7rvxyTv7RqDk93nz123J0ISBAoCCAEYBBIVCg4KBHJ1bmUSBjEwMDAwMBCA4esXGkBoUBROykZ92eILXHZSJr1UHIvNKO3PNNJkpVnuzjk61yn1x/H6QzGaN93RU8gBMqOgA6znmShpQ87dRJ3NVWRp',
  sender: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls',
  recipient: 'sthor1sru6v8fgmrw7trm25ckrr70k53gx5rtc4xhfgf',
  chainId: 'thorchain-stagenet-2',
  accountNumber: 15,
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

export const wrwUser = {
  senderAddress: 'sthor1gqek8kl5mr9c37rl8yp2mljne67jgaqm96jg2f',
  destinationAddress: 'sthor1tl46dxfh3qupqxgap5vtpah4pxwn35j5tnjzls',
  userPrivateKey:
    '{"iv":"9rcHMytmmnHjG1llBoc49g==","v":1,"iter":10000,"ks":256,"ts":64,"mode" :"ccm","adata":"","cipher":"aes","salt":"8lFAwTrcCzQ=","ct":"1gMRC60nu01IYr jgir9GCuQNLMZC2vt/pFjgL+tV3K7/rviSguDsua133PkNEeuty1mZxNH2S1TKu1KxZJMlB+MAs vo7k9dIyCgQvkX/nbJFFaRrnLL55mcQe0PhCdVNRHx9doXMngRF+UqEMLD8F0HNE1+ZPGzsathH DLFPxLCRMrwA/Ss/LQowGiXo4WnzVK3MQcX6wdmZvfV+S3xswRjHkLvolVY3rVGP5PkU86Wwrmy e1CKM4hSGA8FModa718Svk7C+LHr0yOTuuPftXtH0fAPPo9KH7f+EbBWMJPQgjK8DW/z1xnDgLH dzhveyNPevqUqb3FEyutjow+KBkxl+xHqJ4gKcU9MLsghPMCy0zSq2kBbhlqWJ7XwduhHVGv2nT rlsEfh7Z0fbqZTX1RQ5AKZhSBFEqmq1hKxRlhVcr9KqBw814tIfdFD7nMgV7rz+3X8cJaK2tDXH 0QaY8bJGwxwH38FsfNevs8Qf2bx5VrD/Vw3wo0G5hJ7+TdPCrib8UWyxPGuruH7b8hwCUTZaq97 zkDp7c79BDWyH8ycTxQXjLPwb1CwpUiRDc6NHD2p3iGVaztMdQOMXmPeeMhBNGVI0MPAfSdcDip 2E5Ek0fwnI1mEuFjPMkc+VOlsVhlWfV/9Xpoh3NadPhqg3i9Cr2uNT/PSyHd/jpIqG5DlaaEvVD f7COqNvXX5Qqmlr9dL3R2cf0zP8TPImAlRfef4D8zatHtylKkImMc0JcdcXTzwU/5tf21o/Y701 DLYjwUUgqQ57ObHHNlSvmdIuO1rD5LAn96NAYNRStrENqmbibE5MsYrp9nPAprCNFnZR6UNpXwD hvq9gvxRG+PjmXGj0nuyR7cshxURLy0/p4tq7LkGjk4Gg31Mgk41lcYUW2tLuUbTYmpteu3Cdwe DFuLsfI1qZxKyr6V5Nse3ZAvnJLTZnQXiHOnc2y5/e53+MAVupXR7HZzx7SIJ+fqxpjxvccmgJC sWaPo+Lsx6KaSNkQGFMGuyZ87IEvm7vk2GyIP+FQUn4nmTdEDLzg7nNo+zf5WT4A6Yz3GNAa3Nh 2QHZSFGWcubOXDawh6lAjZ78GNK9yJDp22dJTmfZ+1TsVORpbZw="}',
  backupPrivateKey:
    '{"iv":"0EDqGU1yBE2PM4ry6TxARA==","v":1,"iter":10000,"ks":256,"ts":64,"mode" :"ccm","adata":"","cipher":"aes","salt":"a8T0fVVhTz0=","ct":"syCrJ+RD8oHZ4z jltLmyNS/VVmSLXLMAdnVnoPNEfFX9mIMAycYCajMR297l09fPsWWqDcDs0cSI0xNbnMjyW30b/ JOvQ33eaBSiyBr3vbmhaEFduZTUgOCNg/Js0cAkEkeE/KDkfOUB0HzfSEQb6m0eXmWgGSnySUOd TlZZ/thT7j2oPHVpPE52h6Yi3LS1Jkt3S7ySStXvG/4iurhcL32a32Fx3IQxs/bg8JBIGlRG644 aLttCJ+uPihaSISUGn1hh0iEz2ZAaCoCkq7oNPrK+pxHHOmbjxp6XpV67EmQ/JRfSt47eW3jC7A D+xaLLHspjQifp6ClZeHT2pBrkcWrZfr1uL5w3CKrXQeJ0pXUoRmJwGys4hm5Bzu4imANo+jd1+ wg73ByYQ5VwRhV1qhb82vUrQ0i4k5Gt2l6U2LZ/DMQiUbq7FdjYWqfZmk18GIZ6g3IPJtGjnA6x o8RTvkytMMv8btsx/aa6jE6EMeFtGzlhhJJunpcS4QG4IkIuyAjPafwOklEwXklZCLDpKdVYgTR RE0XHC0VXOGQwGUARzMZwQO5OaRyQkxtZ5/CawI5jrwMZP+bpC9dKzsGOXfSvvFsJWnkboXyy09 bFwTuKHx0ZILdA/8Xq5689YEmFljHTeQ0Es/q5y5kU+XzT4sjjgxz1qqhUJVh7wDwQevRDWTwGJ Lfi2AeLsv2f0PKiGTYJzQGSXUerhLMwhg3rXNfXGkrWSmEhJH/RsvF6CdaRKWxVd+k8K5ULLwK+ sdujA5murZ24KI5z0Yr9qW2TSsJRG3PS+ZH1q3VGYaz6k912QVzyvzds8+hfaHNtr6OGBWahGZo JchgnQHSfAZxOUz7K7WNzh934HK5+e11/lF/Fxssumz2OStFWI18oBB7/8YBi6PEp3sFddOQVSA BXRGuStolGna43nly4bavOic7XIoNHs61hynMeR6NcthsSrj5xZ6q36EqLdfkDImQvu+3BXClT7 Q4bdEfXm0t7Bgmid4NeJ1I3grXZMOmVbPgcypfxp2jrkjme/R0/eJL4B38WU2xjxDg+WlBGy8dA xg8ll+n2NkA7lvJz5NBDxbGHRAhtyVTF8YA+Oxps3rumIw=="}',
  bitgoPublicKey:
    '02d754ffd645ba3d87fbdeb3578dbc22fc252ebb299416434a7059d9638f52d11e0fd153d9d dfb2a193531ac5b7d3b223188a957de1312d3ede35305ee70b76376',
  walletPassphrase: 'Ghghjkg!455544llll',
};
