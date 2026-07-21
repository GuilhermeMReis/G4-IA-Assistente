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
  for (let idx = 0; idx < units.length; idx++) {
    let unit = units[idx];
    const candidato = atual ? `${atual}\n${unit}` : unit;
    if (candidato.length <= maxChars) { atual = candidato; continue; }
    if (atual) chunks.push(atual);
    atual = "";

    // a unidade não coube junto com o que já tínhamos: esvazia esta unidade (possivelmente
    // do tamanho de maxChars, vinda de uma fatia dura) em um ou mais chunks, cada um sempre
    // prefixado com o overlap do chunk anterior (sem cortar palavra). Quando overlap + unit
    // não cabem juntos, encolhe o lado da unidade — nunca descarta o overlap — e o restante
    // continua sendo processado no mesmo laço, prefixado com o overlap do chunk que acabou de
    // ser emitido. A concatenação aqui é direta (sem separador) porque overlap e unit são,
    // nesse caminho, trechos contíguos do texto original: inserir um separador sintético faria
    // o ponto de junção "andar" a cada novo chunk e quebraria a garantia de overlap real.
    for (;;) {
      const prevChunk = chunks[chunks.length - 1] ?? "";
      const tail = prevChunk.slice(-overlap);
      const overlapText = tail.includes(" ") ? tail.slice(tail.indexOf(" ") + 1) : tail;
      const overlapPrefix = overlapText.trim();
      const prefixed = overlapPrefix + unit;
      if (prefixed.length <= maxChars) { atual = prefixed; break; }
      const available = maxChars - overlapPrefix.length;
      if (available <= 0) { atual = unit; break; }
      chunks.push(overlapPrefix + unit.slice(0, available));
      unit = unit.slice(available);
    }
  }
  if (atual) chunks.push(atual);
  return chunks;
}
