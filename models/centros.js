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
	aBooleano,
	traducirDuplicado
} = require('./utiles');

const TABLA = 'centros';

const COLUMNAS = {
	id: 'id',
	nombre: 'name',
	tipoCentro: 'tipo_centro',
	autorizado: 'autorizado',
	estado: 'estado',
	municipio: 'municipio',
	parroquia: 'parroquia',
	direccion: 'direccion',
	telefono: 'telefono'
};

const COLUMNAS_ACTUALIZABLES = omitir(COLUMNAS, 'id');
const SELECCION = seleccion(COLUMNAS, 'c');

const ORDENES = {
	nombre: 'c.name ASC',
	municipio: 'c.municipio ASC, c.name ASC',
	tipo: 'c.tipo_centro ASC, c.name ASC',
	reciente: 'c.id DESC'
};

function normalizar(fila) {
	if (!fila) {
		return null;
	}
	return { ...fila, autorizado: Boolean(fila.autorizado) };
}

function normalizarFilas(filas) {
	return filas.map(normalizar);
}

function crearFiltros(filtro = {}) {
	const f = filtros();
	f.igual('c.estado', filtro.estado);
	f.igual('c.municipio', filtro.municipio);
	f.igual('c.parroquia', filtro.parroquia);
	f.igual('c.tipo_centro', filtro.tipoCentro);

	if (filtro.autorizado !== undefined && filtro.autorizado !== null && filtro.autorizado !== '') {
		f.personalizado('c.autorizado = ?', aBooleano(filtro.autorizado) ? 1 : 0);
	}

	if (filtro.busqueda) {
		const patron = `%${filtro.busqueda}%`;
		f.personalizado(
			'(c.name LIKE ? OR c.estado LIKE ? OR c.municipio LIKE ? OR c.parroquia LIKE ? OR c.direccion LIKE ?)',
			...Array(5).fill(patron)
		);
	}

	return f;
}

async function listar(filtro = {}) {
	const f = crearFiltros(filtro);
	const { sql: limite } = paginacion(filtro);
	const orden = ordenar(ORDENES, filtro.orden, 'nombre');
	const filas = await consulta(
		`SELECT ${SELECCION} FROM ${TABLA} c ${f.sql} ORDER BY ${orden} ${limite}`,
		f.valores
	);
	return normalizarFilas(filas);
}

async function contar(filtro = {}) {
	const f = crearFiltros(filtro);
	const fila = await unaFila(
		`SELECT COUNT(*) AS total FROM ${TABLA} c ${f.sql}`,
		f.valores
	);
	return Number(fila?.total ?? 0);
}

async function obtenerPorIdEn(id, ejecutor) {
	const fila = await unaFila(
		`SELECT ${SELECCION} FROM ${TABLA} c WHERE c.id = ? LIMIT 1`,
		[id],
		ejecutor
	);
	return normalizar(fila);
}

async function obtenerPorId(id) {
	return obtenerPorIdEn(id);
}

async function obtenerPorNombre(nombre) {
	const fila = await unaFila(
		`SELECT ${SELECCION} FROM ${TABLA} c WHERE c.name = ? LIMIT 1`,
		[nombre]
	);
	return normalizar(fila);
}

async function listarSubregiones() {
	const filas = await consulta(
		`SELECT ${SELECCION} FROM ${TABLA} c WHERE c.tipo_centro = 1 ORDER BY c.name ASC`
	);
	return normalizarFilas(filas);
}

async function crear(datos = {}) {
	exigir(datos, ['nombre', 'tipoCentro', 'estado', 'municipio']);

	const tipoCentro = Number(datos.tipoCentro);
	if (![1, 2, 3, 4].includes(tipoCentro)) {
		throw new Error('tipoCentro debe estar entre 1 y 4');
	}

	const base = {
		...datos,
		tipoCentro,
		autorizado: aBooleano(datos.autorizado, false),
		parroquia: datos.parroquia ?? '',
		direccion: datos.direccion ?? '',
		telefono: datos.telefono ?? ''
	};

	try {
		const insercion = construirInsercion(base, COLUMNAS_ACTUALIZABLES);
		const resultado = await consulta(
			`INSERT INTO ${TABLA} ${insercion.sql}`,
			insercion.valores
		);
		return obtenerPorId(resultado.insertId);
	} catch (error) {
		throw traducirDuplicado(error, 'Ya existe un centro con ese nombre');
	}
}

async function actualizar(id, datos = {}) {
	if (Object.keys(datos).length === 0) {
		return obtenerPorId(id);
	}

	const base = { ...datos };
	if (base.tipoCentro !== undefined) {
		base.tipoCentro = Number(base.tipoCentro);
	}
	if (base.autorizado !== undefined) {
		base.autorizado = aBooleano(base.autorizado);
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

async function contarDependencias(id) {
	const fila = await unaFila(
		`SELECT
			(SELECT COUNT(*) FROM personas WHERE centro_id = ?) AS personas,
			(SELECT COUNT(*) FROM dosis WHERE centro_id = ?) AS dosis,
			(SELECT COUNT(*) FROM certificados_salud WHERE centro_id = ?) AS certificados,
			(SELECT COUNT(*) FROM examenes WHERE centro_id = ?) AS examenes`,
		[id, id, id, id]
	);

	return {
		personas: Number(fila?.personas ?? 0),
		dosis: Number(fila?.dosis ?? 0),
		certificados: Number(fila?.certificados ?? 0),
		examenes: Number(fila?.examenes ?? 0)
	};
}

module.exports = {
	TABLA,
	COLUMNAS,
	listar,
	contar,
	obtenerPorId,
	obtenerPorNombre,
	listarSubregiones,
	crear,
	actualizar,
	eliminar,
	contarDependencias
};
