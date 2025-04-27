/*
  Warnings:

  - You are about to drop the column `descrição` on the `Atividade` table. All the data in the column will be lost.
  - You are about to drop the column `itinerárioId` on the `Atividade` table. All the data in the column will be lost.
  - You are about to drop the column `descrição` on the `Destino` table. All the data in the column will be lost.
  - You are about to drop the column `país` on the `Destino` table. All the data in the column will be lost.
  - You are about to drop the `Itinerário` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RespostasPósLogin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuário` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ícone` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `itinerarioId` to the `Atividade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pais` to the `Destino` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Atividade" DROP CONSTRAINT "Atividade_itinerárioId_fkey";

-- DropForeignKey
ALTER TABLE "Itinerário" DROP CONSTRAINT "Itinerário_destinoId_fkey";

-- DropForeignKey
ALTER TABLE "Itinerário" DROP CONSTRAINT "Itinerário_usuárioId_fkey";

-- DropForeignKey
ALTER TABLE "Itinerário" DROP CONSTRAINT "Itinerário_íconeId_fkey";

-- DropForeignKey
ALTER TABLE "RespostasPósLogin" DROP CONSTRAINT "RespostasPósLogin_usuárioId_fkey";

-- AlterTable
ALTER TABLE "Atividade" DROP COLUMN "descrição",
DROP COLUMN "itinerárioId",
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "itinerarioId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Destino" DROP COLUMN "descrição",
DROP COLUMN "país",
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "pais" TEXT NOT NULL;

-- DropTable
DROP TABLE "Itinerário";

-- DropTable
DROP TABLE "RespostasPósLogin";

-- DropTable
DROP TABLE "Usuário";

-- DropTable
DROP TABLE "Ícone";

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostasPosLogin" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "comoConheceu" TEXT NOT NULL,
    "motivoUso" TEXT NOT NULL,
    "frequenciaViagens" TEXT NOT NULL,
    "tipoViajante" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostasPosLogin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "destinoId" INTEGER NOT NULL,
    "iconeId" INTEGER,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "orcamento" DOUBLE PRECISION,

    CONSTRAINT "Itinerario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Icone" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Icone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_clerkUserId_key" ON "Usuario"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RespostasPosLogin_usuarioId_key" ON "RespostasPosLogin"("usuarioId");

-- AddForeignKey
ALTER TABLE "RespostasPosLogin" ADD CONSTRAINT "RespostasPosLogin_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerario" ADD CONSTRAINT "Itinerario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerario" ADD CONSTRAINT "Itinerario_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Destino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerario" ADD CONSTRAINT "Itinerario_iconeId_fkey" FOREIGN KEY ("iconeId") REFERENCES "Icone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_itinerarioId_fkey" FOREIGN KEY ("itinerarioId") REFERENCES "Itinerario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
