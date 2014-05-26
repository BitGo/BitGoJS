var Crypto = require('./crypto-js/index');
var Base58 = require('./base58');
var ECKey = require('./eckey');
var jsSHA = require('./sha512');
var BigInteger = require('./jsbn/jsbn2');
var sec = require('./jsbn/sec');

var MAINNET_PUBLIC = 0x0488b21e;   // 'xpub'
var MAINNET_PRIVATE = 0x0488ade4;  // 'xprv'
var TESTNET_PUBLIC = 0x043587cf;   // 'tpub'
var TESTNET_PRIVATE = 0x04358394;  // 'tprv'

// Create a BIP32 address.
// |bytes| is a string and must be a Base58-encoding of a BIP32 extended public or extended private key.
var BIP32 = function(bytes) {
    if( typeof bytes === "string" ) {
        var decoded = Base58.decode(bytes);
        if (decoded.length != 82 ) {
            throw new Error("Not enough data");
        }
        var checksum = decoded.slice(78, 82);
        bytes = decoded.slice(0, 78);

        var hash = Crypto.SHA256( Crypto.SHA256( bytes, { asBytes: true } ), { asBytes: true } );

        if (hash[0] != checksum[0] || hash[1] != checksum[1] || hash[2] != checksum[2] || hash[3] != checksum[3] ) {
            throw new Error("Invalid checksum");
        }
        this.init_from_bytes(bytes);
    }
}

// Initialize from a bitcoin seed
BIP32.prototype.initFromSeed = function(seedBytes) {
    var sha = new jsSHA(seedBytes, "HEX");
    var hash = sha.getHMAC('Bitcoin seed', "TEXT", "SHA-512", "HEX");
    hash = Crypto.util.hexToBytes(hash);
    var masterKey = hash.slice(0, 32);
    var chainCode = hash.slice(32, 64);
    this.version = MAINNET_PRIVATE;
    this.depth = 0;
    this.parent_fingerprint = [0,0,0,0];
    this.child_index = 0;
    this.chain_code = chainCode;
    this.eckey = new ECKey(masterKey);
    this.eckey.setCompressed(true);
    this.extended_public_key = undefined;
    this.extended_private_key = undefined;
    this.has_private_key = true;
    this.build_extended_public_key();
    this.build_extended_private_key();
    return this;
}

BIP32.prototype.init_from_bytes = function(bytes) {
    function uint(f, size) {
        if (f.length < size) {
            throw new Error("not enough data");
        }
        var n = 0;
        for (var i = 0; i < size; i++) {
            n *= 256;
            n += f[i];
        }
        return n;
    }
    function u8(f)  { return uint(f,1); }
    function u32(f) { return uint(f,4); }

    function decompress_pubkey(key_bytes) {
        var ecparams = sec.getSECCurveByName("secp256k1");
        return ecparams.getCurve().decodePointHex(Crypto.util.bytesToHex(key_bytes));
    }

    // Both pub and private extended keys are 78 bytes
    if ( bytes.length != 78 ) {
        throw new Error("expected 78 bytes of data");
    }

    this.version            = u32(bytes.slice(0, 4));
    this.depth              = u8 (bytes.slice(4, 5));
    this.parent_fingerprint = bytes.slice(5, 9);
    this.child_index        = u32(bytes.slice(9, 13));
    this.chain_code         = bytes.slice(13, 45);

    var key_bytes = bytes.slice(45, 78);

    if ( (this.version == MAINNET_PRIVATE || this.version == TESTNET_PRIVATE) && key_bytes[0] == 0 ) {
        this.eckey = new ECKey(key_bytes.slice(1, 33));
        this.eckey.setCompressed(true);
        this.has_private_key = true;
    } else if ( (this.version == MAINNET_PUBLIC || this.version == TESTNET_PUBLIC) &&
                (key_bytes[0] == 0x02 || key_bytes[0] == 0x03) ) {
        this.eckey = new ECKey("0");
        this.eckey.pubPoint = decompress_pubkey(key_bytes);
        this.eckey.setCompressed(true);
        this.has_private_key = false;
    } else {
        throw new Error("Invalid key");
    }

    this.build_extended_public_key();
    this.build_extended_private_key();
}

BIP32.prototype.build_extended_public_key = function() {
    this.extended_public_key = [];

    var v = MAINNET_PUBLIC;
    if( this.version == TESTNET_PUBLIC || this.version == TESTNET_PRIVATE ) {
        v = TESTNET_PUBLIC;
    }

    // Version
    this.extended_public_key.push(v >> 24);
    this.extended_public_key.push((v >> 16) & 0xff);
    this.extended_public_key.push((v >> 8) & 0xff);
    this.extended_public_key.push(v & 0xff);

    // Depth
    this.extended_public_key.push(this.depth);

    // Parent fingerprint
    this.extended_public_key = this.extended_public_key.concat(this.parent_fingerprint);

    // Child index
    this.extended_public_key.push(this.child_index >>> 24);
    this.extended_public_key.push((this.child_index >>> 16) & 0xff);
    this.extended_public_key.push((this.child_index >>> 8) & 0xff);
    this.extended_public_key.push(this.child_index & 0xff);

    // Chain code
    this.extended_public_key = this.extended_public_key.concat(this.chain_code);

    // Public key
    this.extended_public_key = this.extended_public_key.concat(this.eckey.getPub());
}

BIP32.prototype.extended_public_key_string = function(format) {
    if( format === undefined || format === "base58" ) {
        var hash = Crypto.SHA256( Crypto.SHA256( this.extended_public_key, { asBytes: true } ), { asBytes: true } );
        var checksum = hash.slice(0, 4);
        var data = this.extended_public_key.concat(checksum);
        return Base58.encode(data);
    } else if( format === "hex" ) {
        return Crypto.util.bytesToHex(this.extended_public_key);
    } else {
        throw new Error("bad format");
    }
}

