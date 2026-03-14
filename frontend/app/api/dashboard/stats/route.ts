import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user info from headers (set by middleware)
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build where clause based on user role
    const whereClause = userRole === 'ADMIN' ? {} : { createdBy: userId };

    // Get project counts by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: {
        _all: true
      },
      where: whereClause
    });

    // Transform to object format
    const statusCounts = projectsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {} as Record<string, number>);

    // Calculate financial metrics
    const financialStats = await prisma.project.aggregate({
      where: {
        ...whereClause,
        status: { not: 'DRAFT' } // Only count non-draft projects for financial stats
      },
      _sum: {
        grossRevenue: true,
        totalCost: true,
        netProfit: true
      },
      _count: {
        id: true
      }
    });

    const totalRevenue = financialStats._sum?.grossRevenue || 0;
    const totalCosts = financialStats._sum?.totalCost || 0;
    const avgProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : null;

    // Get total project count (including drafts)
    const totalProjectsResult = await prisma.project.count({
      where: whereClause
    });

    // Get recent projects (last 5 updated)
    const recentProjects = await prisma.project.findMany({
      where: whereClause,
      select: {
        id: true,
        projectName: true,
        templateCode: true,
        status: true,
        netProfit: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    const dashboardStats = {
      totalProjects: totalProjectsResult,
      projectsByStatus: statusCounts,
      totalRevenue: totalRevenue,
      totalCosts: totalCosts,
      avgProfitMargin: avgProfitMargin,
      recentProjects: recentProjects.map(project => ({
        ...project,
        updatedAt: project.updatedAt.toISOString()
      }))
    };

    return NextResponse.json(dashboardStats);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}