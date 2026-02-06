import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Import the SDK service
    const { executeSwap } = await import('../../../src/services/swap/service');

    // Execute the swap
    const result = await executeSwap(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing swap:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to execute swap' },
      { status: 500 }
    );
  }
}
