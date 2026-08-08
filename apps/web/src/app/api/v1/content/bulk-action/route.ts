import { POST as BulkPOST } from '../../contents/bulk/route';

export async function POST(request: Request) {
  return BulkPOST(request);
}
