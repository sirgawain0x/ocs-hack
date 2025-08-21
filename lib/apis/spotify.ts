import type { SpotifyTrack, SpotifySearchResponse, SpotifyAuthResponse } from '@/types/spotify';

export class SpotifyAPI {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  static async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'accounts.spotify.com',
          path: '/api/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Use Node-safe base64 encoding for client credentials
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
          },
          body: 'grant_type=client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify access token');
      }

      const data: SpotifyAuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

      return this.accessToken;
    } catch (error) {
      console.error('Spotify auth error:', error);
      throw error;
    }
  }

  static async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      const encodedQuery = encodeURIComponent(query);
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'api.spotify.com',
          path: `/v1/search?q=${encodedQuery}&type=track&limit=${limit}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search Spotify tracks');
      }

      const data: SpotifySearchResponse = await response.json();
      return data.tracks.items.filter(track => track.preview_url !== null);
    } catch (error) {
      console.error('Spotify search error:', error);
      return [];
    }
  }

  static async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'api.spotify.com',
          path: `/v1/tracks/${trackId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify track');
      }

      const track: SpotifyTrack = await response.json();
      return track.preview_url ? track : null;
    } catch (error) {
      console.error('Spotify track error:', error);
      return null;
    }
  }

  static async getMultipleTracks(trackIds: string[]): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      const idsParam = trackIds.join(',');
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'api.spotify.com',
          path: `/v1/tracks?ids=${idsParam}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify tracks');
      }

      const data = await response.json();
      return data.tracks.filter((track: SpotifyTrack) => track && track.preview_url !== null);
    } catch (error) {
      console.error('Spotify multiple tracks error:', error);
      return [];
    }
  }
}