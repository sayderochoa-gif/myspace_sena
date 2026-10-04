-- CreateTable
CREATE TABLE "cargos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "valor_hora_minimo" DECIMAL(12,2) NOT NULL,
    "valor_hora_maximo" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "documento" VARCHAR(50) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "cargo_id" INTEGER NOT NULL,
    "valor_hora" DECIMAL(12,2) NOT NULL,
    "numero_hijos" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cargos_nombre_key" ON "cargos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_documento_key" ON "empleados"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_correo_key" ON "empleados"("correo");

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
