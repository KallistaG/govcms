import { GET as MediaItemGET, PUT as MediaItemPUT, DELETE as MediaItemDELETE } from '../../[id]/route';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return MediaItemGET(request, context);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return MediaItemPUT(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return MediaItemPUT(request, context);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return MediaItemDELETE(request, context);
}
