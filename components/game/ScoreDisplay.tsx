'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Zap, TrendingUp, Star } from 'lucide-react';
import { ScoringSystem } from '@/lib/game/scoring';

interface ScoreDisplayProps {
  currentScore: number;
  questionsAnswered: number;
  totalQuestions: number;
  currentStreak: number;
  bestStreak: number;
  accuracy: number;
  averageTime: number;
  className?: string;
}

export default function ScoreDisplay({
  currentScore,
  questionsAnswered,
  totalQuestions,
  currentStreak,
  bestStreak,
  accuracy,
  averageTime,
  className = '',
}: ScoreDisplayProps) {
  const progress = totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0;
  const levelInfo = ScoringSystem.getLevelFromScore(currentScore);

  const getStreakColor = (streak: number): string => {
    if (streak >= 5) return 'text-purple-600 bg-purple-100';
    if (streak >= 3) return 'text-blue-600 bg-blue-100';
    if (streak >= 1) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getAccuracyColor = (acc: number): string => {
    if (acc >= 80) return 'text-green-600';
    if (acc >= 60) return 'text-blue-600';
    if (acc >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <Card className={`bg-gradient-to-br from-white to-gray-50 shadow-lg ${className}`}>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Score */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
              <span className="text-lg font-semibold text-gray-700">Score</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {formatNumber(currentScore)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Level {levelInfo.level}: {levelInfo.title}
            </div>
          </div>

          {/* Progress */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-6 w-6 text-blue-500 mr-2" />
              <span className="text-lg font-semibold text-gray-700">Progress</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {questionsAnswered}/{totalQuestions}
            </div>
            <Progress value={progress} className="mt-2 h-2" />
            <div className="text-sm text-gray-500 mt-1">
              {Math.round(progress)}% Complete
            </div>
          </div>

          {/* Streak */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-6 w-6 text-purple-500 mr-2" />
              <span className="text-lg font-semibold text-gray-700">Streak</span>
            </div>
            <div className="flex justify-center space-x-2">
              <Badge className={`${getStreakColor(currentStreak)} px-3 py-1`}>
                Current: {currentStreak}
              </Badge>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Best: {bestStreak}
            </div>
          </div>

          {/* Accuracy */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
              <span className="text-lg font-semibold text-gray-700">Stats</span>
            </div>
            <div className={`text-2xl font-bold ${getAccuracyColor(accuracy)}`}>
              {accuracy}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Accuracy
            </div>
            <div className="text-sm text-gray-500">
              Avg: {averageTime}s
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="mt-6 flex justify-center space-x-4">
          {currentStreak >= 5 && (
            <Badge className="bg-purple-500 text-white flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>On Fire!</span>
            </Badge>
          )}
          
          {accuracy >= 90 && questionsAnswered >= 3 && (
            <Badge className="bg-green-500 text-white flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>Perfect Aim</span>
            </Badge>
          )}
          
          {averageTime <= 5 && questionsAnswered >= 3 && (
            <Badge className="bg-blue-500 text-white flex items-center space-x-1">
              <Zap className="h-4 w-4" />
              <span>Speed Demon</span>
            </Badge>
          )}

          {currentScore >= 1000 && (
            <Badge className="bg-yellow-500 text-white flex items-center space-x-1">
              <Trophy className="h-4 w-4" />
              <span>High Scorer</span>
            </Badge>
          )}
        </div>

        {/* Level Progress */}
        {levelInfo.nextLevel > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress to {levelInfo.title}</span>
              <span>{formatNumber(currentScore)} / {formatNumber(levelInfo.nextLevel)}</span>
            </div>
            <Progress 
              value={(currentScore / levelInfo.nextLevel) * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}