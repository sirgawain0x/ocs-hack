'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
}

export default function AudioPlayer({ 
  audioUrl, 
  autoPlay = false, 
  onEnded, 
  className = '' 
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = (): void => setCurrentTime(audio.currentTime);
    const handleDurationChange = (): void => setDuration(audio.duration);
    const handleEnded = (): void => {
      setIsPlaying(false);
      onEnded?.();
    };
    const tryAutoplay = async (): Promise<void> => {
      try {
        await audio.play();
        setIsPlaying(true);
        setAutoplayBlocked(false);
      } catch (err) {
        setAutoplayBlocked(true);
        // Fallback: wait for first user gesture to start playback
        const resumeOnGesture = async () => {
          try {
            await audio.play();
            setIsPlaying(true);
            setAutoplayBlocked(false);
          } catch {}
        };
        const onceOpts: AddEventListenerOptions | boolean = { once: true } as AddEventListenerOptions;
        window.addEventListener('pointerdown', resumeOnGesture, onceOpts);
        window.addEventListener('touchstart', resumeOnGesture, onceOpts);
      }
    };

    const handleLoadedData = (): void => {
      if (autoPlay) {
        void tryAutoplay();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [audioUrl, autoPlay, onEnded]);

  const togglePlayPause = (): void => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          setAutoplayBlocked(true);
        });
    }
  };

  const toggleMute = (): void => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (_newVolume: number[]): void => {
    const audio = audioRef.current;
    const volumeValue = _newVolume[0]! / 100;
    
    if (audio) {
      audio.volume = volumeValue;
    }
    setVolume(volumeValue);
    
    if (volumeValue === 0 && !isMuted) {
      setIsMuted(true);
    } else if (volumeValue > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleSeek = (_newValue: number[]): void => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;
    const percentage = _newValue[0]! / 100;
    const newTime = percentage * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-white rounded-lg p-4 shadow-lg border ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
      />
      
      <div className="flex items-center space-x-4">
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayPause}
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>

        {/* Progress Bar + Seek */}
        <div className="flex-1">
          <Slider
            value={[progressPercentage]}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          {autoplayBlocked && (
            <div className="text-xs text-orange-600 mt-1">Tap play to start audio</div>
          )}
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2 w-40">
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="icon"
            className="w-8 h-8"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[Math.round(volume * 100)]}
            onValueChange={handleVolumeChange}
            className="w-full"
          />
        </div>
      </div>

      {/* Waveform Visual (Simulated) */}
      <div className="mt-3 h-8 flex items-end justify-center space-x-1">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className={`w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm transition-all duration-75 ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{
              height: `${Math.random() * 100 + 10}%`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}