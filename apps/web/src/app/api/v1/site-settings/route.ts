import { NextResponse } from 'next/server';
import { getWebsiteSettings, updateWebsiteSettings } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { requireSettingsAccess, sanitizeSensitiveKeys } from '@/lib/admin-rbac';
import { writeAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    requireSettingsAccess(await requireAuth(request));
    const settings = await getWebsiteSettings();
    return NextResponse.json(sanitizeSensitiveKeys(settings));
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    console.error('[API_ERROR] GET /api/v1/site-settings:', error);
    return NextResponse.json({ message: 'Failed to fetch site settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const actor = requireSettingsAccess(await requireAuth(request));
    const body = (await request.json()) as Record<string, unknown>;
    const updated = await updateWebsiteSettings(body as any);

    await writeAuditLog({
      actor,
      request,
      action: 'SETTINGS_CHANGED',
      entityType: 'WebsiteSettings',
      entityId: updated.id || null,
      metadata: sanitizeSensitiveKeys({
        siteName: updated.siteName,
        maintenanceMode: updated.maintenanceMode,
      }),
    });

    return NextResponse.json(sanitizeSensitiveKeys(updated));
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    console.error('[API_ERROR] PUT /api/v1/site-settings:', error);
    return NextResponse.json({ message: 'Failed to update site settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
