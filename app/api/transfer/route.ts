import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Import the SDK service
    const { executeTransfer } = await import('../../../src/services/transfer/service');

    // Execute the transfer
    const result = await executeTransfer(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing transfer:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to execute transfer' },
      { status: 500 }
    );
  }
}
