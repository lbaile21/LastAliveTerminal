import { cookies } from 'next/headers';
import { pollNotifications } from '@/lib/server/gameService';
import { SESSION_COOKIE } from '@/lib/server/session';

/**
 * POST /api/poll — fetch out-of-band notifications.
 *
 * The client calls this on a timer so events that happen while the player is
 * idle (a bite, later: messages) still surface. This is the poll-based stand-in
 * for Web Push until that infrastructure lands.
 */
export async function POST() {
  const jar = await cookies();
  const playerId = jar.get(SESSION_COOKIE)?.value;
  if (!playerId) {
    return Response.json({ frames: [] });
  }
  const frames = await pollNotifications(playerId);
  return Response.json({ frames });
}
