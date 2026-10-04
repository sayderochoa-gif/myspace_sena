-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'RRHH', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('PENDIENTE', 'ENVIADO', 'ERROR');

-- AlterTable
ALTER TABLE "liquidaciones" ADD COLUMN     "fecha_anulacion" TIMESTAMP(3),
ADD COLUMN     "motivo_anulacion" TEXT,
ADD COLUMN     "numero_comprobante" VARCHAR(50),
ADD COLUMN     "pdf_path" VARCHAR(255),
ADD COLUMN     "usuario_anulacion_id" INTEGER;

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'EMPLEADO',
    "empleado_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" SERIAL NOT NULL,
    "liquidacion_id" INTEGER NOT NULL,
    "destinatario" VARCHAR(150) NOT NULL,
    "asunto" VARCHAR(200) NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "fecha_ultimo_intento" TIMESTAMP(3),
    "fecha_envio" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_empresa" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL DEFAULT 'FinanCorp S.A.',
    "nit" VARCHAR(50) NOT NULL DEFAULT '900.123.456-7',
    "direccion" VARCHAR(200) NOT NULL DEFAULT 'Calle 72 # 10-34, Bogotá, Colombia',
    "telefono" VARCHAR(50) NOT NULL DEFAULT '+57 (1) 745-0000',
    "correo" VARCHAR(150) NOT NULL DEFAULT 'nomina@financorp.com',
    "sitio_web" VARCHAR(150) NOT NULL DEFAULT 'www.financorp.com',
    "logo_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "accion" VARCHAR(50) NOT NULL,
    "entidad" VARCHAR(50) NOT NULL,
    "entidad_id" INTEGER,
    "descripcion" TEXT NOT NULL,
    "ip" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_empleado_id_key" ON "usuarios"("empleado_id");

-- CreateIndex
CREATE UNIQUE INDEX "liquidaciones_numero_comprobante_key" ON "liquidaciones"("numero_comprobante");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "liquidaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
