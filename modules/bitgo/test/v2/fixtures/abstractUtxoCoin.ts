

module.exports.recoverBtcSegwitFixtures = function() {
  const userKey = '{"iv":"OVZx6VlJtv74kyE9gi5c0A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"gY6e6MieSZ4=","ct":"O64y1HhJWxbST1 /KfiRXpSDBl3/d+Grphpq9IhWrXKI2m/V0H1fxRQPj4KCoCV0veEUAvvgSfi49vksEZ0PdXI66umlqWnTahqyQgddBiT05E8yB3HWzVBvwIoMfkL9acQhnL7phjwupZRy73EzeGEX9burWx3w="}';
  const backupKey = '{"iv":"sFkDFraiYrF6L+FNkN7gAQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"SIQYthT9wnw=","ct":"szZdOYRaeaDmHir1f21lC37z2taPNFCNYTUVURBOj19j3KGgMZY8VhWt+StS9U9qZN+kl4LshuQ1IP9oIbL0zyVC/mgfEcgOemgeC/PBACzTtcUy/qyDvv1TXGeqJWXVIuPlpLugTUAYm8B3C2lKloOawfhbWd4="}';
  const walletPassphrase = 'bitconnectisthefutureofmonee';
  const bitgoKey = 'xpub661MyMwAqRbcFQg4uLavkkbf4nAPU9xvyHtFC4FgRgTrcGi3HSVWKqpnW8nujw7sAyqy3gUXNXLWunR82P6JjoC7NoZ3ustoXJTvT7rxbmy';
  const recoveryDestination = '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD';
  const scan = 2;
  const ignoreAddressTypes = ['p2wsh'];
  return {
    params: { userKey, backupKey, walletPassphrase, bitgoKey, recoveryDestination, scan, ignoreAddressTypes },
    expectedTxHex: '01000000000102e0f7fb528646bf0dc3a717a1680fd2b8ca8dfd39f690adcdc194cea8f7cd579a00000000fdfe0000483045022100a7d8208df8844882203739b07211d5b1070592c7daf822150ffddee88eb99b88022012d3da2e29d7f30d10c495f0c8ee6a1699425b404d1b8142de72517c474f9cf401483045022100f3c1d45823cd15d7771061b8ac4c156dc67e9e4cc33ab27361441a9cccfa7e0d0220747fc7f69d9f7d70cf699a61cb6affa9c90e8172970e8de6f6eed02b53a8735e014c695221038c3ed7682e0999fbbb9f2a06348c9406f20a4c6acfa6015aa0049dae8d846dfc2102bdb5d7ac2a8775dcd8eb31bdea85ec82f6019f9580084dc62e905e741a34e5af2103fb333c62e4a349acecb98d63c307bb3a4cf439c71b3a6dce29ab9cfa65ee2ce153aeffffffff87a38a9b6c0dfab5e787bcaa3fbb2f7033b3198a1c36826c6f76ee53263840800100000023220020d397ea8831c203b211445a981bcbb643f464b826cf3a1226842ce956baf9bcd2ffffffff0118df00000000000017a914c1cf4712d6435cb99851d1e47c3fcef34c8681ed870004004730440220176a7de94926af913a0a3b5c668e23d66dc09f2b92b8adb9c4fb44a30afb0fc902206e9b76764a8dd921426d3ff11c43b3f62f431a1ee02647a83c0cd321cdd816bb01483045022100e2150355a76ca81b3bb510caae0a63a18f960d2102c220c6a73d7fd7b8b4301d02200cf50d06d7ccff824030ee4221fdb33d04213b0116dfa41c827ecdf9c39fc26f01695221025e8f5d3dc7e2247a05b7434cd57f985a782d858762ab73bb31f27b4e9cb006cb21036cca9315316b6a54c3b5de33d30d374575c5a30f9b0629e95a37abacf2d878fd2103b7a4d470b12a223518c49d26e2b587c03382ab9c6f7c00e428f8985b57abc2be53ae00000000'
  };
};

module.exports.recoverBtcUnsignedFixtures = function() {
  const userKey = 'xpub661MyMwAqRbcEc56gSK9UBdYL6FggedPtK7HGjDgmn9Hr8NdoED6q8YxJ5CCwdN6MtmRL8DsXiFrMoEEBJn8uNSkH4jgZGrWhWUVS4k4m51';
  const backupKey = 'xpub661MyMwAqRbcGyxYz3v8K7PiqYCpyJvrJW6u3fCTi8KKNJPEFkEuzx2vfX4JZpjdLP7uvuWAT9ESEAH2C9y7TduF7LsLvSGnefrgjXXPiZS';
  const recoveryDestination = '2N1KrBvGLcz8DjivbUjqq7N9eH7km6a8FtT';
  const bitgoKey = 'xpub661MyMwAqRbcFn9RcuYmAcJyG5yJ1ohChcvtQHdGRNVuup5CNpb3PQVYqkYLUZigVEkp28gNrMibHohNGhQxxoe2pr21NqFGYWQxR7kivR2';
  const scan = 2;
  const ignoreAddressTypes = ['p2wsh'];
  return {
    params: { userKey, backupKey, bitgoKey, recoveryDestination, scan, ignoreAddressTypes },
    expectedTxHex: '0100000002f979a35a252c6d4b8afd3b29de0b36fd2fb4eca6ae4f0a5fe2b46c8192a7f44b0000000000ffffffff2e55761cd693b899b7aa0672c3ae4ebd4205f7ea4e4a6d4b9fc7e91dea2d19a90100000000ffffffff01304c03000000000017a91458a0e38c7d65307abe4fe74bf1e0127c6d5804c58700000000'
  };
};
