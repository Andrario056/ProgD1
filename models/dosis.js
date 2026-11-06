'use strict';

const { consulta, unaFila } = require('./conexion');
const {
	paginacion,
	seleccion,
	construirInsercion,
	construirActualizacion,
	omitir,
	filtros,
	ordenar,
	exigir,
	exigirId,
	aFechaISO
} = require('./utiles');

const TABLA = 'dosis';

const COLUMNAS = {
	id: 'id',
	personaId: 'persona_id',
	centroId: 'centro_id',
	vacunaId: 'vacuna_id',
	vacuna: 'vacuna',
	tipoVacuna: 'tipo_vacuna',
	procedencia: 'procedencia',
	lote: 'lote',
	loteVence: 'lote_vence',
	cantidad: 'cantidad',
	peso: 'peso',
	altura: 'altura',
	dosis: 'dosis',
	fecha: 'fecha',
	aplicador: 'aplicador',
	cargoAplicador: 'cargo_aplicador',
	atencion: 'atencion'
};

const COLUMNAS_ACTUALIZABLES = omitir(COLUMNAS, 'id');
const SELECCION = seleccion(COLUMNAS, 'd');
const SELECCION_COMPLETA = `
	${SELECCION},
	CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido) AS personaNombre,
	p.cedula AS personaCedula,
	p.region AS personaRegion,
	c.name AS centroNombre,
	c.estado AS centroEstado,
	c.municipio AS centroMunicipio
`;
const DESDE = `
	FROM ${TABLA} d
	JOIN personas p ON p.id = d.persona_id
	JOIN centros c ON c.id = d.centro_id
`;

const ORDENES = {
	fecha: 'd.fecha DESC, d.id DESC',
	persona: 'personaNombre ASC',
	vacuna: 'd.vacuna ASC',
	aplicador: 'd.aplicador ASC',
	lote: 'd.lote ASC',
	centro: 'c.name ASC'
};

function crearFiltros(filtro = {}) {
	const f = filtros();
	f.igual('d.persona_id', filtro.personaId);
	f.igual('d.centro_id', filtro.centroId);
	f.igual('d.vacuna_id', filtro.vacunaId);
	f.igual('d.vacuna', filtro.vacuna);
	f.igual('d.tipo_vacuna', filtro.tipoVacuna);
	f.igual('d.lote', filtro.lote);
	f.igual('d.aplicador', filtro.aplicador);
	f.igual('p.cedula', filtro.cedula);
	f.igual('d.fecha', filtro.fecha);
	f.rango('d.fecha', filtro.desde, filtro.hasta);

	if (filtro.anio) {
		f.personalizado('YEAR(d.fecha) = ?', Number(filtro.anio));
	}

	if (filtro.busqueda) {
		const patron = `%${filtro.busqueda}%`;
		f.personalizado(
			`(p.cedula LIKE ? OR p.primer_nombre LIKE ? OR p.segundo_nombre LIKE ?
			  OR p.primer_apellido LIKE ? OR p.segundo_apellido LIKE ?
			  OR d.vacuna LIKE ? OR d.lote LIKE ? OR d.aplicador LIKE ? OR c.name LIKE ?)`,
			...Array(9).fill(patron)
		);
	}

	return f;
}

async function listar(filtro = {}) {
	const f = crearFiltros(filtro);
	const { sql: limite } = paginacion(filtro);
	const orden = ordenar(ORDENES, filtro.orden, 'fecha');
	return consulta(
		`SELECT ${SELECCION_COMPLETA} ${DESDE} ${f.sql} ORDER BY ${orden} ${limite}`,
		f.valores
	);
}

async function contar(filtro = {}) {
	const f = crearFiltros(filtro);
	const fila = await unaFila(
		`SELECT COUNT(*) AS total ${DESDE} ${f.sql}`,
		f.valores
	);
	return Number(fila?.total ?? 0);
}

async function obtenerPorId(id) {
	return unaFila(
		`SELECT ${SELECCION_COMPLETA} ${DESDE} WHERE d.id = ? LIMIT 1`,
		[id]
	);
}

async function listarPorPersona(personaId, { limite = 100, orden = 'fecha' } = {}) {
	return listar({ personaId, limite, orden });
}

async function ultimaDosis(personaId, vacunaId) {
	return unaFila(
		`SELECT ${SELECCION_COMPLETA} ${DESDE}
		 WHERE d.persona_id = ? AND d.vacuna_id = ?
		 ORDER BY d.fecha DESC, d.id DESC
		 LIMIT 1`,
		[personaId, vacunaId]
	);
}

async function resumenPorPersona(personaId) {
	const filas = await consulta(
		`SELECT d.vacuna_id AS vacunaId,
		        d.vacuna AS vacuna,
		        COUNT(*) AS aplicadas,
		        MAX(d.fecha) AS ultimaFecha
		 FROM ${TABLA} d
		 WHERE d.persona_id = ?
		 GROUP BY d.vacuna_id, d.vacuna
		 ORDER BY d.vacuna ASC`,
		[personaId]
	);
	return filas.map((fila) => ({
		...fila,
		aplicadas: Number(fila.aplicadas)
	}));
}

