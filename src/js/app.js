/*
	Arranque de la aplicación.

	Carga los módulos compartidos y el módulo de la vista actual desde el HTML,
	luego inicializa la navegación y ejecuta el inicializador correspondiente a
	`data-pagina`. En este boceto no hay autenticación: las vistas se abren
	directamente.
*/
(function () {
	"use strict";

	const Pro2 = window.Pro2;

	const paginas = {
		login: [Pro2.iniciarLogin],
		recuperar: [Pro2.iniciarRecuperar],
		verificar: [Pro2.iniciarVerificar],
		"centro-registrar-usuario": [Pro2.iniciarRegistroUsuario],
		"centro-registrar-vacunacion": [Pro2.iniciarVacunacion],
		"master-historial": [Pro2.iniciarHistorial],
		"master-centros": [Pro2.iniciarCentros],
		"master-certificados": [Pro2.iniciarHistorialCertificados],
		consulta: [Pro2.iniciarConsulta],
		"subregion-certificados": [Pro2.iniciarCertificados],
		"subregion-certificados-historial": [Pro2.iniciarHistorialCertificados],
		"subregion-verificar": [Pro2.iniciarVerificar],
		"master-avisos": [Pro2.iniciarAvisos]
	};

	document.addEventListener("DOMContentLoaded", () => {
		Pro2.iniciarNavegacion();
		const acciones = (paginas[document.body.dataset.pagina] ?? []).filter(Boolean);
		acciones.forEach((accion) => accion());
	});
})();

