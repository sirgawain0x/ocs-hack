import type { Hex } from 'viem';

// Base Builder Code: bc_5l04cy7v
// ERC-8021 data suffix for transaction attribution
// Format: <builder_code_hex><8021_marker>
// - Builder code "bc_5l04cy7v" as ASCII hex: 62635f356c303463793776
// - ERC-8021 marker (repeated): 80218021802180218021802180218021
export const BUILDER_CODE_DATA_SUFFIX: Hex =
  '0x62635f356c30346379377680218021802180218021802180218021';

/**
 * Appends the ERC-8021 builder code suffix to transaction calldata.
 * The suffix is ignored by the EVM and read by offchain indexers.
 */
export function appendBuilderCode(data: Hex | undefined): Hex {
  const calldata = data ?? '0x';
  return `${calldata}${BUILDER_CODE_DATA_SUFFIX.slice(2)}` as Hex;
}
