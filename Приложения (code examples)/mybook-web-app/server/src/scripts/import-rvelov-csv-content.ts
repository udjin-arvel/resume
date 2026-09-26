/**
 * Import lore items, notes and notions from old-schema CSV dump.
 *
 * Usage (from server/):
 *   npx tsx src/scripts/import-rvelov-csv-content.ts
 *   npx tsx src/scripts/import-rvelov-csv-content.ts --dry-run
 *   npx tsx src/scripts/import-rvelov-csv-content.ts --csv ../.project/rvelov_db.csv
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NotionType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AUTHOR_LOGIN = 'arvelov';
const DEFAULT_NOTE_PRICE = 10;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV = path.resolve(__dirname, '../../../.project/rvelov_db.csv');

type Row = Record<string, string>;

type SectionKind = 'lore' | 'notes' | 'notions' | 'unknown';

interface Section {
  kind: SectionKind;
  header: string[];
  rows: Row[];
}

const NOTION_TYPE_MAP: Record<string, NotionType> = {
  definition: NotionType.DEFINITION,
  character: NotionType.CHARACTER,
  place: NotionType.PLACE,
  object: NotionType.OBJECT,
  entity: NotionType.ENTITY,
  event: NotionType.EVENT,
};

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }

    if (c === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (c === '\n' || (c === '\r' && next === '\n')) {
      if (c === '\r') i++;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    if (c === '\r') {
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += c;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

function detectKind(header: string[]): SectionKind {
  // notions: has type + poster + is_public
  if (header.includes('type') && header.includes('poster') && header.includes('is_public')) {
    return 'notions';
  }
  // notes: has importance / is_additional_content, no poster/deleted_at
  if (header.includes('importance') || header.includes('is_additional_content')) {
    return 'notes';
  }
  // lore: title/text/poster/is_public/level, no type
  if (
    header.includes('poster') &&
    header.includes('is_public') &&
    header.includes('level') &&
    !header.includes('type')
  ) {
    return 'lore';
  }
  return 'unknown';
}

function splitSections(matrix: string[][]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const cells of matrix) {
    if (cells[0] === 'id' && cells.length > 1) {
      if (current) sections.push(current);
      const header = cells.map((h) => h.trim());
      current = { kind: detectKind(header), header, rows: [] };
      continue;
    }
    if (!current) continue;

    const row: Row = {};
    current.header.forEach((key, i) => {
      row[key] = cells[i] ?? '';
    });
    current.rows.push(row);
  }

  if (current) sections.push(current);
  return sections;
}

function nullish(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toUpperCase() === 'NULL') return null;
  return trimmed;
}

function parseBool(value: string | null, fallback = true): boolean {
  if (value == null) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

function parseIntOrNull(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cleanHtml(html: string | null): string | null {
  if (!html) return null;

  let out = html
    .replace(/\s*style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/<span\b[^>]*\bclass\s*=\s*["']?ql-cursor["']?[^>]*>[\s\uFEFF]*<\/span>/gi, '')
    .replace(/<span\b([^>]*)>\s*<\/span>/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+>/g, '>')
    .replace(/>\s+</g, '><')
    .trim();

  for (let i = 0; i < 3; i++) {
    const next = out.replace(/<span\b([^>]*)>\s*<\/span>/gi, '');
    if (next === out) break;
    out = next;
  }

  return out || null;
}

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function mapNotionType(type: string | null): NotionType {
  if (!type) {
    throw new Error('Notion type is required');
  }
  const mapped = NOTION_TYPE_MAP[type.toLowerCase()];
  if (!mapped) {
    throw new Error(`Unknown notion type: ${type}`);
  }
  return mapped;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const csvPath = path.resolve(getArg('--csv') ?? DEFAULT_CSV);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const sections = splitSections(parseCsv(fs.readFileSync(csvPath, 'utf8')));
  const lore = sections.find((s) => s.kind === 'lore');
  const notes = sections.find((s) => s.kind === 'notes');
  const notions = sections.find((s) => s.kind === 'notions');

  if (!lore || !notes || !notions) {
    throw new Error(
      `Expected lore/notes/notions sections, got: ${sections.map((s) => s.kind).join(', ')}`
    );
  }

  const author = await prisma.user.findUnique({ where: { login: AUTHOR_LOGIN } });
  if (!author) {
    throw new Error(`User "${AUTHOR_LOGIN}" not found. Create/seed it first.`);
  }

  const existingLoreTitles = new Set(
    (
      await prisma.loreItem.findMany({
        where: { userId: author.id },
        select: { title: true },
      })
    ).map((item) => item.title)
  );
  const existingNotionTitles = new Set(
    (
      await prisma.notion.findMany({
        where: { userId: author.id },
        select: { title: true },
      })
    ).map((item) => item.title)
  );

  const skipped = {
    lore: [] as string[],
    notions: [] as string[],
  };
  let created = { lore: 0, notes: 0, notions: 0 };

  console.log('CSV sections:', {
    lore: lore.rows.length,
    notes: notes.rows.length,
    notions: notions.rows.length,
  });
  console.log('Author:', author.login, `(id=${author.id})`);
  console.log(dryRun ? 'Mode: DRY RUN' : 'Mode: WRITE');

  // --- Lore ---
  for (const row of lore.rows) {
    if (nullish(row.deleted_at) != null) {
      skipped.lore.push(`${row.title} (deleted)`);
      continue;
    }

    const title = row.title?.trim();
    if (!title) continue;

    if (existingLoreTitles.has(title)) {
      skipped.lore.push(`${title} (exists)`);
      continue;
    }

    const text = cleanHtml(nullish(row.text)) ?? '';
    if (dryRun) {
      console.log('[dry] lore+', title);
      created.lore++;
      existingLoreTitles.add(title);
      continue;
    }

    await prisma.loreItem.create({
      data: {
        title,
        text,
        poster: null,
        isPublic: parseBool(nullish(row.is_public)),
        accessLevel: parseIntOrNull(nullish(row.level)) ?? 1,
        userId: author.id,
        createdAt: parseDate(nullish(row.created_at)),
        updatedAt: parseDate(nullish(row.updated_at)),
      },
    });
    existingLoreTitles.add(title);
    created.lore++;
    console.log('lore+', title);
  }

  // --- Notes (always create; no title skip) ---
  for (const row of notes.rows) {
    const title = row.title?.trim();
    if (!title) continue;

    const text = cleanHtml(nullish(row.text)) ?? '';
    const importance = parseIntOrNull(nullish(row.importance)) ?? 5;
    const isContent = parseBool(nullish(row.is_additional_content), false);

    if (dryRun) {
      console.log('[dry] note+', title, { importance, isContent });
      created.notes++;
      continue;
    }

    await prisma.note.create({
      data: {
        title,
        text,
        poster: null,
        importance,
        isContent,
        price: DEFAULT_NOTE_PRICE,
        userId: author.id,
        createdAt: parseDate(nullish(row.created_at)),
        updatedAt: parseDate(nullish(row.updated_at)),
      },
    });
    created.notes++;
    console.log('note+', title);
  }

  // --- Notions ---
  for (const row of notions.rows) {
    if (nullish(row.deleted_at) != null) {
      skipped.notions.push(`${row.title} (deleted)`);
      continue;
    }

    const title = row.title?.trim();
    if (!title) continue;

    if (existingNotionTitles.has(title)) {
      skipped.notions.push(`${title} (exists)`);
      continue;
    }

    const type = mapNotionType(nullish(row.type));
    const text = cleanHtml(nullish(row.text)) ?? '';

    if (dryRun) {
      console.log('[dry] notion+', title, { type });
      created.notions++;
      existingNotionTitles.add(title);
      continue;
    }

    await prisma.notion.create({
      data: {
        title,
        text,
        type,
        poster: null,
        isPublic: parseBool(nullish(row.is_public)),
        accessLevel: parseIntOrNull(nullish(row.level)) ?? 1,
        userId: author.id,
        createdAt: parseDate(nullish(row.created_at)),
        updatedAt: parseDate(nullish(row.updated_at)),
      },
    });
    existingNotionTitles.add(title);
    created.notions++;
    console.log('notion+', title);
  }

  console.log('\nDone.');
  console.log({ created, skipped });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
