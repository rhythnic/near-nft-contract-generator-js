export interface TypesConfig {
  token: {
    base: string;
    replacements: Record<string, string>;
  };
  jsonToken: {
    base: string;
    extensions: Record<string, string>;
  };
  contractMetadata: {
    type: string;
  };
  tokenMetadata: {
    type: string;
  };
}

export const typesConfig: Record<string, Partial<TypesConfig>> = {
  nep171: {
    token: {
      base: "NEP171Token",
      replacements: {},
    },
    jsonToken: {
      base: "NEP171JsonToken",
      extensions: {},
    },
  },
  nep177: {
    jsonToken: {
      base: "NEP177JsonToken",
      extensions: {},
    },
    contractMetadata: {
      type: "NEP177ContractMetadata",
    },
    tokenMetadata: {
      type: "NEP177TokenMetadata",
    },
  },
  nep178: {
    token: {
      base: "NEP178Token", // NEP178Token replaces NEP171Token
      replacements: {},
    },
    jsonToken: {
      base: "NEP178JsonToken",
      extensions: {},
    },
  },
  nep181: {
    // NEP181 doesn't define new types, it adds methods to the contract
  },
  nep199: {
    token: {
      base: "NEP199Token", // NEP199Token replaces NEP178Token
      replacements: {},
    },
    jsonToken: {
      base: "NEP199JsonToken", // NEP199JsonToken replaces NEP178JsonToken
      extensions: {},
    },
  },
};

export function generateTypes(neps: string[]): string {
  // Ensure nep171 is included as it's the base standard
  if (!neps.includes("nep171")) {
    neps = ["nep171", ...neps];
  }

  // Sort NEPs to ensure consistent order (highest standard last)
  neps.sort();

  // Determine the highest token type based on the included NEPs
  let tokenType = "NEP171Token";
  for (const nep of neps) {
    const config = typesConfig[nep];
    if (config?.token?.base) {
      tokenType = config.token.base;
    }
  }

  // Generate JsonToken type by combining all relevant JsonToken types
  // Apply the rules for JsonToken inheritance:
  // 1. If any other NEP JSON token is imported, NEP171JsonToken can be omitted
  // 2. If NEP199JsonToken is imported, NEP178JsonToken can be omitted
  let jsonTokenTypes = neps
    .filter((nep) => typesConfig[nep]?.jsonToken?.base)
    .map((nep) => typesConfig[nep].jsonToken.base);

  // If we have more than just NEP171JsonToken, we can omit it
  if (jsonTokenTypes.length > 1 && jsonTokenTypes.includes("NEP171JsonToken")) {
    jsonTokenTypes = jsonTokenTypes.filter(
      (type) => type !== "NEP171JsonToken"
    );
  }

  // If NEP199JsonToken is included, we can omit NEP178JsonToken
  if (
    jsonTokenTypes.includes("NEP199JsonToken") &&
    jsonTokenTypes.includes("NEP178JsonToken")
  ) {
    jsonTokenTypes = jsonTokenTypes.filter(
      (type) => type !== "NEP178JsonToken"
    );
  }

  // Generate ContractMetadata type
  const contractMetadataType = neps.find(
    (nep) => typesConfig[nep]?.contractMetadata?.type
  )
    ? typesConfig[neps.find((nep) => typesConfig[nep]?.contractMetadata?.type)]
        .contractMetadata.type
    : null;

  // Generate TokenMetadata type
  const tokenMetadataType = neps.find(
    (nep) => typesConfig[nep]?.tokenMetadata?.type
  )
    ? typesConfig[neps.find((nep) => typesConfig[nep]?.tokenMetadata?.type)]
        .tokenMetadata.type
    : null;

  // Build the types string
  let typesStr = "";

  // Token type
  typesStr += `type Token = ${tokenType};\n`;

  // JsonToken type
  if (jsonTokenTypes.length > 1) {
    typesStr += `type JsonToken = ${jsonTokenTypes.join(" & ")};\n`;
  } else {
    typesStr += `type JsonToken = ${jsonTokenTypes[0]};\n`;
  }

  // ContractMetadata type
  if (contractMetadataType) {
    typesStr += `type ContractMetadata = ${contractMetadataType};\n`;
  }

  // TokenMetadata type
  if (tokenMetadataType) {
    typesStr += `type TokenMetadata = ${tokenMetadataType};\n`;
  }

  return typesStr;
}
