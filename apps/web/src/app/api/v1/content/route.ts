import { GET as ContentsGET, POST as ContentsPOST } from '../contents/route';

export async function GET(request: Request) {
  return ContentsGET(request);
}

export async function POST(request: Request) {
  return ContentsPOST(request);
}
