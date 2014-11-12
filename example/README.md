BitGoJS Examples
=======

# Wallet Recovery Tool

The wallet recovery tool allows you to completely recover a BitGo BIP32 multi-sig wallet
using only the user's 2 keys, without making any communication with BitGo. In the event
BitGo ceases to operate, or becomes temporarily unavailable, the tool makes it possible
to exert full control over the bitcoin in your wallet.

To use the tool, you will need the KeyCard from your BitGo wallet, along with your
wallet passcode. If you provided
your own backup public key at wallet creation time, you will also need the private half
of the backup key. It may be necessary to scan the QR codes from the KeyCard 
with a mobile phone and email the resulting text to yourself.

Run the tool using 'node recoverWallet.js'

