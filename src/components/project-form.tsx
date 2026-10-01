'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function ProjectForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? 'Unable to create project.');
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="toolbar project-form" onSubmit={onSubmit}>
      <input name="name" placeholder="New project name" required minLength={2} />
      <input name="description" placeholder="Optional description" />
      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create project'}
      </button>
      {error ? <p className="error-text wide">{error}</p> : null}
    </form>
  );
}