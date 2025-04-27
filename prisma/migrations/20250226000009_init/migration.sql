-- CreateTable
CREATE TABLE "Usuário" (
    "id" SERIAL NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuário_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostasPósLogin" (
    "id" SERIAL NOT NULL,
    "usuárioId" INTEGER NOT NULL,
    "comoConheceu" TEXT NOT NULL,
    "motivoUso" TEXT NOT NULL,
    "frequenciaViagens" TEXT NOT NULL,
    "tipoViajante" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostasPósLogin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerário" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descrição" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuárioId" INTEGER NOT NULL,
    "destinoId" INTEGER NOT NULL,
    "íconeId" INTEGER,
    "dataInício" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "orçamento" DOUBLE PRECISION,

    CONSTRAINT "Itinerário_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atividade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descrição" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "custo" DOUBLE PRECISION,
    "itinerárioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "parceiroId" INTEGER,

    CONSTRAINT "Atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destino" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "país" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "descrição" TEXT,

    CONSTRAINT "Destino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parceiro" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "destinoId" INTEGER NOT NULL,

    CONSTRAINT "Parceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ícone" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Ícone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuário_clerkUserId_key" ON "Usuário"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuário_email_key" ON "Usuário"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RespostasPósLogin_usuárioId_key" ON "RespostasPósLogin"("usuárioId");

-- AddForeignKey
ALTER TABLE "RespostasPósLogin" ADD CONSTRAINT "RespostasPósLogin_usuárioId_fkey" FOREIGN KEY ("usuárioId") REFERENCES "Usuário"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerário" ADD CONSTRAINT "Itinerário_usuárioId_fkey" FOREIGN KEY ("usuárioId") REFERENCES "Usuário"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerário" ADD CONSTRAINT "Itinerário_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Destino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerário" ADD CONSTRAINT "Itinerário_íconeId_fkey" FOREIGN KEY ("íconeId") REFERENCES "Ícone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_itinerárioId_fkey" FOREIGN KEY ("itinerárioId") REFERENCES "Itinerário"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "Parceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parceiro" ADD CONSTRAINT "Parceiro_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Destino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
