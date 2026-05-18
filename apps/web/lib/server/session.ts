/**
 * Session identity.
 *
 * M1 uses a server-issued httpOnly cookie holding an opaque player id. The
 * client never sees game state and cannot forge identity — the cookie is the
 * only handle it has. From M3, this is swapped for Supabase Auth so the same
 * id flows into Postgres RLS as `auth.uid()`.
 */
export const SESSION_COOKIE = 'la_session';

/** Cookie lifetime — 30 days. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
