import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { spacetimeClient } from '@/lib/apis/spacetime';
import { verifyEntryToken } from '@/lib/utils/jwt';
import { TRIVIA_ABI, TRIVIA_CONTRACT_ADDRESS } from '@/lib/blockchain/contracts';

/** Paid games only. Trial / practice scores must not call this route (TOP EARNERS / Spacetime bestScore). */

// Max possible score: 30 questions × 100 points each
const MAX_GAME_SCORE = 3000;

const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, finalScore, username, entryToken } = body;

    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.trim() === '') {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    if (typeof finalScore !== 'number' || finalScore < 0 || !Number.isFinite(finalScore)) {
      return NextResponse.json(
        { error: 'finalScore must be a non-negative number' },
        { status: 400 }
      );
    }

    // Reject scores that exceed the theoretical maximum
    if (finalScore > MAX_GAME_SCORE) {
      return NextResponse.json(
        { error: `finalScore exceeds maximum possible (${MAX_GAME_SCORE})` },
        { status: 400 }
      );
    }

    // Verify entry token if provided — ensures the player actually joined a paid game
    if (entryToken) {
      const payload = verifyEntryToken(entryToken);
      if (!payload || payload.playerType !== 'paid') {
        return NextResponse.json(
          { error: 'Invalid or non-paid entry token' },
          { status: 401 }
        );
      }
      // Verify the wallet address matches the token identity
      if (payload.identity.walletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json(
          { error: 'Wallet address does not match entry token' },
          { status: 403 }
        );
      }
    }

    await spacetimeClient.initialize();

    if (!spacetimeClient.isConfigured()) {
      return NextResponse.json(
        { error: 'SpacetimeDB not configured' },
        { status: 503 }
      );
    }

    const current = spacetimeClient.getPlayerProfile(walletAddress);

    if (!current) {
      await spacetimeClient.createPlayer(walletAddress, username);
    }

    const existing = spacetimeClient.getPlayerProfile(walletAddress);
    const totalScore = (existing?.totalScore ?? 0) + finalScore;
    const gamesPlayed = (existing?.gamesPlayed ?? 0) + 1;
    const bestScore = Math.max(existing?.bestScore ?? 0, finalScore);
    const totalEarnings = existing?.totalEarnings ?? 0;

    await spacetimeClient.updatePlayerStats(
      walletAddress,
      totalScore,
      gamesPlayed,
      bestScore,
      totalEarnings
    );

    // Submit score on-chain so CRE distribution sees real scores.
    // This is fire-and-forget — SpacetimeDB is the source of truth for
    // the leaderboard; on-chain scores are only needed for prize distribution.
    let onChainTxHash: string | null = null;
    const ownerKey = process.env.CONTRACT_OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (ownerKey) {
      try {
        const publicClient = createPublicClient({ chain: base, transport: http(BASE_RPC) });

        // Only submit if the session is active on-chain (scores can only be set during active sessions)
        const isActive = await publicClient.readContract({
          address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
          abi: TRIVIA_ABI,
          functionName: 'isSessionActive',
        });

        if (isActive) {
          const account = privateKeyToAccount(ownerKey as `0x${string}`);
          const walletClient = createWalletClient({ account, chain: base, transport: http(BASE_RPC) });

          onChainTxHash = await walletClient.writeContract({
            address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
            abi: TRIVIA_ABI,
            functionName: 'submitScores',
            args: [[walletAddress as `0x${string}`], [BigInt(bestScore)]],
          });
        }
      } catch (onChainError) {
        // Log but don't fail — SpacetimeDB save already succeeded
        console.error('Warning: on-chain score submission failed (non-fatal):', onChainError);
      }
    }

    return NextResponse.json({ success: true, onChainTxHash });
  } catch (error) {
    console.error('Error saving paid score:', error);
    return NextResponse.json(
      {
        error: 'Failed to save score',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
