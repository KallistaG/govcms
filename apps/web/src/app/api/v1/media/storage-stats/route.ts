import { GET as StorageGET } from '../storage/route';

export async function GET(request: Request) {
  return StorageGET(request);
}
