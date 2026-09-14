import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect admin routes if not admin
    if (pathname.startsWith('/admin')) {
      if (!token || !['ADMIN', 'SUPER_ADMIN'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/browse', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes — no auth required
        const publicPaths = ['/', '/browse', '/map', '/login', '/register', '/items', '/privacy', '/terms'];
        if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
          return true;
        }

        // API routes — handled individually in route handlers
        if (pathname.startsWith('/api')) {
          return true;
        }

        // Everything else requires auth
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|uploads).*)',
  ],
};
