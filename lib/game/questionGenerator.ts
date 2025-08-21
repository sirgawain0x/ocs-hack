import type { TriviaQuestion, QuestionType, DifficultyLevel } from '@/types/game';
import type { BillboardTrack, BillboardGreatestHit } from '@/types/billboard';
import type { SpotifyTrack } from '@/types/spotify';
// import type { MusicBrainzRecording } from '@/types/musicbrainz';
import { SpotifyAPI } from '@/lib/apis/spotify';
import { MusicBrainzAPI } from '@/lib/apis/musicbrainz';
import { ITunesAPI } from '@/lib/apis/itunes';
import { BillboardAPI } from '@/lib/apis/billboard';

export class QuestionGenerator {
  private static questionIdCounter = 0;

  static generateQuestionId(): string {
    return `q_${Date.now()}_${++this.questionIdCounter}`;
  }

  static async generateNameThatTuneQuestion(
    track: SpotifyTrack,
    difficulty: DifficultyLevel = 'medium'
  ): Promise<TriviaQuestion | null> {

    // Get similar artists or random tracks for wrong answers
    const wrongAnswers = await this.getWrongAnswers(track.name, 'song', 3);
    const options = this.shuffleOptions([track.name, ...wrongAnswers]);
    const correctAnswer = options.indexOf(track.name);

    // Prefer Spotify preview; fallback to iTunes
    const previewUrl = track.preview_url || await ITunesAPI.searchPreviewByArtistAndTitle(track.artists[0]?.name || '', track.name);

    return {
      id: this.generateQuestionId(),
      type: 'name-that-tune',
      question: 'What song is this?',
      options,
      correctAnswer,
      audioUrl: previewUrl,
      imageUrl: track.album.images[0]?.url,
      difficulty,
      timeLimit: this.getTimeLimit(difficulty),
      metadata: {
        trackId: track.id,
        artistName: track.artists[0]?.name || 'Unknown',
        songTitle: track.name,
        releaseYear: new Date(track.album.release_date).getFullYear().toString(),
        source: 'spotify',
      },
    };
  }

  static async generateArtistMatchQuestion(
    track: SpotifyTrack,
    difficulty: DifficultyLevel = 'medium'
  ): Promise<TriviaQuestion | null> {

    const correctArtist = track.artists[0]?.name;
    if (!correctArtist) return null;

    const wrongAnswers = await this.getWrongAnswers(correctArtist, 'artist', 3);
    const options = this.shuffleOptions([correctArtist, ...wrongAnswers]);
    const correctAnswer = options.indexOf(correctArtist);

    const previewUrl = track.preview_url || await ITunesAPI.searchPreviewByArtistAndTitle(track.artists[0]?.name || '', track.name);

    return {
      id: this.generateQuestionId(),
      type: 'artist-match',
      question: `Who performs "${track.name}"?`,
      options,
      correctAnswer,
      audioUrl: previewUrl,
      imageUrl: track.album.images[0]?.url,
      difficulty,
      timeLimit: this.getTimeLimit(difficulty),
      metadata: {
        trackId: track.id,
        artistName: correctArtist,
        songTitle: track.name,
        releaseYear: new Date(track.album.release_date).getFullYear().toString(),
        source: 'spotify',
      },
    };
  }

  static async generateReleaseYearQuestion(
    track: SpotifyTrack,
    difficulty: DifficultyLevel = 'medium'
  ): Promise<TriviaQuestion | null> {

    const releaseYear = new Date(track.album.release_date).getFullYear();
    const wrongAnswers = this.generateYearOptions(releaseYear, difficulty);
    const options = this.shuffleOptions([releaseYear.toString(), ...wrongAnswers]);
    const correctAnswer = options.indexOf(releaseYear.toString());

    const previewUrl = track.preview_url || await ITunesAPI.searchPreviewByArtistAndTitle(track.artists[0]?.name || '', track.name);

    return {
      id: this.generateQuestionId(),
      type: 'release-year',
      question: `When was "${track.name}" by ${track.artists[0]?.name} released?`,
      options,
      correctAnswer,
      audioUrl: previewUrl,
      imageUrl: track.album.images[0]?.url,
      difficulty,
      timeLimit: this.getTimeLimit(difficulty),
      metadata: {
        trackId: track.id,
        artistName: track.artists[0]?.name || 'Unknown',
        songTitle: track.name,
        releaseYear: releaseYear.toString(),
        source: 'spotify',
      },
    };
  }

