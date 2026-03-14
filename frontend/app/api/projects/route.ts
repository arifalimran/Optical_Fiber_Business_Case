import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin can see all projects, others only their own
    const whereClause = userRole === 'ADMIN' ? {} : { createdBy: userId };

    const projects = await prisma.project.findMany({
      where: whereClause,
      select: {
        id: true,
        projectName: true,
        clientName: true,
        location: true,
        templateCode: true,
        status: true,
        totalCost: true,
        grossRevenue: true,
        netProfit: true,
        profitMargin: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        approvedBy: true,
        tags: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateCode, projectName, clientName, location, description } = body;

    // Validate required fields
    if (!templateCode || !projectName?.trim()) {
      return NextResponse.json(
        { error: 'Template code and project name are required' },
        { status: 400 }
      );
    }

    // Verify template exists and is active
    const template = await prisma.projectTemplate.findFirst({
      where: {
        templateCode: templateCode,
        isActive: true
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Invalid or inactive template' },
        { status: 400 }
      );
    }

    // Get default parameters for the template
    const templateParameters = await prisma.templateCostParameter.findMany({
      where: {
        templateCode: templateCode,
        isActive: true
      },
      select: {
        itemName: true,
        category: true,
        rate: true,
        unit: true
      }
    });

    // Create initial input parameters object with defaults
    const inputParameters: Record<string, any> = {};
    templateParameters.forEach(param => {
      inputParameters[param.itemName] = {
        value: 0, // Default to 0
        rate: param.rate,
        unit: param.unit,
        category: param.category
      };
    });

    // Create the project
    const project = await prisma.project.create({
      data: {
        templateCode,
        projectName: projectName.trim(),
        clientName: clientName?.trim() || null,
        location: location?.trim() || null,
        description: description?.trim() || null,
        createdBy: userId,
        status: 'DRAFT',
        inputParameters: inputParameters,
        tags: []
      }
    });

    // Log audit entry
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'CREATE_PROJECT',
        resourceType: 'Project',
        resourceId: project.id,
        details: `Created new project: ${project.projectName} (${templateCode})`,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'Unknown'
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}