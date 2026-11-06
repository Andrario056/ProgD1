-- Esquema clínico de Salud Vacunas (PostgreSQL).
-- Contiene las seis entidades del sistema: centros, personas, vacunas, dosis,
-- certificados_salud y examenes.
--
-- Todas las columnas de datos son obligatorias (NOT NULL). Las relaciones
-- foráneas se declaran de forma explícita para que cada dato clínico sea
-- trazable.
--
-- Una relación estructural necesita un tratamiento especial:
--   certificados_salud.examen_id: la FK es diferida por la referencia
--   circular con examenes.certificado_id.
--
-- Nota: CREATE TABLE IF NOT EXISTS no modifica una tabla que ya existe.
-- Si vienes de una versión anterior del esquema, recrea las tablas o aplica
-- las migraciones de columnas antes de ejecutar este archivo.

CREATE TABLE IF NOT EXISTS centros (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(150) NOT NULL UNIQUE,
	tipo_centro INTEGER NOT NULL CHECK (tipo_centro IN (1, 2, 3, 4)),
	autorizado BOOLEAN NOT NULL DEFAULT FALSE,
	estado VARCHAR(100) NOT NULL,
	municipio VARCHAR(100) NOT NULL,
	parroquia VARCHAR(120) NOT NULL,
	direccion TEXT NOT NULL,
	telefono VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS personas (
	id BIGSERIAL PRIMARY KEY,
	primer_nombre VARCHAR(60) NOT NULL,
	segundo_nombre VARCHAR(60) NOT NULL,
	primer_apellido VARCHAR(60) NOT NULL,
	segundo_apellido VARCHAR(60) NOT NULL,
	cedula VARCHAR(20) NOT NULL UNIQUE,
	nacimiento DATE NOT NULL,
	sexo VARCHAR(20) NOT NULL,
	telefono VARCHAR(30) NOT NULL,
	correo VARCHAR(150) NOT NULL,
	region VARCHAR(100) NOT NULL,
	direccion TEXT NOT NULL,
	tipo_sangre VARCHAR(5) NOT NULL,
	alergias TEXT NOT NULL,
	centro_id BIGINT NOT NULL REFERENCES centros(id) ON DELETE RESTRICT,
	registrado_por VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS vacunas (
	id BIGSERIAL PRIMARY KEY,
	nombre VARCHAR(120) NOT NULL UNIQUE,
	tipo VARCHAR(80) NOT NULL,
	procedencia VARCHAR(80) NOT NULL,
	laboratorio VARCHAR(120) NOT NULL,
	descripcion TEXT NOT NULL,
	refuerzo_meses INTEGER NOT NULL CHECK (refuerzo_meses >= 0),
	obligatoria BOOLEAN NOT NULL DEFAULT FALSE,
	dosis_obligatorias INTEGER NOT NULL DEFAULT 0,
	-- Lotes disponibles en el catálogo, con la forma
	-- [{"codigo": "COV-2601", "vence": "2026-12-31"}, ...].
	-- El lote realmente aplicado se guarda en dosis.lote y dosis.lote_vence.
	lotes JSONB NOT NULL CHECK (
		jsonb_typeof(lotes) = 'array'
		AND lotes <> '[]'::jsonb
	),
	CHECK (
		(obligatoria AND dosis_obligatorias > 0)
		OR (NOT obligatoria AND dosis_obligatorias = 0)
	)
);

CREATE TABLE IF NOT EXISTS dosis (
	id BIGSERIAL PRIMARY KEY,
	persona_id BIGINT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
	centro_id BIGINT NOT NULL REFERENCES centros(id) ON DELETE RESTRICT,
	-- Referencia al catálogo de vacunas. Los campos vacuna, tipo_vacuna y
	-- procedencia guardan una copia del dato al momento de la aplicación.
	vacuna_id BIGINT NOT NULL REFERENCES vacunas(id) ON DELETE RESTRICT,
	vacuna VARCHAR(120) NOT NULL,
	tipo_vacuna VARCHAR(80) NOT NULL,
	procedencia VARCHAR(80) NOT NULL,
	lote VARCHAR(50) NOT NULL,
	lote_vence DATE NOT NULL,
	cantidad NUMERIC(6,2) NOT NULL CHECK (cantidad > 0),
	-- Medidas tomadas al momento de la aplicación. Se guardan en la dosis
	-- porque de ellas depende la cantidad aplicada.
	peso NUMERIC(5,2) NOT NULL CHECK (peso > 0 AND peso <= 500),
	altura NUMERIC(5,2) NOT NULL CHECK (altura > 0 AND altura <= 300),
	dosis VARCHAR(80) NOT NULL,
	fecha DATE NOT NULL,
	aplicador VARCHAR(150) NOT NULL,
	cargo_aplicador VARCHAR(120) NOT NULL,
	atencion TEXT NOT NULL,
	CHECK (lote_vence >= fecha)
);

CREATE TABLE IF NOT EXISTS certificados_salud (
	id BIGSERIAL PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	persona_id BIGINT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
	centro_id BIGINT NOT NULL REFERENCES centros(id) ON DELETE RESTRICT,
	-- Dosis principal que sustenta el certificado. El historial completo de
	-- dosis de la persona se obtiene por persona_id + fecha.
	dosis_id BIGINT NOT NULL REFERENCES dosis(id) ON DELETE RESTRICT,
	-- Examen principal del certificado. La relación completa de exámenes vive
	-- en examenes.certificado_id; esta FK se crea al final porque ambas tablas
	-- se referencian entre sí.
	examen_id BIGINT NOT NULL,
	estado VARCHAR(20) NOT NULL DEFAULT 'Vigente' CHECK (estado IN ('Vigente', 'Vencido')),
	emision DATE NOT NULL,
	vigencia DATE NOT NULL,
	examen_fecha DATE NOT NULL,
	bioanalista VARCHAR(150) NOT NULL,
	medico VARCHAR(150) NOT NULL,
	emisor VARCHAR(150) NOT NULL,
	observaciones TEXT NOT NULL,
	sello VARCHAR(120) NOT NULL,
	firma VARCHAR(120) NOT NULL,
	documentacion JSONB NOT NULL CHECK (
		jsonb_typeof(documentacion) = 'array'
		AND documentacion <> '[]'::jsonb
	),
	CHECK (vigencia >= emision)
);

CREATE TABLE IF NOT EXISTS examenes (
	id BIGSERIAL PRIMARY KEY,
	certificado_id BIGINT NOT NULL REFERENCES certificados_salud(id) ON DELETE CASCADE,
	centro_id BIGINT NOT NULL REFERENCES centros(id) ON DELETE RESTRICT,
	fecha DATE NOT NULL,
	tipo VARCHAR(120) NOT NULL,
	descripcion TEXT NOT NULL,
	resultado VARCHAR(120) NOT NULL,
	unidad VARCHAR(50) NOT NULL,
	referencia VARCHAR(120) NOT NULL
);

-- FK del examen principal. Se agrega después de crear examenes para resolver
-- la referencia circular certificados_salud.examen_id <-> examenes.certificado_id.
-- Es diferible para poder insertar el certificado y su examen principal dentro
-- de una misma transacción, en cualquier orden.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'certificados_salud_examen_id_fkey'
			AND conrelid = 'certificados_salud'::regclass
	) THEN
		ALTER TABLE certificados_salud
			DROP CONSTRAINT certificados_salud_examen_id_fkey;
	END IF;

	ALTER TABLE certificados_salud
		ADD CONSTRAINT certificados_salud_examen_id_fkey
		FOREIGN KEY (examen_id) REFERENCES examenes(id)
		ON DELETE NO ACTION
		DEFERRABLE INITIALLY DEFERRED;
END
$$;

-- Orden de inserción:
--   1. centros.
--   2. personas.
--   3. vacunas.
--   4. dosis.
--   5. certificados_salud y examenes dentro de una misma transacción:
--      se preasigna el id del examen principal, se inserta el certificado
--      con ese examen_id y luego se inserta el examen con ese id y el
--      certificado_id correspondiente. La FK diferida valida ambas filas
--      al hacer COMMIT.
