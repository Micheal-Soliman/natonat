import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { routing } from './i18n/routing';

const intlProxy = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/ar/admin' || pathname === '/en/admin') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return intlProxy(request);
}

export const config = {
  // Match all pathnames except for
  // - if they start with `/api`, `/admin`, `/studio`, `/_next` or `/_vercel`
  // - the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|admin|studio|_next|_vercel|.*\\..*).*)'],
};
