import { saveUpload, CHAT_MIMES } from "@/lib/files/storage";
import { apiHandler, requireSession } from "@/lib/services/guards";

export const POST = apiHandler(async (req) => {
  await requireSession();
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return Response.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const { storedName } = await saveUpload(buf, file.name, file.type, CHAT_MIMES);
  return Response.json({ url: `/api/files/${storedName}`, mediaType: file.type, filename: file.name });
});
