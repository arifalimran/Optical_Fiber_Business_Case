import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type TemplateField = {
  name?: string;
  type?: string;
  default?: unknown;
};

const buildDefaultInputParameters = (inputSchema: unknown): Record<string, unknown> => {
  if (
    !inputSchema ||
    typeof inputSchema !== 'object' ||
    !('fields' in inputSchema) ||
    !Array.isArray((inputSchema as { fields?: unknown }).fields)
  ) {
    return {};
  }

  const fields = (inputSchema as { fields: TemplateField[] }).fields;

  return fields.reduce<Record<string, unknown>>((acc, field) => {
    if (!field?.name) {
      return acc;
    }

    if (field.default !== undefined) {
      acc[field.name] = field.default;
      return acc;
    }

    if (field.type === 'boolean') {
      acc[field.name] = false;
    } else if (field.type === 'number') {
      acc[field.name] = 0;
    } else {
      acc[field.name] = '';
    }

    return acc;
  }, {});
};

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
    const {
      templateCode,
      projectName,
      clientName,
      location,
      description,
      clientCompanyAddress,
      clientContactPerson,
      clientContactPhone,
      clientContactEmail,
    } = body;

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

    const inputParameters = {
      ...buildDefaultInputParameters(template.inputSchema),
      client_company_address: clientCompanyAddress?.trim() || '',
      client_contact_person: clientContactPerson?.trim() || '',
      client_contact_phone: clientContactPhone?.trim() || '',
      client_contact_email: clientContactEmail?.trim() || '',
    };

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