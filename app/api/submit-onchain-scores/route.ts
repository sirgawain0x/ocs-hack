import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, encodeFunctionData, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { checkAdminAuth } from '@/lib/utils/adminAuthMiddleware';
import { spacetimeClient } from '@/lib/apis/spacetime';
import { TRIVIA_ABI, TRIVIA_CONTRACT_ADDRESS } from '@/lib/blockchain/contracts';

/**
 * POST /api/submit-onchain-scores
 *
 * Admin-protected endpoint that syncs player scores from SpacetimeDB to on-chain.
 * Must be called before Chainlink CRE distributes prizes so that _findTopPlayers()
 * sees real scores instead of all-zero defaults.
 *
 * Requires:
 *   - Authorization: Bearer <ADMIN_API_SECRET>
 *   - CONTRACT_OWNER_PRIVATE_KEY env var (or PRIVATE_KEY fallback)
 */

const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

export async function POST(req: NextRequest) {
  // Admin auth
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  const ownerKey = process.env.CONTRACT_OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!ownerKey) {
    return NextResponse.json(
      { error: 'CONTRACT_OWNER_PRIVATE_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    // 1. Read current on-chain players
    const publicClient = createPublicClient({ chain: base, transport: http(BASE_RPC) });

    const players = (await publicClient.readContract({
      address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
      abi: TRIVIA_ABI,
      functionName: 'getCurrentPlayers',
    })) as `0x${string}`[];

    if (players.length === 0) {
      return NextResponse.json({ success: true, message: 'No players in current session', submitted: 0 });
    }

    // 2. Look up each player's bestScore from SpacetimeDB
    await spacetimeClient.initialize();

    const addresses: `0x${string}`[] = [];
    const scores: bigint[] = [];

    for (const addr of players) {
      const profile = spacetimeClient.getPlayerProfile(addr);
      const score = profile ? BigInt(profile.bestScore) : BigInt(0);
      addresses.push(addr);
      scores.push(score);
    }

    // 3. Submit scores on-chain as the contract owner
    const account = privateKeyToAccount(ownerKey as `0x${string}`);
    const walletClient = createWalletClient({ account, chain: base, transport: http(BASE_RPC) });

    const txHash: Hash = await walletClient.writeContract({
      address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
      abi: TRIVIA_ABI,
      functionName: 'submitScores',
      args: [addresses, scores],
    });

    // 4. Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });

    return NextResponse.json({
      success: receipt.status === 'success',
      txHash,
      blockNumber: Number(receipt.blockNumber),
      submitted: addresses.length,
      scores: addresses.map((a, i) => ({ address: a, score: Number(scores[i]) })),
    });
  } catch (error) {
    console.error('Error submitting on-chain scores:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit on-chain scores',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
