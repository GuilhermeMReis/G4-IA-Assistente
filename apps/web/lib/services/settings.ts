import { eq } from "drizzle-orm";
import { settings } from "@/lib/db/schema";
import { encrypt, decrypt } from "@/lib/crypto";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import type { Db } from "@/lib/db";

async function getRow(db: Db) {
  return (await db.select().from(settings).where(eq(settings.id, 1)))[0] ?? null;
}

async function upsert(db: Db, values: Partial<typeof settings.$inferInsert>) {
  await db.insert(settings).values({ id: 1, ...values })
    .onConflictDoUpdate({ target: settings.id, set: { ...values, updatedAt: new Date() } });
}

export async function getSettings(db: Db) {
  const row = await getRow(db);
  return {
    defaultModel: row?.defaultModel ?? DEFAULT_MODEL,
    setupCompleted: row?.setupCompleted ?? false,
    hasKey: Boolean(row?.openaiKeyEncrypted),
  };
}

export async function saveOpenAIKey(db: Db, key: string) {
  if (!key.trim()) throw new Error("Chave OpenAI vazia");
  await upsert(db, { openaiKeyEncrypted: encrypt(key.trim()) });
}

export async function getOpenAIKey(db: Db): Promise<string> {
  const row = await getRow(db);
  if (!row?.openaiKeyEncrypted) throw new Error("Chave OpenAI não configurada");
  return decrypt(row.openaiKeyEncrypted);
}

export async function setDefaultModel(db: Db, model: string) {
  if (!model.trim()) throw new Error("Modelo inválido");
  await upsert(db, { defaultModel: model.trim() });
}

export async function markSetupCompleted(db: Db) {
  await upsert(db, { setupCompleted: true });
}
