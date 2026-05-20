import { createProxy } from 'proxy';
import { AddressInfo } from 'net';

const proxy = createProxy();
proxy.listen(3000, () => {
  const port = (proxy.address() as AddressInfo).port;
  console.log('HTTP(s) proxy server listening on port %d', port);
});
