import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const sql = neon(databaseUrl)

// Type helpers
export type QueryResult<T> = T[]

// Run migrations / ensure schema exists
export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username    TEXT UNIQUE NOT NULL,
      display_name TEXT,
      bio         TEXT,
      avatar_url  TEXT,
      following_count INTEGER NOT NULL DEFAULT 0,
      followers_count INTEGER NOT NULL DEFAULT 0,
      likes_count     INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS user_credentials (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS videos (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      video_url     TEXT NOT NULL,
      thumbnail_url TEXT,
      caption       TEXT,
      hashtags      TEXT[] NOT NULL DEFAULT '{}',
      music_title   TEXT,
      likes_count   INTEGER NOT NULL DEFAULT 0,
      comments_count INTEGER NOT NULL DEFAULT 0,
      views_count   INTEGER NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS likes (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, video_id)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS follows (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(follower_id, following_id),
      CHECK(follower_id <> following_id)
    )
  `

  // Indexes (IF NOT EXISTS via DO block)
  await sql`
    DO $$ BEGIN
      CREATE INDEX IF NOT EXISTS videos_user_id_idx    ON videos(user_id);
      CREATE INDEX IF NOT EXISTS videos_created_at_idx ON videos(created_at DESC);
      CREATE INDEX IF NOT EXISTS comments_video_id_idx ON comments(video_id);
      CREATE INDEX IF NOT EXISTS follows_follower_idx  ON follows(follower_id);
      CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);
    EXCEPTION WHEN others THEN NULL;
    END $$
  `

  console.log('✅ Database schema ready')
}
