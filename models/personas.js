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
	traducirDuplicado
} = require('./utiles');

const TABLA = 'personas';

const COLUMNAS = {
	id: 'id',
	primerNombre: 'primer_nombre',
	segundoNombre: 'segundo_nombre',
	primerApellido: 'primer_apellido',
	segundoApellido: 'segundo_apellido',
	cedula: 'cedula',
	nacimiento: 'nacimiento',
	sexo: 'sexo',
	telefono: 'telefono',
	correo: 'correo',
	region: 'region',
	direccion: 'direccion',
	tipoSangre: 'tipo_sangre',
	alergias: 'alergias',
	centroId: 'centro_id',
	registradoPor: 'registrado_por'
};

const COLUMNAS_ACTUALIZABLES = omitir(COLUMNAS, 'id');
const SELECCION = seleccion(COLUMNAS, 'p');
const SELECCION_COMPLETA = `
	${SELECCION},
	c.name AS centroNombre,
	c.tipo_centro AS centroTipo,
	c.estado AS centroEstado,
	c.municipio AS centroMunicipio,
	c.parroquia AS centroParroquia
`;
const DESDE = `FROM ${TABLA} p LEFT JOIN centros c ON c.id = p.centro_id`;

const ORDENES = {
	nombre: 'p.primer_nombre ASC, p.primer_apellido ASC',
	apellido: 'p.primer_apellido ASC, p.primer_nombre ASC',
	cedula: 'p.cedula ASC',
	nacimiento: 'p.nacimiento ASC',
	reciente: 'p.id DESC'
};

function crearFiltros(filtro = {}) {
	const f = filtros();
	f.igual('p.centro_id', filtro.centroId);
	f.igual('p.region', filtro.region);
	f.igual('p.sexo', filtro.sexo);
	f.igual('p.tipo_sangre', filtro.tipoSangre);
	f.rango('p.nacimiento', filtro.desdeNacimiento, filtro.hastaNacimiento);

	if (filtro.busqueda) {
		const patron = `%${filtro.busqueda}%`;
		f.personalizado(
			`(p.cedula LIKE ? OR p.primer_nombre LIKE ? OR p.segundo_nombre LIKE ?
			  OR p.primer_apellido LIKE ? OR p.segundo_apellido LIKE ?
			  OR p.correo LIKE ? OR CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre,
			  p.primer_apellido, p.segundo_apellido) LIKE ?)`,
			...Array(7).fill(patron)
		);
	}

	return f;
}

async function listar(filtro = {}) {
	const f = crearFiltros(filtro);
	const { sql: limite } = paginacion(filtro);
	const orden = ordenar(ORDENES, filtro.orden, 'apellido');
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
		`SELECT ${SELECCION_COMPLETA} ${DESDE} WHERE p.id = ? LIMIT 1`,
		[id]
	);
}

async function obtenerPorCedula(cedula) {
	if (!cedula) {
		return null;
	}
	return unaFila(
		`SELECT ${SELECCION_COMPLETA} ${DESDE} WHERE p.cedula = ? LIMIT 1`,
		[String(cedula).trim()]
	);
}

async function buscar(texto, { centroId, limite = 20 } = {}) {
	if (!texto) {
		return [];
	}

	const patron = `%${texto}%`;
	const f = filtros();
	f.personalizado(
		`(p.cedula LIKE ? OR p.primer_nombre LIKE ? OR p.segundo_nombre LIKE ?
		  OR p.primer_apellido LIKE ? OR p.segundo_apellido LIKE ? OR p.correo LIKE ?)`,
		...Array(6).fill(patron)
	);
	f.igual('p.centro_id', centroId);

	const { sql: paginacionSql } = paginacion({ limite, maximo: 50 });
	return consulta(
		`SELECT ${SELECCION_COMPLETA} ${DESDE} ${f.sql}
		 ORDER BY p.primer_apellido ASC, p.primer_nombre ASC ${paginacionSql}`,
		f.valores
	);
}

async function listarPorCentro(centroId, filtro = {}) {
	return listar({ ...filtro, centroId });
}

async function contarPorCentro(centroId) {
	return contar({ centroId });
}

async function crear(datos = {}) {
	exigir(datos, [
		'primerNombre',
		'primerApellido',
		'cedula',
		'nacimiento',
		'sexo',
		'region',
		'tipoSangre',
		'centroId',
		'registradoPor'
	]);
	exigirId(datos, ['centroId']);

	const base = {
		...datos,
		segundoNombre: datos.segundoNombre ?? '',
		segundoApellido: datos.segundoApellido ?? '',
		telefono: datos.telefono ?? '',
		correo: datos.correo ?? '',
		direccion: datos.direccion ?? '',
		alergias: datos.alergias ?? '',
		centroId: Number(datos.centroId)
	};

	try {
		const insercion = construirInsercion(base, COLUMNAS_ACTUALIZABLES);
		const resultado = await consulta(
			`INSERT INTO ${TABLA} ${insercion.sql}`,
			insercion.valores
		);
		return obtenerPorId(resultado.insertId);
	} catch (error) {
		throw traducirDuplicado(error, 'La cédula ya está registrada');
	}
}

async function actualizar(id, datos = {}) {
	if (Object.keys(datos).length === 0) {
		return obtenerPorId(id);
	}

	const base = { ...datos };
	if (base.centroId !== undefined) {
		base.centroId = Number(base.centroId);
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

module.exports = {
	TABLA,
	COLUMNAS,
	listar,
	contar,
	obtenerPorId,
	obtenerPorCedula,
	buscar,
	listarPorCentro,
	contarPorCentro,
	crear,
	actualizar,
	eliminar
};
