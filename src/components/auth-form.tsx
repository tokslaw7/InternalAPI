'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type AuthFormProps = {
  mode: 'login' | 'register';
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? 'Something went wrong.');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form className="auth-card form-grid" onSubmit={onSubmit}>
      {mode === 'register' ? (
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" placeholder="Jane Doe" required />
        </div>
      ) : null}
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="jane@team.local" required />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>
      {mode === 'register' ? (
        <div>
          <label htmlFor="inviteCode">Invite code</label>
          <input id="inviteCode" name="inviteCode" type="text" placeholder="INV-AB12CD34" required />
        </div>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Working...' : mode === 'register' ? 'Create account' : 'Sign in'}
      </button>
    </form>
  );
}