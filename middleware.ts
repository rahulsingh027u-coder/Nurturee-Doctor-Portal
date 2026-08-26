import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = 
    pathname.startsWith('/api/auth/') ||
    pathname === '/api' ||
    pathname.startsWith('/api/uploads/') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  if (isPublic) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'nurturee-doctor-portal-secret-key-2024',
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please login.' },
        { status: 401 }
      );
    }

    const role = token.role as string;
    if (role !== 'DOCTOR' && role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Access denied. Doctor or Staff role required.' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
