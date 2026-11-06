'use strict';

/*
	Utilidades compartidas por los modelos.
	No contienen lógica de negocio: solo ayudan a construir SQL seguro,
	mapear los nombres camelCase de JavaScript a las columnas snake_case de
	MySQL y normalizar valores.
*/

function identificador(nombre) {
	return `\`${String(nombre).replace(/`/g, '``')}\``;
}

function esObjeto(valor) {
	return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function numeroEntero(valor, porDefecto = 0) {
	const numero = Number(valor);
	return Number.isInteger(numero) && numero >= 0 ? numero : porDefecto;
}

function paginacion({ limite = 50, desplazamiento = 0, maximo = 200 } = {}) {
	const tamano = Math.min(Math.max(numeroEntero(limite, 50), 1), maximo);
	const salto = numeroEntero(desplazamiento, 0);
	return {
		limite: tamano,
		desplazamiento: salto,
		sql: `LIMIT ${tamano} OFFSET ${salto}`
	};
}

function seleccion(columnas, alias = '') {
	const prefijo = alias ? `${identificador(alias)}.` : '';
	return Object.entries(columnas)
		.map(([destino, origen]) => `${prefijo}${identificador(origen)} AS ${identificador(destino)}`)
		.join(', ');
}

function mapearEntrada(datos, columnas) {
	const resultado = {};
	for (const [destino, origen] of Object.entries(columnas)) {
		if (Object.prototype.hasOwnProperty.call(datos, destino) && datos[destino] !== undefined) {
			resultado[origen] = datos[destino];
		}
	}
	return resultado;
}

function construirInsercion(datos, columnas) {
	const entrada = mapearEntrada(datos, columnas);
	const campos = Object.keys(entrada);
	if (campos.length === 0) {
		throw new Error('No hay datos para insertar');
	}
	return {
		sql: `(${campos.map(identificador).join(', ')}) VALUES (${campos.map(() => '?').join(', ')})`,
		valores: campos.map((campo) => entrada[campo]),
		campos
	};
}

function construirActualizacion(datos, columnas) {
	const entrada = mapearEntrada(datos, columnas);
	const campos = Object.keys(entrada);
	if (campos.length === 0) {
		throw new Error('No hay campos para actualizar');
	}
	return {
		sql: campos.map((campo) => `${identificador(campo)} = ?`).join(', '),
		valores: campos.map((campo) => entrada[campo]),
		campos
	};
}

function omitir(columnas, ...camposOmitidos) {
	const copia = { ...columnas };
	for (const campo of camposOmitidos) {
		delete copia[campo];
	}
	return copia;
}

function filtros() {
	const condiciones = [];
	const valores = [];

	const api = {
		igual(columna, valor) {
			if (valor !== undefined && valor !== null && valor !== '') {
				condiciones.push(`${columna} = ?`);
				valores.push(valor);
			}
			return api;
		},
		like(columna, valor) {
			if (valor !== undefined && valor !== null && valor !== '') {
				condiciones.push(`${columna} LIKE ?`);
				valores.push(`%${valor}%`);
			}
			return api;
		},
		rango(columna, desde, hasta) {
			if (desde !== undefined && desde !== null && desde !== '') {
				condiciones.push(`${columna} >= ?`);
				valores.push(desde);
			}
			if (hasta !== undefined && hasta !== null && hasta !== '') {
				condiciones.push(`${columna} <= ?`);
				valores.push(hasta);
			}
			return api;
		},
		personalizado(condicion, ...parametros) {
			if (condicion) {
				condiciones.push(condicion);
				valores.push(...parametros);
			}
			return api;
		},
		get sql() {
			return condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
		},
		get valores() {
			return valores;
		}
	};

	return api;
}

function ordenar(ordenes, valor, porDefecto) {
	return ordenes[valor] || ordenes[porDefecto] || Object.values(ordenes)[0];
}

function exigir(datos, campos) {
	const faltantes = campos.filter((campo) => {
		const valor = datos[campo];
		return (
			valor === undefined ||
			valor === null ||
			valor === '' ||
			(typeof valor === 'number' && Number.isNaN(valor))
		);
	});
	if (faltantes.length > 0) {
		throw new Error(`Faltan campos obligatorios: ${faltantes.join(', ')}`);
	}
}

function exigirId(datos, campos) {
	const invalidos = campos.filter((campo) => {
		const numero = Number(datos[campo]);
		return !Number.isInteger(numero) || numero <= 0;
	});
	if (invalidos.length > 0) {
		throw new Error(`Identificadores inválidos: ${invalidos.join(', ')}`);
	}
}

function leerJSON(valor, porDefecto = null) {
	if (valor === null || valor === undefined) {
		return porDefecto;
	}
	if (typeof valor === 'string') {
		try {
			return JSON.parse(valor);
		} catch (error) {
			return porDefecto;
		}
	}
	return valor;
}

function escribirJSON(valor) {
	if (valor === undefined) {
		throw new Error('El valor JSON no puede ser undefined');
	}
	if (typeof valor === 'string') {
		return valor;
	}
	return JSON.stringify(valor);
}

function aBooleano(valor, porDefecto = false) {
	if (valor === undefined || valor === null || valor === '') {
		return porDefecto;
	}
	return valor === true || valor === 1 || valor === '1' || valor === 'true';
}

function aFechaISO(valor) {
	if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
		return valor.toISOString().slice(0, 10);
	}
	return valor;
}

function fechaHoy() {
	const fecha = new Date();
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	const dia = String(fecha.getDate()).padStart(2, '0');
	return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function traducirDuplicado(error, mensaje) {
	if (error && error.code === 'ER_DUP_ENTRY') {
		const duplicado = new Error(mensaje);
		duplicado.codigo = 'DUPLICADO';
		duplicado.causa = error;
		return duplicado;
	}
	return error;
}

module.exports = {
	identificador,
	esObjeto,
	numeroEntero,
	paginacion,
	seleccion,
	mapearEntrada,
	construirInsercion,
	construirActualizacion,
	omitir,
	filtros,
	ordenar,
	exigir,
	exigirId,
	leerJSON,
	escribirJSON,
	aBooleano,
	aFechaISO,
	fechaHoy,
	traducirDuplicado
};
