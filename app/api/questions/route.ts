import { NextRequest, NextResponse } from 'next/server';
import { QuestionGenerator } from '@/lib/game/questionGenerator';
import type { DifficultyLevel, QuestionType } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      count = 5, 
      difficulty = 'medium', 
      questionTypes 
    } = body;

    // Validate inputs
    if (count < 1 || count > 20) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 20' },
        { status: 400 }
      );
    }

    const validDifficulties: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    const validQuestionTypes: QuestionType[] = [
      'name-that-tune', 'artist-match', 'release-year', 'chart-position', 'genre-classification'
    ];
    if (questionTypes && !questionTypes.every((type: string) => validQuestionTypes.includes(type as QuestionType))) {
      return NextResponse.json(
        { error: 'Invalid question type' },
        { status: 400 }
      );
    }

    console.log('🎵 Generating trivia questions:', { count, difficulty, questionTypes });

    const questions = await QuestionGenerator.generateQuestionSet(
      count,
      difficulty as DifficultyLevel,
      questionTypes as QuestionType[]
    );

    console.log(`✅ Generated ${questions.length} questions`);

    return NextResponse.json({ 
      questions,
      count: questions.length,
      difficulty,
      questionTypes: questionTypes || 'all'
    });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate trivia questions' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '5', 10);
  const difficulty = searchParams.get('difficulty') || 'medium';
  const questionTypesParam = searchParams.get('questionTypes');
  
  let questionTypes: QuestionType[] | undefined;
  if (questionTypesParam) {
    questionTypes = questionTypesParam.split(',') as QuestionType[];
  }

  try {
    const questions = await QuestionGenerator.generateQuestionSet(
      count,
      difficulty as DifficultyLevel,
      questionTypes
    );

    return NextResponse.json({ 
      questions,
      count: questions.length,
      difficulty,
      questionTypes: questionTypes || 'all'
    });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate trivia questions' },
      { status: 500 }
    );
  }
}