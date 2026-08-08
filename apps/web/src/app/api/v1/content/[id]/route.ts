import { GET as ContentItemGET, PUT as ContentItemPUT, DELETE as ContentItemDELETE } from '../../contents/[id]/route';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return ContentItemGET(request, context);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return ContentItemPUT(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return ContentItemPUT(request, context);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return ContentItemDELETE(request, context);
}
