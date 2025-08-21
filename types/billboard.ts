export interface BillboardTrack {
  rank: number;
  song: string;
  artist: string;
  'last-week'?: number;
  'peak-pos': number;
  'wks-on-chart': number;
  image?: string;
  award?: string;
}

export interface BillboardChartResponse {
  chart: {
    week: string;
    previousWeek: string;
    songs: BillboardTrack[];
  };
}

export interface BillboardGreatestHit {
  no: number;
  title: string;
  artist: string;
  year?: string;
  peak_position?: number;
  weeks_at_no_1?: number;
  image?: string;
}

export interface BillboardGreatestResponse {
  content: BillboardGreatestHit[];
}

export interface BillboardGenreChart {
  position: number;
  title: string;
  artist: string;
  weeks_on_chart: number;
  last_week_position: number;
  peak_position: number;
  image_url?: string;
}

export interface BillboardGenreResponse {
  chart_name: string;
  chart_date: string;
  songs: BillboardGenreChart[];
}