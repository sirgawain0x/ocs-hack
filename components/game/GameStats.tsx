'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, Clock, CheckCircle } from 'lucide-react';

interface GameStatsProps {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  totalScore: number;
  maxScore: number;
  className?: string;
}

export default function GameStats({
  totalQuestions,
  correctAnswers,
  accuracy,
  averageTime,
  totalScore,
  maxScore,
  className = '',
}: GameStatsProps) {
  return (
    <Card className={`bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 ${className}`}>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{totalScore}</div>
            <div className="text-sm text-gray-600">Score</div>
            <div className="text-xs text-gray-500">{maxScore} max</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{correctAnswers}</div>
            <div className="text-sm text-gray-600">Correct</div>
            <div className="text-xs text-gray-500">of {totalQuestions}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{averageTime.toFixed(1)}s</div>
            <div className="text-sm text-gray-600">Avg Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}