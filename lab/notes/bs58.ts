// import bs58 from "bs58";
// import { Dot } from "@bitgo/account-lib";

it('initialization from public key', () => {
  // const buffer = Buffer.from('8Arrfe4vAh5fAEJgUBwL42EZa5P22zJJUnn569hxWfJU', 'base64');
  // const bufString = buffer.toString('hex');
  const buffer = bs58.decode('8Arrfe4vAh5fAEJgUBwL42EZa5P22zJJUnn569hxWfJU');
  const bufString = buffer.toString('hex');

  // const keyPair = new Dot.KeyPair({ pub: 'f00aeb7dee2f021e5f004260501c0be361196b93f6db32495279f9ebd87159f254' });
  const keyPair = new Dot.KeyPair({ pub: bufString });
  console.log(keyPair.getAddress());
  // should.equal(keyPair.getKeys().pub, account3.publicKey);
});
