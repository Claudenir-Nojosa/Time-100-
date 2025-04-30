import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { findUserByCredentials } from "@/lib/user";

const prisma = new PrismaClient();

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

      if (account?.provider === "google") {
        const email = profile?.email;
        if (!email) {
          return false;
        }

        // Verifica se o usuário já existe
        const existingUser = await prisma.usuario.findUnique({
          where: { email },
        });

        if (!existingUser) {
          // Cria o usuário na tabela Usuario
          const newUser = await prisma.usuario.create({
            data: {
              name: profile?.name || user.name || "",
              email,
              password: "",
              image: profile?.picture || user.image || "",
            },
          });

          // Cria a entrada na tabela Account
          await prisma.account.create({
            data: {
              usuarioId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

         
        } else {
          // Verifica se o usuário já tem uma conta associada
          const existingAccount = await prisma.account.findFirst({
            where: {
              usuarioId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

          if (!existingAccount) {
            // Cria a entrada na tabela Account se não existir
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
        // Busca o usuário no banco de dados usando o email
        const usuario = await prisma.usuario.findUnique({
          where: { email: session.user.email }, // Usa o email para buscar o usuário
        });

        if (usuario) {
          session.user.id = usuario.id; // Define o ID correto do usuário na sessão
          session.user.name = usuario.name;
          session.user.email = usuario.email;
          session.user.image = usuario.image || undefined;
        } else {
        }
      }
      return session;
    },
  },
});
