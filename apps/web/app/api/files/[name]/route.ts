import { readUpload } from "@/lib/files/storage";
import { apiHandler, requireSession } from "@/lib/services/guards";

export const GET = apiHandler(async (_req, { params }) => {
  await requireSession();
  const { name } = await params;
  const { buf, mime } = await readUpload(name);
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600" },
  });
});
