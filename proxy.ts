import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

import { routing } from './i18n/routing';

const intlProxy = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return intlProxy(request);
}

export const config = {
  // Match all pathnames except for
  // - if they start with `/api`, `/_next` or `/_vercel`
  // - the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
