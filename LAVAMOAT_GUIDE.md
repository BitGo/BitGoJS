# Running BitGo Express with LavaMoat

## Setup Process

### Initial Setup (Using BitGo's LavaMoat Fork)

1. **Clone the LavaMoat fork with ESM support:**
   ```bash
   git clone https://github.com/BitGo/LavaMoat-ESM
   cd LavaMoat-ESM
   git checkout feat/lavamoat-node-esm-support
   ```

2. **Link the LavaMoat package:**
   ```bash
   cd packages/lavamoat-node

   npm link
   ```

3. **In BitGoJS, link to the custom LavaMoat:**
   ```bash
   npm link lavamoat
   ```

4. **Verify the correct version:**
   ```bash
   npx lavamoat
   ```
   You should see: "start the application (watermark v1.0.12)"

### Running BitGo Express with LavaMoat

1. **Install dependencies:**
   ```bash
   # In the BitGoJS root directory
   yarn install
   ```
   This will trigger the postinstall script that patches packages that violate SES rules. Patches can be found in `/patches`

2. **Regenerate the policy file (do this once or when dependencies change):**
   ```bash
   cd modules/express
   npx lavamoat bin/bitgo-express --autopolicy
   ```

3. **Start BitGo Express with LavaMoat:**
   ```bash
   npx lavamoat bin/bitgo-express
   ```


## Troubleshooting Common Issues

### Depd Issue 
This issue has been resolved in current versions. If it reappears:
1. Create `scripts/fix-depd.js` using the script from: https://gist.github.com/kev-daniell/fbd1086e560ecaacdf52f2bf9ec6b86b
2. Run: `node scripts/fix-depd.js`

Source of the issue: https://github.com/dougwilson/nodejs-depd/issues/53

### Package Not in Allowlist Error
If you see errors like: `LavaMoat - required package not in allowlist: package @bitgo>some-pkg requested "pkg" as "pkg"`:

1. Edit: `modules/express/lavamoat/node/policy-override.json`
2. Add the missing package to the requesting package's "packages" section:
   ```json
   "resources": {
     "bitgo>some-pkg": {
       "packages": {
         "pkg": true
       }
     }
   }
   ```

This tells LavaMoat that `bitgo>some-pkg` should be allowed to access `pkg`

## Policy Files
- **Main Policy:** `modules/express/lavamoat/node/policy.json` (auto-generated - do not edit)
- **Policy Override:** `modules/express/lavamoat/node/policy-override.json` (for manual adjustments)

## Important Code Changes for LavaMoat Compatibility

Some code changes were necessary to make certain packages work with LavaMoat:

- In files using cbor-x, imports had to be changed from:
  ```javascript
  const { encode, decode, Encoder } = require('cbor-x/index-no-eval')
  ```
  to:
  ```javascript
  const { encode, decode, Encoder } = require('cbor-x')
  ```
  
This change was necessary because the direct path import was causing issues with LavaMoat's custom module resolver.