  static async generateChartPositionQuestion(
    billboardTrack: BillboardTrack,
    difficulty: DifficultyLevel = 'medium'
  ): Promise<TriviaQuestion | null> {
    // Try to find Spotify preview for this Billboard track
    const spotifyTracks = await SpotifyAPI.searchTracks(`${billboardTrack.song} ${billboardTrack.artist}`, 5);
    const spotifyTrack = spotifyTracks.find(track => 
      track.name.toLowerCase().includes(billboardTrack.song.toLowerCase()) &&
      track.artists.some(artist => artist.name.toLowerCase().includes(billboardTrack.artist.toLowerCase()))
    );

    const peakPosition = billboardTrack['peak-pos'];
    const wrongAnswers = this.generatePositionOptions(peakPosition, difficulty);
    const options = this.shuffleOptions([peakPosition.toString(), ...wrongAnswers]);
    const correctAnswer = options.indexOf(peakPosition.toString());

    const previewUrl = spotifyTrack?.preview_url || await ITunesAPI.searchPreviewByArtistAndTitle(billboardTrack.artist, billboardTrack.song);

    return {
      id: this.generateQuestionId(),
      type: 'chart-position',
      question: `What was the peak Billboard position of "${billboardTrack.song}" by ${billboardTrack.artist}?`,
      options,
      correctAnswer,
      audioUrl: previewUrl || undefined,
      imageUrl: billboardTrack.image || spotifyTrack?.album.images?.[0]?.url,
      difficulty,
      timeLimit: this.getTimeLimit(difficulty),
      metadata: {
        trackId: spotifyTrack?.id,
        artistName: billboardTrack.artist,
        songTitle: billboardTrack.song,
        chartPosition: peakPosition,
        source: 'billboard',
      },
    };
  }

  static async generateGenreQuestion(
    track: SpotifyTrack,
    difficulty: DifficultyLevel = 'medium'
  ): Promise<TriviaQuestion | null> {

    // Try to get genre info from MusicBrainz
    const mbRecordings = await MusicBrainzAPI.searchByArtistAndTitle(
      track.artists[0]?.name || '',
      track.name
    );

    let genres: string[] = [];
    if (mbRecordings.length > 0) {
      genres = MusicBrainzAPI.extractGenres(mbRecordings[0]!);
    }

    if (genres.length === 0) {
      // Fallback to common genres
      genres = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Country', 'Jazz', 'Blues'];
    }

    const correctGenre = genres[0] || 'Pop';
    const wrongAnswers = this.getRandomGenres(correctGenre, 3);
    const options = this.shuffleOptions([correctGenre, ...wrongAnswers]);
    const correctAnswer = options.indexOf(correctGenre);

    const previewUrl = track.preview_url || await ITunesAPI.searchPreviewByArtistAndTitle(track.artists[0]?.name || '', track.name);

    return {
      id: this.generateQuestionId(),
      type: 'genre-classification',
      question: `What genre is "${track.name}" by ${track.artists[0]?.name}?`,
      options,
      correctAnswer,
      audioUrl: previewUrl,
      imageUrl: track.album.images[0]?.url,
      difficulty,
      timeLimit: this.getTimeLimit(difficulty),
      metadata: {
        trackId: track.id,
        artistName: track.artists[0]?.name || 'Unknown',
        songTitle: track.name,
        genre: correctGenre,
        source: 'spotify',
      },
    };
  }

