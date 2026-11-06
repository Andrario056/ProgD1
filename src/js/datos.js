/*
	Lectura de datos de demostración desde los bloques HTML y la sesión.
*/
(function () {
	"use strict";

	const { $$, leerSesion, cedulaDigitos } = window.Pro2;

	function leerRegistros() {
		const base = $$("[data-datos-registros] [data-registro]").map((fila) => ({
			id: fila.dataset.id,
			fecha: fila.dataset.fecha,
			anio: (fila.dataset.fecha || "").slice(0, 4),
			vacunaId: fila.dataset.vacunaId,
			vacuna: fila.dataset.vacuna,
			tipo: fila.dataset.tipo,
			procedencia: fila.dataset.procedencia,
			lote: fila.dataset.lote,
			loteVence: fila.dataset.loteVence ?? "",
			cantidad: fila.dataset.cantidad ?? "",
			peso: fila.dataset.peso ?? "",
			altura: fila.dataset.altura ?? "",
			dosis: fila.dataset.dosis,
			usuarioId: fila.dataset.usuarioId,
			usuario: fila.dataset.usuario,
			cedula: fila.dataset.cedula,
			edad: fila.dataset.edad,
			telefono: fila.dataset.telefono,
			centroId: fila.dataset.centroId,
			centro: fila.dataset.centro,
			municipio: fila.dataset.municipio,
			estado: fila.dataset.estado,
			region: fila.dataset.region,
			aplicador: fila.dataset.aplicador,
			cargo: fila.dataset.cargo,
			atencion: fila.dataset.atencion
		}));
		const vacunas = leerVacunas();
		const completarLote = (registro) => {
			if (registro.loteVence) {
				return registro;
			}
			const vacuna = vacunas.find((item) => item.id === registro.vacunaId);
			const lote = vacuna?.lotes.find((item) => item.codigo === registro.lote);
			return { ...registro, loteVence: lote?.vence ?? "" };
		};
		const sesion = leerSesion();
		const nuevos = sesion?.registrosNuevos ?? [];
		return base
			.map(completarLote)
			.concat(nuevos.filter((nuevo) => !base.some((item) => item.id === nuevo.id)).map(completarLote));
	}

	function leerUsuarios() {
		const base = $$("[data-datos-usuarios] [data-usuario]").map((nodo) => ({
			id: nodo.dataset.usuarioId,
			nombre: nodo.dataset.nombre,
			primerNombre: nodo.dataset.primerNombre ?? "",
			segundoNombre: nodo.dataset.segundoNombre ?? "",
			primerApellido: nodo.dataset.primerApellido ?? "",
			segundoApellido: nodo.dataset.segundoApellido ?? "",
			cedula: nodo.dataset.cedula,
			nacimiento: nodo.dataset.nacimiento,
			sexo: nodo.dataset.sexo,
			region: nodo.dataset.region,
			estado: nodo.dataset.estado,
			municipio: nodo.dataset.municipio,
			telefono: nodo.dataset.telefono,
			correo: nodo.dataset.correo,
			centroId: nodo.dataset.centroId,
			centro: nodo.dataset.centro,
			sangre: nodo.dataset.sangre,
			direccion: nodo.dataset.direccion,
			alergias: nodo.dataset.alergias,
			registradoPor: nodo.dataset.registradoPor || nodo.dataset.enfermero || "",
			registradoPorCedula: nodo.dataset.registradoPorCedula || nodo.dataset.enfermeroCedula || ""
		}));
		const sesion = leerSesion();
		const nuevos = sesion?.usuariosNuevos ?? [];
		const medidas = sesion?.usuariosMedidas ?? {};
		const combinar = (usuario) => ({ ...usuario, ...(medidas[usuario.id] ?? {}) });
		return base.map(combinar).concat(
			nuevos
				.filter((nuevo) => !base.some((item) => cedulaDigitos(item.cedula) === cedulaDigitos(nuevo.cedula)))
				.map(combinar)
		);
	}

	function leerVacunas() {
		return $$("[data-datos-vacunas] [data-vacuna]").map((nodo) => ({
			id: nodo.dataset.vacunaId,
			nombre: nodo.dataset.nombre,
			tipo: nodo.dataset.tipo,
			procedencia: nodo.dataset.procedencia,
			laboratorio: nodo.dataset.laboratorio,
			descripcion: nodo.dataset.descripcion,
			dosisEsquema: Number(nodo.dataset.dosisEsquema || 1),
			refuerzoMeses: Number(nodo.dataset.refuerzoMeses || 0),
			cobertura: String(nodo.dataset.cobertura ?? "")
				.split(",")
				.map((region) => region.trim())
				.filter(Boolean),
			lotes: $$("[data-lote]", nodo).map((lote) => ({
				codigo: lote.dataset.codigo,
				vence: lote.dataset.vence
			}))
		}));
	}

	function leerCentros() {
		const sesion = leerSesion();
		const eliminados = new Set(sesion?.centrosEliminados ?? []);
		const base = $$("[data-datos-centros] [data-centro]")
			.map((nodo) => ({
				id: nodo.dataset.centroId,
				nombre: nodo.dataset.nombre,
				tipoCentro: Number(nodo.dataset.tipoCentro || 0),
				autorizado: nodo.dataset.autorizado === "true",
				estado: nodo.dataset.estado,
				municipio: nodo.dataset.municipio,
				parroquia: nodo.dataset.parroquia ?? "",
				direccion: nodo.dataset.direccion,
				telefono: nodo.dataset.telefono,
				region: nodo.dataset.region
			}))
			.filter((centro) => !eliminados.has(centro.id));
		const nuevos = (sesion?.centrosNuevos ?? []).filter((centro) => !eliminados.has(centro.id));
		return base.concat(nuevos.filter((nuevo) => !base.some((item) => item.id === nuevo.id)));
	}

	function leerCertificados() {
		const base = $$("[data-datos-certificados] [data-certificado]").map((nodo) => ({
			codigo: nodo.dataset.codigo,
			usuarioId: nodo.dataset.usuarioId,
			estado: nodo.dataset.estado,
			emision: nodo.dataset.emision,
			vigencia: nodo.dataset.vigencia,
			examenFecha: nodo.dataset.examenFecha,
			centroId: nodo.dataset.centroId,
			centro: nodo.dataset.centro,
			centroDireccion: nodo.dataset.centroDireccion ?? "",
			centroTelefono: nodo.dataset.centroTelefono ?? "",
			centroMunicipio: nodo.dataset.centroMunicipio ?? "",
			centroEstado: nodo.dataset.centroEstado ?? "",
			centroTipo: nodo.dataset.centroTipo ?? "",
			bioanalista: nodo.dataset.bioanalista,
			medico: nodo.dataset.medico,
			emisor: nodo.dataset.emisor,
			observaciones: nodo.dataset.observaciones,
			sello: nodo.dataset.sello,
			firma: nodo.dataset.firma,
			examenes: $$("[data-examen-tipo]", nodo).map((examen) => ({
				tipo: examen.dataset.nombre,
				descripcion: examen.dataset.descripcion,
				resultado: examen.dataset.resultado,
				unidad: examen.dataset.unidad,
				referencia: examen.dataset.referencia,
				fecha: examen.dataset.fecha || nodo.dataset.examenFecha || "",
				centro: examen.dataset.centro || nodo.dataset.centro || "",
				bioanalista: examen.dataset.bioanalista || nodo.dataset.bioanalista || ""
			})),
			documentacion: $$("[data-documento]", nodo).map((documento) => ({
				nombre: documento.dataset.nombre,
				tipo: documento.dataset.tipo ?? "",
				tamano: Number(documento.dataset.tamano || 0)
			})),
			dosisRespaldo: $$("[data-dosis-respaldo]", nodo).map((dosis) => ({
				vacuna: dosis.dataset.vacuna,
				dosis: dosis.dataset.dosis,
				fecha: dosis.dataset.fecha,
				lote: dosis.dataset.lote,
				loteVence: dosis.dataset.loteVence ?? "",
				centro: dosis.dataset.centro,
				aplicador: dosis.dataset.aplicador,
				cargo: dosis.dataset.cargo ?? ""
			})),
			usuario: {
				nombre: nodo.dataset.usuarioNombre,
				cedula: nodo.dataset.usuarioCedula,
				nacimiento: nodo.dataset.usuarioNacimiento,
				sexo: nodo.dataset.usuarioSexo,
				telefono: nodo.dataset.usuarioTelefono,
				correo: nodo.dataset.usuarioCorreo,
				centro: nodo.dataset.usuarioCentro,
				region: nodo.dataset.usuarioRegion,
				municipio: nodo.dataset.usuarioMunicipio ?? "",
				estado: nodo.dataset.usuarioEstado ?? "",
				direccion: nodo.dataset.usuarioDireccion,
				sangre: nodo.dataset.usuarioSangre,
				alergias: nodo.dataset.usuarioAlergias
			}
		}));
		const sesion = leerSesion();
		const nuevos = sesion?.certificadosNuevos ?? [];
		return base.concat(nuevos.filter((nuevo) => !base.some((item) => item.codigo === nuevo.codigo)));
	}

	Object.assign(window.Pro2, {
		leerRegistros,
		leerUsuarios,
		leerVacunas,
		leerCentros,
		leerCertificados
	});
})();
