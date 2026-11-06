'use strict';

const { consulta, unaFila, transaccion } = require('./conexion');
const examenesModelo = require('./examenes');
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
	leerJSON,
	escribirJSON,
	aFechaISO,
	fechaHoy,
	traducirDuplicado
} = require('./utiles');

const TABLA = 'certificados_salud';
const ESTADOS = ['Vigente', 'Vencido'];

const COLUMNAS = {
	id: 'id',
	codigo: 'codigo',
	personaId: 'persona_id',
	centroId: 'centro_id',
	dosisId: 'dosis_id',
	examenId: 'examen_id',
	estado: 'estado',
	emision: 'emision',
	vigencia: 'vigencia',
	examenFecha: 'examen_fecha',
	bioanalista: 'bioanalista',
	medico: 'medico',
	emisor: 'emisor',
	observaciones: 'observaciones',
	sello: 'sello',
	firma: 'firma',
	documentacion: 'documentacion'
};

const COLUMNAS_ACTUALIZABLES = omitir(COLUMNAS, 'id');
const SELECCION = seleccion(COLUMNAS, 'cs');
const SELECCION_COMPLETA = `
	${SELECCION},
	CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido) AS personaNombre,
	p.cedula AS personaCedula,
	p.region AS personaRegion,
	c.name AS centroNombre,
	c.estado AS centroEstado,
	c.municipio AS centroMunicipio,
	(SELECT COUNT(*) FROM examenes e WHERE e.certificado_id = cs.id) AS cantidadExamenes
`;
const DESDE = `
	FROM ${TABLA} cs
	JOIN personas p ON p.id = cs.persona_id
	JOIN centros c ON c.id = cs.centro_id
`;

const ORDENES = {
	emision: 'cs.emision DESC, cs.id DESC',
	vigencia: 'cs.vigencia ASC, cs.id ASC',
	persona: 'personaNombre ASC',
	codigo: 'cs.codigo ASC',
	reciente: 'cs.id DESC'
};

function normalizar(fila) {
	if (!fila) {
		return null;
	}
	const certificado = {
		...fila,
		documentacion: leerJSON(fila.documentacion, [])
	};
	if (certificado.cantidadExamenes !== undefined) {
		certificado.cantidadExamenes = Number(certificado.cantidadExamenes);
	}
	return certificado;
}

function normalizarFilas(filas) {
	return filas.map(normalizar);
}

function validarEstado(estado) {
	if (!ESTADOS.includes(estado)) {
		throw new Error(`El estado debe ser uno de: ${ESTADOS.join(', ')}`);
	}
}

function validarDocumentacion(documentacion) {
	const archivos = Array.isArray(documentacion)
		? documentacion
		: leerJSON(documentacion, null);

	if (!Array.isArray(archivos) || archivos.length === 0) {
		throw new Error('La documentación debe ser un arreglo con al menos un archivo');
	}
	return archivos;
}

function crearFiltros(filtro = {}) {
	const f = filtros();
	f.igual('cs.persona_id', filtro.personaId);
	f.igual('cs.centro_id', filtro.centroId);
	f.igual('cs.estado', filtro.estado);
	f.igual('cs.codigo', filtro.codigo);
	f.igual('p.cedula', filtro.cedula);
	f.igual('p.region', filtro.region);
	f.rango('cs.emision', filtro.desde, filtro.hasta);
	f.rango('cs.vigencia', filtro.vigenciaDesde, filtro.vigenciaHasta);

	if (filtro.busqueda) {
		const patron = `%${filtro.busqueda}%`;
		f.personalizado(
			`(cs.codigo LIKE ? OR p.cedula LIKE ?
			  OR CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre,
			  p.primer_apellido, p.segundo_apellido) LIKE ? OR c.name LIKE ?)`,
			...Array(4).fill(patron)
		);
	}

	return f;
}

async function listar(filtro = {}) {
	const f = crearFiltros(filtro);
	const { sql: limite } = paginacion(filtro);
	const orden = ordenar(ORDENES, filtro.orden, 'emision');
	const filas = await consulta(
		`SELECT ${SELECCION_COMPLETA} ${DESDE} ${f.sql} ORDER BY ${orden} ${limite}`,
		f.valores
	);
	return normalizarFilas(filas);
}

async function contar(filtro = {}) {
	const f = crearFiltros(filtro);
	const fila = await unaFila(
		`SELECT COUNT(*) AS total ${DESDE} ${f.sql}`,
		f.valores
	);
	return Number(fila?.total ?? 0);
}

