import type { DifficultyLevel, GameSession } from '@/types/game';

export class ScoringSystem {
  private static readonly BASE_POINTS = 100;
  private static readonly TIME_BONUS_MULTIPLIER = 0.5;
  private static readonly STREAK_BONUS_MULTIPLIER = 0.2;
  private static readonly DIFFICULTY_MULTIPLIERS: Record<DifficultyLevel, number> = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0,
    expert: 2.5,
  };

  static calculateQuestionScore(
    isCorrect: boolean,
    timeSpent: number,
    timeLimit: number,
    difficulty: DifficultyLevel,
    currentStreak: number = 0
  ): number {
    if (!isCorrect) return 0;

    // Base points based on difficulty
    const basePoints = this.BASE_POINTS * this.DIFFICULTY_MULTIPLIERS[difficulty]!;

    // Time bonus (faster answers get more points)
    const timeRemaining = Math.max(0, timeLimit - timeSpent);
    const timeBonus = (timeRemaining / timeLimit) * this.TIME_BONUS_MULTIPLIER * basePoints;

    // Streak bonus (consecutive correct answers)
    const streakBonus = Math.min(currentStreak, 10) * this.STREAK_BONUS_MULTIPLIER * basePoints;

    const totalScore = Math.round(basePoints + timeBonus + streakBonus);
    return Math.max(0, totalScore);
  }

  static calculateSessionScore(session: GameSession): number {
    let totalScore = 0;
    let currentStreak = 0;

    session.answers.forEach((answer, index) => {
      if (answer.isCorrect) {
        currentStreak++;
      } else {
        currentStreak = 0;
      }

      const question = session.questions[index]!;
      const questionScore = this.calculateQuestionScore(
        answer.isCorrect,
        answer.timeSpent,
        question.timeLimit,
        question.difficulty,
        currentStreak - 1 // Use previous streak for current question
      );

      totalScore += questionScore;
      
      // Update the answer with calculated points
      answer.pointsEarned = questionScore;
    });

    return totalScore;
  }

  static calculateAccuracy(session: GameSession): number {
    if (session.answers.length === 0) return 0;

    const correctAnswers = session.answers.filter(answer => answer.isCorrect).length;
    return Math.round((correctAnswers / session.answers.length) * 100);
  }

  static calculateAverageTime(session: GameSession): number {
    if (session.answers.length === 0) return 0;

    const totalTime = session.answers.reduce((sum, answer) => sum + answer.timeSpent, 0);
    return Math.round(totalTime / session.answers.length * 100) / 100;
  }

  static getLevelFromScore(totalScore: number): {level: number; title: string; nextLevel: number} {
    const levels = [
      { threshold: 0, title: 'Tone Deaf', nextLevel: 1000 },
      { threshold: 1000, title: 'Music Newbie', nextLevel: 2500 },
      { threshold: 2500, title: 'Casual Listener', nextLevel: 5000 },
      { threshold: 5000, title: 'Music Enthusiast', nextLevel: 10000 },
      { threshold: 10000, title: 'Music Buff', nextLevel: 20000 },
      { threshold: 20000, title: 'Chart Tracker', nextLevel: 35000 },
      { threshold: 35000, title: 'Music Guru', nextLevel: 50000 },
      { threshold: 50000, title: 'Beat Master', nextLevel: 75000 },
      { threshold: 75000, title: 'Music Legend', nextLevel: 100000 },
      { threshold: 100000, title: 'Beat Battle Champion', nextLevel: -1 },
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalScore >= levels[i]!.threshold) {
        return {
          level: i + 1,
          title: levels[i]!.title,
          nextLevel: levels[i]!.nextLevel,
        };
      }
    }

    return { level: 1, title: 'Tone Deaf', nextLevel: 1000 };
  }

  static calculateRank(playerScore: number, allScores: number[]): number {
    const sortedScores = [...allScores].sort((a, b) => b - a);
    const rank = sortedScores.findIndex(score => score <= playerScore) + 1;
    return rank || sortedScores.length + 1;
  }

  static getBonusMultipliers(difficulty: DifficultyLevel): {
    base: number;
    time: number;
    streak: number;
  } {
    return {
      base: this.DIFFICULTY_MULTIPLIERS[difficulty]!,
      time: this.TIME_BONUS_MULTIPLIER,
      streak: this.STREAK_BONUS_MULTIPLIER,
    };
  }

  static getPerformanceAnalysis(session: GameSession): {
    accuracy: number;
    averageTime: number;
    totalStreak: number;
    bestStreak: number;
    performance: 'excellent' | 'good' | 'average' | 'poor';
    strengths: string[];
    improvements: string[];
  } {
    const accuracy = this.calculateAccuracy(session);
    const averageTime = this.calculateAverageTime(session);

    let currentStreak = 0;
    let bestStreak = 0;
    let totalStreak = 0;

    session.answers.forEach(answer => {
      if (answer.isCorrect) {
        currentStreak++;
        totalStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Performance rating
    let performance: 'excellent' | 'good' | 'average' | 'poor';
    if (accuracy >= 80 && averageTime <= 8) performance = 'excellent';
    else if (accuracy >= 60 && averageTime <= 12) performance = 'good';
    else if (accuracy >= 40) performance = 'average';
    else performance = 'poor';

    // Strengths and improvements
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (accuracy >= 70) strengths.push('High accuracy');
    if (averageTime <= 10) strengths.push('Quick thinking');
    if (bestStreak >= 5) strengths.push('Great consistency');
    
    if (accuracy < 50) improvements.push('Focus on accuracy');
    if (averageTime > 15) improvements.push('Speed up your responses');
    if (bestStreak <= 2) improvements.push('Build answer streaks');

    return {
      accuracy,
      averageTime,
      totalStreak,
      bestStreak,
      performance,
      strengths,
      improvements,
    };
  }
}