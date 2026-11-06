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
	leerJSON,
	escribirJSON,
	aBooleano,
	traducirDuplicado
} = require('./utiles');

const TABLA = 'vacunas';

const COLUMNAS = {
	id: 'id',
	nombre: 'nombre',
	tipo: 'tipo',
	procedencia: 'procedencia',
	laboratorio: 'laboratorio',
	descripcion: 'descripcion',
	refuerzoMeses: 'refuerzo_meses',
	obligatoria: 'obligatoria',
	dosisObligatorias: 'dosis_obligatorias',
	lotes: 'lotes'
};

const COLUMNAS_ACTUALIZABLES = omitir(COLUMNAS, 'id');
const SELECCION = seleccion(COLUMNAS, 'v');

const ORDENES = {
	nombre: 'v.nombre ASC',
	tipo: 'v.tipo ASC, v.nombre ASC',
	procedencia: 'v.procedencia ASC, v.nombre ASC',
	reciente: 'v.id DESC'
};

function normalizar(fila) {
	if (!fila) {
		return null;
	}
	return {
		...fila,
		lotes: leerJSON(fila.lotes, []),
		obligatoria: Boolean(fila.obligatoria)
	};
}

function normalizarFilas(filas) {
	return filas.map(normalizar);
}

function validarLotes(lotes) {
	if (!Array.isArray(lotes) || lotes.length === 0) {
		throw new Error('Debe registrarse al menos un lote');
	}
	for (const lote of lotes) {
		if (!lote || !lote.codigo || !lote.vence) {
			throw new Error('Cada lote debe tener codigo y vence');
		}
	}
	return lotes;
}

function validarObligatoriedad({ obligatoria, dosisObligatorias }) {
	if (!Number.isInteger(dosisObligatorias) || dosisObligatorias < 0) {
		throw new Error('dosisObligatorias debe ser un entero mayor o igual que 0');
	}
	if (obligatoria && dosisObligatorias <= 0) {
		throw new Error('Una vacuna obligatoria debe tener dosis obligatorias');
	}
	if (!obligatoria && dosisObligatorias !== 0) {
		throw new Error('Una vacuna no obligatoria no puede tener dosis obligatorias');
	}
}