async function obtenerPorIdEn(id, ejecutor) {
	const fila = await unaFila(
		`SELECT ${SELECCION_COMPLETA} ${DESDE} WHERE cs.id = ? LIMIT 1`,
		[id],
		ejecutor
	);
	return normalizar(fila);
}

async function obtenerPorId(id) {
	return obtenerPorIdEn(id);
}

async function obtenerPorCodigo(codigo) {
	if (!codigo) {
		return null;
	}
	const fila = await unaFila(
		`SELECT ${SELECCION_COMPLETA} ${DESDE} WHERE cs.codigo = ? LIMIT 1`,
		[String(codigo).trim()]
	);
	return normalizar(fila);
}

async function listarPorPersona(personaId, filtro = {}) {
	return listar({ ...filtro, personaId });
}

async function crear(datos = {}) {
	exigir(datos, [
		'codigo',
		'personaId',
		'centroId',
		'dosisId',
		'examenId',
		'emision',
		'vigencia',
		'examenFecha',
		'bioanalista',
		'medico',
		'emisor',
		'sello',
		'firma',
		'documentacion'
	]);
	exigirId(datos, ['personaId', 'centroId', 'dosisId', 'examenId']);

	const documentacion = validarDocumentacion(datos.documentacion);
	const estado = datos.estado ?? 'Vigente';
	validarEstado(estado);

	const base = {
		...datos,
		personaId: Number(datos.personaId),
		centroId: Number(datos.centroId),
		dosisId: Number(datos.dosisId),
		examenId: Number(datos.examenId),
		estado,
		emision: aFechaISO(datos.emision),
		vigencia: aFechaISO(datos.vigencia),
		examenFecha: aFechaISO(datos.examenFecha),
		observaciones: datos.observaciones ?? '',
		documentacion: escribirJSON(documentacion)
	};

	if (base.vigencia < base.emision) {
		throw new Error('La fecha de vigencia no puede ser anterior a la emisión');
	}

	try {
		const insercion = construirInsercion(base, COLUMNAS_ACTUALIZABLES);
		const resultado = await consulta(
			`INSERT INTO ${TABLA} ${insercion.sql}`,
			insercion.valores
		);
		return obtenerPorId(resultado.insertId);
	} catch (error) {
		throw traducirDuplicado(error, 'Ya existe un certificado con ese código');
	}
}

/**
 * Crea el certificado y sus exámenes en una sola transacción.
 *
 * certificados_salud.examen_id y examenes.certificado_id forman una relación
 * circular. En MySQL no existen FK diferidas, por lo que el certificado se
 * inserta con examen_id NULL, luego se insertan los exámenes y finalmente se
 * actualiza examen_id con el primer examen creado.
 */
async function crearConExamenes(datos = {}, examenes = []) {
	exigir(datos, [
		'codigo',
		'personaId',
		'centroId',
		'dosisId',
		'emision',
		'vigencia',
		'examenFecha',
		'bioanalista',
		'medico',
		'emisor',
		'sello',
		'firma',
		'documentacion'
	]);
	exigirId(datos, ['personaId', 'centroId', 'dosisId']);

	if (!Array.isArray(examenes) || examenes.length === 0) {
		throw new Error('Debe registrarse al menos un examen');
	}

	const documentacion = validarDocumentacion(datos.documentacion);
	const estado = datos.estado ?? 'Vigente';
	validarEstado(estado);

	const emision = aFechaISO(datos.emision);
	const vigencia = aFechaISO(datos.vigencia);
	if (vigencia < emision) {
		throw new Error('La fecha de vigencia no puede ser anterior a la emisión');
	}

	const listaExamenes = examenes.map((examen) => ({
		...examen,
		certificadoId: null,
		centroId: Number(examen.centroId ?? datos.centroId),
		fecha: aFechaISO(examen.fecha ?? datos.examenFecha)
	}));

	for (const examen of listaExamenes) {
		exigir(examen, ['centroId', 'fecha', 'tipo', 'descripcion', 'resultado', 'unidad', 'referencia']);
		exigirId(examen, ['centroId']);
	}

	const base = {
		...datos,
		personaId: Number(datos.personaId),
		centroId: Number(datos.centroId),
		dosisId: Number(datos.dosisId),
		examenId: null,
		estado,
		emision,
		vigencia,
		examenFecha: aFechaISO(datos.examenFecha),
		observaciones: datos.observaciones ?? '',
		documentacion: escribirJSON(documentacion)
	};

	try {
		return await transaccion(async (conexion) => {
			const insercion = construirInsercion(base, COLUMNAS_ACTUALIZABLES);
			const resultado = await consulta(
				`INSERT INTO ${TABLA} ${insercion.sql}`,
				insercion.valores,
				conexion
			);
			const certificadoId = resultado.insertId;

			let examenPrincipalId = null;
			for (const examen of listaExamenes) {
				const insercionExamen = construirInsercion(
					{ ...examen, certificadoId },
					examenesModelo.COLUMNAS_ACTUALIZABLES
				);
				const resultadoExamen = await consulta(
					`INSERT INTO examenes ${insercionExamen.sql}`,
					insercionExamen.valores,
					conexion
				);
				if (examenPrincipalId === null) {
					examenPrincipalId = resultadoExamen.insertId;
				}
			}

			await consulta(
				`UPDATE ${TABLA} SET examen_id = ? WHERE id = ?`,
				[examenPrincipalId, certificadoId],
				conexion
			);

			return obtenerCompletoEn(certificadoId, conexion);
		});
	} catch (error) {
		throw traducirDuplicado(error, 'Ya existe un certificado con ese código');
	}
}

