import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getCurrentUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="shell auth-grid" style={{ maxWidth: 540 }}>
      <section className="hero">
        <p className="eyebrow">Internal API testing workspace</p>
        <h1>Sign in to your team workspace.</h1>
        <p>
          Run and validate endpoints, keep request folders organized, and store team history in one self-hosted place.
        </p>
      </section>
      <AuthForm mode="login" />
      <p className="muted">
        Need an account? <Link href="/register">Register with an invite code</Link>.
      </p>
    </main>
  );
}