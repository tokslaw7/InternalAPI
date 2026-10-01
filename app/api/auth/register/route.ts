import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, hashPassword, SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/auth';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  inviteCode: z.string().min(4),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Please fill out all fields correctly.' }, { status: 400 });
  }

  const inviteCode = await db.inviteCode.findUnique({
    where: { code: parsed.data.inviteCode },
    include: { organization: true },
  });

  if (!inviteCode || (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) || inviteCode.usesRemaining <= 0) {
    return NextResponse.json({ error: 'Invite code is invalid or expired.' }, { status: 400 });
  }

  const existingUser = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      memberships: {
        create: {
          organizationId: inviteCode.organizationId,
        },
      },
    },
  });

  if (inviteCode.usesRemaining > 1) {
    await db.inviteCode.update({
      where: { id: inviteCode.id },
      data: { usesRemaining: { decrement: 1 } },
    });
  } else {
    await db.inviteCode.delete({ where: { id: inviteCode.id } });
  }

  await db.auditEvent
    .create({
      data: {
        organizationId: inviteCode.organizationId,
        actorUserId: user.id,
        entityType: 'user',
        entityId: user.id,
        action: 'REGISTER',
      },
    })
    .catch(() => null);

  const token = await createSession(user.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  return response;
}