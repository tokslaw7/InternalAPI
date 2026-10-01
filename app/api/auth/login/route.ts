import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, sessionCookieOptions, verifyPassword, SESSION_COOKIE_NAME } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = await createSession(user.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  const membership = await db.membership.findFirst({ where: { userId: user.id } });

  if (membership) {
    await db.auditEvent
      .create({
        data: {
          organizationId: membership.organizationId,
          actorUserId: user.id,
          entityType: 'session',
          entityId: user.id,
          action: 'LOGIN',
        },
      })
      .catch(() => null);
  }

  return response;
}