type Opts = { maxChars?: number; overlap?: number };

export function chunkText(text: string, opts: Opts = {}): string[] {
  const maxChars = opts.maxChars ?? 1800;
  const overlap = opts.overlap ?? 200;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // quebra em unidades: parágrafos; parágrafos grandes viram frases; frases grandes viram fatias duras
  const units: string[] = [];
  for (const para of normalized.split(/\n{2,}/)) {
    const p = para.trim();
    if (!p) continue;
    if (p.length <= maxChars) { units.push(p); continue; }
    for (const sentence of p.split(/(?<=[.!?])\s+/)) {
      if (sentence.length <= maxChars) units.push(sentence);
      else for (let i = 0; i < sentence.length; i += maxChars) units.push(sentence.slice(i, i + maxChars));
    }
  }

  const chunks: string[] = [];
  let atual = "";
  for (const unit of units) {
    const candidato = atual ? `${atual}\n${unit}` : unit;
    if (candidato.length <= maxChars) { atual = candidato; continue; }
    if (atual) chunks.push(atual);
    // overlap: começa o próximo chunk com o final do anterior (sem cortar palavra)
    const tail = atual.slice(-overlap);
    const overlapText = tail.includes(" ") ? tail.slice(tail.indexOf(" ") + 1) : tail;
    atual = overlapText ? `${overlapText.trim()}\n${unit}`.slice(-maxChars) : unit;
    if (atual.length > maxChars) atual = unit.slice(0, maxChars);
  }
  if (atual) chunks.push(atual);
  return chunks;
}
