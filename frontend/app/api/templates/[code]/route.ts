import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: templateCode } = await params;

    const template = await prisma.projectTemplate.findFirst({
      where: {
        templateCode: templateCode,
        isActive: true
      },
      include: {
        costParameters: {
          select: {
            itemName: true,
            category: true,
            rate: true,
            unit: true,
            frequency: true,
            isConditional: true,
            condition: true
          },
          orderBy: {
            category: 'asc'
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}