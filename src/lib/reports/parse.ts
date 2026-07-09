export async function tryExtractPdfText(buffer: Buffer): Promise<string> {
  // Importa "pdf-parse/lib/pdf-parse.js" (não o pacote raiz) porque o index.js do
  // pdf-parse@1.1.1 roda um bloco de "modo debug" (`!module.parent`) como efeito
  // colateral do import, que em bundles serverless quebra e tenta ler um PDF de
  // teste que não existe no build (ENOENT), derrubando a extração inteira.
  const mod = (await import("pdf-parse/lib/pdf-parse.js")) as any;
  const pdfParse = mod.default || mod;
  const result = await pdfParse(buffer);
  return result.text || "";
}

export interface ParsedAgendaEvent {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  company: string;
  customerType: "associado" | "nao_associado";
  room: string;
  participants: number;
  responsible: string;
  amount: number;
  status: "confirmado" | "em_espera" | "cancelado";
  notes: string;
  isGratuity: boolean;
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const MONTH_MAP: Record<string, number> = {
  JANEIRO: 0, FEVEREIRO: 1, MARCO: 2, ABRIL: 3, MAIO: 4, JUNHO: 5,
  JULHO: 6, AGOSTO: 7, SETEMBRO: 8, OUTUBRO: 9, NOVEMBRO: 10, DEZEMBRO: 11
};

const DATE_HEADER_RE = /^(SEGUNDA-FEIRA|TER[ÇC]A-FEIRA|QUARTA-FEIRA|QUINTA-FEIRA|SEXTA-FEIRA|S[ÁA]BADO|DOMINGO),\s*(\d{1,2})\s+DE\s+([A-ZÇÃÁÉÊÍÓÔÕÚ]+)\s+DE\s+(\d{4})/i;
const ROOM_HEADER_RE = /^(\d{1,2})\s*-\s*(.+)$/;
const HORARIO_LABEL_RE = /^Hor[áa]rio$/i;
const TIME_RE = /^\d{2}:\d{2}$/;
const COMPANY_RE = /^(.+?)\s*-\s*(N[ÃA]O\s*ASSOCIADA|ASSOCIADA)\s*$/i;
const TOTAL_RE = /Valor\s+total\s+di[áa]rio\.*:\s*([\d.]+,\d{2})/i;
const PAGE_BREAK_RE = /^--\s*\d+\s*of\s*\d+\s*--$/i;
const STATUS_WORDS = ["RESERVADO", "CANCELADO", "EM ESPERA"];

function toIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function statusFromWord(word: string): "confirmado" | "em_espera" | "cancelado" {
  if (word === "RESERVADO") return "confirmado";
  if (word === "CANCELADO") return "cancelado";
  return "em_espera";
}

/**
 * Parser específico para o relatório "Agendamentos de Salas e Equipamentos" do Supera.
 * Formato: blocos de data > sala > horário, um evento por bloco, sem seção de totais.
 * O pdf-parse (v1, sem dependência nativa) extrai cada rótulo/valor do bloco "Horário"
 * em uma linha separada, por isso os campos são lidos por deslocamento fixo (i+1..i+7).
 * Testado contra um export real de 50 páginas / 306 eventos antes de ir pra produção.
 */
export function parseAgendamentosSalas(rawText: string): { events: ParsedAgendaEvent[]; warnings: string[] } {
  // Nomes de empresa longos quebram a linha bem depois do "-" que antecede
  // ASSOCIADA/NÃO ASSOCIADA (às vezes até em 3 linhas). Junta qualquer linha
  // terminada em "-" com a próxima antes de dividir em linhas, senão o nome
  // da empresa nunca bate com COMPANY_RE e o bloco inteiro vira "título".
  const normalized = rawText
    .replace(/-\s*\n\s*/g, "- ")
    .replace(/N[ÃA]O\s*\n\s*ASSOCIADA/gi, "NÃO ASSOCIADA");
  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !PAGE_BREAK_RE.test(l));

