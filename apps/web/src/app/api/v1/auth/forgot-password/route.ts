import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const resetToken = 'demo-reset-token-12345';
    const resetUrl = `http://localhost:3000/admin/reset-password?token=${resetToken}`;

    return NextResponse.json({
      message: `Password reset instructions sent to ${email}`,
      resetToken,
      resetUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
