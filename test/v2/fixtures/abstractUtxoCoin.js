

module.exports.recoverBtcSegwitFixtures = function() {
  const userKey = '{"iv":"OVZx6VlJtv74kyE9gi5c0A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"gY6e6MieSZ4=","ct":"O64y1HhJWxbST1 /KfiRXpSDBl3/d+Grphpq9IhWrXKI2m/V0H1fxRQPj4KCoCV0veEUAvvgSfi49vksEZ0PdXI66umlqWnTahqyQgddBiT05E8yB3HWzVBvwIoMfkL9acQhnL7phjwupZRy73EzeGEX9burWx3w="}';
  const backupKey = '{"iv":"sFkDFraiYrF6L+FNkN7gAQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"SIQYthT9wnw=","ct":"szZdOYRaeaDmHir1f21lC37z2taPNFCNYTUVURBOj19j3KGgMZY8VhWt+StS9U9qZN+kl4LshuQ1IP9oIbL0zyVC/mgfEcgOemgeC/PBACzTtcUy/qyDvv1TXGeqJWXVIuPlpLugTUAYm8B3C2lKloOawfhbWd4="}';
  const walletPassphrase = 'bitconnectisthefutureofmonee';
  const bitgoKey = 'xpub661MyMwAqRbcFQg4uLavkkbf4nAPU9xvyHtFC4FgRgTrcGi3HSVWKqpnW8nujw7sAyqy3gUXNXLWunR82P6JjoC7NoZ3ustoXJTvT7rxbmy';
  const recoveryDestination = '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD';
  const scan = 2;
  return { userKey, backupKey, walletPassphrase, bitgoKey, recoveryDestination, scan };
}
