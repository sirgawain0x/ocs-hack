'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SpotifyAPI } from '@/lib/apis/spotify';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, AlertCircle } from 'lucide-react';
import type { SpotifyTrack, SpotifyPlaybackState } from '@/types/spotify';

interface SpotifyPlayerProps {
  track?: SpotifyTrack;
  autoPlay?: boolean;
  onTrackEnd?: () => void;
  onPlaybackStateChange?: (state: SpotifyPlaybackState | null) => void;
  className?: string;
}

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export default function SpotifyPlayer({ 
  track, 
  autoPlay = false, 
  onTrackEnd, 
  onPlaybackStateChange,
  className = '' 
}: SpotifyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const initializePlayer = useCallback(async () => {
    if (!window.Spotify) {
      console.error('Spotify Web Playback SDK not loaded');
      return;
    }

    const token = SpotifyAPI.getUserAccessToken();
    if (!token) {
      setError('No Spotify access token available');
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
        setError(message);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
        setError(message);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account:', message);
        setError(message);
      });

      player.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Failed to perform playback:', message);
        setError(message);
      });

      // Playback status updates
      player.addListener('player_state_changed', (state: SpotifyPlaybackState) => {
        setPlaybackState(state);
        onPlaybackStateChange?.(state);
        
        if (state) {
          setIsPlaying(!state.is_playing);
          if (state.item) {
            setCurrentTrack(state.item);
            setDuration(state.item.duration_ms);
          }
          setProgress(state.progress_ms || 0);
        }
      });

      // Ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setError(null);
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
      setError(error instanceof Error ? error.message : 'Failed to initialize player');
    }
  }, [onPlaybackStateChange]);

  const playTrack = useCallback(async (trackUri: string) => {
    if (!player || !deviceId) {
      console.error('Player or device not ready');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Use Spotify Web API to start playback
      const success = await SpotifyAPI.playTrack(trackUri);
      if (success) {
        setIsPlaying(true);
        console.log('Started playing track:', trackUri);
      } else {
        setError('Failed to start playback');
      }
    } catch (error) {
      console.error('Error playing track:', error);
      setError(error instanceof Error ? error.message : 'Failed to play track');
    } finally {
      setIsLoading(false);
    }
  }, [player, deviceId]);

  const pausePlayback = useCallback(async () => {
    if (!player) return;

    try {
      await player.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  }, [player]);

  const resumePlayback = useCallback(async () => {
    if (!player) return;

    try {
      await player.resume();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error resuming playback:', error);
    }
  }, [player]);

  const setVolumeLevel = useCallback(async (newVolume: number) => {
    if (!player) return;

    try {
      await player.setVolume(newVolume / 100);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [player]);

  const toggleMute = useCallback(async () => {
    if (!player) return;

    try {
      if (isMuted) {
        await player.setVolume(volume / 100);
        setIsMuted(false);
      } else {
        await player.setVolume(0);
        setIsMuted(true);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  }, [player, isMuted, volume]);

  // Update progress bar
  useEffect(() => {
    if (isPlaying && duration > 0) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1000; // Update every second
          if (newProgress >= duration) {
            onTrackEnd?.();
            return 0;
          }
          return newProgress;
        });
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, duration, onTrackEnd]);

  // Initialize player on mount
  useEffect(() => {
    initializePlayer();
  }, [initializePlayer]);

  // Play track when provided
  useEffect(() => {
    if (track && track.uri && autoPlay) {
      playTrack(track.uri);
    }
  }, [track, autoPlay, playTrack]);

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

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  if (error) {
    return (
      <Card className={`max-w-md mx-auto ${className}`}>
        <CardContent className="text-center p-6">
          <div className="text-red-600 mb-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={initializePlayer} variant="outline" size="sm">
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`max-w-md mx-auto ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Spotify Player</CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {deviceId ? 'Connected' : 'Connecting...'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Track Info */}
        {currentTrack && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              {currentTrack.album.images[0] && (
                <img
                  src={currentTrack.album.images[0].url}
                  alt="Album cover"
                  className="w-12 h-12 rounded-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentTrack.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {currentTrack.artists.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {duration > 0 && (
          <div className="space-y-2">
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Previous track logic */}}
            disabled={!deviceId}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={isPlaying ? pausePlayback : resumePlayback}
            disabled={!deviceId || isLoading}
            className="w-12 h-12"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Next track logic */}}
            disabled={!deviceId}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            disabled={!deviceId}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolumeLevel(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={!deviceId}
          />
          
          <span className="text-xs text-gray-500 w-8">
            {isMuted ? 0 : volume}%
          </span>
        </div>

        {/* Play Specific Track Button */}
        {track && track.uri && (
          <Button
            onClick={() => playTrack(track.uri)}
            disabled={!deviceId || isLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            {isLoading ? 'Loading...' : `Play "${track.name}"`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
