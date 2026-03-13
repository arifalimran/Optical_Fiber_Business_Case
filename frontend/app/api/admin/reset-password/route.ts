import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userRole = request.headers.get('x-user-role');
    const adminUserId = request.headers.get('x-user-id');

    // Check if user is admin
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, newPassword } = body;

    // Validate input
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { 
          error: 'Password too weak',
          hint: 'Password must be at least 8 characters long'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Log the password reset action
    await prisma.auditLog.create({
      data: {
        userId: adminUserId || 'unknown',
        action: 'PASSWORD_CHANGED',
        resourceType: 'User',
        resourceId: userId,
        details: `Admin reset password for user: ${user.email}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${user.email}`,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
