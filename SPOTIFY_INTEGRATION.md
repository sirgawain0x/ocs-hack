# Spotify Integration for Music Trivia Game

This document explains the Spotify Web API and Spotify Player SDK integration for the music trivia game, which uses the Top Global playlist to generate questions.

## Features

- **Spotify Web API Integration**: Fetches tracks from Spotify's Top Global playlist
- **Spotify Player SDK**: Provides real-time playback control and audio streaming
- **OAuth Authentication**: Secure user authentication with Spotify
- **Real-time Music Data**: Questions generated from current global hits
- **Enhanced Audio Experience**: Full Spotify playback integration

## Setup Instructions

### 1. Spotify Developer Account

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use an existing one
3. Note down your `Client ID` and `Client Secret`

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Spotify API Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Public Client ID for frontend
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
```

### 3. Spotify App Configuration

In your Spotify Developer Dashboard:

1. **Redirect URIs**: Add `http://localhost:3000/spotify-callback` (for development)
2. **Scopes**: Ensure your app has the following scopes:
   - `user-read-private`
   - `user-read-email`
   - `user-read-playback-state`
   - `user-modify-playback-state`
   - `user-read-currently-playing`
   - `streaming`
   - `playlist-read-private`
   - `playlist-read-collaborative`

## Components Overview

### 1. SpotifyAuth Component (`components/spotify/SpotifyAuth.tsx`)

Handles user authentication with Spotify:
- OAuth flow implementation
- Spotify Player SDK initialization
- User profile fetching
- Playback state management

### 2. SpotifyPlayer Component (`components/spotify/SpotifyPlayer.tsx`)

Provides playback control:
- Track playback
- Volume control
- Progress tracking
- Playback state synchronization

### 3. SpotifyTriviaGame Component (`components/game/SpotifyTriviaGame.tsx`)

Main game component that integrates Spotify:
- Question generation from Top Global playlist
- Spotify authentication flow
- Game state management
- Score tracking

## API Integration

### SpotifyAPI Class (`lib/apis/spotify.ts`)

Enhanced with new methods:

```typescript
// Get Top Global playlist tracks
static async getTopGlobalTracks(limit: number = 50): Promise<SpotifyTrack[]>

// Get playlist by ID
static async getPlaylist(playlistId: string, useUserToken: boolean = false): Promise<SpotifyPlaylist | null>

// Get playlist tracks
static async getPlaylistTracks(playlistId: string, limit: number = 50, offset: number = 0, useUserToken: boolean = false): Promise<SpotifyPlaylistTrack[]>

// User playback control
static async playTrack(trackUri: string): Promise<boolean>
static async pausePlayback(): Promise<boolean>
static async getCurrentPlayback(): Promise<any>
```

### Question Generator (`lib/game/questionGenerator.ts`)

New method for Top Global playlist:

```typescript
static async generateTopGlobalQuestionSet(
  count: number = 10,
  difficulty: DifficultyLevel = 'medium',
  questionTypes?: QuestionType[]
): Promise<TriviaQuestion[]>
```

## Usage

### 1. Access the Spotify Trivia Game

Navigate to `/spotify-trivia` to access the dedicated Spotify trivia game.

### 2. Authentication Flow

1. Click "Connect Spotify Account"
2. Authorize the application in Spotify
3. Return to the game with authenticated session

### 3. Game Features

- **Question Types**: Name that tune, artist match, release year, genre classification
- **Difficulty Levels**: Easy, Medium, Hard, Expert
- **Question Count**: 5, 10, 15, or 20 questions
- **Real-time Playback**: Control Spotify playback during the game

## Top Global Playlist

The game uses Spotify's Top Global playlist (ID: `37i9dQZEVXbNG2KDcFcKOF`) which features:
- Current global hits
- Real-time popularity data
- International music selection
- Regular updates

## Technical Implementation

### Authentication Flow

1. **Client-side OAuth**: Uses implicit grant flow for frontend applications
2. **Token Management**: Automatically handles access token storage and refresh
3. **Player SDK**: Initializes Spotify Web Playback SDK for enhanced control

### Data Flow

1. **Playlist Fetching**: Retrieves tracks from Top Global playlist
2. **Question Generation**: Creates trivia questions from track metadata
3. **Audio Integration**: Uses Spotify preview URLs or full playback
4. **Score Tracking**: Tracks user performance and accuracy

### Error Handling

- Network connectivity issues
- Spotify API rate limiting
- Authentication failures
- Playback errors
- Fallback to local questions when APIs fail

## Security Considerations

- Client credentials stored securely in environment variables
- OAuth tokens handled client-side only
- No sensitive data stored in localStorage
- Secure redirect URI validation

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check redirect URI configuration
   - Verify client ID and secret
   - Ensure proper scopes are set

2. **Playback Not Working**
   - Verify user has Spotify Premium (required for playback control)
   - Check device activation
   - Ensure Spotify app is running

3. **Questions Not Loading**
   - Check Spotify API rate limits
   - Verify playlist access permissions
   - Check network connectivity

### Debug Mode

Enable console logging to debug issues:

```typescript
// In SpotifyAPI class
console.log('Spotify API calls:', response);
```

## Future Enhancements

- **Multiple Playlists**: Support for different music genres
- **Collaborative Playlists**: User-created playlist support
- **Advanced Analytics**: Detailed performance tracking
- **Social Features**: Share scores and achievements
- **Offline Mode**: Cached questions for offline play

## API Rate Limits

- **Spotify Web API**: 25 requests per second
- **Playlist Tracks**: 100 tracks per request
- **Search API**: 100 requests per second

## Support

For issues related to Spotify integration:
1. Check Spotify Developer Documentation
2. Verify API credentials and permissions
3. Test with Spotify's API console
4. Review browser console for errors
