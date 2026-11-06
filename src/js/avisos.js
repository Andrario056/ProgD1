/*
	Gestión de avisos y preparación de correos del Perfil 3.
*/
(function () {
	"use strict";

	const { $, $$, esc, normalizar, cedulaDigitos, buscarPorNombreOCedula, fechaCorta, hoyISO, mostrarAlerta, limpiarAlerta, htmlAlerta } = window.Pro2;

	function iniciarAvisos() {
		const contenedor = $("[data-avisos]");
		if (!contenedor) {
			return;
		}
		const usuarios = $$("[data-datos-usuarios] [data-usuario]").map((nodo) => ({
			id: nodo.dataset.usuarioId,
			nombre: nodo.dataset.nombre,
			cedula: nodo.dataset.cedula,
			nacimiento: nodo.dataset.nacimiento,
			correo: nodo.dataset.correo,
			centro: nodo.dataset.centro,
			region: nodo.dataset.region,
			pendientes: nodo.dataset.pendientes || "Sin vacunas pendientes"
		}));
		const destinatarios = usuarios
			.filter((usuario) => usuario.correo)
			.map((usuario) => ({
				nombre: usuario.nombre,
				correo: usuario.correo,
				entidad: usuario.centro
			}));
		const formulario = $("[data-form-aviso]", contenedor);
		const tipo = $("[data-aviso-tipo]", contenedor);
		const asunto = $("[data-aviso-asunto]", contenedor);
		const mensaje = $("[data-aviso-mensaje]", contenedor);
		const alerta = $("[data-aviso-alerta]", contenedor);
		const exito = $("[data-aviso-exito]", contenedor);
		const busquedaUsuario = $("[data-aviso-usuario-busqueda]", contenedor);
		const sugerenciasUsuario = $("[data-aviso-usuario-sugerencias]", contenedor);
		const resumenUsuario = $("[data-aviso-usuario]", contenedor);
		const busquedaDestinatario = $("[data-aviso-destinatario-busqueda]", contenedor);
		const listaDestinatarios = $("[data-aviso-destinatarios-lista]", contenedor);
		const chips = $("[data-destinatarios-chips]", contenedor);
		const tablaAvisos = $("[data-lista-avisos]", contenedor);
		const abrirCorreo = $("[data-abrir-correo]", contenedor);
		let usuario = null;
		let seleccionados = [];

		const plantillas = {
			vacunacion: {
				asunto: "Vacunación pendiente para {usuario}",
				mensaje:
					"Estimado/a {destinatario}:\n\nLe recordamos que {usuario}, del centro {centro}, tiene vacunas pendientes: {vacunas}.\n\nPor favor, acuda a su centro de salud para completar el esquema.\n\nSalud Vacunas"
			},
			faltantes: {
				asunto: "Vacunas faltantes en {centro}",
				mensaje:
					"Estimado/a {destinatario}:\n\nEl usuario {usuario} presenta las siguientes vacunas faltantes: {vacunas}.\n\nSe recomienda completar el esquema de vacunación en el centro {centro}.\n\nSalud Vacunas"
			},
			emergencia: {
				asunto: "Emergencia sanitaria en {centro}",
				mensaje:
					"Estimado/a {destinatario}:\n\nSe ha activado una alerta de emergencia en {centro}.\n\nUsuario de referencia: {usuario}.\nVacunas pendientes: {vacunas}.\n\nAtienda las indicaciones del equipo de salud.\n\nSalud Vacunas"
			}
		};

		function aplicarPlantilla() {
			const plantilla = plantillas[tipo.value] ?? plantillas.vacunacion;
			asunto.value = plantilla.asunto;
			mensaje.value = plantilla.mensaje;
		}

		function renderDestinatarios() {
			const consulta = normalizar(busquedaDestinatario.value);
			const disponibles = destinatarios.filter(
				(destinatario) =>
					!seleccionados.some((item) => item.correo === destinatario.correo) &&
					(!consulta ||
						normalizar(destinatario.nombre).includes(consulta) ||
						normalizar(destinatario.correo).includes(consulta))
			);
			listaDestinatarios.innerHTML = disponibles.length
				? disponibles
						.map(
							(destinatario) => `<button type="button" class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-base-200" data-agregar-destinatario="${esc(destinatario.correo)}">
								<span class="min-w-0"><span class="block font-medium text-sm">${esc(destinatario.nombre)}</span><span class="block text-base-content/55 text-xs">${esc(destinatario.correo)} · ${esc(destinatario.entidad)}</span></span>
								<span class="text-primary text-xs">Agregar</span>
							</button>`
						)
						.join("")
				: `<p class="px-3 py-2 text-base-content/55 text-sm">${consulta ? "No hay destinatarios que coincidan." : "Todos los destinatarios ya están seleccionados."}</p>`;
			listaDestinatarios.hidden = false;
		}

		function renderChips() {
			chips.innerHTML = seleccionados.length
				? seleccionados
						.map(
							(destinatario) => `<span class="badge badge-primary badge-lg h-auto gap-1 py-1.5">
								<span class="max-w-56 truncate">${esc(destinatario.nombre)} · ${esc(destinatario.correo)}</span>
								<button type="button" class="rounded-full p-0.5 hover:bg-primary-content/20" data-quitar-destinatario="${esc(destinatario.correo)}" aria-label="Quitar ${esc(destinatario.nombre)}">
									<span class="icono icono-x size-3.5" aria-hidden="true"></span>
								</button>
							</span>`
						)
						.join("")
				: `<p class="text-base-content/55 text-sm">Sin destinatarios seleccionados.</p>`;
		}

		function renderUsuario() {
			if (!usuario) {
				resumenUsuario.innerHTML = "";
				resumenUsuario.hidden = true;
				return;
			}
			resumenUsuario.hidden = false;
			resumenUsuario.innerHTML = `<div class="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/20">
				<div>
					<p class="font-medium">${esc(usuario.nombre)}</p>
					<p class="text-base-content/60 text-sm">${esc(usuario.cedula)} · ${esc(usuario.centro)} · ${esc(usuario.region)}</p>
					<p class="mt-1 text-sm"><span class="text-base-content/55">Vacunas pendientes:</span> <strong>${esc(usuario.pendientes)}</strong></p>
				</div>
				<button type="button" class="btn btn-ghost btn-sm text-primary" data-quitar-usuario-aviso>Quitar</button>
			</div>`;
			$("[data-quitar-usuario-aviso]", resumenUsuario).addEventListener("click", () => {
				usuario = null;
				busquedaUsuario.value = "";
				renderUsuario();
			});
		}

		function resolver(texto, destinatario) {
			const valores = {
				destinatario: destinatario.nombre,
				usuario: usuario?.nombre ?? "Sin usuario de referencia",
				centro: usuario?.centro ?? "la red de vacunación",
				vacunas: usuario?.pendientes ?? "Sin vacunas pendientes"
			};
			return String(texto).replace(/\{(destinatario|usuario|centro|vacunas)\}/gi, (coincidencia, clave) => {
				return valores[clave.toLowerCase()] ?? coincidencia;
			});
		}

		tipo.addEventListener("change", () => {
			aplicarPlantilla();
			limpiarAlerta(alerta);
		});

		busquedaUsuario.addEventListener("input", () => {
			const consulta = normalizar(busquedaUsuario.value);
			if (consulta.length < 2) {
				sugerenciasUsuario.innerHTML = "";
				sugerenciasUsuario.hidden = true;
				return;
			}
			const coincidencias = buscarPorNombreOCedula(usuarios, busquedaUsuario.value);
			sugerenciasUsuario.innerHTML = coincidencias.length
				? coincidencias
						.map(
							(item) => `<button type="button" class="block w-full rounded-lg px-3 py-2 text-left hover:bg-base-200" data-elegir-usuario-aviso="${esc(item.id)}">
								<span class="block font-medium text-sm">${esc(item.nombre)}</span>
								<span class="block text-base-content/55 text-xs">${esc(item.cedula)} · ${esc(item.centro)} · ${esc(item.pendientes)}</span>
							</button>`
						)
						.join("")
				: `<p class="px-3 py-2 text-base-content/55 text-sm">No se encontró el usuario.</p>`;
			sugerenciasUsuario.hidden = false;
		});

		sugerenciasUsuario.addEventListener("click", (evento) => {
			const boton = evento.target.closest("[data-elegir-usuario-aviso]");
			if (!boton) {
				return;
			}
			usuario = usuarios.find((item) => item.id === boton.dataset.elegirUsuarioAviso) ?? null;
			if (usuario) {
				busquedaUsuario.value = `${usuario.nombre} · ${usuario.cedula}`;
				sugerenciasUsuario.hidden = true;
				renderUsuario();
			}
		});

		busquedaDestinatario.addEventListener("input", renderDestinatarios);
		busquedaDestinatario.addEventListener("focus", renderDestinatarios);
		busquedaDestinatario.addEventListener("blur", () => {
			window.setTimeout(() => {
				listaDestinatarios.hidden = true;
			}, 120);
		});

		listaDestinatarios.addEventListener("click", (evento) => {
			const boton = evento.target.closest("[data-agregar-destinatario]");
			if (!boton) {
				return;
			}
			const destinatario = destinatarios.find((item) => item.correo === boton.dataset.agregarDestinatario);
			if (destinatario && !seleccionados.some((item) => item.correo === destinatario.correo)) {
				seleccionados.push(destinatario);
				busquedaDestinatario.value = "";
				renderChips();
				renderDestinatarios();
			}
		});

		chips.addEventListener("click", (evento) => {
			const boton = evento.target.closest("[data-quitar-destinatario]");
			if (!boton) {
				return;
			}
			seleccionados = seleccionados.filter((item) => item.correo !== boton.dataset.quitarDestinatario);
			renderChips();
			renderDestinatarios();
		});

		formulario.addEventListener("submit", (evento) => {
			evento.preventDefault();
			limpiarAlerta(alerta);
			if (!seleccionados.length) {
				mostrarAlerta(alerta, "error", "Debes agregar al menos un destinatario.");
				return;
			}
			if (!asunto.value.trim()) {
				mostrarAlerta(alerta, "error", "El asunto del aviso no puede estar vacío.");
				return;
			}
			if (!mensaje.value.trim()) {
				mostrarAlerta(alerta, "error", "El mensaje del aviso no puede estar vacío.");
				return;
			}

			const avisos = seleccionados.map((destinatario) => ({
				fecha: hoyISO(),
				destinatario: destinatario.nombre,
				correo: destinatario.correo,
				asunto: resolver(asunto.value.trim(), destinatario),
				mensaje: resolver(mensaje.value.trim(), destinatario)
			}));
			if (!$("[data-lista-avisos]").dataset.iniciado) {
				tablaAvisos.innerHTML = "";
				$("[data-lista-avisos]").dataset.iniciado = "true";
			}
			tablaAvisos.innerHTML = "";
			tablaAvisos.insertAdjacentHTML(
				"beforeend",
				avisos
					.map(
						(aviso) => `<tr>
							<td class="whitespace-nowrap text-xs">${esc(fechaCorta(aviso.fecha))}</td>
							<td><span class="block text-sm">${esc(aviso.destinatario)}</span><span class="text-base-content/55 text-xs">${esc(aviso.correo)}</span></td>
							<td class="text-sm">${esc(aviso.asunto)}</td>
							<td><span class="badge badge-success badge-sm">Preparado</span></td>
						</tr>`
					)
					.join("")
			);
			if (exito) {
				exito.hidden = false;
				exito.innerHTML = htmlAlerta(
					"success",
					`<p class="font-semibold">${avisos.length} aviso${avisos.length === 1 ? "" : "s"} registrado${avisos.length === 1 ? "" : "s"} y preparado${avisos.length === 1 ? "" : "s"}.</p><p class="mt-1">Correos: ${avisos.map((aviso) => esc(aviso.correo)).join(", ")}.</p><p class="mt-2 text-sm">En la demostración el correo no se envía realmente.</p>`
				);
			}
			if (abrirCorreo) {
				const primero = avisos[0];
				abrirCorreo.hidden = false;
				abrirCorreo.href = `mailto:${avisos.map((aviso) => aviso.correo).join(",")}?subject=${encodeURIComponent(primero.asunto)}&body=${encodeURIComponent(primero.mensaje)}`;
			}
		});

		formulario.addEventListener("reset", () => {
			window.setTimeout(() => {
				usuario = null;
				seleccionados = [];
				busquedaUsuario.value = "";
				busquedaDestinatario.value = "";
				sugerenciasUsuario.hidden = true;
				renderUsuario();
				renderChips();
				renderDestinatarios();
				limpiarAlerta(alerta);
				if (exito) {
					exito.hidden = true;
					exito.innerHTML = "";
				}
				if (abrirCorreo) {
					abrirCorreo.hidden = true;
					abrirCorreo.removeAttribute("href");
				}
				aplicarPlantilla();
			}, 0);
		});

		aplicarPlantilla();
		renderChips();
		renderDestinatarios();
		listaDestinatarios.hidden = true;
		tablaAvisos.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-base-content/55 text-sm">Todavía no hay avisos registrados.</td></tr>`;
	}

	Object.assign(window.Pro2, {
		iniciarAvisos
	});
})();
