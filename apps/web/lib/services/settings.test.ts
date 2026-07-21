import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb, truncateAll } from "@/test/helpers/db";
import { getSettings, saveOpenAIKey, getOpenAIKey, setDefaultModel } from "./settings";

describe.skipIf(!process.env.TEST_DATABASE_URL)("settings", () => {
  beforeEach(async () => {
    process.env.ENCRYPTION_KEY = "b".repeat(64);
    await truncateAll();
  });

  it("retorna defaults quando não há linha", async () => {
    const db = await getTestDb();
    const s = await getSettings(db);
    expect(s.setupCompleted).toBe(false);
    expect(s.hasKey).toBe(false);
    expect(s.defaultModel).toBe("gpt-5-mini");
  });

  it("salva chave criptografada e lê descriptografada", async () => {
    const db = await getTestDb();
    await saveOpenAIKey(db, "sk-abc");
    expect(await getOpenAIKey(db)).toBe("sk-abc");
    const s = await getSettings(db);
    expect(s.hasKey).toBe(true);
  });

  it("getOpenAIKey lança quando não configurada", async () => {
    const db = await getTestDb();
    await expect(getOpenAIKey(db)).rejects.toThrow(/não configurada/);
  });

  it("setDefaultModel rejeita vazio", async () => {
    const db = await getTestDb();
    await expect(setDefaultModel(db, " ")).rejects.toThrow();
    await setDefaultModel(db, "gpt-4o");
    expect((await getSettings(db)).defaultModel).toBe("gpt-4o");
  });
});
