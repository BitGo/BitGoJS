import * as assert from 'assert';
import { constructPsbt, getDefaultWalletKeys, Input as InputType, Output as OutputType } from '../../../src/testutil';
import { ecc, bip32, networks } from '../../../src';
import * as desc from '@saravanan7mani/descriptors';
import {
  assertDescriptor,
  assertDifferenceForInternalExternal,
  expandDescriptor,
  parsePsbtWithDescriptor,
} from '../../../src/bitgo/Descriptor/Descriptor';
import { Psbt } from 'bitcoinjs-lib/src/psbt';

const { Output } = desc.DescriptorsFactory(ecc);
const rootWalletKeys = getDefaultWalletKeys();
const network = networks.bitcoin;

/**
 * Compressed public key:
 * 3eda9319
 * xprv9s21ZrQH143K3FD3eBfcR6mo5tvB2fBseMXdif66RShc6fMuAhPFpraTc3Qwirq44wk6vPvGfnDSm5Yz4cXCu9XWbad47qN2bsQ9ne6k8gC
 * xpub661MyMwAqRbcFjHWkDCcnEiXdvkfS7uj1aTEX3VhynEayTh3iEhWNetwTM2U4W9Z67nBi1JxmZ1rVsQBTAUFy3vDccxMapX7XJGNyQtHyzK
 * 03fda0d184f78dcdb33123129818495b39e1f5ebca259552e9283b7a5d3692dd6d
 *
 * Uncompressed public key:
 * 64e38a2a
 * xprv9s21ZrQH143K4bXszGVBuPpuvxAqSvxrCKZXc9jZsCVs2rDjhjKFrTiXBvFtHEj6T511TVuGRPdFFBAEayPMtRQgMCuDAPV4xWSyvTrHo9w
 * xpub661MyMwAqRbcH5cM6J2CGXmeUz1KrPghZYV8QY9BRY2queYtFGdWQG313CVsomM8AHwvgpkeFTFeXH9KiU5uDiM9jdjg8cDx8wiycLk22j2
 * 044006e1a19e5a5479148c50a7f78ac0eadffbd16602def76dd2b5b8d723c9e7a5def45e0317c73cb93c69dbf447cabd1ed4a882359846e35e2e983dd14263dc83
 *
 * Public key with key origin:
 * 30590470
 * xprv9s21ZrQH143K3m5RPG2eA1WdsSvnLjtDuAa4KxEsgXMXj2vc8RsyaYvwwYDtbzDDrr9oR8hioYky8n9SxgSNgsoWYwsRX2ZggeRdSTVDa9A
 * xpub661MyMwAqRbcGF9tVHZeX9TNRUmGkCc5GPVf8LeVErtWbqFkfyCE8MFRnpbkJStrP1PeEJfdzjc1jhcoGzwg5gMENKQpnzno3mYLu5o1d15
 * [30590470/m/0h/0h/0h]02830ef084e9783008acba8fe02fa6c3dc191749d6eb4b66d7b7fa87201c709a92
 *
 * Public key with key origin (mixed hardened indicator):
 * b5e0a030
 * xprv9s21ZrQH143K2th5ySt1QFRrs1jNUPrsDAciuv36B7EMMwZhXsJMhuKLs83dWec817t4SMgBb9bT7tQZ8nLSWMrFwrBgr3jZR6UzQZ9b43Z
 * xpub661MyMwAqRbcFNmZ5UR1mPNbR3ZrsraiaPYKiJShjSmLEjtr5QccFhdpiRkHxmUvdW4ZDVQ3XPBeHi9rbTAHsBEysAycVwYAUwFdjQhCJuN
 * [b5e0a030/m/0'/0h/0']038dd3f649c0e09b20614551368ea8ecf8fc1f6eb1364d2efed35b5cf0ebb6ef64
 *
 * WIF uncompressed private key:
 * 247b3c83
 * xprv9s21ZrQH143K4XmyUNxN4FgG3FZ1yvD8PtpvYfY2MNGJ2CBwndW2uM3NUXphZdF8RonZvYGEr42u7yQBJhZJLjKey75CBoyacpthcqBNHvt
 * xpub661MyMwAqRbcH1rSaQVNRPczbHPWPNvym7kXM3wduhoGtzX6LApHT9MrKpphdSLmso9Uax3zSJULyPP4rbN8RzaYCtWmaAJJnEhSzFzbayS
 * 5K9uth3PGkwuohubYn3e2nYGNMqdgzbghpnwskpjVREkYhgpMfJ
 *
 * WIF compressed private key:
 * 9154f328
 * xprv9s21ZrQH143K2jWMnbz1sZB215RbDyhNXfZrxTfJQFLKv6Q62hNnEuvANhhwSgYkNaBfku1gqwug1zv8AuzxtMReKavWFD4JFHfJks5Ugqz
 * xpub661MyMwAqRbcFDaptdX2Eh7kZ7G5dSRDttVTkr4uxasJntjEaEh2niEeDzCqnXkdRRfVYhUYGzab5UWzEd3Sg7qGnmvhajZSHRmMTeduKUv
 * KySUEd6c3VTxhYHgXEqHLMxbHNa3pJLJD3keAuqPRqJf8bH8qBpn
 *
 * Extended public key:
 * 1226afc5
 * xprv9s21ZrQH143K4Sh3uaHCp5oyK3UzEzXujCZuDM371shiopZtMn32fchsK3MCK6jjTTsDmeDxLqAguZ6gk8C5TCQkKnDHMwHs9p76c7pVcHp
 * xpub661MyMwAqRbcGvmX1bpDBDkhs5KUeTFm6RVW1jSiaDEhgcu2uKMHDR2MAJT52X2kL1Hz8dTS2ysGbFzD8g5ucAJ9LLdeNwU7nQFFiiT8HGu
 *
 * Extended public key with key origin:
 * e53b5e7b
 * xprv9s21ZrQH143K2W8qPRLUpTxNWCsMkrceMvrabYaEkC6zTJJXU1Sbr3cf5J7w2EdR2SsKMm8YigdwTNaTEcrqBuXn8n93jNb54P5KdBmcK7A
 * xpub661MyMwAqRbcEzDJVSsVBbu74EhrAKLVj9nBPvyrJXdyL6dg1YkrPqw8vZ4xsQAfi8TFTSLfN6mqu4FbhSscEuhzzPnmaJPebeX8EemJbQf
 * xprv9yGdxVkDaZtVgHKe4ytm91ErMPmQ2Z2Y48FfPoaoup5kkYQRVNuRYgWNwX7K5yBRSn5PFLNBwnWQvbKDpiz4Q6dvQ8xHA7WLe564Arg3kSV
 * [e53b5e7b/0h/1h/2h]xpub6CFzN1H7QwSntmQ7B1RmW9BauRbtS1kPRMBGCBzRU9cjdLja2vDg6Uprno22FtDpBGaxXWvQFZCZtWX3x56ioNJkxgHNq6HWzpNb5WKxcy7
 *
 * Extended public key with derivation:
 * f1bef795
 * xprv9s21ZrQH143K4LAzfCZCjBpiKhMAu5Lp5YUp7rGKVTXkxPbeaoa8WeCZhbrJffSCEetttwbTPuAL5D5zVjyvKpBVQauVEeaHBBepVgxVbTD
 * xpub661MyMwAqRbcGpFTmE6D6KmSsjBfJY4fSmQQvEfw3o4jqBvo8LtP4SX3Ytd7sPzixeGgAUpp1ARFdY8cmqPnA3diq9SVEEyMyGeEiGmocsH
 * xprv9zVLrcQeogxsD7qL3rxNpZTPVrfmVtP6i1AVKkr9SkRxQsrqitUN4w4d4QkN5cCFaMY4SmoYDk2zWeZWibCVM2ZDC8YZYEacUzixC6ojXj8
 * [f1bef795/0h/1h/2h]xpub6DUhG7wYe4XARbuo9tVPBhQ83tWFuM6x5E6689Fm15xwHgBzGRnccjP6uerqv8dDPKDX5uPDEJHdbwwFQgL8nr2UJ8JGXXpBmWxjLUm8bor/3/4/5
 *
 * Extended public key with derivation and children:
 * ea0648e9
 * xprv9s21ZrQH143K3enH5MmHQwpcAGX5UTdEX11mxDnKWwkQRCLLtcoWvsGjLiS5xgKYJXEyP1Zua3jgJH2tZNEtKirzdSrQDTgXoSELB2L3xmZ
 * xpub661MyMwAqRbcG8rkBPJHn5mLiJMZsvM5tDwNkcBw5HHPHzfVSA7mUfbDBxreW78v4XAkv2LMR3Uy3EDSEyZUghkULzW2x2XtCJXX58sqozc
 * xprv9z4SCcrCwbELH6Up7wXR2yjmbutLs65PsEhdNF2ditoe7okCH3nsg99ZuvrCaEmhtqA4XVA3teDwoHWtNzYQHTAthecTSrG7jpZi4XQiUz5
 * [ea0648e9/0h/1h/2h]xpub6D3nc8P6mxndVaZHDy4RQ7gW9wiqGYoFETdEAdSFHELczc5Lpb78DwU3mEN6QaeTCupScKDXxdmn8TY9A5agm9XEVSVyzYQJTwgPTek1kHz/3/4/5/*
 *
 * Extended public key with hardened derivation and unhardened children:
 *
 *
 *
 */

