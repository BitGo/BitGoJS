export const prvKeys = {
  prvKey1: {
    base58: '5jtsd9SmUH5mFZL7ywNNmqmxxdXw4FQ5GJQprXmrdX4LCuUwMBivCfUX2ar8hGdnLHDGrVKkshW1Ke21vZhPiLyr',
    uint8Array: new Uint8Array([
      237, 14, 247, 66, 157, 192, 51, 38, 195, 13, 42, 77, 45, 233, 52, 72, 234, 225, 160, 174, 127, 74, 31, 90, 101,
      33, 127, 139, 237, 147, 51, 128, 169, 24, 27, 82, 247, 237, 144, 234, 235, 13, 173, 75, 113, 190, 180, 83, 131,
      97, 103, 97, 49, 113, 126, 147, 9, 88, 16, 95, 183, 163, 137, 213,
    ]),
  },
  invalidPrvKeys: [
    'randomstring',
    '5jtsd9SmUH5mFZL7ywNaaaaaxdXw4FQ5GJQprXmrdX4LCuUwMBivCfUX2ar8hGdnLHDGrVKkshW1Ke21vZhPiLyr',
    '5jtsd9SmUH5mFZL7ywNNmqmxxdXw4FQ5GJQprXmrdX4LCuUwMBivCfUX2ar8hGdnLHDGr===hW1Ke21vZhPiLyr',
    new Uint8Array([
      237, 14, 247, 66, 157, 192, 51, 38, 195, 13, 42, 77, 45, 233, 52, 72, 234, 225, 160, 174, 127, 74, 31, 90, 101,
      33, 127, 139, 237, 147, 51, 128, 169, 24, 27, 82, 247, 237, 144, 234, 235, 13, 173, 75, 113, 190, 180, 83, 131,
    ]),
  ],
};

export const pubKeys = {
  validPubKeys: [
    'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
    '7Uxci7Cyi3M6utvAFP6uhzkH3yMzhfqshA4Uu4hqBfy8',
    'C5z8gWxer3Drwv98gRCYj7hUMJcTQCLuLQkgciy1PmzL',
  ],
  invalidPubKeys: [
    'randomstring',
    'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S12AF1',
    'CP5Dpaa42R11111KqCQsLwma5Yh3knuvKsYDFX85F41S',
    'CP5Dpaa42RtJmMuKqCQsLwma==h3knuvKsYDFX85F41S',
  ],
};

export const addresses = {
  validAddresses: [
    'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H',
    'Azz9EmNuhtjoYrhWvidWx1Hfd14SNBsYyzXhA9Tnoca8',
    '2n2xqWM9Z18LqxfJzkNrMMFWiDUFYA2k6WSgSnf6EnJs',
  ],
  invalidAddresses: [
    'randomstring',
    'aesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H',
    'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H1',
    'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P==',
  ],
};

export const blockHashes = {
  validBlockHashes: [
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
    '7afHRHcVbCKd1tbJHrXkDf7PtpNE8dDoP5qPoxPk6v4H',
    'A6GGkqcorKi2oSac7tAEduNUgQKR9tQP11gpmGoGoEU1',
  ],
  invalidBlockHashes: [
    'randomstring',
    'DesU7XscZjng8yj5VX6AZsk3hWSW4sQ3rTG2LuyQ2P4H1',
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZP==qen',
  ],
};

export const signatures = {
  validSignatures: [
    'NfcCZq7rrxx8SN23w31Wtd53Bhw5qm6E4GaXfw1sxBEnV3J9MRdHRzwgDEEjTC5WCurvW84bkyDcpCGgGjkhi9A',
    '2SMMaKhXE6PkzyKi8pBDPHKs5FkFuPSC3kfYE4Zt2e62wTop12qMu41E7R4pL9iVVfuCyNufSw9Zwjj383qfQFEY',
    '5AePNqh3WbHJhXKAdzhvsV1Yvxa5NH5hGChiZheLPShnNgHEizysio4812r7GDURHp1GNm4kBFLacnbpp4fhSBAj',
  ],
  invalidSignatures: [
    'randomstring',
    '5AePNqh3WbHJhXKAdzhvsV1Yvxa5NH5hGChiZheLPShnNgHEizysio4812r7GDURHp1GNm4k==Lacnbpp4fhSBAj',
    'NfcCZq7rrxx8SN23w31Wtd53Bhw5qm6E4GaXfw1sxBEnV3J9MRdHRzwgDEEjaaaaW84bkyDcpCGgGjkhi9A',
  ],
};