async function actualizar(id, datos = {}) {
	if (Object.keys(datos).length === 0) {
		return obtenerPorId(id);
	}

	const base = { ...datos };

	if (base.documentacion !== undefined) {
		base.documentacion = escribirJSON(validarDocumentacion(base.documentacion));
	}
	if (base.estado !== undefined) {
		validarEstado(base.estado);
	}
	if (base.personaId !== undefined) {
		base.personaId = Number(base.personaId);
	}
	if (base.centroId !== undefined) {
		base.centroId = Number(base.centroId);
	}
	if (base.dosisId !== undefined) {
		base.dosisId = Number(base.dosisId);
	}
	if (base.examenId !== undefined && base.examenId !== null) {
		base.examenId = Number(base.examenId);
	}
	if (base.emision !== undefined) {
		base.emision = aFechaISO(base.emision);
	}
	if (base.vigencia !== undefined) {
		base.vigencia = aFechaISO(base.vigencia);
	}
	if (base.examenFecha !== undefined) {
		base.examenFecha = aFechaISO(base.examenFecha);
	}

	const cambios = construirActualizacion(base, COLUMNAS_ACTUALIZABLES);
	try {
		await consulta(
			`UPDATE ${TABLA} SET ${cambios.sql} WHERE id = ?`,
			[...cambios.valores, id]
		);
		return obtenerPorId(id);
	} catch (error) {
		throw traducirDuplicado(error, 'Ya existe un certificado con ese código');
	}
}

async function actualizarEstado(id, estado) {
	validarEstado(estado);
	await consulta(
		`UPDATE ${TABLA} SET estado = ? WHERE id = ?`,
		[estado, id]
	);
	return obtenerPorId(id);
}

async function marcarVencidos(fecha = fechaHoy()) {
	const resultado = await consulta(
		`UPDATE ${TABLA}
		 SET estado = 'Vencido'
		 WHERE estado = 'Vigente' AND vigencia < ?`,
		[fecha]
	);
	return { actualizados: Number(resultado.affectedRows) };
}

async function eliminar(id) {
	return transaccion(async (conexion) => {
		await consulta(
			`UPDATE ${TABLA} SET examen_id = NULL WHERE id = ?`,
			[id],
			conexion
		);
		await consulta(
			'DELETE FROM examenes WHERE certificado_id = ?',
			[id],
			conexion
		);
		const resultado = await consulta(
			`DELETE FROM ${TABLA} WHERE id = ?`,
			[id],
			conexion
		);
		return { eliminado: resultado.affectedRows > 0 };
	});
}

async function obtenerCompletoEn(id, ejecutor) {
	const certificado = await obtenerPorIdEn(id, ejecutor);
	if (!certificado) {
		return null;
	}
	const examenes = await examenesModelo.listarPorCertificado(id, ejecutor);
	return { ...certificado, examenes };
}

async function obtenerCompleto(id) {
	return obtenerCompletoEn(id);
}

async function verificarPorCodigo(codigo) {
	const certificado = await obtenerPorCodigo(codigo);
	if (!certificado) {
		return null;
	}
	const examenes = await examenesModelo.listarPorCertificado(certificado.id);
	return {
		...certificado,
		examenes,
		vigente: certificado.estado === 'Vigente' && certificado.vigencia >= fechaHoy()
	};
}

module.exports = {
	TABLA,
	COLUMNAS,
	ESTADOS,
	listar,
	contar,
	obtenerPorId,
	obtenerPorCodigo,
	listarPorPersona,
	crear,
	crearConExamenes,
	actualizar,
	actualizarEstado,
	marcarVencidos,
	eliminar,
	obtenerCompleto,
	verificarPorCodigo
};
