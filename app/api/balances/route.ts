import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account_id, tokens } = body;

    if (!account_id) {
      return NextResponse.json(
        { success: false, error: 'account_id is required' },
        { status: 400 }
      );
    }

    // Import the SDK service
    const { getBalances } = await import('../../../src/services/balance/balances');

    // Get balances for the account
    const balances = await getBalances({
      account_id,
      tokens: tokens || undefined,
    });

    return NextResponse.json({ success: true, data: balances });
  } catch (error) {
    console.error('Error fetching balances:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}