  // New method to generate questions from Top Global playlist
  static async generateTopGlobalQuestionSet(
    count: number = 10,
    difficulty: DifficultyLevel = 'medium',
    questionTypes?: QuestionType[]
  ): Promise<TriviaQuestion[]> {
    const questions: TriviaQuestion[] = [];
    const types: QuestionType[] = questionTypes || ['name-that-tune', 'artist-match', 'release-year', 'genre-classification'];

    try {
      console.log('Fetching Top Global playlist tracks...');
      const topGlobalTracks = await SpotifyAPI.getTopGlobalTracks(count * 2);
      console.log(`Found ${topGlobalTracks.length} tracks from Top Global playlist`);

      if (topGlobalTracks.length === 0) {
        console.log('No tracks found, falling back to Billboard API');
        return await this.generateQuestionSet(count, difficulty, questionTypes);
      }

      // Shuffle tracks and take the requested number
      const shuffledTracks = topGlobalTracks.sort(() => 0.5 - Math.random()).slice(0, count);

      for (let i = 0; i < count && i < shuffledTracks.length; i++) {
        const track = shuffledTracks[i]!;
        const questionType = types[i % types.length]!;

        try {
          let question: TriviaQuestion | null = null;

          switch (questionType) {
            case 'name-that-tune':
              question = await this.generateNameThatTuneQuestion(track, difficulty);
              break;
            case 'artist-match':
              question = await this.generateArtistMatchQuestion(track, difficulty);
              break;
            case 'release-year':
              question = await this.generateReleaseYearQuestion(track, difficulty);
              break;
            case 'genre-classification':
              question = await this.generateGenreQuestion(track, difficulty);
              break;
            case 'chart-position':
              // Skip chart position for Top Global tracks as we don't have Billboard data
              continue;
          }

          if (question) {
            questions.push(question);
            console.log(`Generated ${questionType} question for: ${track.name} by ${track.artists[0]?.name}`);
          }
        } catch (error: unknown) {
          console.error(`Error generating question for ${track.name}:`, error);
          continue;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error generating Top Global question set:', error);
      // Fallback to Billboard API
      return await this.generateQuestionSet(count, difficulty, questionTypes);
    }

    // Fallback: if we could not build enough questions, pad with local questions
    if (questions.length < count) {
      const missing = count - questions.length;
      const fallback = this.generateLocalFallbackQuestions(missing, difficulty);
      questions.push(...fallback);
    }

    return questions;
  }

  static async generateQuestionSet(
    count: number = 10,
    difficulty: DifficultyLevel = 'medium',
    questionTypes?: QuestionType[]
  ): Promise<TriviaQuestion[]> {
    const questions: TriviaQuestion[] = [];
    const types: QuestionType[] = questionTypes || ['name-that-tune', 'artist-match', 'release-year', 'chart-position', 'genre-classification'];

    try {
      // Get mix of current hits and greatest hits
      const [hot100, greatestHits] = await Promise.all([
        BillboardAPI.getHot100(),
        BillboardAPI.getGreatestHits(),
      ]);

      const allTracks = [...hot100.slice(0, 20), ...greatestHits.slice(0, 30)];
      const shuffledTracks = allTracks.sort(() => 0.5 - Math.random()).slice(0, count * 2);

      for (let i = 0; i < count && i < shuffledTracks.length; i++) {
        const track = shuffledTracks[i]!;
        const questionType = types[i % types.length]!;

        try {
          // Search for Spotify track to get preview
          const title: string = (track as BillboardTrack).song ?? (track as BillboardGreatestHit).title ?? ''
          const artist: string = track.artist
          const spotifyTracks = await SpotifyAPI.searchTracks(`${title} ${artist}`, 3);
          const spotifyTrack = spotifyTracks.find(st => 
            st.name.toLowerCase().includes(title.toLowerCase()) &&
            st.artists.some(a => a.name.toLowerCase().includes(artist.toLowerCase()))
          );

          if (spotifyTrack) {
            let question: TriviaQuestion | null = null;

            switch (questionType) {
              case 'name-that-tune':
                question = await this.generateNameThatTuneQuestion(spotifyTrack, difficulty);
                break;
              case 'artist-match':
                question = await this.generateArtistMatchQuestion(spotifyTrack, difficulty);
                break;
              case 'release-year':
                question = await this.generateReleaseYearQuestion(spotifyTrack, difficulty);
                break;
              case 'chart-position':
                if ((track as BillboardTrack).song !== undefined) {
                  question = await this.generateChartPositionQuestion(track as BillboardTrack, difficulty);
                }
                break;
              case 'genre-classification':
                question = await this.generateGenreQuestion(spotifyTrack, difficulty);
                break;
            }

            if (question) {
              questions.push(question);
            }
          }
        } catch (error: unknown) {
          const titleForLog: string = (track as BillboardTrack).song ?? (track as BillboardGreatestHit).title ?? 'unknown'
          console.error(`Error generating question for ${titleForLog}:`, error);
          continue;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error generating question set:', error);
    }

    // Fallback: if we could not build enough questions from external APIs, pad with local questions
    if (questions.length < count) {
      const missing = count - questions.length;
      const fallback = this.generateLocalFallbackQuestions(missing, difficulty);
      questions.push(...fallback);
    }

    return questions;
  }

  // Provide offline/local fallback questions when external APIs fail
  private static generateLocalFallbackQuestions(amount: number, difficulty: DifficultyLevel): TriviaQuestion[] {
    const fallbackBank: Array<{ q: string; options: string[]; answer: number; meta: { artistName: string; songTitle: string; releaseYear?: string; genre?: string } }> = [
      { q: 'Who is known as the "King of Pop"?', options: ['Elvis Presley', 'Michael Jackson', 'Prince', 'Justin Timberlake'], answer: 1, meta: { artistName: 'Michael Jackson', songTitle: 'Various' } },
      { q: 'Which band released the album "Abbey Road"?', options: ['The Rolling Stones', 'The Beatles', 'Pink Floyd', 'Queen'], answer: 1, meta: { artistName: 'The Beatles', songTitle: 'Abbey Road', releaseYear: '1969' } },
      { q: 'Which genre is characterized by heavy bass and electronic beats?', options: ['Classical', 'EDM', 'Folk', 'Jazz'], answer: 1, meta: { artistName: 'Various', songTitle: 'N/A', genre: 'Electronic' } },
      { q: 'In what year was the song "Hey Ya!" by OutKast released?', options: ['1999', '2000', '2003', '2005'], answer: 2, meta: { artistName: 'OutKast', songTitle: 'Hey Ya!', releaseYear: '2003' } },
      { q: 'Which artist is famous for the album "1989"?', options: ['Adele', 'Taylor Swift', 'Katy Perry', 'Lady Gaga'], answer: 1, meta: { artistName: 'Taylor Swift', songTitle: '1989', releaseYear: '2014' } },
      { q: 'Which band wrote "Bohemian Rhapsody"?', options: ['Queen', 'The Who', 'Led Zeppelin', 'Aerosmith'], answer: 0, meta: { artistName: 'Queen', songTitle: 'Bohemian Rhapsody', releaseYear: '1975' } },
      { q: 'Which genre does the artist Drake primarily belong to?', options: ['Country', 'Hip-Hop', 'Rock', 'Classical'], answer: 1, meta: { artistName: 'Drake', songTitle: 'N/A', genre: 'Hip-Hop' } },
      { q: 'Which duo created the hit "Smells Like Teen Spirit"?', options: ['Nirvana', 'Daft Punk', 'The Black Keys', 'Twenty One Pilots'], answer: 0, meta: { artistName: 'Nirvana', songTitle: 'Smells Like Teen Spirit', releaseYear: '1991' } },
    ];

    const results: TriviaQuestion[] = [];
    for (let i = 0; i < amount; i++) {
      const b = fallbackBank[(i + Math.floor(Math.random() * fallbackBank.length)) % fallbackBank.length]!;
      const shuffledOptions = this.shuffleOptions([...b.options]);
      const correctIdx = shuffledOptions.indexOf(b.options[b.answer]!);
      results.push({
        id: this.generateQuestionId(),
        type: 'artist-match',
        question: b.q,
        options: shuffledOptions,
        correctAnswer: correctIdx >= 0 ? correctIdx : 0,
        difficulty,
        timeLimit: this.getTimeLimit(difficulty),
        metadata: {
          artistName: b.meta.artistName,
          songTitle: b.meta.songTitle,
          releaseYear: b.meta.releaseYear,
          genre: b.meta.genre,
          source: 'billboard',
        },
      });
    }
    return results;
  }

  private static async getWrongAnswers(correct: string, type: 'song' | 'artist', count: number): Promise<string[]> {
    const wrongAnswers: string[] = [];
    
    try {
      if (type === 'song') {
        const randomTracks = await SpotifyAPI.searchTracks('a', 50);
        const filtered = randomTracks
          .map(track => track.name)
          .filter(name => name.toLowerCase() !== correct.toLowerCase())
          .slice(0, count);
        wrongAnswers.push(...filtered);
      } else {
        const randomTracks = await SpotifyAPI.searchTracks('the', 50);
        const artists = randomTracks
          .map(track => track.artists[0]?.name)
          .filter(name => name && name.toLowerCase() !== correct.toLowerCase())
          .slice(0, count);
        wrongAnswers.push(...artists as string[]);
      }
    } catch (error) {
      console.error('Error getting wrong answers:', error);
    }

    // Fallback options if API fails
    if (wrongAnswers.length < count) {
      const fallbacks = type === 'song' 
        ? ['Shape of You', 'Blinding Lights', 'Watermelon Sugar', 'Levitating', 'Good 4 U', 'Peaches', 'Stay', 'Industry Baby']
        : ['Ed Sheeran', 'The Weeknd', 'Harry Styles', 'Dua Lipa', 'Olivia Rodrigo', 'Justin Bieber', 'The Kid LAROI', 'Lil Nas X'];
      
      const needed = count - wrongAnswers.length;
      const additional = fallbacks
        .filter(option => option.toLowerCase() !== correct.toLowerCase())
        .slice(0, needed);
      wrongAnswers.push(...additional);
    }

    return wrongAnswers.slice(0, count);
  }

  private static generateYearOptions(correctYear: number, difficulty: DifficultyLevel): string[] {
    const range = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 2;
    const options: number[] = [];
    
    while (options.length < 3) {
      const offset = Math.floor(Math.random() * range * 2 + 1) - range;
      const year = correctYear + offset;
      if (year !== correctYear && year > 1950 && year <= new Date().getFullYear() && !options.includes(year)) {
        options.push(year);
      }
    }

    return options.map(year => year.toString());
  }

  private static generatePositionOptions(correctPosition: number, difficulty: DifficultyLevel): string[] {
    const positions = new Set<number>();
    const range = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 10 : 5;

    while (positions.size < 3) {
      let pos: number;
      if (correctPosition <= 10) {
        pos = Math.floor(Math.random() * Math.min(range, 50)) + 1;
      } else {
        pos = Math.floor(Math.random() * 100) + 1;
      }
      
      if (pos !== correctPosition && pos >= 1 && pos <= 100) {
        positions.add(pos);
      }
    }

    return Array.from(positions).map(pos => pos.toString());
  }

  private static getRandomGenres(excludeGenre: string, count: number): string[] {
    const allGenres = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Country', 'Jazz', 'Blues', 'Classical', 'Reggae', 'Folk', 'Punk', 'Metal', 'Alternative', 'Indie', 'Dance', 'Funk', 'Soul'];
    
    return allGenres
      .filter(genre => genre !== excludeGenre)
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  }

  private static shuffleOptions(options: string[]): string[] {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  }

  private static getTimeLimit(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'easy': return 20;
      case 'medium': return 15;
      case 'hard': return 10;
      case 'expert': return 8;
      default: return 15;
    }
  }
}