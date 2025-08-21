'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SpotifyAPI } from '@/lib/apis/spotify';
import { Music, User, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import type { SpotifyUser, SpotifyPlaybackState } from '@/types/spotify';

interface SpotifyAuthProps {
  onAuthSuccess?: (token: string) => void;
  onAuthError?: (error: string) => void;
  className?: string;
}

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export default function SpotifyAuth({ onAuthSuccess, onAuthError, className = '' }: SpotifyAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/spotify-callback` : '';

  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  const handleLogin = useCallback(() => {
    setIsLoading(true);
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', CLIENT_ID || '');
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('show_dialog', 'true');

    window.location.href = authUrl.toString();
  }, [CLIENT_ID, REDIRECT_URI, scopes]);

  const handleLogout = useCallback(() => {
    SpotifyAPI.setUserAccessToken('');
    setIsAuthenticated(false);
    setUser(null);
    setPlaybackState(null);
    if (player) {
      player.disconnect();
      setPlayer(null);
    }
    setDeviceId(null);
    
    // Clear URL hash
    window.location.hash = '';
  }, [player]);

  const initializePlayer = useCallback(async (token: string) => {
    if (!window.Spotify) {
      console.error('Spotify Web Playback SDK not loaded');
      return;
    }

    try {
      const player = new window.Spotify.Player({
        name: 'Music Trivia Game Player',
        getOAuthToken: cb => { cb(token); }
      });

      // Error handling
      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Failed to initialize player:', message);
        onAuthError?.(message);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
        onAuthError?.(message);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account:', message);
        onAuthError?.(message);
      });

      player.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Failed to perform playback:', message);
      });

      // Playback status updates
      player.addListener('player_state_changed', (state: SpotifyPlaybackState) => {
        setPlaybackState(state);
      });

      // Ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setDeviceId(null);
      });

      // Connect to the player
      const success = await player.connect();
      if (success) {
        setPlayer(player);
        console.log('Successfully connected to Spotify!');
      }
    } catch (error) {
      console.error('Error initializing Spotify player:', error);
      onAuthError?.(error instanceof Error ? error.message : 'Failed to initialize player');
    }
  }, [onAuthError]);

  const getUserProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData: SpotifyUser = await response.json();
        setUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  }, []);

  const handlePlaybackControl = useCallback(async (action: 'play' | 'pause' | 'next' | 'previous') => {
    if (!player || !deviceId) return;

    try {
      switch (action) {
        case 'play':
          await player.resume();
          break;
        case 'pause':
          await player.pause();
          break;
        case 'next':
          await player.nextTrack();
          break;
        case 'previous':
          await player.previousTrack();
          break;
      }
    } catch (error) {
      console.error(`Error controlling playback (${action}):`, error);
    }
  }, [player, deviceId]);

  // Check for existing token on mount
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
      SpotifyAPI.setUserAccessToken(accessToken);
      setIsAuthenticated(true);
      onAuthSuccess?.(accessToken);
      
      // Clear the hash from URL
      window.location.hash = '';
      
      // Initialize player and get user profile
      initializePlayer(accessToken);
      getUserProfile(accessToken);
    }
  }, [initializePlayer, getUserProfile, onAuthSuccess]);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('Spotify Web Playback SDK ready');
      };
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <Card className={`max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <Music className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl font-bold">Connect to Spotify</CardTitle>
          <p className="text-gray-600 text-sm">
            Connect your Spotify account to play music clips and control playback during the game.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            {isLoading ? 'Connecting...' : 'Connect Spotify Account'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`max-w-md mx-auto ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Spotify Connected</CardTitle>
              {user && (
                <p className="text-sm text-gray-600">@{user.display_name}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Connected
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Track Info */}
        {playbackState?.item && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              {playbackState.item.album.images[0] && (
                <img
                  src={playbackState.item.album.images[0].url}
                  alt="Album cover"
                  className="w-12 h-12 rounded-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{playbackState.item.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {playbackState.item.artists.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        {deviceId && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePlaybackControl('previous')}
              disabled={!playbackState}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePlaybackControl(playbackState?.is_playing ? 'pause' : 'play')}
              disabled={!playbackState}
            >
              {playbackState?.is_playing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePlaybackControl('next')}
              disabled={!playbackState}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Disconnect Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
        >
          Disconnect Spotify
        </Button>
      </CardContent>
    </Card>
  );
}