BIP32.prototype.build_extended_private_key = function() {
    if( !this.has_private_key ) return;
    this.extended_private_key = [];

    var v = MAINNET_PRIVATE;
    if( this.version == TESTNET_PUBLIC || this.version == TESTNET_PRIVATE ) {
        v = TESTNET_PRIVATE;
    }

    // Version
    this.extended_private_key.push(v >> 24);
    this.extended_private_key.push((v >> 16) & 0xff);
    this.extended_private_key.push((v >> 8) & 0xff);
    this.extended_private_key.push(v & 0xff);

    // Depth
    this.extended_private_key.push(this.depth);

    // Parent fingerprint
    this.extended_private_key = this.extended_private_key.concat(this.parent_fingerprint);

    // Child index
    this.extended_private_key.push(this.child_index >>> 24);
    this.extended_private_key.push((this.child_index >>> 16) & 0xff);
    this.extended_private_key.push((this.child_index >>> 8) & 0xff);
    this.extended_private_key.push(this.child_index & 0xff);

    // Chain code
    this.extended_private_key = this.extended_private_key.concat(this.chain_code);

    // Private key
    this.extended_private_key.push(0);
    this.extended_private_key = this.extended_private_key.concat(this.eckey.priv.toByteArrayUnsigned());
}

BIP32.prototype.extended_private_key_string = function(format) {
    if (!this.has_private_key) {
        throw 'no private key';
    }

    if( format === undefined || format === "base58" ) {
        var hash = Crypto.SHA256( Crypto.SHA256( this.extended_private_key, { asBytes: true } ), { asBytes: true } );
        var checksum = hash.slice(0, 4);
        var data = this.extended_private_key.concat(checksum);
        return Base58.encode(data);
    } else if( format === "hex" ) {
        return Crypto.util.bytesToHex(this.extended_private_key);
    } else {
        throw new Error("bad format");
    }
}


BIP32.prototype.derive = function(path) {
    var e = path.split('/');

    var bip32 = this;
    for( var i in e ) {
        if (!e.hasOwnProperty(i)) continue;
        var c = e[i];

        if( i == 0 ) {
            if( c != 'm' ) throw new Error("invalid path");
            continue;
        }

        var use_private = (c.length > 1) && (c[c.length-1] == '\'');
        var child_index = parseInt(use_private ? c.slice(0, c.length - 1) : c);
        if (c >= 0x80000000) {
            throw 'index too large';  // index is greater than 31bits
        }

        if( use_private )
            child_index |= 0x80000000;

        bip32 = bip32.derive_child(child_index);
    }

    return bip32;
}

BIP32.prototype.derive_child = function(child_index) {
    var ib = [];
    ib.push( (child_index >> 24) & 0xff );
    ib.push( (child_index >> 16) & 0xff );
    ib.push( (child_index >>  8) & 0xff );
    ib.push( child_index & 0xff );

    var use_private = (child_index & 0x80000000) != 0;
    var ecparams = sec.getSECCurveByName("secp256k1");

    if (use_private && (!this.has_private_key || (this.version != MAINNET_PRIVATE && this.version != TESTNET_PRIVATE)) ) {
        throw new Error("Cannot do private key derivation without private key");
    }

    var ret = null;
    if( this.has_private_key ) {
        // Private-key derivation is the same whether we have private key or not.
        var data = null;

        if( use_private ) {
            data = [0].concat(this.eckey.priv.toByteArrayUnsigned()).concat(ib);
        } else {
            data = this.eckey.getPub().concat(ib);
        }

        var j = new jsSHA(Crypto.util.bytesToHex(data), 'HEX');
        var hash = j.getHMAC(Crypto.util.bytesToHex(this.chain_code), "HEX", "SHA-512", "HEX");
        var il = new BigInteger(hash.slice(0, 64), 16);
        var ir = Crypto.util.hexToBytes(hash.slice(64, 128));

        // ki = IL + kpar (mod n).
        var curve = ecparams.getCurve();
        var k = il.add(this.eckey.priv).mod(ecparams.getN());

        ret = new BIP32();
        ret.chain_code = ir;
        ret.eckey = new ECKey(k.toByteArrayUnsigned());
        ret.has_private_key = true;

    } else {
        // Public-key derivation is the same whether we have private key or not.
        var data = this.eckey.getPub().concat(ib);
        var j = new jsSHA(Crypto.util.bytesToHex(data), 'HEX');
        var hash = j.getHMAC(Crypto.util.bytesToHex(this.chain_code), "HEX", "SHA-512", "HEX");
        var il = new BigInteger(hash.slice(0, 64), 16);
        var ir = Crypto.util.hexToBytes(hash.slice(64, 128));

        // Ki = (IL + kpar)*G = IL*G + Kpar
        var k = ecparams.getG().multiply(il).add(this.eckey.getPubPoint());

        ret = new BIP32();
        ret.chain_code = ir;
        ret.eckey = new ECKey("0");
        ret.eckey.setPub(k.getEncoded(true));
        ret.has_private_key = false;
    }

    ret.child_index = child_index;
    ret.parent_fingerprint = this.eckey.getPubKeyHash().slice(0,4);
    ret.version = this.version;
    ret.depth   = this.depth + 1;

    ret.eckey.setCompressed(true);

    ret.build_extended_public_key();
    ret.build_extended_private_key();

    return ret;
}

module.exports = BIP32;
