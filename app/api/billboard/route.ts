import { NextRequest, NextResponse } from 'next/server';
import { BillboardAPI } from '@/lib/apis/billboard';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chart = searchParams.get('chart') || 'hot100';
  const genre = searchParams.get('genre');
  const year = searchParams.get('year');

  try {
    let data;

    switch (chart) {
      case 'hot100':
        data = await BillboardAPI.getHot100();
        break;
      case 'greatest':
        data = await BillboardAPI.getGreatestHits();
        break;
      case 'billboard200':
        data = await BillboardAPI.getBillboard200();
        break;
      case 'genre':
        if (!genre) {
          return NextResponse.json(
            { error: 'Genre parameter is required for genre charts' },
            { status: 400 }
          );
        }
        data = await BillboardAPI.getGenreChart(genre);
        break;
      case 'year':
        if (!year) {
          return NextResponse.json(
            { error: 'Year parameter is required for yearly charts' },
            { status: 400 }
          );
        }
        data = await BillboardAPI.searchChartsByYear(parseInt(year, 10));
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid chart type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ chart: data });
  } catch (error) {
    console.error('Billboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Billboard chart data' },
      { status: 500 }
    );
  }
}