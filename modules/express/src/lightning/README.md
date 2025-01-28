# Self-Custody Lightning

The [lightning network](https://lightning.network/) is an L2 settlement network built on top of the Bitcoin network that
enables you to quickly send bitcoin off-chain. This enables Bitcoin to scale to smaller and more rapid transactions,
while conserving many of the security guarantees provided by the Bitcoin protocol. To learn more about lightning, see
[Lightning-Labs](https://docs.lightning.engineering/the-lightning-network/overview). To learn more about self-custody lightning wallets at BitGo,
continue reading here.

Self-custody lightning wallets at BitGo are fully integrated into the greater BitGo ecosystem, enabling you to send bitcoin over
the lightning network, while leveraging other BitGo features, such as policies. BitGo's lightning node runs using
[BitGo Express](https://developers.bitgo.com/guides/get-started/express/install) and [Lightning Labs's Lightning Network Daemon (LND) open-source software](https://lightning.engineering/api-docs/api/lnd/).
The rest of this documentation assumes that you set up BitGo Express and you can make requests to it.

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

* `Lightning p2p network`: This is the peer-to-peer lightning network that performs off-chain settlements. To connect to the lightning network, BitGo runs a
`watch-only` node that acts as the interface between the lightning network and your wallet.
* `watch-only lnd`: This is an LND node that doesn't contain any private information. It initializes using the public keys that you created when you
generated the wallet. Meanwhile, you manage your private keys using Express in the `signer lnd` node. Your private keys remain offline, except for a few
specific connections. The `watch-only lnd` node communicates what's happening on the lightning network to BitGo and your signing node - nothing else. The
`watch-only lnd` doesn't contain any ability or permissions to move bitcoin.
The node also connects to the Bitcoin network (`bitcoind/btcd`). Here, the node watches for bitcoin moving in or out of the wallet and also watches for any lightning channels opening or closing.
* `signer lnd node`: This node contains your private key information that you use to authorize transfers, both on-chain and off-chain. This node isn't
connected to the lighting network or Bitcoin directly. Instead, information about what's happening comes from the `watch-only lnd` node. The `signer lnd`
node is the other half of the LND node and is completely in your control. This signing node is deployed within your infrastructure alongside the `Express`
app. Only `Express` and the `watch-only lnd` node can make connections to this application. BitGo separates the `watch-only` and `signer` LND nodes because:
  
  1. It's safer, because the private keys aren't directly online.
  2. It keeps the keys in your control, while delegating most of the operational complexities of running LND nodes to BitGo.
  
* `Express`: This is the self-hosted server that you run and use to make requests to BitGo and the `signer lnd node`.
* `BitGo Platform`: This is a server that BitGo runs to serve your requests. For more information, see the
[Introduction to BitGo](https://developers.bitgo.com/guides/get-started/intro) on the [Developer Portal](https://developers.bitgo.com/).
* `bitcoind/btcd`: This is the Bitcoin network.
* `BitGo Infrastructure`: These are services and connections that BitGo manages. You don't need to manage these services.
* `Client Infrastructure`: These are the services that deploy in your infrastructure.

BitGo built self-custody lightning wallets to:

1. Maximize your control of the signer LND node while keeping it offline.
2. Minimize your control of the watch-only LND node.

## `Client Infrastructure` deployment recommendations

### Express

* Express needs to be able to communicate with
  * `signer lnd` node via port 8080 (or whatever port you set for REST communications on the
  `signer lnd` node).
  * BitGo APIs on port 443

### `signer lnd` node

* Ingress: must be able to be communicated from the `watch-only` node either via a static IP
address or a hostname on the GRPC port (10009)
* Egress: must be able to send information to the `watch-only lnd` node and Express.
* TLS: We highly recommend using the `signer lnd` node to create the TLS certificate. If none
is provided during startup, it will automatically create one. The TLS certificate must account
for the IP addresses or hostnames that you will be contacting the `signer lnd` node from. You
can add these in the [LND config](https://github.com/lightningnetwork/lnd/blob/master/sample-lnd.conf) with `tlsextraip` and `tlsextradomain`, respectively.

## Wallet Creation

Unlike on-chain Bitcoin Wallets, the Lightning wallet requires multiple steps to initialize. Broadly, we need to
initiate the deployment of the watch-only node in our infrastructure, configure express and the remote signer with
the IP information of the watch-only node, and finally initialize the lightning wallet with the wallet passphrase.

#### Step (0) Add Lightning Wallet license to your enterprise

Reach out to `support@bitgo.com` to request a license for you to create lightning wallets.

#### Step (1): Initiate Wallet Creation

To initiate wallet creation, use the standard endpoint for wallet creation with the following parameters:

```
POST /api/v2/[t]lnbtc/wallet/generate
{
  label,
  passphrase,
  enterprise,
  passcodeEncryptionCode
}
```

* `label`: the name of the wallet
* `passphrase`: This is the passphrase that encrypts the keys on the wallet.
* `enterprise`: the ID of the enterprise you want to create the wallet under
* `passcodeEncryptionCode`: This is the passphrase that encrypts the walletPassphrase. This is used in recovery scenarios
if you lost the `passphrase`, where the encrypted backup is stored in BitGo's databases. This should be stored in a safe location.

This will start the process of creating a wallet. Once the watch-only lightning node is created, you will receive an email for the next step.

#### Step (2) Create the `lightningSignerConfig.json`

Once we have deployed a `signer lnd` node and created the wallet, we have the ability to
create the `lightningSignerConfig.json`, which gives the relevant information for `Express`
to talk to the `signer lnd` node:

```
{
  walletId: { url, tlsCert }
}
```

* `walletId`: This is the `id` for the wallet that was created in step 1.
* `host`: This is the url/hostname for how `Express` can contact the `lnd signer` node via REST.
If they are deployed in the same namespace, you can use `0.0.0.0`. Note that you need to include the port (LND default for REST is 8080).
* `tlsCert`: This is the TLS certificate created by the `signer lnd` node encoded
to base64. You can generate get this by deploying the `signer lnd` node and it will create
one automatically if you do not provide one.

When deploying the `Express` instance, pass in the config using the flag `--lightingSignerConfig lightingSignerConfig.json`. __This will require restarting the `Express` server so it can run with this flag.__

You can test your connection to `Express` and the `signer lnd` node (via `Express`) with the
following endpoints:

```
GET /api/v2/ping (ping Express)
GET /api/v2/[t]lnbtc/wallet/:walletId/state (ping signer lnd via Express)
```

Both should return `200`. If `/api/v2/ping` is not working, you cannot correct connect to Express. If `/api/v2/[t]lnbtc/wallet/:walletId/state` is not working, then `Express` cannot properly connect to the the `signer lnd`.

#### Step (3) Initialize the `signer lnd` node

Once we are able to communicate with the `signer lnd` node from Express, we can initialize the `signer lnd` node with the following endpoint:

```
POST /api/v2/[t]lnbtc/wallet/:walletId/initwallet
{
  passphrase: string
}
```

This will initialize the lnd using the [`initwallet`](https://lightning.engineering/api-docs/api/lnd/wallet-unlocker/init-wallet/) LND route. This will create the admin macaroon for the signer node and an encrypted version (to the wallet passphrase) will be uploaded to the wallet.

#### Step (4) Update Wallet with relevant information

Once we have a deployment for `Express` and `lnd signer` node, we can update the wallet:

```
PUT /api/v2/[t]lnbtc/wallet/:walletId
{
  signerHost: string,
  tlsCert: string,
  tlsKey: string, (optional)
}
```

* `signerLndHostname`: This is either the IP address or the hostname that the
`watch-only lnd` node will communicate with the `signer lnd` node.
* `tlsCert`: This is the base64 encoded TLS certificate (the same that is used in the `lightningSignerConfig.json`)
* (Optional) `tlsKey`: The `signer lnd` node TLS key. This will be encrypted client side and uploaded to BitGo for backup purposes. BitGo will not know your TLS key for the signer node.

#### Step (5) Wait for the `watchOnlyIp` to be set

In the background, initiated by step (1), BitGo is creating the `watch-only lnd` node in our
own infrastructure, and therefore can take some time. You can periodically poll the wallet
with `GET /api/v2/[t]lnbtc/wallet/:walletId` and look for `watchOnlyIp` to be set in the
`coinSpecific` of the wallet. However, we will send you an email once it is set so that you
do not have to.

#### Step (6) Create the signer macaroon

Once the `watchOnlyIp` of the wallet is set, we now are able to create the signer macaroon.
This macaroon will be used by the `watch-only lnd` node to tell the `signer lnd` node to do
certain operational actions such as creating lightning channels, signing invoices, etc, and
is derived from the admin macaroon of the `signer lnd` node. We need the `watchOnlyIp` of the
`watch-only lnd` node so that we can add the caveat to the signer macaroon that it can only
be used by that IP address.

To create the signer macaroon use the following endpoint:

```
POST /api/v2/[t]lnbtc/wallet/:walletId/signermacaroon
{
  passphrase
}
```

* `passphrase`: wallet passphrase used to decrypt the admin macaroon so that we can bake the
signer macaroon.

In transit, we encrypt the signer macaroon using ECDH encryption.
