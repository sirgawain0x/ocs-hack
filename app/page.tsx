'use client';

import { useState, useEffect } from 'react';
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useAccount } from 'wagmi';
import { Play, RefreshCw, Trophy, Music, Sparkles, Users, Clock, Zap } from 'lucide-react';
import TriviaQuestionComponent from '@/components/game/TriviaQuestion';
import type { TriviaQuestion as TriviaQuestionType } from '@/types/game';

// Mock types and components for now
type GameState = {
  currentQuestion: number;
  questions: TriviaQuestionType[];
  answers: Answer[];
  score: number;
  timeRemaining: number;
  gameStatus: 'waiting' | 'playing' | 'completed';
  prizePool: number;
  entryFee: number;
};

type Answer = {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
  pointsEarned: number;
};

// Using shared TriviaQuestionType from '@/types/game'

type LeaderboardEntry = {
  rank: number;
  playerAddress: string;
  playerName: string;
  totalScore: number;
  gamesPlayed: number;
  averageScore: number;
  totalEarnings: number;
  lastPlayed: number;
};

// Mock components - you can replace these with actual implementations
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>;
const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`mb-4 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-xl font-bold text-white ${className}`}>{children}</h3>
);

const Button = ({ children, onClick, disabled = false, className = "", variant = "default" }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline";
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      variant === "outline" 
        ? "border border-white/50 text-white hover:bg-white/10" 
        : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
  >
    {children}
  </button>
);

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

// Mock game components (others below remain)

const ScoreDisplay = ({ currentScore, questionsAnswered, totalQuestions, currentStreak, bestStreak, accuracy, averageTime: _averageTime }: {
  currentScore: number;
  questionsAnswered: number;
  totalQuestions: number;
  currentStreak: number;
  bestStreak: number;
  accuracy: number;
  averageTime: number;
}) => (
  <Card className="text-white">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Trophy className="h-6 w-6 text-yellow-400" />
        <span>Score: {currentScore}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-purple-200">Progress</div>
          <div className="font-bold">{questionsAnswered}/{totalQuestions}</div>
        </div>
        <div>
          <div className="text-purple-200">Current Streak</div>
          <div className="font-bold">{currentStreak}</div>
        </div>
        <div>
          <div className="text-purple-200">Best Streak</div>
          <div className="font-bold">{bestStreak}</div>
        </div>
        <div>
          <div className="text-purple-200">Accuracy</div>
          <div className="font-bold">{accuracy}%</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PrizePoolCard = ({ prizePool, onJoinGame, isConnected, isLoading, timeUntilStart: _timeUntilStart }: {
  prizePool: {
    totalAmount: number;
    entryFee: number;
    participants: number;
    distribution: {
      first: number;
      second: number;
      third: number;
      participation: number;
    };
    contractAddress: string;
  };
  onJoinGame: () => void;
  isConnected: boolean;
  isLoading: boolean;
  timeUntilStart: number;
}) => (
  <Card className="text-white">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Trophy className="h-6 w-6 text-yellow-400" />
        <span>Prize Pool</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center space-y-4">
        <div className="text-3xl font-bold text-yellow-400">
          ${prizePool.totalAmount.toFixed(2)}
        </div>
        <div className="text-sm text-purple-200">
          Entry Fee: ${prizePool.entryFee.toFixed(2)}
        </div>
        <div className="text-sm text-purple-200">
          {prizePool.participants} participants
        </div>
        <Button
          onClick={onJoinGame}
          disabled={!isConnected || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Join Game</span>
            </div>
          )}
        </Button>
      </div>
    </CardContent>
  </Card>
);

