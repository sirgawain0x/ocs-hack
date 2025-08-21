export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    release_date: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  preview_url: string | null;
  duration_ms: number;
  popularity: number;
  external_urls: {
    spotify: string;
  };
  uri: string;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  owner: {
    id: string;
    display_name: string;
  };
  tracks: {
    total: number;
    items: SpotifyPlaylistTrack[];
  };
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  track: SpotifyTrack;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  uri: string;
}

export interface SpotifyPlaybackState {
  device: {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
  };
  shuffle_state: boolean;
  repeat_state: string;
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
  timestamp: number;
  context: {
    type: string;
    href: string;
    external_urls: {
      spotify: string;
    };
    uri: string;
  } | null;
}

export interface SpotifyPlayerSDK {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, callback: (data: any) => void): void;
  removeListener(event: string, callback: (data: any) => void): void;
  getCurrentState(): Promise<SpotifyPlaybackState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
  activateElement(): Promise<void>;
}