import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { verifyPassword } from '@/lib/password';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Email + Password Credentials Provider
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password.');
        }

        const isValid = verifyPassword(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid email or password.');
        }

        const isLeader = user.email.toLowerCase() === 'shaniyadav777am@gmail.com';
        const role = isLeader ? Role.SUPER_ADMIN : user.role;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role,
        };
      },
    }),

    // Google OAuth (active when credentials configured)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Email Magic Link (active when Resend API key configured)
    ...(process.env.RESEND_API_KEY
      ? [
          EmailProvider({
            server: {
              host: 'smtp.resend.com',
              port: 465,
              auth: {
                user: 'resend',
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: process.env.RESEND_FROM_EMAIL || 'noreply@foundit.app',
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.email = user.email;
      }
      if (trigger === 'update' && session?.role) {
        token.role = session.role;
      }
      // Always sync role from DB if token.id is present
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, email: true },
          });
          if (dbUser?.email?.toLowerCase() === 'shaniyadav777am@gmail.com') {
            token.role = Role.SUPER_ADMIN;
          } else if (dbUser?.role) {
            token.role = dbUser.role;
          }
        } catch {}
      }
      if (token?.email?.toLowerCase() === 'shaniyadav777am@gmail.com') {
        token.role = Role.SUPER_ADMIN;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM',
            title: 'Welcome to FoundIt! 🎉',
            body: 'Start by reporting a lost or found item. Our smart matching will connect you with the right people.',
            link: '/browse',
          },
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for next-auth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}
