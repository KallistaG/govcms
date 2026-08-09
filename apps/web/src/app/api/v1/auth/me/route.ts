import { NextResponse } from 'next/server';
import { AuthConfigurationError, ForbiddenError, isAuthConfigurationError, requireAuth } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    return NextResponse.json(user);
  } catch (error: any) {
    if (error instanceof AuthConfigurationError || isAuthConfigurationError(error)) {
      return NextResponse.json({ message: 'Authentication service unavailable' }, { status: 500 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
