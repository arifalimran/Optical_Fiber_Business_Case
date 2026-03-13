import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-min-32-characters';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_REMEMBER_ME_EXPIRY = process.env.JWT_REMEMBER_ME_EXPIRY || '30d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(payload: JWTPayload, rememberMe: boolean = false): string {
  const expiresIn = rememberMe ? JWT_REMEMBER_ME_EXPIRY : JWT_EXPIRY;
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn,
    issuer: 'optical-fiber-app',
  } as jwt.SignOptions);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'optical-fiber-app',
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}

/**
 * Calculate token expiration date
 */
export function getTokenExpiration(rememberMe: boolean = false): Date {
  const expiryMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
  return new Date(Date.now() + expiryMs);
}
