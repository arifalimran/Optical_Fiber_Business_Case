import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { generateToken, getTokenExpiration } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: 'Email address not found',
          hint: 'Please check your email address or contact your administrator for access.',
          field: 'email'
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { 
          error: 'Account is disabled',
          hint: 'Your account has been deactivated. Please contact the system administrator to reactivate your account.',
          field: 'account'
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: 'Incorrect password',
          hint: 'The password you entered is incorrect. Please try again or reset your password.',
          field: 'password'
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      rememberMe || false
    );

    // Calculate expiration
    const expiresAt = getTokenExpiration(rememberMe || false);

    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        deviceInfo: request.headers.get('user-agent') || 'Unknown',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
      },
    });

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      },
    });

    // Create response with user data (exclude password)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

    // Set httpOnly cookie
    response.cookies.set({
      name: process.env.SESSION_COOKIE_NAME || 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
