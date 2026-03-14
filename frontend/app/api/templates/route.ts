import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch all active project templates with their parameter count
    const templates = await prisma.projectTemplate.findMany({
      where: {
        isActive: true
      },
      select: {
        templateCode: true,
        templateName: true,
        description: true,
        isActive: true,
        _count: {
          select: {
            costParameters: true
          }
        }
      },
      orderBy: {
        templateName: 'asc'
      }
    });

    // Transform the data to include parameter count and estimated time
    const templatesWithMetadata = templates.map(template => ({
      code: template.templateCode,
      name: template.templateName,
      description: template.description,
      isActive: template.isActive,
      parameterCount: template._count.costParameters,
      estimatedTime: getEstimatedTime(template._count.costParameters)
    }));

    return NextResponse.json(templatesWithMetadata);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Helper function to estimate completion time based on parameter count
function getEstimatedTime(parameterCount: number): string {
  if (parameterCount <= 5) return '5-10 mins';
  if (parameterCount <= 15) return '10-20 mins';
  if (parameterCount <= 25) return '20-30 mins';
  return '30+ mins';
}