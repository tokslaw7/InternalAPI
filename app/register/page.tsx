import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getCurrentUser } from '@/lib/auth';

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="shell auth-grid" style={{ maxWidth: 540 }}>
      <section className="hero">
        <p className="eyebrow">Invite-code registration</p>
        <h1>Create your internal account.</h1>
        <p>
          Join the shared API workspace with a team invite code and start organizing endpoints by project and folder.
        </p>
      </section>
      <AuthForm mode="register" />
      <p className="muted">
        Already have an account? <Link href="/login">Sign in</Link>.
      </p>
    </main>
  );
}