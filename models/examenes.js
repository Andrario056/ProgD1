'use strict';

const { consulta, unaFila, transaccion } = require('./conexion');
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

const TABLA = 'examenes';

const COLUMNAS = {
	id: 'id',
	certificadoId: 'certificado_id',
	centroId: 'centro_id',
	fecha: 'fecha',
	tipo: 'tipo',
	descripcion: 'descripcion',
	resultado: 'resultado',
	unidad: 'unidad',
	referencia: 'referencia'
};

const COLUMNAS_ACTUALIZABLES = omitir(COLUMNAS, 'id');
const SELECCION = seleccion(COLUMNAS, 'e');
const SELECCION_COMPLETA = `${SELECCION}, c.name AS centroNombre`;
const DESDE = `
	FROM ${TABLA} e
	JOIN centros c ON c.id = e.centro_id
`;

const ORDENES = {
	fecha: 'e.fecha DESC, e.id DESC',
	tipo: 'e.tipo ASC, e.id ASC',
	reciente: 'e.id DESC'
};

function crearFiltros(filtro = {}) {
	const f = filtros();
	f.igual('e.certificado_id', filtro.certificadoId);
	f.igual('e.centro_id', filtro.centroId);
	f.igual('e.tipo', filtro.tipo);
	f.igual('e.fecha', filtro.fecha);
	f.rango('e.fecha', filtro.desde, filtro.hasta);

	if (filtro.busqueda) {
		const patron = `%${filtro.busqueda}%`;
		f.personalizado(
			'(e.tipo LIKE ? OR e.descripcion LIKE ? OR e.resultado LIKE ? OR e.unidad LIKE ? OR e.referencia LIKE ?)',
			...Array(5).fill(patron)
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
		`SELECT ${SELECCION_COMPLETA} ${DESDE} WHERE e.id = ? LIMIT 1`,
		[id]
	);
}

async function listarPorCertificado(certificadoId, ejecutor) {
	return consulta(
		`SELECT ${SELECCION_COMPLETA} ${DESDE}
		 WHERE e.certificado_id = ?
		 ORDER BY e.id ASC`,
		[certificadoId],
		ejecutor
	);
}

async function crear(datos = {}) {
	const base = {
		...datos,
		certificadoId: Number(datos.certificadoId),
		centroId: Number(datos.centroId),
		fecha: aFechaISO(datos.fecha)
	};

	exigir(base, [
		'certificadoId',
		'centroId',
		'fecha',
		'tipo',
		'descripcion',
		'resultado',
		'unidad',
		'referencia'
	]);
	exigirId(base, ['certificadoId', 'centroId']);

	const insercion = construirInsercion(base, COLUMNAS_ACTUALIZABLES);
	const resultado = await consulta(
		`INSERT INTO ${TABLA} ${insercion.sql}`,
		insercion.valores
	);
	return obtenerPorId(resultado.insertId);
}

async function crearMuchos(certificadoId, examenes, centroId) {
	if (!Array.isArray(examenes) || examenes.length === 0) {
		throw new Error('Debe registrarse al menos un examen');
	}

	return transaccion(async (conexion) => {
		for (const examen of examenes) {
			const base = {
				...examen,
				certificadoId: Number(certificadoId),
				centroId: Number(examen.centroId ?? centroId),
				fecha: aFechaISO(examen.fecha)
			};
			exigir(base, [
				'certificadoId',
				'centroId',
				'fecha',
				'tipo',
				'descripcion',
				'resultado',
				'unidad',
				'referencia'
			]);
			exigirId(base, ['certificadoId', 'centroId']);

			const insercion = construirInsercion(base, COLUMNAS_ACTUALIZABLES);
			await consulta(
				`INSERT INTO ${TABLA} ${insercion.sql}`,
				insercion.valores,
				conexion
			);
		}

		return listarPorCertificado(certificadoId, conexion);
	});
}

async function actualizar(id, datos = {}) {
	if (Object.keys(datos).length === 0) {
		return obtenerPorId(id);
	}

	const base = { ...datos };
	if (base.certificadoId !== undefined) {
		base.certificadoId = Number(base.certificadoId);
	}
	if (base.centroId !== undefined) {
		base.centroId = Number(base.centroId);
	}
	if (base.fecha !== undefined) {
		base.fecha = aFechaISO(base.fecha);
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

async function eliminarPorCertificado(certificadoId) {
	const resultado = await consulta(
		`DELETE FROM ${TABLA} WHERE certificado_id = ?`,
		[certificadoId]
	);
	return { eliminados: resultado.affectedRows };
}

module.exports = {
	TABLA,
	COLUMNAS,
	COLUMNAS_ACTUALIZABLES,
	listar,
	contar,
	obtenerPorId,
	listarPorCertificado,
	crear,
	crearMuchos,
	actualizar,
	eliminar,
	eliminarPorCertificado
};
