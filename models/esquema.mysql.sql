-- Esquema MySQL 8 para la carpeta models/.
-- Adaptación de esquema.sql (PostgreSQL) a MySQL.
--
-- Cambios necesarios por el motor:
--   * BIGSERIAL se reemplaza por BIGINT UNSIGNED AUTO_INCREMENT.
--   * JSONB se reemplaza por JSON.
--   * certificados_salud.examen_id admite NULL para resolver la referencia
--     circular con examenes.certificado_id. El modelo crea el certificado,
--     inserta los exámenes y después asigna el examen principal.
--
-- Las comprobaciones de que los arreglos JSON no estén vacíos se hacen en los
-- modelos, porque las funciones JSON dentro de CHECK tienen soporte limitado
-- según la versión de MySQL.

CREATE TABLE IF NOT EXISTS centros (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	name VARCHAR(150) NOT NULL,
	tipo_centro TINYINT UNSIGNED NOT NULL,
	autorizado TINYINT(1) NOT NULL DEFAULT 0,
	estado VARCHAR(100) NOT NULL,
	municipio VARCHAR(100) NOT NULL,
	parroquia VARCHAR(120) NOT NULL,
	direccion TEXT NOT NULL,
	telefono VARCHAR(30) NOT NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uq_centros_name (name),
	CONSTRAINT chk_centros_tipo CHECK (tipo_centro BETWEEN 1 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS personas (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	primer_nombre VARCHAR(60) NOT NULL,
	segundo_nombre VARCHAR(60) NOT NULL DEFAULT '',
	primer_apellido VARCHAR(60) NOT NULL,
	segundo_apellido VARCHAR(60) NOT NULL DEFAULT '',
	cedula VARCHAR(20) NOT NULL,
	nacimiento DATE NOT NULL,
	sexo VARCHAR(20) NOT NULL,
	telefono VARCHAR(30) NOT NULL,
	correo VARCHAR(150) NOT NULL,
	region VARCHAR(100) NOT NULL,
	direccion TEXT NOT NULL,
	tipo_sangre VARCHAR(5) NOT NULL,
	alergias TEXT NOT NULL,
	centro_id BIGINT UNSIGNED NOT NULL,
	registrado_por VARCHAR(150) NOT NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uq_personas_cedula (cedula),
	KEY idx_personas_centro (centro_id),
	KEY idx_personas_region (region),
	CONSTRAINT fk_personas_centro
		FOREIGN KEY (centro_id) REFERENCES centros (id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vacunas (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	nombre VARCHAR(120) NOT NULL,
	tipo VARCHAR(80) NOT NULL,
	procedencia VARCHAR(80) NOT NULL,
	laboratorio VARCHAR(120) NOT NULL,
	descripcion TEXT NOT NULL,
	refuerzo_meses INT UNSIGNED NOT NULL,
	obligatoria TINYINT(1) NOT NULL DEFAULT 0,
	dosis_obligatorias INT UNSIGNED NOT NULL DEFAULT 0,
	lotes JSON NOT NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uq_vacunas_nombre (nombre),
	CONSTRAINT chk_vacunas_refuerzo CHECK (refuerzo_meses >= 0),
	CONSTRAINT chk_vacunas_obligatorias CHECK (dosis_obligatorias >= 0),
	CONSTRAINT chk_vacunas_coherencia CHECK (
		(obligatoria = 1 AND dosis_obligatorias > 0)
		OR (obligatoria = 0 AND dosis_obligatorias = 0)
	)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dosis (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	persona_id BIGINT UNSIGNED NOT NULL,
	centro_id BIGINT UNSIGNED NOT NULL,
	vacuna_id BIGINT UNSIGNED NOT NULL,
	vacuna VARCHAR(120) NOT NULL,
	tipo_vacuna VARCHAR(80) NOT NULL,
	procedencia VARCHAR(80) NOT NULL,
	lote VARCHAR(50) NOT NULL,
	lote_vence DATE NOT NULL,
	cantidad DECIMAL(6,2) NOT NULL,
	peso DECIMAL(5,2) NOT NULL,
	altura DECIMAL(5,2) NOT NULL,
	dosis VARCHAR(80) NOT NULL,
	fecha DATE NOT NULL,
	aplicador VARCHAR(150) NOT NULL,
	cargo_aplicador VARCHAR(120) NOT NULL,
	atencion TEXT NOT NULL,
	PRIMARY KEY (id),
	KEY idx_dosis_persona (persona_id),
	KEY idx_dosis_centro (centro_id),
	KEY idx_dosis_vacuna (vacuna_id),
	KEY idx_dosis_fecha (fecha),
	CONSTRAINT fk_dosis_persona
		FOREIGN KEY (persona_id) REFERENCES personas (id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE,
	CONSTRAINT fk_dosis_centro
		FOREIGN KEY (centro_id) REFERENCES centros (id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE,
	CONSTRAINT fk_dosis_vacuna
		FOREIGN KEY (vacuna_id) REFERENCES vacunas (id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE,
	CONSTRAINT chk_dosis_cantidad CHECK (cantidad > 0),
	CONSTRAINT chk_dosis_peso CHECK (peso > 0 AND peso <= 500),
	CONSTRAINT chk_dosis_altura CHECK (altura > 0 AND altura <= 300),
	CONSTRAINT chk_dosis_lote CHECK (lote_vence >= fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificados_salud (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	codigo VARCHAR(50) NOT NULL,
	persona_id BIGINT UNSIGNED NOT NULL,
	centro_id BIGINT UNSIGNED NOT NULL,
	dosis_id BIGINT UNSIGNED NOT NULL,
	examen_id BIGINT UNSIGNED NULL,
	estado ENUM('Vigente', 'Vencido') NOT NULL DEFAULT 'Vigente',
	emision DATE NOT NULL,
	vigencia DATE NOT NULL,
	examen_fecha DATE NOT NULL,
	bioanalista VARCHAR(150) NOT NULL,
	medico VARCHAR(150) NOT NULL,
	emisor VARCHAR(150) NOT NULL,
	observaciones TEXT NOT NULL,
	sello VARCHAR(120) NOT NULL,
	firma VARCHAR(120) NOT NULL,
	documentacion JSON NOT NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uq_certificados_codigo (codigo),
	KEY idx_certificados_persona (persona_id),
	KEY idx_certificados_centro (centro_id),
	KEY idx_certificados_estado (estado),
	KEY idx_certificados_emision (emision),
	KEY idx_certificados_examen (examen_id),
	CONSTRAINT fk_certificados_persona
		FOREIGN KEY (persona_id) REFERENCES personas (id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE,
	CONSTRAINT fk_certificados_centro
		FOREIGN KEY (centro_id) REFERENCES centros (id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE,
	CONSTRAINT fk_certificados_dosis
		FOREIGN KEY (dosis_id) REFERENCES dosis (id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE,
	CONSTRAINT chk_certificados_vigencia CHECK (vigencia >= emision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS examenes (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	certificado_id BIGINT UNSIGNED NOT NULL,
	centro_id BIGINT UNSIGNED NOT NULL,
	fecha DATE NOT NULL,
	tipo VARCHAR(120) NOT NULL,
	descripcion TEXT NOT NULL,
	resultado VARCHAR(120) NOT NULL,
	unidad VARCHAR(50) NOT NULL,
	referencia VARCHAR(120) NOT NULL,
	PRIMARY KEY (id),
	KEY idx_examenes_certificado (certificado_id),
	KEY idx_examenes_centro (centro_id),
	CONSTRAINT fk_examenes_certificado
		FOREIGN KEY (certificado_id) REFERENCES certificados_salud (id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	CONSTRAINT fk_examenes_centro
		FOREIGN KEY (centro_id) REFERENCES centros (id)
		ON DELETE RESTRICT
		ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK del examen principal. Se agrega después de crear examenes para resolver
-- la referencia circular. El bloque es idempotente: solo agrega la FK si no
-- existe.
SET @fk_examen := (
	SELECT COUNT(*)
	FROM information_schema.TABLE_CONSTRAINTS
	WHERE CONSTRAINT_SCHEMA = DATABASE()
		AND TABLE_NAME = 'certificados_salud'
		AND CONSTRAINT_NAME = 'fk_certificados_examen'
		AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql_fk := IF(
	@fk_examen = 0,
	'ALTER TABLE certificados_salud ADD CONSTRAINT fk_certificados_examen FOREIGN KEY (examen_id) REFERENCES examenes (id) ON DELETE RESTRICT ON UPDATE CASCADE',
	'SELECT 1'
);

PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;