describe('Descriptors', function () {
  it(`dummy`, function () {
    // assertDescriptorPlaceholders(['$10', '$0'], '$');
    // const a = bip32.fromSeed(crypto.randomBytes(32));
    // console.log(a.fingerprint.toString('hex'));
    // console.log(a.toBase58());
    // console.log(a.neutered().toBase58());
    // console.log(a.derivePath("m/0'/1'/2'").toBase58());
    // console.log(a.derivePath("m/0'/1'/2'").neutered().toBase58());
  });
  it(`success`, function () {
    // const descriptor =
    //   "wsh(andor(pk([73d83c6f/48'/1'/0'/2']tpubDEyGjD5PkjZf6rQiKWKqRi8wD8yvA43aurE8mwjE5yxjX3AJWyu7xnm94BcoxxirQKAd9AExoz7oqLiHAQL2tVC78r452bLedHyvE1GRzW8/*),older(10000),thresh(3,pk([0d78119c/48'/1'/0'/2']tpubDExqoVD2WKmN5YFBNQQZV9SU3ajPr4CLa1JBmLkNyCUv5nPDJxxAn6oqXKTUtaQxtRXrhPaGELi8hP1a5Rpjs7bNdqnfKMvVxebTtpmFtd6/*),s:pk([8f8c7811/48'/1'/0'/2']tpubDErfvxUCfe4Yd7vURSL69zSA2VtweQHvgmZAzQHNXwoY4UTcCq5F9qWfgGXtfDS3e6HZySbT8XXjmbGWkcyngqSsEBv4mYAazmETx3QfP9f/*),s:pk([a592f770/48'/1'/0'/2']tpubDE6Xb7UALq4fnjL39g6DUaf3z8MN8SeTzBMDFEhzyjYDVyn4oqY8A4K3qCUAnTCbsv8qheZK3EPNsrkE7sDnAzNcj2bXq5Rt22UESJ5wSCx/*),s:pk([4ef7afff/48'/1'/0'/2']tpubDFf5zVvuuzU285RfaHEsnsizhcgfW5Wyk6vQezW3BG1RBJXXAWdHSRzzesGfH9kQjeXgWNvFJJjZHxHPMk8xeqBj89WuuiwrfJKiVCKNMyH/*),s:pk([0d8a8cb4/48'/1'/0'/2']tpubDFQBGM1DQZyD6bWBgtgU8UQtzJvVxEmtuVfSg3cYf1R2tU6GnU4ZVUoUQ37SHGrhJyGtrZ5XG5y1Bz9ydn3yUYUkQRkvnQqq4KCcr7oaYLq/*),sln:after(840000))))";
    // const descriptor = `wsh(andor(pk(03fda0d184f78dcdb33123129818495b39e1f5ebca259552e9283b7a5d3692dd6d),older(10000),thresh(3,pk([b5e0a030/0'/0'/0']038dd3f649c0e09b20614551368ea8ecf8fc1f6eb1364d2efed35b5cf0ebb6ef64),s:pk(xpub661MyMwAqRbcGvmX1bpDBDkhs5KUeTFm6RVW1jSiaDEhgcu2uKMHDR2MAJT52X2kL1Hz8dTS2ysGbFzD8g5ucAJ9LLdeNwU7nQFFiiT8HGu),s:pk([e53b5e7b/0'/1'/2']xpub6CFzN1H7QwSntmQ7B1RmW9BauRbtS1kPRMBGCBzRU9cjdLja2vDg6Uprno22FtDpBGaxXWvQFZCZtWX3x56ioNJkxgHNq6HWzpNb5WKxcy7),s:pk([f1bef795/0'/1'/2']xpub6DUhG7wYe4XARbuo9tVPBhQ83tWFuM6x5E6689Fm15xwHgBzGRnccjP6uerqv8dDPKDX5uPDEJHdbwwFQgL8nr2UJ8JGXXpBmWxjLUm8bor/3/4/5),s:pk([ea0648e9/0'/1'/2']xpub6D3nc8P6mxndVaZHDy4RQ7gW9wiqGYoFETdEAdSFHELczc5Lpb78DwU3mEN6QaeTCupScKDXxdmn8TY9A5agm9XEVSVyzYQJTwgPTek1kHz/3/4/5/*),sln:after(840000))))`;

    const externalDescriptor = `wsh(and_v(v:pk([ea0648e9/0'/1'/2']xpub6D3nc8P6mxndVaZHDy4RQ7gW9wiqGYoFETdEAdSFHELczc5Lpb78DwU3mEN6QaeTCupScKDXxdmn8TY9A5agm9XEVSVyzYQJTwgPTek1kHz/3/4/5),pk([ea0648e9/0'/1'/2']xpub6D3nc8P6mxndVaZHDy4RQ7gW9wiqGYoFETdEAdSFHELczc5Lpb78DwU3mEN6QaeTCupScKDXxdmn8TY9A5agm9XEVSVyzYQJTwgPTek1kHz/3/4/5/*)))`;
    const internalDescriptor = `wsh(and_v(v:pk([ea0648e9/0'/1'/2']xpub6D3nc8P6mxndVaZHDy4RQ7gW9wiqGYoFETdEAdSFHELczc5Lpb78DwU3mEN6QaeTCupScKDXxdmn8TY9A5agm9XEVSVyzYQJTwgPTek1kHz/3/4/6),pk([ea0648e9/0'/1'/2']xpub6D3nc8P6mxndVaZHDy4RQ7gW9wiqGYoFETdEAdSFHELczc5Lpb78DwU3mEN6QaeTCupScKDXxdmn8TY9A5agm9XEVSVyzYQJTwgPTek1kHz/3/4/5/*)))`;

    assertDescriptor({
      descriptor: externalDescriptor,
      network,
      checksumRequired: false,
      allowKeyPathWithoutWildcardIndex: true,
    });

    const { expandedMiniscript } = expandDescriptor({
      descriptor: externalDescriptor,
      network,
      checksumRequired: false,
    });
    assert(expandedMiniscript);
    // const nonKeyExpanded = expandNonKeyLocks(expandedMiniscript);

    // assert(
    //   nonKeyExpanded === 'andor(pk(@0),older(#0),thresh(3,pk(@1),s:pk(@2),s:pk(@3),s:pk(@4),s:pk(@5),sln:after(#1)))'
    // );

    const outputDescs: desc.OutputInstance[] = [0, 1, 2, 3, 4].map(
      (index) => new Output({ descriptor: externalDescriptor, index, network })
    );
    const inputs: InputType[] = [{ scriptType: 'p2wsh', value: BigInt(1e9) }];
    const outputs: OutputType[] = outputDescs.map((od, i) => ({
      address: od.getAddress(),
      value: BigInt((i + 1) * 10000),
    }));
    const inputPsbt = constructPsbt(inputs, outputs, network, rootWalletKeys, 'fullsigned');
    const tx = inputPsbt.finalizeAllInputs().extractTransaction();
    const txHex = tx.toHex();

    const psbt = new Psbt({ network });
    outputDescs.forEach((od, i) => od.updatePsbtAsInput({ psbt, txHex, vout: i }));
    new Output({
      descriptor: `addr(bc1q8qy6wmh5urjam6qdual8v6yud6w4kazlm2a8ur)`,
      network,
    }).updatePsbtAsOutput({ psbt, value: BigInt(10000) });

    const hd = bip32.fromBase58(
      'xprv9s21ZrQH143K3enH5MmHQwpcAGX5UTdEX11mxDnKWwkQRCLLtcoWvsGjLiS5xgKYJXEyP1Zua3jgJH2tZNEtKirzdSrQDTgXoSELB2L3xmZ'
    );
    psbt.signAllInputsHD(hd);

    parsePsbtWithDescriptor({
      psbt,
      descriptors: [internalDescriptor, externalDescriptor],
      network,
    });
    assertDifferenceForInternalExternal({ descriptorA: internalDescriptor, descriptorB: externalDescriptor, network });
    // console.log(JSON.stringify(parsed));
  });
});
