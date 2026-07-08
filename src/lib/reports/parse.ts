export async function tryExtractPdfText(buffer: Buffer): Promise<string> {
  try {
    const mod = (await import("pdf-parse")) as any;
    const pdfParse = mod.default || mod;
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  } catch {
    return "";
  }
}

function parseCurrency(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1].replace(/\./g, "").replace(",", ".")) || 0;
  }
  return 0;
}

function parseInteger(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1].replace(/\D/g, "")) || 0;
  }
  return 0;
}

export function parseSummary(text: string) {
  return {
    total_events: parseInteger(text, [/total\s+de\s+eventos\D+(\d+)/i, /eventos\D+(\d+)/i]),
    confirmed_events: parseInteger(text, [/confirmad[oa]s?\D+(\d+)/i]),
    pending_events: parseInteger(text, [/em\s+espera\D+(\d+)/i, /pendentes?\D+(\d+)/i]),
    canceled_events: parseInteger(text, [/cancelad[oa]s?\D+(\d+)/i]),
    expected_revenue: parseCurrency(text, [/faturamento\s+previsto\D+([\d.]+,\d{2})/i]),
    confirmed_revenue: parseCurrency(text, [/receita\s+confirmada\D+([\d.]+,\d{2})/i]),
    discounts_applied: parseCurrency(text, [/descontos?\s+aplicados?\D+([\d.]+,\d{2})/i])
  };
}
