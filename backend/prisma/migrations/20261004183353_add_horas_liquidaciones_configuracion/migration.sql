-- CreateEnum
CREATE TYPE "EstadoLiquidacion" AS ENUM ('PENDIENTE', 'CALCULADA', 'ANULADA');

-- CreateTable
CREATE TABLE "horas_trabajadas" (
    "id" SERIAL NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "periodo" VARCHAR(7) NOT NULL,
    "horas" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horas_trabajadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones" (
    "id" SERIAL NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "periodo" VARCHAR(7) NOT NULL,
    "horas_trabajadas" DECIMAL(6,2) NOT NULL,
    "valor_hora" DECIMAL(12,2) NOT NULL,
    "numero_hijos" INTEGER NOT NULL DEFAULT 0,
    "cargo_nombre" VARCHAR(100) NOT NULL,
    "salario_bruto" DECIMAL(14,2) NOT NULL,
    "bono_hijos" DECIMAL(14,2) NOT NULL,
    "porcentaje_seguridad_social" DECIMAL(5,2) NOT NULL,
    "valor_seguridad_social" DECIMAL(14,2) NOT NULL,
    "salario_neto" DECIMAL(14,2) NOT NULL,
    "estado" "EstadoLiquidacion" NOT NULL DEFAULT 'CALCULADA',
    "fecha_liquidacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones_nomina" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(50) NOT NULL,
    "valor" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuraciones_nomina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "horas_trabajadas_empleado_id_periodo_key" ON "horas_trabajadas"("empleado_id", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "liquidaciones_empleado_id_periodo_key" ON "liquidaciones"("empleado_id", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_nomina_clave_key" ON "configuraciones_nomina"("clave");

-- AddForeignKey
ALTER TABLE "horas_trabajadas" ADD CONSTRAINT "horas_trabajadas_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
