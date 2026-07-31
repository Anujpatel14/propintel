import { cookies } from 'next/headers';
import { prisma } from '../db';
import { Role } from '@prisma/client';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  clerkId: string;
}

const MOCK_INVESTOR: UserSession = {
  id: 'mock-investor-id-12345',
  email: 'investor@propintel.com',
  name: 'Alex Investor',
  role: 'INVESTOR',
  clerkId: 'mock_clerk_investor_123',
};

const MOCK_ADMIN: UserSession = {
  id: 'mock-admin-id-67890',
  email: 'admin@propintel.com',
  name: 'Sarah Admin',
  role: 'ADMIN',
  clerkId: 'mock_clerk_admin_456',
};

export const MOCK_USERS = [MOCK_INVESTOR, MOCK_ADMIN];

/**
 * Gets the current user session.
 * Seamlessly fallbacks to a cookie-based mock user if Clerk keys are not set.
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  // 1. If Clerk is configured, you'd integrate Clerk's auth() here:
  // const { userId } = await auth();
  // However, we default to the cookie simulation for standard local deployments.
  
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('propintel_session');
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    const session = JSON.parse(sessionCookie.value) as UserSession;
    
    // Attempt to verify/sync with DB if Prisma is connected
    try {
      let dbUser = await prisma.user.findUnique({
        where: { email: session.email },
        include: { profile: true }
      });
      
      if (!dbUser) {
        // Automatically seed user in database to ensure relation queries work
        dbUser = await prisma.user.create({
          data: {
            clerkId: session.clerkId,
            email: session.email,
            name: session.name,
            role: session.role,
            profile: {
              create: {
                phone: '+1 (555) 019-2834',
                company: session.role === 'INVESTOR' ? 'Apex Equity Partners' : 'PropIntel Corp',
                investorType: session.role === 'INVESTOR' ? 'Fix & Flip / Buy & Hold' : 'Platform Administrator',
              }
            },
            subscription: {
              create: {
                plan: session.role === 'INVESTOR' ? 'PRO' : 'ENTERPRISE',
                status: 'ACTIVE',
              }
            }
          },
          include: { profile: true }
        });
      }
      
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || 'Anonymous User',
        role: dbUser.role,
        clerkId: dbUser.clerkId,
      };
    } catch (dbError) {
      // If DB connection fails (e.g. DATABASE_URL not set yet), return the session directly
      return session;
    }
  } catch (err) {
    return null;
  }
}

/**
 * Logs in a simulated user by setting a secure cookie.
 */
export async function signInMockUser(email: string): Promise<UserSession | null> {
  const targetUser = MOCK_USERS.find(u => u.email === email);
  if (!targetUser) return null;
  
  const cookieStore = await cookies();
  cookieStore.set('propintel_session', JSON.stringify(targetUser), {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  return targetUser;
}

/**
 * Signs out the simulated user.
 */
export async function signOutMockUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('propintel_session');
}

/**
 * Validates that user is authenticated, otherwise throws or returns null.
 */
export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized access. Please log in.');
  }
  return user;
}
