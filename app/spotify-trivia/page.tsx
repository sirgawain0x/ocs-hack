'use client';

import SpotifyTriviaGame from '@/components/game/SpotifyTriviaGame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Music, Globe, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function SpotifyTriviaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Main</span>
              </Button>
            </Link>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <Music className="h-8 w-8 text-green-500" />
                <h1 className="text-3xl font-bold text-gray-800">
                  Spotify Music Trivia
                </h1>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-gray-600">
                Test your knowledge of the world's most popular songs
              </p>
            </div>
            
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Music className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg text-gray-800">Top Global Hits</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm">
                Questions generated from Spotify's Top Global playlist featuring the most popular songs worldwide
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg text-gray-800">Real-time Data</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm">
                Get the latest trending songs and artists as they climb the global charts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg text-gray-800">Global Music</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm">
                Discover music from around the world and test your knowledge of international hits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Game Component */}
        <SpotifyTriviaGame />
      </div>
    </main>
  );
}
