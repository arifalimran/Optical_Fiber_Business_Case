import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-min-32-characters';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Verify JWT token (Edge Runtime compatible)
 * Used in middleware which runs in Edge Runtime
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'optical-fiber-app',
    });
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}
