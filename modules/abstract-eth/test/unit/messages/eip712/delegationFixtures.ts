// EIP-712 typed data for WLFI delegateBySig.
// Domain values sourced from on-chain eip712Domain() call on the WLFI contract
// (0xdA5e1988097297dCdc1f90D4dFE7909e847CBeF6).
export const wlfiDelegationFixture = {
  input: {
    payload: JSON.stringify({
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Delegation: [
          { name: 'delegatee', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'expiry', type: 'uint256' },
        ],
      },
      primaryType: 'Delegation',
      domain: {
        name: 'World Liberty Financial',
        version: '2',
        chainId: 1,
        verifyingContract: '0xdA5e1988097297dCdc1f90D4dFE7909e847CBeF6',
      },
      message: {
        delegatee: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        nonce: 0,
        expiry: 1893456000,
      },
    }),
  },
  expected: {
    // Computed from TypedDataUtils against the WLFI domain + Delegation struct above
    expectedSignableHex:
      '19017844a586a62aa514206b0e72818ff6b0311fc83c3d08f7e93841ce41f305e3af2c7e43a12ac4ea2395cb5f431bc3f2e721db3dde29de35e88c89eed175615d89',
    expectedSignableBase64: 'GQF4RKWGpiqlFCBrDnKBj/awMR/IPD0I9+k4Qc5B8wXjryx+Q6EqxOojlctfQxvD8uch2z3eKd416IyJ7tF1YV2J',
  },
};
