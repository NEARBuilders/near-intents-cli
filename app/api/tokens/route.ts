import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Import the SDK service
    const { listTokens } = await import('../../../src/services/tokens/service');

    // List tokens from the service
    const tokens = await listTokens();

    // Filter by search if provided
    let result = tokens;
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = tokens.filter(
        (token: any) =>
          token.symbol?.toLowerCase().includes(lowerSearch) ||
          token.name?.toLowerCase().includes(lowerSearch) ||
          token.address?.toLowerCase().includes(lowerSearch)
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
