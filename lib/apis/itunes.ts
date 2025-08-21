export class ITunesAPI {
  static async searchPreviewByArtistAndTitle(artist: string, title: string): Promise<string | undefined> {
    if (!artist && !title) return undefined;
    const term = encodeURIComponent(`${artist} ${title}`.trim());
    const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=5`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return undefined;
      const data = await res.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      const match = results.find((r: unknown) => r && typeof r === 'object' && 'previewUrl' in r);
      return match?.previewUrl as string | undefined;
    } catch {
      return undefined;
    }
  }
}


