import { NextRequest, NextResponse } from 'next/server';
import { SpotifyAPI } from '@/lib/apis/spotify';

export async function GET(request: NextRequest) {
  try {
    // Test Spotify API connection
    const tracks = await SpotifyAPI.getTopGlobalTracks(5);
    
    if (tracks.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No tracks found from Top Global playlist',
          message: 'Check Spotify API credentials and playlist access'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Spotify API integration working correctly',
      tracks: tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name,
        album: track.album.name,
        preview_url: track.preview_url ? 'Available' : 'Not available'
      })),
      total_tracks: tracks.length
    });

  } catch (error) {
    console.error('Spotify API test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Spotify API integration failed. Check environment variables and API credentials.'
      },
      { status: 500 }
    );
  }
}
