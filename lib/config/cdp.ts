// CDP Configuration (client-side)
export const CDP_CONFIG = {
  // TriviaBattle Contract Configuration
  CONTRACT_ADDRESS: "0xd8183AA7cf350a1c4E1a247C12b4C5315BEa9D7A",
  NETWORK: "base-mainnet",
  CONTRACT_NAME: "TriviaBattle",
  PROTOCOL_NAME: "public"
} as const;

// Client-side validation (always returns true since server handles the actual validation)
export const validateCDPConfig = (): boolean => {
  // Server-side validation happens in the API route
  // Client-side we assume it's available
  return true;
};
