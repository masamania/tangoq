import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'

// Edge-compatible auth config (no Prisma, no Node.js-only modules)
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId:     process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages:   { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname === '/login'

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/decks', nextUrl))
        return true
      }

      // Allow API auth routes
      if (nextUrl.pathname.startsWith('/api/auth')) return true

      // Require login for everything else
      return isLoggedIn
    },
  },
}
