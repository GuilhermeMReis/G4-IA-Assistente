import { describe, it, expect } from "vitest";
import { chunkText } from "./chunking";

describe("chunkText", () => {
  it("texto vazio/espacos → []", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("texto curto → um chunk único, trimado", () => {
    expect(chunkText("  Olá mundo.  ")).toEqual(["Olá mundo."]);
  });

  it("nenhum chunk excede maxChars", () => {
    const text = Array.from({ length: 50 }, (_, i) => `Parágrafo ${i} com algum conteúdo relevante sobre negócios.`).join("\n\n");
    const chunks = chunkText(text, { maxChars: 200, overlap: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(200);
  });

  it("chunks consecutivos compartilham overlap", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Frase número ${i} sobre estratégia.`).join(" ");
    const chunks = chunkText(text, { maxChars: 150, overlap: 40 });
    for (let i = 1; i < chunks.length; i++) {
      const tail = chunks[i - 1].slice(-40);
      expect(chunks[i].startsWith(tail.slice(tail.indexOf(" ") + 1).trim().split(" ")[0])).toBe(true);
    }
  });

  it("parágrafo único maior que maxChars é dividido", () => {
    const text = "palavra ".repeat(500);
    const chunks = chunkText(text, { maxChars: 300, overlap: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(300);
  });

  it("hard-split preserva overlap real entre chunks consecutivos (texto longo sem pontuação)", () => {
    // Tokens distintos (não repetitivos) para que uma substring compartilhada só possa
    // existir por causa do overlap de verdade — não por coincidência de padrão repetido
    // (ex.: "palavra ".repeat(n) teria falso positivo mesmo com o overlap zerado).
    const text = Array.from({ length: 3000 }, (_, i) => `palavra${i}`).join(" ");
    const chunks = chunkText(text, { maxChars: 300, overlap: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(300);
    for (let i = 1; i < chunks.length; i++) {
      const head = chunks[i].slice(0, 30);
      expect(head.length).toBe(30);
      expect(chunks[i - 1].includes(head)).toBe(true);
    }
  });
});
