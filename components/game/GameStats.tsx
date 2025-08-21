'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor } from 'lucide-react';

interface GameStatsProps {
  fps: number;
  playerPosition?: { x: number; y: number; z: number };
  gameScore: number;
  isMobile: boolean;
  className?: string;
}

export default function GameStats({
  fps,
  playerPosition,
  gameScore,
  isMobile,
  className = '',
}: GameStatsProps) {
  return (
    <Card className={`fixed top-4 right-4 z-50 bg-gray-800 text-white border-gray-700 ${isMobile ? 'text-xs p-2' : 'text-sm p-3'} ${className}`}>
      <CardContent className="p-0 space-y-1">
        <div className="flex items-center justify-between">
          <span>FPS:</span>
          <Badge variant="outline" className={`ml-2 ${fps >= 30 ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
            {fps}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Mobile:</span>
          <div className="flex items-center ml-2">
            {isMobile ? (
              <Smartphone className="h-3 w-3 text-blue-400" />
            ) : (
              <Monitor className="h-3 w-3 text-blue-400" />
            )}
            <span className="ml-1 text-xs">{isMobile ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {playerPosition && (
          <div className="text-xs">
            <div>X: {playerPosition.x.toFixed(1)}</div>
            <div>Y: {playerPosition.y.toFixed(1)}</div>
            <div>Z: {playerPosition.z.toFixed(1)}</div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-gray-700">
          <span>Score:</span>
          <Badge className="ml-2 bg-yellow-600 text-yellow-100">
            {gameScore.toLocaleString()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}