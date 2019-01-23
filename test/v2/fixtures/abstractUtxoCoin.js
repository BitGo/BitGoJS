

module.exports.recoverBtcSegwitFixtures = function() {
  const userKey = '{"iv":"OVZx6VlJtv74kyE9gi5c0A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"gY6e6MieSZ4=","ct":"O64y1HhJWxbST1 /KfiRXpSDBl3/d+Grphpq9IhWrXKI2m/V0H1fxRQPj4KCoCV0veEUAvvgSfi49vksEZ0PdXI66umlqWnTahqyQgddBiT05E8yB3HWzVBvwIoMfkL9acQhnL7phjwupZRy73EzeGEX9burWx3w="}';
  const backupKey = '{"iv":"sFkDFraiYrF6L+FNkN7gAQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"SIQYthT9wnw=","ct":"szZdOYRaeaDmHir1f21lC37z2taPNFCNYTUVURBOj19j3KGgMZY8VhWt+StS9U9qZN+kl4LshuQ1IP9oIbL0zyVC/mgfEcgOemgeC/PBACzTtcUy/qyDvv1TXGeqJWXVIuPlpLugTUAYm8B3C2lKloOawfhbWd4="}';
  const walletPassphrase = 'bitconnectisthefutureofmonee';
  const bitgoKey = 'xpub661MyMwAqRbcFQg4uLavkkbf4nAPU9xvyHtFC4FgRgTrcGi3HSVWKqpnW8nujw7sAyqy3gUXNXLWunR82P6JjoC7NoZ3ustoXJTvT7rxbmy';
  const recoveryDestination = '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD';
  const scan = 2;
  return {
    params: { userKey, backupKey, walletPassphrase, bitgoKey, recoveryDestination, scan },
    expectedTxHex: '01000000000102e0f7fb528646bf0dc3a717a1680fd2b8ca8dfd39f690adcdc194cea8f7cd579a00000000fc004730440220608bd5a8533244185a6b53fc4d466a82bc604980e3a5acad5dfda285651753cc02207ae73febb467eec90968e41d2c158181648bda7bab42ff376cdf890d39a07b5d0147304402200974952d2742a338e2bea84425ada7680939d4d5dec1136dbfdff3dd008e0581022079c8c74c4c18c1b816c01468d112a6cbf3d66186f3a8bf0abbe30d22d6905ecb014c695221038c3ed7682e0999fbbb9f2a06348c9406f20a4c6acfa6015aa0049dae8d846dfc2102bdb5d7ac2a8775dcd8eb31bdea85ec82f6019f9580084dc62e905e741a34e5af2103fb333c62e4a349acecb98d63c307bb3a4cf439c71b3a6dce29ab9cfa65ee2ce153aeffffffff87a38a9b6c0dfab5e787bcaa3fbb2f7033b3198a1c36826c6f76ee53263840800100000023220020d397ea8831c203b211445a981bcbb643f464b826cf3a1226842ce956baf9bcd2ffffffff0160df00000000000017a914c1cf4712d6435cb99851d1e47c3fcef34c8681ed87000400483045022100b3dd92fe9d078a98cdb2b2b59c5d8c78a3fa44e48c54659e5e578215fdffeefb022073b5be09e7b1cab7ad63b6490121d7b6d495a02471a10d71dd4807fde9216ed801483045022100a9f204b05acd968a0054ebfc68a5387b0bb54d47c60eaeb9a650f855f08d2cd502206333ff64198a29bce8cd97a62a5c56fc014b4e60d3ecfdd26f9c2e6f91c2a7bf01695221025e8f5d3dc7e2247a05b7434cd57f985a782d858762ab73bb31f27b4e9cb006cb21036cca9315316b6a54c3b5de33d30d374575c5a30f9b0629e95a37abacf2d878fd2103b7a4d470b12a223518c49d26e2b587c03382ab9c6f7c00e428f8985b57abc2be53ae00000000'
  };
}

module.exports.recoverBtcUnsignedFixtures = function() {
  const userKey = 'xpub661MyMwAqRbcEc56gSK9UBdYL6FggedPtK7HGjDgmn9Hr8NdoED6q8YxJ5CCwdN6MtmRL8DsXiFrMoEEBJn8uNSkH4jgZGrWhWUVS4k4m51';
  const backupKey = 'xpub661MyMwAqRbcGyxYz3v8K7PiqYCpyJvrJW6u3fCTi8KKNJPEFkEuzx2vfX4JZpjdLP7uvuWAT9ESEAH2C9y7TduF7LsLvSGnefrgjXXPiZS';
  const recoveryDestination = '2N1KrBvGLcz8DjivbUjqq7N9eH7km6a8FtT';
  const bitgoKey = 'xpub661MyMwAqRbcFn9RcuYmAcJyG5yJ1ohChcvtQHdGRNVuup5CNpb3PQVYqkYLUZigVEkp28gNrMibHohNGhQxxoe2pr21NqFGYWQxR7kivR2';
  const scan = 2;
  return {
    params: { userKey, backupKey, bitgoKey, recoveryDestination, scan },
    expectedTxHex: '0100000002f979a35a252c6d4b8afd3b29de0b36fd2fb4eca6ae4f0a5fe2b46c8192a7f44b0000000000ffffffff2e55761cd693b899b7aa0672c3ae4ebd4205f7ea4e4a6d4b9fc7e91dea2d19a90100000000ffffffff01784c03000000000017a91458a0e38c7d65307abe4fe74bf1e0127c6d5804c58700000000'
  };
}
