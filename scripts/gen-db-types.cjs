// scripts/gen-db-types.cjs
// Gera types/database.ts introspecionando o Postgres do Supabase diretamente.
// Alternativa a `supabase gen types --local` quando NAO ha Docker.
//
// Uso:
//   SUPABASE_DB_URL="postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres" node scripts/gen-db-types.cjs
//
// A connection string (modo URI) fica em: Dashboard > Project Settings > Database.
// Caracteres especiais na senha devem ser URL-encoded.

const pg = require('pg')
const fs = require('fs')
const path = require('path')

const url = process.env.SUPABASE_DB_URL
if (!url) {
  console.error('Defina SUPABASE_DB_URL com a connection string (modo URI) do Supabase.')
  process.exit(1)
}

function tsType(udt, enums) {
  if (udt.startsWith('_')) return tsType(udt.slice(1), enums) + '[]'
  if (enums[udt]) return `Database["public"]["Enums"]["${udt}"]`
  switch (udt) {
    case 'uuid': case 'text': case 'varchar': case 'bpchar': case 'char':
    case 'name': case 'citext': case 'inet': case 'interval': return 'string'
    case 'int2': case 'int4': case 'int8': case 'float4': case 'float8':
    case 'numeric': case 'money': case 'oid': return 'number'
    case 'bool': return 'boolean'
    case 'json': case 'jsonb': return 'Json'
    case 'timestamp': case 'timestamptz': case 'date': case 'time': case 'timetz': return 'string'
    default: return 'string'
  }
}

;(async () => {
  const c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15000, ssl: { rejectUnauthorized: false } })
  await c.connect()

  const enumRows = (await c.query(`
    select t.typname as name, e.enumlabel as label
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
    order by t.typname, e.enumsortorder`)).rows
  const enums = {}
  for (const r of enumRows) (enums[r.name] ||= []).push(r.label)

  const tableRows = (await c.query(`
    select table_name, table_type
    from information_schema.tables
    where table_schema = 'public' and table_type in ('BASE TABLE','VIEW')
    order by table_name`)).rows

  const colRows = (await c.query(`
    select table_name, column_name, udt_name, is_nullable, column_default, is_identity, is_generated
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position`)).rows
  const colsByTable = {}
  for (const r of colRows) (colsByTable[r.table_name] ||= []).push(r)

  const fkRows = (await c.query(`
    select tc.table_name as src_table, kcu.column_name as src_col,
           ccu.table_name as tgt_table, ccu.column_name as tgt_col, tc.constraint_name as name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`)).rows
  const fkByTable = {}
  for (const r of fkRows) (fkByTable[r.src_table] ||= []).push(r)

  await c.end()

  const tablesSrc = []
  const viewsSrc = []
  for (const t of tableRows) {
    const cols = colsByTable[t.table_name] || []
    const isView = t.table_type === 'VIEW'

    const rowLines = cols.map(col => {
      const nul = col.is_nullable === 'YES' ? ' | null' : ''
      return `          ${col.column_name}: ${tsType(col.udt_name, enums)}${nul}`
    })
    const insLines = cols.map(col => {
      const nul = col.is_nullable === 'YES' ? ' | null' : ''
      const optional = col.is_nullable === 'YES' || col.column_default !== null ||
        col.is_identity === 'YES' || col.is_generated === 'ALWAYS'
      return `          ${col.column_name}${optional ? '?' : ''}: ${tsType(col.udt_name, enums)}${nul}`
    })
    const updLines = cols.map(col => {
      const nul = col.is_nullable === 'YES' ? ' | null' : ''
      return `          ${col.column_name}?: ${tsType(col.udt_name, enums)}${nul}`
    })
    const rels = (fkByTable[t.table_name] || []).map(fk =>
      `          {\n            foreignKeyName: "${fk.name}"\n            columns: ["${fk.src_col}"]\n` +
      `            isOneToOne: false\n            referencedRelation: "${fk.tgt_table}"\n` +
      `            referencedColumns: ["${fk.tgt_col}"]\n          }`)

    const block =
      `      ${t.table_name}: {\n` +
      `        Row: {\n${rowLines.join('\n')}\n        }\n` +
      (isView ? '' :
        `        Insert: {\n${insLines.join('\n')}\n        }\n` +
        `        Update: {\n${updLines.join('\n')}\n        }\n`) +
      `        Relationships: [${rels.length ? '\n' + rels.join(',\n') + '\n        ' : ''}]\n` +
      `      }`
    if (isView) viewsSrc.push(block); else tablesSrc.push(block)
  }

  const enumsSrc = Object.entries(enums).map(([name, vals]) =>
    `      ${name}: ${vals.map(v => JSON.stringify(v)).join(' | ')}`)

  const out =
`export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
${tablesSrc.join('\n')}
    }
    Views: {${viewsSrc.length ? '\n' + viewsSrc.join('\n') + '\n    ' : ''}}
    Functions: {
      [_ in never]: never
    }
    Enums: {${enumsSrc.length ? '\n' + enumsSrc.join('\n') + '\n    ' : ''}}
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
`
  fs.writeFileSync(path.join(__dirname, '..', 'types', 'database.ts'), out)
  console.log('types/database.ts gerado:', tableRows.length, 'tabelas/views,', Object.keys(enums).length, 'enums')
})().catch(e => { console.error('ERRO:', e.message); process.exit(2) })
