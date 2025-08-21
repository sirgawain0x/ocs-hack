export interface MusicBrainzRecording {
  id: string;
  title: string;
  length?: number;
  disambiguation?: string;
  'artist-credit': Array<{
    name: string;
    artist: {
      id: string;
      name: string;
      'sort-name': string;
    };
  }>;
  releases?: Array<{
    id: string;
    title: string;
    date?: string;
    'release-group'?: {
      id: string;
      title: string;
      'primary-type'?: string;
      'secondary-types'?: string[];
    };
  }>;
  tags?: Array<{
    count: number;
    name: string;
  }>;
}

export interface MusicBrainzSearchResponse {
  recordings: MusicBrainzRecording[];
  count: number;
  offset: number;
}

export interface MusicBrainzArtist {
  id: string;
  name: string;
  'sort-name': string;
  disambiguation?: string;
  'life-span'?: {
    begin?: string;
    end?: string;
  };
  country?: string;
  area?: {
    id: string;
    name: string;
  };
  tags?: Array<{
    count: number;
    name: string;
  }>;
}