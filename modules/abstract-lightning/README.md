# @bitgo/abstract-lightning

## Custodial userAuth key reset

For a custody Lightning wallet, call `requestUserAuthKeyReset` with the new wallet
passphrase and optional `encryptionVersion`. The SDK creates and encrypts a new
userAuth key locally, registers the encrypted key, and signs the reset request.
The returned verification code is calculated locally; the customer reads it to
support. The unencrypted private key and passphrase are never sent to the API.

Use `getUserAuthKeyResetRequest` to retrieve the latest request (a missing request
returns HTTP 404), and `cancelUserAuthKeyResetRequest` with its request ID to
cancel it. After a successful reset, other wallet members must be re-shared the
new key before they can regain access.

`computeUserAuthResetVerificationCode` and `compareUserAuthResetVerificationCodes`
are also exported for independent verification.
