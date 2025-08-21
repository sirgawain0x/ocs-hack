import { NextRequest, NextResponse } from 'next/server';
import { SpotifyAPI } from '@/lib/apis/spotify';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const tracks = await SpotifyAPI.searchTracks(query, limit);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks from Spotify' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackIds } = body;

    if (!trackIds || !Array.isArray(trackIds)) {
      return NextResponse.json(
        { error: 'trackIds array is required' },
        { status: 400 }
      );
    }

    const tracks = await SpotifyAPI.getMultipleTracks(trackIds);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks from Spotify' },
      { status: 500 }
    );
  }
}