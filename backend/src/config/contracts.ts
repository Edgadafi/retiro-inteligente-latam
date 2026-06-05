export const CONTRACTS = {
  arbitrumSepolia: {
    chainId: 421614,
    mxnb: {
      proxy: "0x82B9e52b26A2954E113F94Ff26647754d5a4247D" as const,
      implementation: "0xb56E3E3769EfB85214Cb4fA42eBA198E9FDA92bf" as const,
      decimals: 6,
    },
  },
  arbitrumOne: {
    chainId: 42161,
    mxnb: {
      proxy: "0xF197FFC28c23E0309B5559e7a166f2c6164C80aA" as const,
      decimals: 6,
    },
    cetes: {
      address: "0x834df4c1d8f51be24322e39e4766697be015512f" as const,
      decimals: 6,
    },
  },
} as const;

export const ANNUAL_CETES_YIELD = 0.11;
export const ANNUAL_AFORE_YIELD = 0.0784;
export const DAILY_SPENDING_LIMIT_MXNB = 500;
