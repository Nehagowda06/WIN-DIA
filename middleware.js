import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/profile', '/wishlist', '/cart'];
const GUEST_ONLY_PATHS = ['/login', '/register'];

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  if (user && GUEST_ONLY_PATHS.includes(path)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/profile',
    '/profile/:path*',
    '/wishlist',
    '/wishlist/:path*',
    '/cart',
    '/cart/:path*',
    '/login',
    '/register',
  ],
};