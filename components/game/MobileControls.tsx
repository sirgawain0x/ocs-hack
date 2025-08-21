'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, VolumeX, Volume2, RotateCcw, Home } from 'lucide-react';

interface MobileControlsProps {
  isPlaying?: boolean;
  onPlayPause?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onRestart?: () => void;
  onHome?: () => void;
  className?: string;
}

export default function MobileControls({
  isPlaying = false,
  onPlayPause,
  isMuted = false,
  onToggleMute,
  onRestart,
  onHome,
  className = '',
}: MobileControlsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between space-x-3">
          {/* Game Control Hints */}
          <div className="flex-1 text-center">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              📱 Mobile Mode
            </Badge>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Play/Pause */}
            {onPlayPause && (
              <Button
                onClick={onPlayPause}
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-purple-100 border-purple-300 hover:bg-purple-200"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-purple-700" />
                ) : (
                  <Play className="h-4 w-4 text-purple-700 ml-0.5" />
                )}
              </Button>
            )}

            {/* Volume Toggle */}
            {onToggleMute && (
              <Button
                onClick={onToggleMute}
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-blue-100 border-blue-300 hover:bg-blue-200"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-blue-700" />
                ) : (
                  <Volume2 className="h-4 w-4 text-blue-700" />
                )}
              </Button>
            )}

            {/* Restart */}
            {onRestart && (
              <Button
                onClick={onRestart}
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-green-100 border-green-300 hover:bg-green-200"
              >
                <RotateCcw className="h-4 w-4 text-green-700" />
              </Button>
            )}

            {/* Home */}
            {onHome && (
              <Button
                onClick={onHome}
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-gray-100 border-gray-300 hover:bg-gray-200"
              >
                <Home className="h-4 w-4 text-gray-700" />
              </Button>
            )}
          </div>
        </div>

        {/* Control Instructions */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 text-center space-y-1">
            <div className="flex items-center justify-center space-x-4">
              <span>🎵 Tap to select answers</span>
              <span>⏱️ Watch the timer</span>
            </div>
            <div className="text-gray-500">
              Swipe friendly • Touch optimized
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}