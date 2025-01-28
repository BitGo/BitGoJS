# Self-custodial Lightning

The [lightning network](https://lightning.network/) is a L2 settlement network built on top of Bitcoin that allows you
to send funds off-chain. It allows the Bitcoin ecosystem to scale without limit while conserving much of the security
guarantees of Bitcoin, all while increasing the payment speed to much faster than waiting for a block to confirm. For
more information about lightning, [Lightning-Labs](https://docs.lightning.engineering/the-lightning-network/overview)
has a great overview. The rest of the documentation is regarding BitGo's self-custodial lightning wallet.

BitGo has created a self-custodial lightning wallet, fully integrated into the BitGo wallet ecosystem, that allows you
to send funds over the lightning network. We leverage
[Lightning Labs's Lightning Network Daemon (LND) open-source software](https://lightning.engineering/api-docs/api/lnd/) to run the node.
We have integrated running the LND node with BitGo's Express server. For information on how to set up Express, please
refer to the [top level Express documentation](../../README.md). The rest of this documentation assumes that you have
set up an express and you can make requests to it.

## Architecture

```
          xxxxxxxxx
   xxxxxxxxx      xxxx
 xxx                 xx
 x     Lightning     xx
 x    p2p network    x
 xxx               xx                        
    xxxxx   xxxxxxxx                         
         xxx                               +--------------------------------+
           ^                               |   Client Infrastructure        |
           | p2p traffic                   |                                |
           |                               |   +------------------------+   | 
+----------+--------------------------+    |   |     firewalled/        |   | 
|          |  BitGo Infrastructure    |    |   |  offline network zone  |   |  
|          v                          |    |   |                        |   |
|  +----------------+     gRPC        |    |   |   +-----------------+  |   |
|  | watch-only lnd +-----------------+----+---+-->| signer lnd node |  |   |
|  +-------+----+---+                 |    |   |   +--------+--------+  |   |
|          |    ^                     |    |   |            ^           |   |
|          |    |                     |    |   |            |           |   |
|          |    |                     |    |   +------------+-----------+   |
|          |    |                     |    |                |               |
|          |    |       +----------+  |    |           +----+----+          |
|          |    |       |          |  |    |           |         |          |
|          |    +------>|  BitGo   |<-+----+-----------+ Express |          |
|          |            | Platform |  |    |           |         |          |
|          |            |          |  |    |           +---------+          |
|  +-------v--------+   +----------+  |    +--------------------------------+
|  | bitcoind/btcd  |                 |
|  +----------------+                 |
+-------------------------------------+
```

[Adapted from this figure.](https://github.com/lightningnetwork/lnd/blob/master/docs/remote-signing.md#remote-signing)

* `Lightning p2p network`: This is the peer-to-peer lightning network where off-chain settlements are performed. To connect
to the lightning network, we (BitGo) run a `watch-only` node that acts as the interface between the lightning network and
your wallet
* `watch-only lnd`: This is a LND node that contains no private information. It is initialized with the public keys that are
created when you generate a wallet. However, the private keys stay with you, running along side your express in the
`signer lnd node`, where they are offline except for a few very specific connections. The `watch-only lnd` node's job is to
communicate what is happening on the lightning network with BitGo and your signing node, but nothing else. It contains
no ability or permissions to move funds.

  The node is also connected to the bitcoin network (`bitcoind/btcd`), where the node watches for funds moving on/off the
  wallet and to watch for any closing/opening of lightning channels.
* `signer lnd node`: This is the node that contains the private key information used to authorize the transfer for funds,
both on-chain and off-chain. This node is not connected to the lighting network or bitcoin directly. Instead, information
about what is happening comes from the `watch-only lnd` node. You can think of this node being the other half for the LND
node, and it is completely in the customers control. This signing node is deployed within your own infrastructure along
side of the `Express` app. Only `Express` and the `watch-only lnd` node can make connections to this application. We
separate the `watch-only` and `signer` LND nodes because:
  
  1. It is safer; the private keys are not directly online.
  2. Keeps the keys in your control while delegating most of the operational complexities of running LND nodes to BitGo.
* `Express`: This is the self-hosted server that you are running that makes requests to BitGo and the `signer lnd node`.
* `BitGo Platform`: This is a server that we run to serve the requests of customers. For more information, see the
[developer documentation](https://developers.bitgo.com/guides/get-started/intro).
* `bitcoind/btcd`: This is the Bitcoin network.
* `BitGo Infrastructure`: These are services and connections that are managed by BitGo. You as a client do not need to
worry about these services
* `Client Infrastructure`: These are the services that are going to be deployed in your infrastructure.

We have built our self-custodial lightning product to:

1. maximize the control of the signer lnd node while keeping it offline
2. minimize the control of the watch-only lnd
