import type { MusicBrainzRecording, MusicBrainzSearchResponse } from '@/types/musicbrainz';

export class MusicBrainzAPI {
  private static readonly BASE_URL = 'musicbrainz.org';
  private static readonly USER_AGENT = process.env.MUSICBRAINZ_USER_AGENT || 'trivia-beat-battle/1.0 (your-email@example.com)';

  static async searchRecordings(query: string, limit: number = 20): Promise<MusicBrainzRecording[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: this.BASE_URL,
          path: `/ws/2/recording?query=${encodedQuery}&limit=${limit}&fmt=json`,
          method: 'GET',
          headers: {
            'User-Agent': this.USER_AGENT,
            'Accept': 'application/json',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search MusicBrainz recordings');
      }

      const data: MusicBrainzSearchResponse = await response.json();
      return data.recordings || [];
    } catch (error) {
      console.error('MusicBrainz search error:', error);
      return [];
    }
  }

  static async searchByArtistAndTitle(artist: string, title: string): Promise<MusicBrainzRecording[]> {
    try {
      const query = `artist:"${artist}" AND recording:"${title}"`;
      return await this.searchRecordings(query, 10);
    } catch (error) {
      console.error('MusicBrainz artist/title search error:', error);
      return [];
    }
  }

  static async getRecordingById(recordingId: string): Promise<MusicBrainzRecording | null> {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: this.BASE_URL,
          path: `/ws/2/recording/${recordingId}?inc=artist-credits+releases+release-groups+tags&fmt=json`,
          method: 'GET',
          headers: {
            'User-Agent': this.USER_AGENT,
            'Accept': 'application/json',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get MusicBrainz recording');
      }

      const recording: MusicBrainzRecording = await response.json();
      return recording;
    } catch (error) {
      console.error('MusicBrainz recording error:', error);
      return null;
    }
  }

  static async searchByGenre(genre: string, limit: number = 20): Promise<MusicBrainzRecording[]> {
    try {
      const query = `tag:"${genre}"`;
      return await this.searchRecordings(query, limit);
    } catch (error) {
      console.error('MusicBrainz genre search error:', error);
      return [];
    }
  }

  static extractReleaseYear(recording: MusicBrainzRecording): string | null {
    if (!recording.releases || recording.releases.length === 0) {
      return null;
    }

    // Find the earliest release date
    const dates = recording.releases
      .map(release => release.date)
      .filter(date => date)
      .sort();

    if (dates.length === 0) {
      return null;
    }

    // Extract year from date (format: YYYY-MM-DD or just YYYY)
    const firstDate = dates[0]!;
    return firstDate.substring(0, 4);
  }

  static extractGenres(recording: MusicBrainzRecording): string[] {
    if (!recording.tags) {
      return [];
    }

    return recording.tags
      .filter(tag => tag.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(tag => tag.name);
  }
}