import type { SpotifyTrack, SpotifySearchResponse, SpotifyAuthResponse, SpotifyPlaylist, SpotifyPlaylistTrack } from '@/types/spotify';

export class SpotifyAPI {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;
  private static userAccessToken: string | null = null;

  // Client credentials flow for server-side operations
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

  // Set user access token from client-side auth
  static setUserAccessToken(token: string): void {
    this.userAccessToken = token;
  }

  // Get user access token for user-specific operations
  static getUserAccessToken(): string | null {
    return this.userAccessToken;
  }

  // Get playlist by ID
  static async getPlaylist(playlistId: string, useUserToken: boolean = false): Promise<SpotifyPlaylist | null> {
    try {
      const token = useUserToken ? this.userAccessToken : await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'api.spotify.com',
          path: `/v1/playlists/${playlistId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify playlist');
      }

      const playlist: SpotifyPlaylist = await response.json();
      return playlist;
    } catch (error) {
      console.error('Spotify playlist error:', error);
      return null;
    }
  }

  // Get playlist tracks
  static async getPlaylistTracks(playlistId: string, limit: number = 50, offset: number = 0, useUserToken: boolean = false): Promise<SpotifyPlaylistTrack[]> {
    try {
      const token = useUserToken ? this.userAccessToken : await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'api.spotify.com',
          path: `/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify playlist tracks');
      }

      const data = await response.json();
      return data.items.map((item: any) => item.track).filter((track: SpotifyTrack) => track && track.preview_url);
    } catch (error) {
      console.error('Spotify playlist tracks error:', error);
      return [];
    }
  }

  // Get Top Global playlist tracks (using the specific playlist ID)
  static async getTopGlobalTracks(limit: number = 50): Promise<SpotifyTrack[]> {
    const TOP_GLOBAL_PLAYLIST_ID = '37i9dQZEVXbNG2KDcFcKOF';
    const tracks = await this.getPlaylistTracks(TOP_GLOBAL_PLAYLIST_ID, limit);
    return tracks;
  }

  // Get user's current playback state
  static async getCurrentPlayback(): Promise<any> {
    try {
      if (!this.userAccessToken) {
        throw new Error('User access token required for playback state');
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'api.spotify.com',
          path: '/v1/me/player',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.userAccessToken}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get current playback');
      }

      return await response.json();
    } catch (error) {
      console.error('Spotify playback error:', error);
      return null;
    }
  }

  // Start playback of a track
  static async playTrack(trackUri: string): Promise<boolean> {
    try {
      if (!this.userAccessToken) {
        throw new Error('User access token required for playback control');
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'api.spotify.com',
          path: '/v1/me/player/play',
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.userAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [trackUri],
          }),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Spotify play error:', error);
      return false;
    }
  }

  // Pause playback
  static async pausePlayback(): Promise<boolean> {
    try {
      if (!this.userAccessToken) {
        throw new Error('User access token required for playback control');
      }

      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'api.spotify.com',
          path: '/v1/me/player/pause',
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.userAccessToken}`,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Spotify pause error:', error);
      return false;
    }
  }

  // Search tracks (existing method)
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

  // Get track (existing method)
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

  // Get multiple tracks (existing method)
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