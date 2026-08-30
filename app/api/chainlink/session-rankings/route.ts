import { NextRequest, NextResponse } from 'next/server';
import { createBasePublicClient } from '@/lib/blockchain/onChainScoreSync';
import { TRIVIA_ABI, TRIVIA_CONTRACT_ADDRESS } from '@/lib/blockchain/contracts';
import { getWeeklyScoresForPlayers } from '@/lib/game/weeklyScoresForPlayers';

/**
 * GET /api/chainlink/session-rankings[?sessionId=N]
 *
 * Returns wallet addresses and scores for an on-chain session.
 * Used by CRE weekly-prize-distribution to encode submitScores() without owner-key HTTP sync.
 *
 * CRITICAL: This response is consumed by a Chainlink DON via
 * consensusIdenticalAggregation — every DON node must receive a byte-identical
 * body. NEVER include per-request values like Date.now() here; they differ per
 * node and cause ConsensusFailed (no values meet the f+1 threshold).
 *
 * Optional ?sessionId=N targets a specific closed session instead of the live
 * one (needed when the weekly session has rolled over since the cron fired).
 */
export async function GET(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const sessionIdParam = request.nextUrl.searchParams.get('sessionId');
    const targetSessionId = sessionIdParam !== null ? Number(sessionIdParam) : undefined;

    if (sessionIdParam !== null && (!Number.isInteger(targetSessionId) || (targetSessionId ?? 0) < 1)) {
      return NextResponse.json(
        { error: 'Invalid sessionId — must be a positive integer' },
        { status: 400, headers: corsHeaders },
      );
    }

    const publicClient = createBasePublicClient();

    // When a sessionId is supplied, read that specific session's players so the
    // rankings match the session the workflow is distributing for — not the
    // live one (they diverge after weekly rollover).
    const players = targetSessionId
      ? ((await publicClient.readContract({
          address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
          abi: TRIVIA_ABI,
          functionName: 'getCurrentPlayersForSession',
          args: [BigInt(targetSessionId)],
        })) as `0x${string}`[])
      : ((await publicClient.readContract({
          address: TRIVIA_CONTRACT_ADDRESS as `0x${string}`,
          abi: TRIVIA_ABI,
          functionName: 'getCurrentPlayers',
        })) as `0x${string}`[]);

    const { sessionCounter, scores } = await getWeeklyScoresForPlayers(
      players,
      targetSessionId ? { sessionCounter: targetSessionId } : {},
    );

    const rankings = scores
      .filter((entry) => entry.score > BigInt(0))
      .sort((a, b) => (a.score > b.score ? -1 : a.score < b.score ? 1 : 0))
      .map((entry) => ({
        address: entry.address,
        score: Number(entry.score),
      }));

    // Deterministic body only — no timestamp, no random ordering.
    return NextResponse.json(
      {
        sessionCounter,
        players: rankings,
        rankings: rankings.map((entry) => entry.address),
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error('Error fetching session rankings:', error);
    // Deterministic error body too — a variable `details` message would differ
    // per DON node and break identical consensus even on failures.
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}