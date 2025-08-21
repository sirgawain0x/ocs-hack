'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minimize2, Maximize2, Keyboard } from 'lucide-react';

interface GameControlsProps {
  isMobile: boolean;
  className?: string;
}

export default function GameControls({ isMobile, className = '' }: GameControlsProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [shouldAutoHide, setShouldAutoHide] = useState(true);

  useEffect(() => {
    if (!shouldAutoHide) return;

    const timer = setTimeout(() => {
      setIsMinimized(true);
    }, 5000); // Auto-hide after 5 seconds

    return () => clearTimeout(timer);
  }, [shouldAutoHide]);

  const controls = [
    { key: 'SPACE', action: 'Select Answer' },
    { key: '1-4', action: 'Quick Select' },
    { key: 'ESC', action: 'Menu' },
    { key: '↑↓', action: 'Navigate' },
  ];

  if (isMobile) {
    return (
      <Card className={`fixed top-4 left-4 z-40 bg-black/80 text-white border-gray-700 ${className}`}>
        <CardContent className="p-2">
          <div className="flex items-center space-x-2">
            <Keyboard className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium">Touch to play</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 text-white border-gray-700 transition-all duration-300 ${isMinimized ? 'w-auto' : 'w-80'} ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Keyboard className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">Controls</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsMinimized(!isMinimized);
              setShouldAutoHide(false);
            }}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            {isMinimized ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>
        </div>

        {!isMinimized && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {controls.map(({ key, action }) => (
              <div key={key} className="flex justify-between items-center">
                <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 font-mono">
                  {key}
                </kbd>
                <span className="text-gray-400">{action}</span>
              </div>
            ))}
          </div>
        )}

        {isMinimized && (
          <div className="text-xs text-gray-400">
            Click to expand
          </div>
        )}
      </CardContent>
    </Card>
  );
}