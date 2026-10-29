/**
 * Import compositions, stories and fragments from old-schema CSV dump.
 *
 * Usage (from server/):
 *   npx tsx src/scripts/import-rvelov-csv-stories.ts
 *   npx tsx src/scripts/import-rvelov-csv-stories.ts --dry-run
 *   npx tsx src/scripts/import-rvelov-csv-stories.ts --csv ../.project/rvelov_db.csv
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CompositionType,
  PrismaClient,
  StoryType,
} from '@prisma/client';

const prisma = new PrismaClient();

const AUTHOR_LOGIN = 'arvelov';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV = path.resolve(__dirname, '../../../.project/rvelov_db.csv');

type Row = Record<string, string>;

interface Section {
  kind: 'compositions' | 'fragments' | 'stories' | 'unknown';
  header: string[];
  rows: Row[];
}

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

function detectKind(header: string[]): Section['kind'] {
  if (header.includes('description') && header.includes('poster') && header.includes('era')) {
    return 'compositions';
  }
  if (header.includes('story_id') && header.includes('text') && header.includes('order')) {
    return 'fragments';
  }
  if (header.includes('composition_id') && header.includes('epigraph')) {
    return 'stories';
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

function parseNames(raw: string | null): string[] | null {
  if (!raw) return null;

  let s = raw.trim();
  // Dump may wrap JSON in extra quotes: """[\"A\"]"""
  while (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    s = s.slice(1, -1);
  }
  s = s.replace(/\\"/g, '"');

  try {
    const parsed = JSON.parse(s);
    if (!Array.isArray(parsed)) return null;
    const names = parsed.map((item) => String(item).trim()).filter(Boolean);
    return names.length ? names : null;
  } catch {
    return null;
  }
}

function mapStoryType(type: string | null): StoryType {
  if (type === 'announce') return StoryType.ANNOUNCEMENT;
  return StoryType.STORY;
}

/** Strip inline style attributes and Quill cursor artifacts; collapse empty spans. */
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

  // Second pass: nested empty spans left after style removal
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

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const csvPath = path.resolve(getArg('--csv') ?? DEFAULT_CSV);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const sections = splitSections(parseCsv(fs.readFileSync(csvPath, 'utf8')));
  const compositions = sections.find((s) => s.kind === 'compositions');
  const fragments = sections.find((s) => s.kind === 'fragments');
  const stories = sections.find((s) => s.kind === 'stories');

  if (!compositions || !fragments || !stories) {
    throw new Error(
      `Expected compositions/fragments/stories sections, got: ${sections.map((s) => s.kind).join(', ')}`
    );
  }

  const author = await prisma.user.findUnique({ where: { login: AUTHOR_LOGIN } });
  if (!author) {
    throw new Error(`User "${AUTHOR_LOGIN}" not found. Create/seed it first.`);
  }

  const existingCompositions = await prisma.composition.findMany({
    where: { userId: author.id },
    select: { id: true, title: true },
  });
  const existingStories = await prisma.story.findMany({
    where: { userId: author.id },
    select: { id: true, title: true },
  });
  const existingCompositionTitles = new Set(existingCompositions.map((c) => c.title));
  const existingStoryTitles = new Set(existingStories.map((s) => s.title));

  const compositionIdMap = new Map<number, number>();
  const storyIdMap = new Map<number, number>();
  /** Only stories created in this run get fragments imported. */
  const newlyCreatedStoryOldIds = new Set<number>();
  const skipped = {
    compositions: [] as string[],
    stories: [] as string[],
    fragments: 0,
  };

  console.log('CSV sections:', {
    compositions: compositions.rows.length,
    stories: stories.rows.length,
    fragments: fragments.rows.length,
  });
  console.log('Author:', author.login, `(id=${author.id})`);
  console.log(dryRun ? 'Mode: DRY RUN' : 'Mode: WRITE');

  // --- Compositions ---
  for (const row of compositions.rows) {
    if (nullish(row.deleted_at) != null) {
      skipped.compositions.push(`${row.title} (deleted)`);
      continue;
    }

    const title = row.title?.trim();
    if (!title) continue;

    if (existingCompositionTitles.has(title)) {
      skipped.compositions.push(`${title} (exists)`);
      const existing = existingCompositions.find((c) => c.title === title);
      if (existing) compositionIdMap.set(Number(row.id), existing.id);
      continue;
    }

    if (dryRun) {
      console.log('[dry] composition+', title);
      compositionIdMap.set(Number(row.id), -Number(row.id));
      continue;
    }

    const created = await prisma.composition.create({
      data: {
        title,
        description: cleanHtml(nullish(row.description)),
        // poster not copied — leave null (optional field)
        poster: null,
        type: CompositionType.BOOK,
        isPublic: parseBool(nullish(row.is_public)),
        userId: author.id,
        createdAt: parseDate(nullish(row.created_at)),
        updatedAt: parseDate(nullish(row.updated_at)),
      },
    });
    compositionIdMap.set(Number(row.id), created.id);
    existingCompositionTitles.add(title);
    console.log('composition+', created.id, title);
  }

  // --- Stories ---
  for (const row of stories.rows) {
    if (nullish(row.deleted_at) != null) {
      skipped.stories.push(`${row.title} (deleted)`);
      continue;
    }

    const title = row.title?.trim();
    if (!title) continue;

    if (existingStoryTitles.has(title)) {
      skipped.stories.push(`${title} (exists)`);
      continue;
    }

    const oldCompId = parseIntOrNull(nullish(row.composition_id));
    const compositionId =
      oldCompId != null ? compositionIdMap.get(oldCompId) ?? null : null;

    if (dryRun) {
      console.log('[dry] story+', title, {
        type: mapStoryType(nullish(row.type)),
        compositionId,
      });
      storyIdMap.set(Number(row.id), -Number(row.id));
      newlyCreatedStoryOldIds.add(Number(row.id));
      continue;
    }

    const created = await prisma.story.create({
      data: {
        title,
        epigraph: nullish(row.epigraph),
        type: mapStoryType(nullish(row.type)),
        isPublic: parseBool(nullish(row.is_public)),
        accessLevel: parseIntOrNull(nullish(row.level)) ?? 1,
        chapter: parseIntOrNull(nullish(row.chapter)),
        notes: parseNames(nullish(row.names)) ?? undefined,
        compositionId: compositionId != null && compositionId > 0 ? compositionId : null,
        userId: author.id,
        createdAt: parseDate(nullish(row.created_at)),
        updatedAt: parseDate(nullish(row.updated_at)),
      },
    });
    storyIdMap.set(Number(row.id), created.id);
    newlyCreatedStoryOldIds.add(Number(row.id));
    existingStoryTitles.add(title);
    console.log('story+', created.id, title);
  }

  // --- Fragments ---
  const byStory = new Map<number, Row[]>();
  for (const row of fragments.rows) {
    if (nullish(row.deleted_at) != null) {
      skipped.fragments++;
      continue;
    }

    const oldStoryId = Number(row.story_id);
    if (!newlyCreatedStoryOldIds.has(oldStoryId)) {
      skipped.fragments++;
      continue;
    }

    const list = byStory.get(oldStoryId) ?? [];
    list.push(row);
    byStory.set(oldStoryId, list);
  }

  let createdFragments = 0;
  for (const [oldStoryId, list] of byStory) {
    const newStoryId = storyIdMap.get(oldStoryId)!;
    list.sort((a, b) => Number(a.order) - Number(b.order));

    if (dryRun) {
      console.log(`[dry] fragments+ story ${oldStoryId}: ${list.length}`);
      createdFragments += list.length;
      continue;
    }

    await prisma.fragment.createMany({
      data: list.map((f, index) => ({
        storyId: newStoryId,
        order: index + 1,
        text: cleanHtml(f.text) ?? '',
        authorNote: cleanHtml(nullish(f.footnote)),
        createdAt: parseDate(nullish(f.created_at)),
        updatedAt: parseDate(nullish(f.updated_at)),
      })),
    });
    createdFragments += list.length;
    console.log(`fragments+ story ${newStoryId}: ${list.length}`);
  }

  console.log('\nDone.');
  console.log({
    mappedCompositions: Object.fromEntries(compositionIdMap),
    mappedStories: Object.fromEntries(storyIdMap),
    createdFragments,
    skipped,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
