import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { id: projectId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause - Admin can see all projects, others only their own
    const whereClause: any = { id: projectId };
    if (userRole !== 'ADMIN') {
      whereClause.createdBy = userId;
    }

    const project = await prisma.project.findFirst({
      where: whereClause
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { id: projectId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Build where clause - Admin can edit all projects, others only their own
    const whereClause: any = { id: projectId };
    if (userRole !== 'ADMIN') {
      whereClause.createdBy = userId;
    }

    // Check if project exists and user has access
    const existingProject = await prisma.project.findFirst({
      where: whereClause
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...body,
        updatedAt: new Date()
      }
    });

    // Log audit entry
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'UPDATE_PROJECT',
        resourceType: 'Project',
        resourceId: projectId,
        details: `Updated project: ${updatedProject.projectName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'Unknown'
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { id: projectId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause - Admin can delete all projects, others only their own
    const whereClause: any = { id: projectId };
    if (userRole !== 'ADMIN') {
      whereClause.createdBy = userId;
    }

    // Check if project exists and user has access
    const existingProject = await prisma.project.findFirst({
      where: whereClause
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete the project
    await prisma.project.delete({
      where: { id: projectId }
    });

    // Log audit entry
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'DELETE_PROJECT',
        resourceType: 'Project',
        resourceId: projectId,
        details: `Deleted project: ${existingProject.projectName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'Unknown'
      }
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}