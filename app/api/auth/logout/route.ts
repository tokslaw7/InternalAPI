import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { hashSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  const response = NextResponse.redirect(new URL('/login', process.env.APP_URL ?? 'http://localhost:3000'));
  response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}