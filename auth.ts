import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { findUserByCredentials } from "@/lib/user";
import { AuthError } from "next-auth";

const prisma = new PrismaClient();
const ALLOWED_EMAIL = "clau.nojosaf@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await findUserByCredentials(
          credentials.email as string,
          credentials.password as string
        );
        return user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback:", { user, account, profile });

      // Restrição para login com Google
      if (account?.provider === "google") {
        const email = profile?.email || user.email;

        if (!email) {
          return false;
        }

        // Verifica se o e-mail é o permitido
        if (email !== ALLOWED_EMAIL) {
          throw new AuthError(
            "Apenas o e-mail específico pode fazer login com Google"
          );
        }

        // Restante da lógica para criar/atualizar usuário
        const existingUser = await prisma.usuario.findUnique({
          where: { email },
        });

        if (!existingUser) {
          const newUser = await prisma.usuario.create({
            data: {
              name: profile?.name || user.name || "",
              email,
              password: "",
              image: profile?.picture || user.image || "",
            },
          });

          await prisma.account.create({
            data: {
              usuarioId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });
        } else {
          const existingAccount = await prisma.account.findFirst({
            where: {
              usuarioId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                usuarioId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            });
          }
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const usuario = await prisma.usuario.findUnique({
          where: { email: session.user.email },
        });

        if (usuario) {
          session.user.id = usuario.id;
          session.user.name = usuario.name;
          session.user.email = usuario.email;
          session.user.image = usuario.image || undefined;
        }
      }
      return session;
    },
  },
});
