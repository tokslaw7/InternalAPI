import { requireUser, getCurrentMembership } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProjectForm } from '@/components/project-form';

export default async function DashboardPage() {
  const user = await requireUser();
  const membership = await getCurrentMembership();

  if (!membership) {
    return null;
  }

  const projects = await db.project.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <main className="shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">{membership.organization.name}</p>
          <h1>Welcome back, {user.name}.</h1>
          <p>Start with a project, then add folders and requests for your internal APIs.</p>
        </div>
        <div className="page-actions">
          <a className="secondary-button" href="/api/auth/logout">
            Log out
          </a>
        </div>
      </header>

      <section className="workspace-card">
        <h2>Projects</h2>
        <p className="muted">Create a project for each internal service or team-owned API surface.</p>
        <ProjectForm />

        {projects.length > 0 ? (
          <div className="list">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <h3>{project.name}</h3>
                <p className="muted">{project.description || 'No description yet.'}</p>
                <p className="muted">Slug: {project.slug}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="muted">No projects yet. Create the first workspace above.</p>
          </div>
        )}
      </section>
    </main>
  );
}