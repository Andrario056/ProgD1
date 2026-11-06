'use strict';

/*
	Capa de acceso a datos.

	Cada propiedad expone las funciones de un modelo. Las rutas y los
	controladores deben importar desde aquí (o desde el archivo del modelo
	concreto) y no escribir SQL directamente.
*/

module.exports = {
	centros: require('./centros'),
	personas: require('./personas'),
	vacunas: require('./vacunas'),
	dosis: require('./dosis'),
	certificadosSalud: require('./certificadosSalud'),
	examenes: require('./examenes'),
	conexion: require('./conexion')
};
