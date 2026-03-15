import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateProjectFeasibility } from '@/lib/calculations/feasibility';
import { areAllStepsCompleted, getWorkflowState } from '@/lib/workflow/feasibilitySteps';

export async function POST(
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

    const whereClause = userRole === 'ADMIN' || userRole === 'APPROVER'
      ? { id: projectId }
      : { id: projectId, createdBy: userId };

    const project = await prisma.project.findFirst({ where: whereClause });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const workflowState = getWorkflowState((project.inputParameters ?? {}) as Record<string, unknown>);
    if (!areAllStepsCompleted(workflowState)) {
      return NextResponse.json(
        {
          error: 'All feasibility steps must be completed before calculation',
          workflowState,
        },
        { status: 400 }
      );
    }

    const assumptions = (project.inputParameters ?? {}) as Record<string, unknown>;
    const calculated = calculateProjectFeasibility(project.templateCode, assumptions);

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        calculatedCosts: calculated.calculatedCosts,
        calculatedRevenue: calculated.calculatedRevenue,
        totalCost: calculated.totalCost,
        grossRevenue: calculated.grossRevenue,
        netProfit: calculated.netProfit,
        profitMargin: calculated.profitMargin,
        status: 'PENDING_APPROVAL',
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CALCULATE_PROJECT',
        resourceType: 'Project',
        resourceId: projectId,
        details: {
          templateCode: project.templateCode,
          totalCost: calculated.totalCost,
          grossRevenue: calculated.grossRevenue,
          netProfit: calculated.netProfit,
          profitMargin: calculated.profitMargin,
          decision: calculated.calculatedRevenue.decision.label,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
      },
    });

    return NextResponse.json({
      ...updatedProject,
      calculationSummary: {
        decision: calculated.calculatedRevenue.decision,
        scenarios: calculated.calculatedRevenue.scenarios,
      },
    });
  } catch (error) {
    console.error('Error calculating project:', error);
    return NextResponse.json(
      { error: 'Failed to calculate project' },
      { status: 500 }
    );
  }
}
