import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Import the SDK service
    const { executeWithdraw } = await import('../../../src/services/withdraw/service');

    // Execute the withdraw
    const result = await executeWithdraw(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing withdraw:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to execute withdraw' },
      { status: 500 }
    );
  }
}
