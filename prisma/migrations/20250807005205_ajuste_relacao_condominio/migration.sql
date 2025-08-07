-- CreateTable
CREATE TABLE "public"."Condominio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referenceId" TEXT,

    CONSTRAINT "Condominio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Condominio_cnpj_key" ON "public"."Condominio"("cnpj");

-- CreateIndex
CREATE INDEX "Condominio_city_state_idx" ON "public"."Condominio"("city", "state");

-- CreateIndex
CREATE INDEX "Condominio_name_idx" ON "public"."Condominio"("name");

-- CreateIndex
CREATE INDEX "Condominio_referenceId_idx" ON "public"."Condominio"("referenceId");

-- AddForeignKey
ALTER TABLE "public"."Condominio" ADD CONSTRAINT "Condominio_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "public"."Condominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
