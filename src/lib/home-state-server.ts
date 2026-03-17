import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { User } from "./database.types";
import type { DailyQuests, UserGoals, UserId, UserProgress } from "./user-store";

const BUCKET_NAME = "jptl-home-state";
const DEFAULT_DAILY_QUESTS: DailyQuests = {
  flashcard: false,
  vocabulary: false,
  grammar: false,
  reading: false,
};
const DEFAULT_PROGRESS: UserProgress = {
  totalDays: 0,
  flashcardCount: 0,
  vocabCount: 0,
  grammarCount: 0,
  readingCount: 0,
};

let adminClient: SupabaseClient | null = null;
let bucketReady: Promise<void> | null = null;

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  }

  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

async function ensureBucket(): Promise<void> {
  if (bucketReady) return bucketReady;

  bucketReady = (async () => {
    const supabase = getAdminClient();
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;

    const exists = (data || []).some((bucket) => bucket.name === BUCKET_NAME);
    if (exists) return;

    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
    });
    if (createError && !createError.message.toLowerCase().includes("already")) {
      throw createError;
    }
  })().catch((error) => {
    bucketReady = null;
    throw error;
  });

  return bucketReady;
}

function profilePath(userId: UserId): string {
  return `users/${userId}.json`;
}

function questsPath(userId: UserId, date: string): string {
  return `quests/${userId}/${date}.json`;
}

function progressPath(userId: UserId): string {
  return `progress/${userId}.json`;
}

async function readJson<T>(path: string): Promise<T | null> {
  await ensureBucket();

  const { data, error } = await getAdminClient().storage.from(BUCKET_NAME).download(path);
  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("not found") ||
      message.includes("not exist") ||
      String(error.statusCode || "") === "404"
    ) {
      return null;
    }
    throw error;
  }

  const text = await data.text();
  return JSON.parse(text) as T;
}

async function writeJson(path: string, payload: unknown): Promise<void> {
  await ensureBucket();

  const { error } = await getAdminClient().storage.from(BUCKET_NAME).upload(
    path,
    Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
    {
      upsert: true,
      contentType: "application/json",
    }
  );
  if (error) throw error;
}

function toUser(
  userId: UserId,
  profile: { name: string; level: "N3" | "N4" | "N5" } & Partial<UserGoals>,
  existing?: User | null
): User {
  return {
    id: userId,
    name: profile.name,
    level: profile.level,
    daily_flashcard: profile.daily_flashcard ?? existing?.daily_flashcard ?? 10,
    daily_vocab: profile.daily_vocab ?? existing?.daily_vocab ?? 5,
    daily_grammar: profile.daily_grammar ?? existing?.daily_grammar ?? 5,
    daily_reading: profile.daily_reading ?? existing?.daily_reading ?? 2,
    created_at: existing?.created_at ?? new Date().toISOString(),
  };
}

export async function getRemoteState(userId: UserId): Promise<{
  user: User | null;
  quests: DailyQuests;
  progress: UserProgress;
}> {
  const date = getToday();
  const [user, quests, progress] = await Promise.all([
    readJson<User>(profilePath(userId)),
    readJson<DailyQuests>(questsPath(userId, date)),
    readJson<UserProgress>(progressPath(userId)),
  ]);

  return {
    user,
    quests: quests ?? { ...DEFAULT_DAILY_QUESTS },
    progress: progress ?? { ...DEFAULT_PROGRESS },
  };
}

export async function saveUserProfile(
  userId: UserId,
  profile: { name: string; level: "N3" | "N4" | "N5" } & Partial<UserGoals>
): Promise<User> {
  const existing = await readJson<User>(profilePath(userId));
  const user = toUser(userId, profile, existing);
  await writeJson(profilePath(userId), user);
  return user;
}

export async function completeRemoteQuest(
  userId: UserId,
  quest: keyof DailyQuests
): Promise<{ quests: DailyQuests; progress: UserProgress }> {
  const date = getToday();
  const currentQuests =
    (await readJson<DailyQuests>(questsPath(userId, date))) ?? { ...DEFAULT_DAILY_QUESTS };
  const currentProgress =
    (await readJson<UserProgress>(progressPath(userId))) ?? { ...DEFAULT_PROGRESS };

  if (currentQuests[quest]) {
    return { quests: currentQuests, progress: currentProgress };
  }

  const updatedQuests = { ...currentQuests, [quest]: true };
  const updatedProgress: UserProgress = { ...currentProgress };

  if (quest === "flashcard") updatedProgress.flashcardCount += 1;
  if (quest === "vocabulary") updatedProgress.vocabCount += 1;
  if (quest === "grammar") updatedProgress.grammarCount += 1;
  if (quest === "reading") updatedProgress.readingCount += 1;

  const previouslyComplete =
    currentQuests.flashcard &&
    currentQuests.vocabulary &&
    currentQuests.grammar &&
    currentQuests.reading;
  const nowComplete =
    updatedQuests.flashcard &&
    updatedQuests.vocabulary &&
    updatedQuests.grammar &&
    updatedQuests.reading;
  if (!previouslyComplete && nowComplete) {
    updatedProgress.totalDays += 1;
  }

  await Promise.all([
    writeJson(questsPath(userId, date), updatedQuests),
    writeJson(progressPath(userId), updatedProgress),
  ]);

  return { quests: updatedQuests, progress: updatedProgress };
}

export async function replaceRemoteState(
  userId: UserId,
  state: {
    user: User | null;
    quests: DailyQuests;
    progress: UserProgress;
  }
): Promise<{
  user: User | null;
  quests: DailyQuests;
  progress: UserProgress;
}> {
  await ensureBucket();

  const writes: Promise<void>[] = [
    writeJson(questsPath(userId, getToday()), state.quests),
    writeJson(progressPath(userId), state.progress),
  ];

  if (state.user) {
    writes.push(writeJson(profilePath(userId), state.user));
  }

  await Promise.all(writes);
  return state;
}
