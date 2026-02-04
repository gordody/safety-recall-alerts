import { loadEnvFile } from "node:process"
import pg from "pg";

const { Pool } = pg;

loadEnvFile('./config/.env');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set to initialize the database.");
}

const pool = new Pool({ connectionString });

const adminConnectionString = (() => {
  try {
    const url = new URL(connectionString);
    const dbName = url.pathname.replace(/^\//, "") || "postgres";

    url.pathname = "/postgres";

    return {
      adminUrl: url.toString(),
      dbName,
    };
  } catch (error) {
    throw new Error(
      "DATABASE_URL must be a valid postgres connection string to initialize the database.",
      { cause: error },
    );
  }
})();

const statements = [
  "create extension if not exists pgcrypto;",
  "do $$ begin if not exists (select 1 from pg_type where typname = 'severity') then create type severity as enum ('low','medium','high'); end if; end $$;",
  "do $$ begin if not exists (select 1 from pg_type where typname = 'recall_source') then create type recall_source as enum ('fda','cdc','foodsafety'); end if; end $$;",
  "create table if not exists users (\n" +
    "  id varchar primary key default gen_random_uuid(),\n" +
    "  username text not null unique,\n" +
    "  password text not null\n" +
    ");",
  "create table if not exists profiles (\n" +
    "  id varchar primary key default gen_random_uuid(),\n" +
    "  display_name text not null,\n" +
    "  state varchar(2) not null,\n" +
    "  use_current_location boolean not null default true,\n" +
    "  push_alerts_enabled boolean not null default true,\n" +
    "  daily_digest_enabled boolean not null default true,\n" +
    "  dietary_restrictions text[] not null default ARRAY[]::text[],\n" +
    "  allergies text[] not null default ARRAY[]::text[]\n" +
    ");",
  "create table if not exists recall_alerts (\n" +
    "  id varchar primary key,\n" +
    "  source recall_source not null,\n" +
    "  title text not null,\n" +
    "  summary text not null,\n" +
    "  url text not null,\n" +
    "  published_at timestamptz not null,\n" +
    "  updated_at timestamptz not null,\n" +
    "  severity severity not null default 'low',\n" +
    "  tags text[] not null default ARRAY[]::text[],\n" +
    "  states text[] not null default ARRAY[]::text[],\n" +
    "  raw jsonb not null default '{}'::jsonb\n" +
    ");",
  "create table if not exists alert_match_reasons (\n" +
    "  id varchar primary key default gen_random_uuid(),\n" +
    "  profile_id varchar not null,\n" +
    "  alert_id varchar not null,\n" +
    "  matched_state varchar(2),\n" +
    "  matched_allergens text[] not null default ARRAY[]::text[],\n" +
    "  matched_dietary_restrictions text[] not null default ARRAY[]::text[],\n" +
    "  score integer not null default 0,\n" +
    "  created_at timestamptz not null default now()\n" +
    ");",
];

const ensureDatabase = async () => {
  const adminPool = new Pool({ connectionString: adminConnectionString.adminUrl });
  const client = await adminPool.connect();
  try {
    const { rowCount } = await client.query(
      "select 1 from pg_database where datname = $1",
      [adminConnectionString.dbName],
    );

    if (!rowCount) {
      const quotedDbName = `"${adminConnectionString.dbName.replace(/"/g, '""')}"`;
      await client.query(`create database ${quotedDbName}`);
    }
  } finally {
    client.release();
    await adminPool.end();
  }
};

const run = async () => {
  await ensureDatabase();
  const client = await pool.connect();
  try {
    for (const statement of statements) {
      await client.query(statement);
    }
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error) => {
  console.error("Database initialization failed:", error);
  process.exitCode = 1;
});