function crearFiltros(filtro = {}) {
	const f = filtros();
	f.igual('v.tipo', filtro.tipo);
	f.igual('v.procedencia', filtro.procedencia);
	f.igual('v.laboratorio', filtro.laboratorio);

	if (filtro.obligatoria !== undefined && filtro.obligatoria !== null && filtro.obligatoria !== '') {
		f.personalizado('v.obligatoria = ?', aBooleano(filtro.obligatoria) ? 1 : 0);
	}

	if (filtro.busqueda) {
		const patron = `%${filtro.busqueda}%`;
		f.personalizado(
			'(v.nombre LIKE ? OR v.tipo LIKE ? OR v.procedencia LIKE ? OR v.laboratorio LIKE ? OR v.descripcion LIKE ?)',
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
		`SELECT ${SELECCION} FROM ${TABLA} v ${f.sql} ORDER BY ${orden} ${limite}`,
		f.valores
	);
	return normalizarFilas(filas);
}

async function contar(filtro = {}) {
	const f = crearFiltros(filtro);
	const fila = await unaFila(
		`SELECT COUNT(*) AS total FROM ${TABLA} v ${f.sql}`,
		f.valores
	);
	return Number(fila?.total ?? 0);
}

async function obtenerPorIdEn(id, ejecutor) {
	const fila = await unaFila(
		`SELECT ${SELECCION} FROM ${TABLA} v WHERE v.id = ? LIMIT 1`,
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
		`SELECT ${SELECCION} FROM ${TABLA} v WHERE v.nombre = ? LIMIT 1`,
		[nombre]
	);
	return normalizar(fila);
}

async function listarLotes(id) {
	const vacuna = await obtenerPorId(id);
	return vacuna ? vacuna.lotes : null;
}

async function crear(datos = {}) {
	exigir(datos, [
		'nombre',
		'tipo',
		'procedencia',
		'laboratorio',
		'descripcion',
		'refuerzoMeses',
		'lotes'
	]);

	const lotes = validarLotes(
		Array.isArray(datos.lotes) ? datos.lotes : leerJSON(datos.lotes, null)
	);

	const refuerzoMeses = Number(datos.refuerzoMeses);
	const obligatoria = aBooleano(datos.obligatoria, false);
	const dosisObligatorias = Number(datos.dosisObligatorias ?? 0);

	if (!Number.isInteger(refuerzoMeses) || refuerzoMeses < 0) {
		throw new Error('refuerzoMeses debe ser un entero mayor o igual que 0');
	}
	validarObligatoriedad({ obligatoria, dosisObligatorias });

	const base = {
		...datos,
		refuerzoMeses,
		obligatoria,
		dosisObligatorias,
		lotes: escribirJSON(lotes)
	};

	try {
		const insercion = construirInsercion(base, COLUMNAS_ACTUALIZABLES);
		const resultado = await consulta(
			`INSERT INTO ${TABLA} ${insercion.sql}`,
			insercion.valores
		);
		return obtenerPorId(resultado.insertId);
	} catch (error) {
		throw traducirDuplicado(error, 'Ya existe una vacuna con ese nombre');
	}
}

async function actualizar(id, datos = {}) {
	const actual = await obtenerPorId(id);
	if (!actual) {
		return null;
	}
	if (Object.keys(datos).length === 0) {
		return actual;
	}

	const base = { ...datos };

	if (base.lotes !== undefined) {
		const lotes = validarLotes(
			Array.isArray(base.lotes) ? base.lotes : leerJSON(base.lotes, null)
		);
		base.lotes = escribirJSON(lotes);
	}

	if (base.obligatoria !== undefined) {
		base.obligatoria = aBooleano(base.obligatoria);
	}
	if (base.refuerzoMeses !== undefined) {
		base.refuerzoMeses = Number(base.refuerzoMeses);
	}
	if (base.dosisObligatorias !== undefined) {
		base.dosisObligatorias = Number(base.dosisObligatorias);
	}

	// Se valida el estado resultante, no solo los campos enviados.
	validarObligatoriedad({
		obligatoria: base.obligatoria ?? actual.obligatoria,
		dosisObligatorias: base.dosisObligatorias ?? actual.dosisObligatorias
	});

	const cambios = construirActualizacion(base, COLUMNAS_ACTUALIZABLES);
	try {
		await consulta(
			`UPDATE ${TABLA} SET ${cambios.sql} WHERE id = ?`,
			[...cambios.valores, id]
		);
		return obtenerPorId(id);
	} catch (error) {
		throw traducirDuplicado(error, 'Ya existe una vacuna con ese nombre');
	}
}

async function agregarLote(id, lote) {
	if (!lote || !lote.codigo || !lote.vence) {
		throw new Error('El lote debe tener codigo y vence');
	}

	return transaccion(async (conexion) => {
		const fila = await unaFila(
			`SELECT lotes FROM ${TABLA} WHERE id = ? FOR UPDATE`,
			[id],
			conexion
		);
		if (!fila) {
			return null;
		}

		const lotes = leerJSON(fila.lotes, []);
		if (lotes.some((item) => item.codigo === lote.codigo)) {
			throw new Error('El lote ya existe para esta vacuna');
		}

		lotes.push({ codigo: lote.codigo, vence: lote.vence });
		await consulta(
			`UPDATE ${TABLA} SET lotes = ? WHERE id = ?`,
			[escribirJSON(lotes), id],
			conexion
		);
		return obtenerPorIdEn(id, conexion);
	});
}

async function quitarLote(id, codigo) {
	return transaccion(async (conexion) => {
		const fila = await unaFila(
			`SELECT lotes FROM ${TABLA} WHERE id = ? FOR UPDATE`,
			[id],
			conexion
		);
		if (!fila) {
			return null;
		}

		const lotes = leerJSON(fila.lotes, []);
		const restantes = lotes.filter((item) => item.codigo !== codigo);
		if (restantes.length === lotes.length) {
			throw new Error('El lote no existe para esta vacuna');
		}
		if (restantes.length === 0) {
			throw new Error('La vacuna debe conservar al menos un lote');
		}

		await consulta(
			`UPDATE ${TABLA} SET lotes = ? WHERE id = ?`,
			[escribirJSON(restantes), id],
			conexion
		);
		return obtenerPorIdEn(id, conexion);
	});
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
	obtenerPorNombre,
	listarLotes,
	crear,
	actualizar,
	agregarLote,
	quitarLote,
	eliminar
};
