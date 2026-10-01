import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser, getPrimaryMembership } from '@/lib/auth';
import { slugify } from '@/lib/http';

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await getPrimaryMembership(user.id);

  if (!membership) {
    return NextResponse.json({ error: 'No organization membership found.' }, { status: 403 });
  }

  const projects = await db.project.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await getPrimaryMembership(user.id);

  if (!membership) {
    return NextResponse.json({ error: 'No organization membership found.' }, { status: 403 });
  }

  if (membership.role === 'VIEWER') {
    return NextResponse.json({ error: 'You do not have permission to create projects.' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Project name is required.' }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

  const project = await db.project.create({
    data: {
      organizationId: membership.organizationId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description?.trim() || null,
    },
  });

  await db.auditEvent
    .create({
      data: {
        organizationId: membership.organizationId,
        actorUserId: user.id,
        entityType: 'project',
        entityId: project.id,
        action: 'CREATE',
        metadata: { name: project.name, slug: project.slug },
      },
    })
    .catch(() => null);

  return NextResponse.json({ project }, { status: 201 });
}