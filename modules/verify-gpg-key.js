const d = '{\n' +
    '  "type": "eddsaMpcV2",\n' +
    '  "signatureShares": [\n' +
    '    {\n' +
    '      "from": "user",\n' +
    '      "to": "bitgo",\n' +
    '      "share": "{\\"type\\":\\"round1Input\\",\\"data\\":{\\"msg1\\":{\\"to\\":2,\\"from\\":0,\\"encryptedMessage\\":\\"-----BEGIN PGP MESSAGE-----\\\\n\\\\nwX4DpAGXtdQXGpkSAgMEedw401QehN/PytQrwzkptA+pvQiUpFYyB8TT1Zit\\\\nc0RM61kCp37nlAWWWWBLB1ZOoyOgZ0wG9O3qJMXsSmOdxTDYnoT2PowW3jFt\\\\n0Ohpbde5R/LENMlkJ/sZn+lyPu8ub6gvBHcgW5R9tpkfp+OlnwvSwBQB91WM\\\\nW97dIka/mevVh5a0uTpR8fkx7mZGQgWrAYi+OzyGv9UVJZPDi1woxE8Fhex1\\\\nt8RakE8A4zftEMI+nNv1Fj1svv8ULZ+XNIkKxydoT8xlbWeguQb/jXqAjeGQ\\\\n2E4ezNaV6kEwgNmwc7SLx3V35LSlF6t5iYMOXQzvDrliyOMaWU6aBcAnC9VL\\\\nBWnm8gickOZMYpTMzQmhL14/+86ih41U9SXQyn8KLOXuc621BP+e438Yuggb\\\\ngeDX9w+x/qJhRVmmAzmcqiYrmDoEBVOWbm/t0Q==\\\\n=Orob\\\\n-----END PGP MESSAGE-----\\\\n\\",\\"signature\\":\\"-----BEGIN PGP SIGNATURE-----\\\\n\\\\nwnUEABMIACcFgmkCCNUJkKZIIeuPCFbBFiEElg0zdOw7eQ5QPJq2pkgh648I\\\\nVsEAAJ11AQCm2AAUfwN63HPeNOXR+ACXEPhSJPHlgnLHcuetwlWUNQD/agoz\\\\nwwNP7OtoypDexW8oxdVYKlZJP5XRNtxedqpNIKQ=\\\\n=e5ih\\\\n-----END PGP SIGNATURE-----\\\\n\\"}}}"\n' +
    '    }\n' +
    '  ],\n' +
    '  "signerGpgPublicKey": "-----BEGIN PGP PUBLIC KEY BLOCK-----\\n\\nxk8EaQII1RMFK4EEAAoCAwTAPsXx499/0flMt1skLw2VIUWRjZvDXKwl6MU8\\n5a2Qqd/wCOERjaUrQCR5SGWhLbgCPLVlzfQShUOvCKqZclUazVU2YmMwMjE1\\nMDMyYTU3M2I4OGFiMjllZGYgPHVzZXItNmJjMDIxNTAzMmE1NzNiODhhYjI5\\nZWRmQDZiYzAyMTUwMzJhNTczYjg4YWIyOWVkZi5jb20+wowEEBMIAD4FgmkC\\nCNUECwkHCAmQpkgh648IVsEDFQgKBBYAAgECGQECmwMCHgEWIQSWDTN07Dt5\\nDlA8mramSCHrjwhWwQAAt3EA/0woR6hh4LTD38thAH1xG2z8d3bWxpSFEjiR\\nHZd5wyO5AP48EjbozOmxrb22uQutuLlFjeW6s5WYX3mzbKIcGY9zYM5TBGkC\\nCNUSBSuBBAAKAgMEUEG3ozP9Mzig3nByVXuRocOT3twObmJvpECTOi/y5Oo5\\nnAJmadBBuFd5zuMYjX7gDySw9SMvRKnuvRM9txosJgMBCAfCeAQYEwgAKgWC\\naQII1QmQpkgh648IVsECmwwWIQSWDTN07Dt5DlA8mramSCHrjwhWwQAAzUkA\\n/iXuF4rnL3fdlxOobmRjSbO6+omKt5OzdqG31aOcSiRdAQCDLuxiTIIMhejv\\nRGekrxcNGeCYedviInMdSqKlZ/YTCQ==\\n=Mck+\\n-----END PGP PUBLIC KEY BLOCK-----\\n"\n' +
    '}'

    console.log(d)
const data = JSON.parse(d);
console.log(JSON.parse(data.signatureShares[0].share));