import { cookies } from 'next/headers';
import { startSession } from '@/lib/server/gameService';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/server/session';

/**
 * POST /api/session — start or resume a play session.
 *
 * Reads the session cookie (if any), ensures the player exists, and returns the
 * opening frames. The cookie is the client's only identity handle; it is
 * httpOnly so client JavaScript can neither read nor forge it.
 */
export async function POST() {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value ?? null;

  const { playerId, response } = await startSession(existing);

  jar.set(SESSION_COOKIE, playerId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return Response.json(response);
}
