'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, CheckCircle } from 'lucide-react';

export default function SpotifyCallback() {
  useEffect(() => {
    // Handle the OAuth callback
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (accessToken) {
      // Store the token and redirect back to the main app
      localStorage.setItem('spotify_access_token', accessToken);
      
      // Redirect back to the main page
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } else if (error) {
      console.error('Spotify auth error:', error);
    }
  }, []);

  const handleRetry = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Spotify Authorization
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Successfully connected to Spotify!</span>
          </div>
          
          <p className="text-gray-600 text-sm">
            You will be redirected back to the game in a few seconds...
          </p>
          
          <div className="flex justify-center">
            <Button onClick={handleRetry} variant="outline">
              Return to Game Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
