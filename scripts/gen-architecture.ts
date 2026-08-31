/**
 * Regenerates the marked blocks in ARCHITECTURE.md from the live local schema and
 * from the source tree, so the document cannot silently drift from the build.
 *
 *   npm run gen:arch        rewrite the generated blocks
 *   npm run arch:check      fail if they are out of date (run before opening a PR)
 *
 * Requires the local Supabase stack: `supabase start`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DOC = join(ROOT, 'ARCHITECTURE.md');
const DB = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const check = process.argv.includes('--check');

function sql<T>(query: string): T[] {
  const out = execFileSync('psql', [DB, '-t', '-A', '-F', '\t', '-c', query], {
    encoding: 'utf8',
  });
  return out
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t')) as T[];
}

// ---------------------------------------------------------------------- ERD

const columns = sql<[string, string, string, string]>(`
  select c.table_name, c.column_name,
         case when c.data_type = 'USER-DEFINED' then c.udt_name else c.data_type end,
         c.is_nullable
    from information_schema.columns c
    join information_schema.tables t
      on t.table_name = c.table_name and t.table_schema = c.table_schema
   where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
   order by c.table_name, c.ordinal_position
`);

const keys = sql<[string, string, string]>(`
  select tc.table_name, kcu.column_name, tc.constraint_type
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
   where tc.table_schema = 'public' and tc.constraint_type in ('PRIMARY KEY','UNIQUE')
`);

const fks = sql<[string, string, string, string]>(`
  select tc.table_name, kcu.column_name, ccu.table_name, ccu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
   where tc.table_schema = 'public' and tc.constraint_type = 'FOREIGN KEY'
   order by tc.table_name, kcu.column_name
`);

const TYPE_ALIAS: Record<string, string> = {
  'timestamp with time zone': 'timestamptz',
  'character varying': 'text',
  'double precision': 'float8',
  integer: 'int',
  boolean: 'bool',
  numeric: 'numeric',
};

const tables = [...new Set(columns.map((c) => c[0]))].sort();
const keyOf = (table: string, col: string) => {
  const kinds = keys.filter((k) => k[0] === table && k[1] === col).map((k) => k[2]);
  if (fks.some((f) => f[0] === table && f[1] === col)) {
    return kinds.includes('PRIMARY KEY') ? 'PK,FK' : 'FK';
  }
  if (kinds.includes('PRIMARY KEY')) return 'PK';
  if (kinds.includes('UNIQUE')) return 'UK';
  return '';
};

const erd = [
  '```mermaid',
  'erDiagram',
  ...[
    ...new Set(
      fks.map(
        ([t, col, parent]) =>
          `    ${parent.toUpperCase()} ||--o{ ${t.toUpperCase()} : ${col.replace(/_id$/, '')}`,
      ),
    ),
  ].sort(),
  '',
  ...tables.flatMap((t) => [
    `    ${t.toUpperCase()} {`,
    ...columns
      .filter((c) => c[0] === t)
      .map(([, col, type]) => {
        const k = keyOf(t, col);
        return `        ${(TYPE_ALIAS[type] ?? type).padEnd(12)} ${col}${k ? ` ${k}` : ''}`;
      }),
    '    }',
  ]),
  '```',
].join('\n');

// ----------------------------------------------------------------- inventory

const countFiles = (dir: string, ext = '.tsx') =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' }).filter(
        (f) => typeof f === 'string' && f.endsWith(ext),
      ).length
    : 0;

const routes = readdirSync(join(ROOT, 'src/app'), { recursive: true, encoding: 'utf8' })
  .filter((f) => typeof f === 'string' && f.endsWith('.tsx') && !f.includes('_layout'))
  .map((f) => '/' + String(f).replace(/\.tsx$/, '').replace(/\/index$/, '').replace(/^index$/, ''))
  .sort();

const migrations = readdirSync(join(ROOT, 'supabase/migrations')).filter((f) => f.endsWith('.sql'));
const functions = readdirSync(join(ROOT, 'supabase/functions'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const vercelFns = readdirSync(join(ROOT, 'api')).filter((f) => f.endsWith('.ts'));

const inventory = [
  '| Layer | Count | Detail |',
  '|---|---|---|',
  `| Front-end — routes | ${routes.length} | ${routes.join(' · ')} |`,
  `| Front-end — primitives | 8 | FormLabel · TypedValue · Rule · StampSeal · Lantern · PaperSurface · WallSurface · ScoreDisplay |`,
  `| Front-end — other components | ${countFiles('src/components') - 8} | Certificate · Frame · SceneNodes · ActionButton · ReportSheet · LegalPage |`,
  `| Back-end — tables | ${tables.length} | ${tables.join(' · ')} |`,
  `| Back-end — migrations | ${migrations.length} | ${migrations[0]} … ${migrations[migrations.length - 1]} |`,
  `| Middleware — Supabase Edge Functions | ${functions.length} | ${functions.join(' · ')} |`,
  `| Middleware — Vercel Functions | ${vercelFns.length} | ${vercelFns.join(' · ')} |`,
].join('\n');

// ------------------------------------------------------------------- write

const BLOCKS: Record<string, string> = { erd, inventory };

let doc = readFileSync(DOC, 'utf8');
let stale = false;

for (const [name, body] of Object.entries(BLOCKS)) {
  const open = `<!-- generated:${name} -->`;
  const close = `<!-- /generated:${name} -->`;
  const start = doc.indexOf(open);
  const end = doc.indexOf(close);
  if (start === -1 || end === -1) throw new Error(`ARCHITECTURE.md is missing the ${name} markers`);

  const current = doc.slice(start + open.length, end).trim();
  if (current !== body.trim()) {
    stale = true;
    doc = doc.slice(0, start + open.length) + '\n' + body + '\n' + doc.slice(end);
  }
}

if (check) {
  if (stale) {
    console.error('ARCHITECTURE.md is out of date. Run: npm run gen:arch');
    process.exit(1);
  }
  console.log('ARCHITECTURE.md is current');
} else {
  writeFileSync(DOC, doc);
  console.log(stale ? 'ARCHITECTURE.md regenerated' : 'ARCHITECTURE.md already current');
}
