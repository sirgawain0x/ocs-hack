import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorage } from '@/lib/apis/supabase';
import type { DifficultyLevel } from '@/types/game';

type Mode = 'name-that-tune' | 'artist-match';

const shuffle = <T,>(a: T[]) => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
};

const unique = (arr: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.trim().toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return out;
};

const getTimeLimit = (difficulty: DifficultyLevel): number => {
  switch (difficulty) {
    case 'easy': return 20;
    case 'medium': return 15;
    case 'hard': return 10;
    case 'expert': return 8;
    default: return 15;
  }
};

// Static list of available audio files to avoid bundling large files
const getLocalAudioFiles = (): Array<{ name: string; path: string; artistName: string; songTitle: string }> => {
  // Static list of available songs - this prevents bundling large audio files
  const availableSongs = [
    { name: "Drake - God's Plan.mp3", artistName: "Drake", songTitle: "God's Plan" },
    { name: "Ed Sheeran - Shape of You.mp3", artistName: "Ed Sheeran", songTitle: "Shape of You" },
    { name: "Post Malone - Rockstar.mp3", artistName: "Post Malone", songTitle: "Rockstar" },
    { name: "Camila Cabello - Havana.mp3", artistName: "Camila Cabello", songTitle: "Havana" },
    { name: "Bruno Mars - That's What I Like.mp3", artistName: "Bruno Mars", songTitle: "That's What I Like" },
    { name: "The Weeknd - Starboy.mp3", artistName: "The Weeknd", songTitle: "Starboy" },
    { name: "Kendrick Lamar - HUMBLE..mp3", artistName: "Kendrick Lamar", songTitle: "HUMBLE." },
    { name: "Luis Fonsi - Despacito.mp3", artistName: "Luis Fonsi", songTitle: "Despacito" },
    { name: "Imagine Dragons - Believer.mp3", artistName: "Imagine Dragons", songTitle: "Believer" },
    { name: "Maroon 5 - Sugar.mp3", artistName: "Maroon 5", songTitle: "Sugar" },
    { name: "Adele - Hello.mp3", artistName: "Adele", songTitle: "Hello" },
    { name: "Justin Bieber - Sorry.mp3", artistName: "Justin Bieber", songTitle: "Sorry" },
    { name: "Rihanna - Work.mp3", artistName: "Rihanna", songTitle: "Work" },
    { name: "The Chainsmokers - Closer.mp3", artistName: "The Chainsmokers", songTitle: "Closer" },
    { name: "Twenty One Pilots - Stressed Out.mp3", artistName: "Twenty One Pilots", songTitle: "Stressed Out" },
    { name: "Sia - Cheap Thrills.mp3", artistName: "Sia", songTitle: "Cheap Thrills" },
    { name: "Calvin Harris - This Is What You Came For.mp3", artistName: "Calvin Harris", songTitle: "This Is What You Came For" },
    { name: "Major Lazer - Lean On.mp3", artistName: "Major Lazer", songTitle: "Lean On" },
    { name: "Fetty Wap - Trap Queen.mp3", artistName: "Fetty Wap", songTitle: "Trap Queen" },
    { name: "Wiz Khalifa - See You Again.mp3", artistName: "Wiz Khalifa", songTitle: "See You Again" }
  ];
  
  return availableSongs.map(song => ({
    name: song.name,
    path: `/music/${song.name}`,
    artistName: song.artistName,
    songTitle: song.songTitle
  }));
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get('bucket') || 'Songs';
    const folder = searchParams.get('folder') || 'Global_Top_100';
    const mode = (searchParams.get('mode') as Mode) || 'name-that-tune';
    const count = Math.max(1, Math.min(20, parseInt(searchParams.get('count') || '5', 10)));
    const choices = Math.max(2, Math.min(6, parseInt(searchParams.get('choices') || '4', 10)));
    const difficulty = (searchParams.get('difficulty') as DifficultyLevel) || 'medium';

    const prefix = folder;

    console.log(`🎵 Fetching questions from Supabase: bucket=${bucket}, folder=${folder}, mode=${mode}, count=${count}`);

    let files: Array<{ name: string; path: string; artistName: string; songTitle: string }> = [];
    let source = 'local'; // Force local since Supabase is not configured

    try {
      // Try Supabase first (but skip since env vars are not set)
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        files = await SupabaseStorage.listAudioFiles(bucket, prefix);
        console.log(`📁 Found ${files.length} audio files in Supabase ${bucket}/${folder}`);
        source = 'supabase';
      } else {
        throw new Error('Supabase not configured');
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase storage failed, falling back to local files:', supabaseError);
      files = getLocalAudioFiles();
      source = 'local';
      console.log(`📁 Found ${files.length} local audio files`);
    }

    if (files.length < choices) {
      return NextResponse.json({ 
        error: `Not enough tracks (${files.length}) to build ${choices} choices` 
      }, { status: 400 });
    }

    const questions = [];
    const bag = shuffle(files);

    for (let i = 0; i < count && i < bag.length; i++) {
      const correct = bag[i]!;
      const pool = files.filter(f => f.name !== correct.name);

      const correctText = mode === 'name-that-tune' ? correct.songTitle : correct.artistName;
      const distractorPool = mode === 'name-that-tune' 
        ? pool.map(p => p.songTitle) 
        : pool.map(p => p.artistName);

      const distractors = shuffle(
        unique(distractorPool.filter(x => x.toLowerCase() !== correctText.toLowerCase()))
      ).slice(0, Math.max(0, choices - 1));

      const options = shuffle([correctText, ...distractors]).slice(0, choices);
      const correctIndex = options.indexOf(correctText);

      let audioUrl: string;
      if (source === 'supabase') {
        audioUrl = await SupabaseStorage.createSignedUrl(bucket, correct.path, 300);
      } else {
        // Use local file path
        audioUrl = correct.path;
      }

      questions.push({
        id: `sb_${Date.now()}_${i}`,
        type: mode,
        question: mode === 'name-that-tune' 
          ? 'What song is this?' 
          : `Who performs "${correct.songTitle}"?`,
        options,
        correctAnswer: correctIndex >= 0 ? correctIndex : 0,
        audioUrl,
        timeLimit: getTimeLimit(difficulty),
        difficulty,
        metadata: {
          artistName: correct.artistName,
          songTitle: correct.songTitle,
          source: source as 'supabase' | 'local',
        },
      });

      console.log(`✅ Generated ${mode} question: ${correct.artistName} - ${correct.songTitle}`);
    }

    console.log(`🎉 Generated ${questions.length} questions successfully from ${source}`);

    return NextResponse.json({ 
      questions,
      count: questions.length,
      difficulty,
      mode,
      source,
      bucket,
      folder
    });
  } catch (e) {
    console.error('❌ Error generating Supabase questions:', e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Internal error' 
    }, { status: 500 });
  }
}
