import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Import the SDK service
    const { executeDeposit } = await import('../../../src/services/deposit/service');

    // Execute the deposit
    const result = await executeDeposit(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing deposit:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to execute deposit' },
      { status: 500 }
    );
  }
}
