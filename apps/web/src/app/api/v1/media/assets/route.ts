import { GET as MediaGET, POST as MediaPOST } from '../route';

export async function GET(request: Request) {
  return MediaGET(request);
}

export async function POST(request: Request) {
  return MediaPOST(request);
}