  let currentDateIso: string | null = null;
  let currentRoom: string | null = null;
  const events: ParsedAgendaEvent[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const dateMatch = line.match(DATE_HEADER_RE);
    if (dateMatch) {
      const day = Number(dateMatch[2]);
      const monthKey = stripAccents(dateMatch[3].toUpperCase());
      const month = MONTH_MAP[monthKey];
      const year = Number(dateMatch[4]);
      if (month !== undefined) currentDateIso = toIso(year, month, day);
      continue;
    }

    if (HORARIO_LABEL_RE.test(line)) {
      const startTime = lines[i + 1];
      const endTime = lines[i + 3];
      const participantsStr = lines[i + 7];
      if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
        warnings.push(`Bloco "Horário" com formato inesperado (linha ${i})`);
        continue;
      }
      if (!currentDateIso) { warnings.push(`Horário sem data (linha ${i})`); continue; }

      let j = i + 8;
      const titleLines: string[] = [];
      const noteLines: string[] = [];
      let company = "";
      let customerType: "associado" | "nao_associado" = "associado";
      let responsible = "";
      let total = 0;
      let status: "confirmado" | "em_espera" | "cancelado" = "em_espera";
      let foundCompany = false;
      let foundResponsible = false;
      let consumed = false;

      while (j < lines.length) {
        const l2 = lines[j];
        if (DATE_HEADER_RE.test(l2)) break;

        const companyMatch = l2.match(COMPANY_RE);
        if (!foundCompany && companyMatch) {
          company = companyMatch[1].trim();
          customerType = /N[ÃA]O/i.test(companyMatch[2]) ? "nao_associado" : "associado";
          foundCompany = true;
          j++;
          continue;
        }

        if (foundCompany && !foundResponsible) {
          responsible = l2;
          foundResponsible = true;
          j++;
          continue;
        }

        const totalMatch = l2.match(TOTAL_RE);
        if (totalMatch) {
          total = Number(totalMatch[1].replace(/\./g, "").replace(",", "."));
        }

        const respIndex = l2.indexOf("Resp.:");
        if (respIndex !== -1) {
          const inline = l2.slice(respIndex + "Resp.:".length).trim().toUpperCase();
          if (STATUS_WORDS.includes(inline)) {
            status = statusFromWord(inline);
            j += 1;
          } else {
            const next = lines[j + 1];
            if (next && STATUS_WORDS.includes(next.toUpperCase())) {
              status = statusFromWord(next.toUpperCase());
              j += 2;
            } else {
              j += 1;
            }
          }
          consumed = true;
          break;
        }

        if (!foundCompany) titleLines.push(l2);
        else if (foundResponsible && !totalMatch) noteLines.push(l2);
        j++;
      }

      const title = titleLines.join(" ").trim() || "(sem título)";
      const notes = noteLines.join(" ").trim();

      events.push({
        date: currentDateIso,
        startTime,
        endTime,
        title,
        company,
        customerType,
        room: currentRoom || "",
        participants: Number(participantsStr) || 0,
        responsible,
        amount: total,
        status,
        notes,
        isGratuity: /gratuidade/i.test(title) || /gratuidade/i.test(notes)
      });

      if (!consumed) warnings.push(`Bloco sem "Resp.:" perto da linha ${i} (${titleLines.join(" ")})`);
      i = j - 1;
      continue;
    }

    const roomMatch = line.match(ROOM_HEADER_RE);
    if (roomMatch) {
      currentRoom = `${roomMatch[1]} - ${roomMatch[2]}`.trim();
      continue;
    }
  }

  return { events, warnings };
}

export function summarizeEvents(events: ParsedAgendaEvent[]) {
  const confirmed = events.filter((e) => e.status === "confirmado");
  const pending = events.filter((e) => e.status === "em_espera");
  const canceled = events.filter((e) => e.status === "cancelado");
  return {
    total_events: events.length,
    confirmed_events: confirmed.length,
    pending_events: pending.length,
    canceled_events: canceled.length,
    expected_revenue: events.reduce((sum, e) => sum + e.amount, 0),
    confirmed_revenue: confirmed.reduce((sum, e) => sum + e.amount, 0),
    discounts_applied: 0
  };
}