async function crear(datos = {}) {
	exigir(datos, [
		'personaId',
		'centroId',
		'vacunaId',
		'lote',
		'loteVence',
		'cantidad',
		'peso',
		'altura',
		'dosis',
		'fecha',
		'aplicador',
		'cargoAplicador',
		'atencion'
	]);
	exigirId(datos, ['personaId', 'centroId', 'vacunaId']);

	const base = {
		...datos,
		personaId: Number(datos.personaId),
		centroId: Number(datos.centroId),
		vacunaId: Number(datos.vacunaId),
		cantidad: Number(datos.cantidad),
		peso: Number(datos.peso),
		altura: Number(datos.altura),
		fecha: aFechaISO(datos.fecha),
		loteVence: aFechaISO(datos.loteVence)
	};

	if (!(base.cantidad > 0)) {
		throw new Error('La cantidad aplicada debe ser mayor que 0');
	}
	if (!(base.peso > 0 && base.peso <= 500)) {
		throw new Error('El peso debe estar entre 0 y 500');
	}
	if (!(base.altura > 0 && base.altura <= 300)) {
		throw new Error('La altura debe estar entre 0 y 300');
	}
	if (base.loteVence < base.fecha) {
		throw new Error('El lote no puede estar vencido para la fecha de aplicación');
	}

	// Los datos de la vacuna se guardan como copia histórica en la dosis.
	if (!base.vacuna || !base.tipoVacuna || !base.procedencia) {
		const vacuna = await unaFila(
			'SELECT nombre, tipo, procedencia FROM vacunas WHERE id = ? LIMIT 1',
			[base.vacunaId]
		);
		if (!vacuna) {
			throw new Error('La vacuna indicada no existe');
		}
		base.vacuna = base.vacuna || vacuna.nombre;
		base.tipoVacuna = base.tipoVacuna || vacuna.tipo;
		base.procedencia = base.procedencia || vacuna.procedencia;
	}

	const insercion = construirInsercion(base, COLUMNAS_ACTUALIZABLES);
	const resultado = await consulta(
		`INSERT INTO ${TABLA} ${insercion.sql}`,
		insercion.valores
	);
	return obtenerPorId(resultado.insertId);
}

async function actualizar(id, datos = {}) {
	if (Object.keys(datos).length === 0) {
		return obtenerPorId(id);
	}

	const base = { ...datos };
	if (base.personaId !== undefined) {
		base.personaId = Number(base.personaId);
	}
	if (base.centroId !== undefined) {
		base.centroId = Number(base.centroId);
	}
	if (base.vacunaId !== undefined) {
		base.vacunaId = Number(base.vacunaId);
	}
	if (base.cantidad !== undefined) {
		base.cantidad = Number(base.cantidad);
	}
	if (base.peso !== undefined) {
		base.peso = Number(base.peso);
	}
	if (base.altura !== undefined) {
		base.altura = Number(base.altura);
	}
	if (base.fecha !== undefined) {
		base.fecha = aFechaISO(base.fecha);
	}
	if (base.loteVence !== undefined) {
		base.loteVence = aFechaISO(base.loteVence);
	}

	const cambios = construirActualizacion(base, COLUMNAS_ACTUALIZABLES);
	await consulta(
		`UPDATE ${TABLA} SET ${cambios.sql} WHERE id = ?`,
		[...cambios.valores, id]
	);
	return obtenerPorId(id);
}

async function eliminar(id) {
	const resultado = await consulta(`DELETE FROM ${TABLA} WHERE id = ?`, [id]);
	return { eliminado: resultado.affectedRows > 0 };
}

async function estadisticas({ desde, hasta, centroId } = {}) {
	const f = filtros();
	f.igual('d.centro_id', centroId);
	f.rango('d.fecha', desde, hasta);

	const fila = await unaFila(
		`SELECT COUNT(*) AS total,
		        COUNT(DISTINCT d.persona_id) AS personas,
		        COUNT(DISTINCT d.vacuna_id) AS vacunas,
		        COUNT(DISTINCT d.centro_id) AS centros
		 FROM ${TABLA} d ${f.sql}`,
		f.valores
	);

	return {
		total: Number(fila?.total ?? 0),
		personas: Number(fila?.personas ?? 0),
		vacunas: Number(fila?.vacunas ?? 0),
		centros: Number(fila?.centros ?? 0)
	};
}

async function listarAplicadores(centroId) {
	return consulta(
		`SELECT DISTINCT d.aplicador AS aplicador,
		        d.cargo_aplicador AS cargoAplicador
		 FROM ${TABLA} d
		 WHERE d.centro_id = ?
		 ORDER BY d.aplicador ASC`,
		[centroId]
	);
}

async function listarLotes({ vacunaId, centroId } = {}) {
	const f = filtros();
	f.igual('d.vacuna_id', vacunaId);
	f.igual('d.centro_id', centroId);

	return consulta(
		`SELECT DISTINCT d.vacuna_id AS vacunaId,
		        d.vacuna AS vacuna,
		        d.lote AS lote,
		        d.lote_vence AS loteVence
		 FROM ${TABLA} d ${f.sql}
		 ORDER BY d.vacuna ASC, d.lote ASC`,
		f.valores
	);
}

module.exports = {
	TABLA,
	COLUMNAS,
	listar,
	contar,
	obtenerPorId,
	listarPorPersona,
	ultimaDosis,
	resumenPorPersona,
	crear,
	actualizar,
	eliminar,
	estadisticas,
	listarAplicadores,
	listarLotes
};
