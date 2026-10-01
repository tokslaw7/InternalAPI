import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';

export const SESSION_COOKIE_NAME = 'ssapost_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createSessionToken() {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: string) {
  const token = createSessionToken();
  await db.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    },
  });

  return token;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function getPrimaryMembership(userId: string) {
  return db.membership.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getCurrentMembership() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return getPrimaryMembership(user.id);
}

export async function requireMembership() {
  const membership = await getCurrentMembership();
  if (!membership) {
    redirect('/login');
  }

  return membership;
}