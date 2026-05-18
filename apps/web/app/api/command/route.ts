import { cookies } from 'next/headers';
import { commandRequestSchema } from '@last-alive/shared';
import { runPlayerCommand } from '@/lib/server/gameService';
import { SESSION_COOKIE } from '@/lib/server/session';

/**
 * POST /api/command — the server-authoritative command loop.
 *
 * The client sends only a command string. All logic runs here and in the pure
 * engine; the response is a list of frames to render. No game state, puzzle
 * answer, or world data is ever sent that the client did not earn.
 */
export async function POST(request: Request) {
  const jar = await cookies();
  const playerId = jar.get(SESSION_COOKIE)?.value;
  if (!playerId) {
    return Response.json({ error: 'no-session' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid-json' }, { status: 400 });
  }

  const parsed = commandRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'invalid-request' }, { status: 400 });
  }

  const response = await runPlayerCommand(playerId, parsed.data);
  return Response.json(response);
}