const LiveRankings = ({ entries, currentPlayerAddress, refreshInterval: _refreshInterval }: {
  entries: LeaderboardEntry[];
  currentPlayerAddress?: string;
  refreshInterval: number;
}) => (
  <Card className="text-white">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Users className="h-6 w-6 text-blue-400" />
        <span>Live Rankings</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center justify-between p-2 rounded ${
              entry.playerAddress === currentPlayerAddress
                ? "bg-purple-500/20 border border-purple-400"
                : "bg-white/5"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="font-bold">#{entry.rank}</span>
              <div>
                <div className="font-medium">{entry.playerName}</div>
                <div className="text-xs text-purple-200">
                  {entry.playerAddress.slice(0, 6)}...{entry.playerAddress.slice(-4)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{entry.totalScore}</div>
              <div className="text-xs text-purple-200">${entry.totalEarnings.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const MobileControls = ({ onRestart, onHome }: { onRestart: () => void; onHome: () => void }) => (
  <div className="flex justify-center space-x-4 md:hidden">
    <Button onClick={onRestart} variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Restart
    </Button>
    <Button onClick={onHome} variant="outline">
      <Users className="h-4 w-4 mr-2" />
      Home
    </Button>
  </div>
);

export default function Page() {
  const { address: activeAccount } = useAccount();
  
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    questions: [],
    answers: [],
    score: 0,
    timeRemaining: 0,
    gameStatus: 'waiting',
    prizePool: 0.01,
    entryFee: 0.01,
  });

  const [loading, setLoading] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  
  // Mock prize pool data
  const prizePool = {
    totalAmount: gameState.prizePool,
    entryFee: gameState.entryFee,
    participants: 7,
    distribution: {
      first: gameState.prizePool * 0.5,
      second: gameState.prizePool * 0.3,
      third: gameState.prizePool * 0.15,
      participation: gameState.prizePool * 0.05,
    },
    contractAddress: '0x0000000000000000000000000000000000000001',
  };

  // Mock leaderboard data
  const [leaderboardData] = useState<LeaderboardEntry[]>([
    {
      rank: 1,
      playerAddress: '0x742d35Cc6634C0532925a3b8D1C91C4e1B8e6C6E',
      playerName: 'MusicMaster',
      totalScore: 2850,
      gamesPlayed: 12,
      averageScore: 237,
      totalEarnings: 47.50,
      lastPlayed: Date.now() - 300000,
    },
    {
      rank: 2,
      playerAddress: '0x8ba1f109551bD432803012645Hac136c3c739cC8',
      playerName: 'BeatBattler',
      totalScore: 2640,
      gamesPlayed: 8,
      averageScore: 330,
      totalEarnings: 23.75,
      lastPlayed: Date.now() - 600000,
    },
    {
      rank: 3,
      playerAddress: '0x9ca2f108651aE521893012645Bbd146d4d829dD9',
      playerName: 'ChartChaser',
      totalScore: 2420,
      gamesPlayed: 15,
      averageScore: 161,
      totalEarnings: 31.25,
      lastPlayed: Date.now() - 900000,
    },
  ]);

  const startGame = async () => {
    if (!activeAccount) return;
    
    setLoading(true);
    
    try {
      // Mock payment processing
      console.log('💰 Processing $0.01 entry fee payment...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment delay
      console.log('✅ Payment successful!');
      
      // Fetch real questions (with Spotify previews)
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5, difficulty: 'medium' })
      });
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      const data: { questions: TriviaQuestionType[] } = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions available');
      }

      setGameState(prev => ({
        ...prev,
        gameStatus: 'playing',
        currentQuestion: 0,
        score: 0,
        answers: [],
        questions: data.questions,
      }));
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (selectedAnswer: number, timeSpent: number) => {
    const currentQuestion = gameState.questions[gameState.currentQuestion];
    if (!currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const points = isCorrect ? 100 + Math.max(0, 15 - timeSpent) * 10 : 0;

    // Update streak
    const newStreak = isCorrect ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);
    setBestStreak(prev => Math.max(prev, newStreak));

    const newAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      timeSpent,
      pointsEarned: points,
    };

    setGameState(prev => ({
      ...prev,
      answers: [...prev.answers, newAnswer],
      score: prev.score + points,
    }));

    // Move to next question or end game
    setTimeout(() => {
      if (gameState.currentQuestion + 1 >= gameState.questions.length) {
        setGameState(prev => ({ ...prev, gameStatus: 'completed' }));
      } else {
        setGameState(prev => ({ ...prev, currentQuestion: prev.currentQuestion + 1 }));
      }
    }, 2000);
  };

  const resetGame = () => {
    setGameState({
      currentQuestion: 0,
      questions: [],
      answers: [],
      score: 0,
      timeRemaining: 0,
      gameStatus: 'waiting',
      prizePool: 0.01,
      entryFee: 0.01,
    });
    setCurrentStreak(0);
  };

  const calculateAccuracy = () => {
    if (gameState.answers.length === 0) return 0;
    const correct = gameState.answers.filter(a => a.isCorrect).length;
    return Math.round((correct / gameState.answers.length) * 100);
  };

  const calculateAverageTime = () => {
    if (gameState.answers.length === 0) return 0;
    const total = gameState.answers.reduce((sum, a) => sum + a.timeSpent, 0);
    return Math.round((total / gameState.answers.length) * 100) / 100;
  };

  // Waiting/Welcome Screen
  if (gameState.gameStatus === 'waiting') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center py-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Music className="h-12 w-12 text-purple-400" />
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                Trivia <span className="text-purple-400">Beat</span> Battle
              </h1>
              <Trophy className="h-12 w-12 text-yellow-400" />
            </div>
            <p className="text-xl text-purple-200 mb-2">
              🎵 Test your music knowledge and earn crypto rewards! 🎵
            </p>
            <div className="flex items-center justify-center space-x-6 text-purple-300">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Real-time battles</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Instant payouts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Global leaderboard</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Prize Pool Card */}
            <div className="lg:col-span-1">
              <PrizePoolCard
                prizePool={prizePool}
                onJoinGame={startGame}
                isConnected={!!activeAccount}
                isLoading={loading}
                timeUntilStart={0}
              />
            </div>

            {/* Game Info */}
            <div className="lg:col-span-1">
              <Card className="h-full text-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                    <span>How to Play</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-purple-500 text-white shrink-0">1</Badge>
                      <div>
                        <div className="font-semibold">Connect Wallet</div>
                        <div className="text-sm text-purple-200">Link your crypto wallet to join battles</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-blue-500 text-white shrink-0">2</Badge>
                      <div>
                        <div className="font-semibold">Answer Questions</div>
                        <div className="text-sm text-purple-200">Listen to music clips and identify songs, artists, or release years</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-green-500 text-white shrink-0">3</Badge>
                      <div>
                        <div className="font-semibold">Earn Rewards</div>
                        <div className="text-sm text-purple-200">Top players split the prize pool instantly via smart contracts</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/20">
                    <div className="text-center">
                      {!activeAccount ? (
                        <div className="space-y-3">
                          <div className="text-purple-200 text-sm">Ready to play?</div>
                          <div className="flex justify-center">
                            <Wallet />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <Wallet />
                          </div>
                          <Button 
                            onClick={startGame}
                            disabled={loading}
                            className="w-full mt-3"
                          >
                            {loading ? (
                              <div className="flex items-center space-x-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Loading Questions...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Play className="h-4 w-4" />
                                <span>Start Playing! ($0.01)</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard */}
            <div className="lg:col-span-1">
              <LiveRankings
                entries={leaderboardData}
                currentPlayerAddress={activeAccount}
                refreshInterval={10000}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Game Playing Screen
  if (gameState.gameStatus === 'playing') {
    const currentQuestion = gameState.questions[gameState.currentQuestion];
    
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">🎵 Trivia Beat Battle 🎵</h1>
          </div>

          {/* Score Display */}
          <ScoreDisplay
            currentScore={gameState.score}
            questionsAnswered={gameState.answers.length}
            totalQuestions={gameState.questions.length}
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            accuracy={calculateAccuracy()}
            averageTime={calculateAverageTime()}
          />

          {/* Current Question */}
          {currentQuestion && (
            <TriviaQuestionComponent
              question={currentQuestion}
              questionNumber={gameState.currentQuestion + 1}
              totalQuestions={gameState.questions.length}
              onAnswer={handleAnswer}
            />
          )}

          {/* Mobile Controls */}
          <MobileControls
            onRestart={resetGame}
            onHome={() => setGameState(prev => ({ ...prev, gameStatus: 'waiting' }))}
          />
        </div>
      </main>
    );
  }

  // Game Completed Screen
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="text-white">
          <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">🎉 Battle Complete! 🎉</h1>
          <p className="text-xl text-purple-200">Here&apos;s how you performed:</p>
        </div>

        <ScoreDisplay
          currentScore={gameState.score}
          questionsAnswered={gameState.answers.length}
          totalQuestions={gameState.questions.length}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          accuracy={calculateAccuracy()}
          averageTime={calculateAverageTime()}
        />

        <div className="flex justify-center space-x-4">
          <Button 
            onClick={resetGame}
            className="px-8 py-3"
          >
            <Play className="h-5 w-5 mr-2" />
            Play Again
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="px-8 py-3"
          >
            <Users className="h-5 w-5 mr-2" />
            View Leaderboard
          </Button>
        </div>
      </div>
    </main>
  );
}
