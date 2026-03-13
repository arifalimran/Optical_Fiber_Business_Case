import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'auth_token')?.value;

    if (token) {
      // Verify token
      const payload = verifyToken(token);

      if (payload) {
        // Delete session from database
        await prisma.session.deleteMany({
          where: {
            token,
            userId: payload.userId,
          },
        });

        // Log logout
        await prisma.auditLog.create({
          data: {
            userId: payload.userId,
            action: 'LOGOUT',
            resourceType: 'User',
            resourceId: payload.userId,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
            userAgent: request.headers.get('user-agent') || 'Unknown',
          },
        });
      }
    }

    // Create response
    const response = NextResponse.json({ success: true });

    // Clear cookie
    response.cookies.set({
      name: process.env.SESSION_COOKIE_NAME || 'auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
