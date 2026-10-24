-- ============================================================
-- Reelz - TikTok Clone Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- --------------------------------------------------------
-- PROFILES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  following_count INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  likes_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- --------------------------------------------------------
-- VIDEOS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url       TEXT NOT NULL,
  thumbnail_url   TEXT,
  caption         TEXT,
  hashtags        TEXT[] NOT NULL DEFAULT '{}',
  music_title     TEXT,
  likes_count     INTEGER NOT NULL DEFAULT 0,
  comments_count  INTEGER NOT NULL DEFAULT 0,
  views_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS videos_user_id_idx    ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS videos_created_at_idx ON public.videos(created_at DESC);
CREATE INDEX IF NOT EXISTS videos_hashtags_idx   ON public.videos USING GIN(hashtags);

-- --------------------------------------------------------
-- LIKES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id   UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT likes_unique UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS likes_video_id_idx ON public.likes(video_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx  ON public.likes(user_id);

-- --------------------------------------------------------
-- COMMENTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id   UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_video_id_idx    ON public.comments(video_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx  ON public.comments(created_at DESC);

-- --------------------------------------------------------
-- FOLLOWS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT follows_unique UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK(follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_id_idx  ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows(following_id);


-- ============================================================
-- TRIGGERS: keep denormalized counts in sync
-- ============================================================

-- Like counts
CREATE OR REPLACE FUNCTION handle_like_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.videos  SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
  UPDATE public.profiles SET likes_count = likes_count + 1 WHERE id = (SELECT user_id FROM public.videos WHERE id = NEW.video_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_like_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.videos  SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.video_id;
  UPDATE public.profiles SET likes_count = GREATEST(0, likes_count - 1) WHERE id = (SELECT user_id FROM public.videos WHERE id = OLD.video_id);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_like_insert ON public.likes;
CREATE TRIGGER on_like_insert AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION handle_like_insert();

DROP TRIGGER IF EXISTS on_like_delete ON public.likes;
CREATE TRIGGER on_like_delete AFTER DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION handle_like_delete();

-- Comment counts
CREATE OR REPLACE FUNCTION handle_comment_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.videos SET comments_count = comments_count + 1 WHERE id = NEW.video_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_comment_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.videos SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.video_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_insert ON public.comments;
CREATE TRIGGER on_comment_insert AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION handle_comment_insert();

DROP TRIGGER IF EXISTS on_comment_delete ON public.comments;
CREATE TRIGGER on_comment_delete AFTER DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION handle_comment_delete();

-- Follow counts
CREATE OR REPLACE FUNCTION handle_follow_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET following_count  = following_count  + 1 WHERE id = NEW.follower_id;
  UPDATE public.profiles SET followers_count  = followers_count  + 1 WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_follow_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET following_count  = GREATEST(0, following_count  - 1) WHERE id = OLD.follower_id;
  UPDATE public.profiles SET followers_count  = GREATEST(0, followers_count  - 1) WHERE id = OLD.following_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_insert ON public.follows;
CREATE TRIGGER on_follow_insert AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION handle_follow_insert();

DROP TRIGGER IF EXISTS on_follow_delete ON public.follows;
CREATE TRIGGER on_follow_delete AFTER DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION handle_follow_delete();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
  );
  INSERT INTO public.profiles(id, username, display_name)
  VALUES (NEW.id, generated_username, generated_username)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows   ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles are publicly viewable"
  ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- VIDEOS
CREATE POLICY "Videos are publicly viewable"
  ON public.videos FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can insert videos"
  ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON public.videos FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON public.videos FOR DELETE USING (auth.uid() = user_id);

-- LIKES
CREATE POLICY "Likes are publicly viewable"
  ON public.likes FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can like"
  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS
CREATE POLICY "Comments are publicly viewable"
  ON public.comments FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS
CREATE POLICY "Follows are publicly viewable"
  ON public.follows FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can follow"
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run this separately (or via the Supabase dashboard):
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('videos', 'videos', true)
-- ON CONFLICT DO NOTHING;
--
-- CREATE POLICY "Anyone can view videos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'videos');
--
-- CREATE POLICY "Authenticated users can upload videos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Users can delete own videos" ON storage.objects
--   FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
