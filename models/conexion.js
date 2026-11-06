'use strict';

/*
	Punto único de conexión con MySQL.

	Todas las funciones devuelven promesas, por lo que los controladores pueden
	usar .then()/.catch() o async/await sin conocer los detalles del pool.

	Variables de entorno:
		DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_POOL_LIMIT
*/

const mysql = require('mysql2/promise');

const configuracion = {
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT) || 3306,
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'salud_vacunas',
	waitForConnections: true,
	connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
	queueLimit: 0,
	charset: 'utf8mb4',
	dateStrings: true,
	decimalNumbers: true,
	connectTimeout: 10000,
	enableKeepAlive: true
};

const pool = mysql.createPool(configuracion);

/**
 * Ejecuta una consulta con parámetros.
 * @param {string} sql
 * @param {Array} parametros
 * @param {import('mysql2/promise').Pool|import('mysql2/promise').PoolConnection} [ejecutor]
 * @returns {Promise<any>}
 */
async function consulta(sql, parametros = [], ejecutor = pool) {
	const [resultado] = await ejecutor.execute(sql, parametros);
	return resultado;
}

/**
 * Devuelve la primera fila de una consulta o null.
 */
async function unaFila(sql, parametros = [], ejecutor = pool) {
	const resultado = await consulta(sql, parametros, ejecutor);
	return Array.isArray(resultado) ? resultado[0] || null : null;
}

/**
 * Ejecuta un bloque dentro de una transacción.
 * Si el manejador lanza un error, se hace rollback automáticamente.
 *
 * @param {(conexion: import('mysql2/promise').PoolConnection) => Promise<any>} manejador
 */
async function transaccion(manejador) {
	const conexion = await pool.getConnection();
	try {
		await conexion.beginTransaction();
		const resultado = await manejador(conexion);
		await conexion.commit();
		return resultado;
	} catch (error) {
		try {
			await conexion.rollback();
		} catch (errorRollback) {
			// Se conserva el error original.
		}
		throw error;
	} finally {
		conexion.release();
	}
}

async function probarConexion() {
	const conexion = await pool.getConnection();
	try {
		await conexion.ping();
		return true;
	} finally {
		conexion.release();
	}
}

async function cerrar() {
	await pool.end();
}

module.exports = {
	pool,
	configuracion,
	consulta,
	unaFila,
	transaccion,
	probarConexion,
	cerrar
};
