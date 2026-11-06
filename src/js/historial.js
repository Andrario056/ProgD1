/*
	Historial de vacunación y gestión de centros.
*/
(function () {
	"use strict";

	const { $, $$, esc, normalizar, coincideCedula, ordenarPorTexto, fechaCorta, telefonoValido, mostrarAlerta, modificarSesion, leerRegistros, leerUsuarios, leerCentros } = window.Pro2;

	const TIPOS_CENTRO = {
		1: "Subregión",
		2: "CDI",
		3: "Módulo",
		4: "Hospital"
	};

	function etiquetaTipoCentro(tipo) {
		return TIPOS_CENTRO[Number(tipo)] ?? "Sin tipo";
	}

	function opcionesMultiples(registros, campo) {
		const mapa = new Map();
		registros.forEach((registro) => {
			let valor = "";
			let etiqueta = "";
			let detalle = "";
			switch (campo) {
				case "vacunas":
					valor = etiqueta = registro.vacuna;
					detalle = `${registro.tipo} · ${registro.procedencia}`;
					break;
				case "tipos":
					valor = etiqueta = registro.tipo;
					break;
				case "anios":
					valor = etiqueta = registro.anio;
					break;
				case "usuarios":
					valor = registro.cedula;
					etiqueta = registro.usuario;
					detalle = `${registro.cedula} · ${registro.edad} años · ${registro.telefono}`;
					break;
				case "lotes":
					valor = etiqueta = registro.lote;
					detalle = registro.loteVence ? `Vence ${fechaCorta(registro.loteVence)}` : "";
					break;
				case "centros":
					valor = etiqueta = registro.centro;
					detalle = `${registro.municipio}, ${registro.estado}`;
					break;
				default:
					break;
			}
			if (valor && !mapa.has(valor)) {
				mapa.set(valor, { valor, etiqueta, detalle });
			}
		});
		return Array.from(mapa.values()).sort((a, b) => ordenarPorTexto(a.etiqueta, b.etiqueta));
	}

	function filaHistorial(registro) {
		return `<tr class="align-top">
			<td><span class="block font-medium text-sm">${esc(fechaCorta(registro.fecha))}</span><span class="text-base-content/55 text-xs">${esc(registro.anio)}</span></td>
			<td><span class="block font-medium text-sm">${esc(registro.vacuna)}</span><span class="text-base-content/55 text-xs">${esc(registro.tipo)} · ${esc(registro.procedencia)}</span></td>
			<td><span class="font-mono text-xs">${esc(registro.lote)}</span>${registro.loteVence ? `<span class="block text-base-content/55 text-xs">Vence ${esc(fechaCorta(registro.loteVence))}</span>` : ""}${registro.loteVence && registro.fecha && registro.loteVence < registro.fecha ? `<span class="badge badge-error badge-xs mt-1">Vencido al aplicar</span>` : ""}</td>
			<td class="text-sm">${esc(registro.dosis)}</td>
			<td class="whitespace-nowrap text-sm">${registro.cantidad ? `${esc(registro.cantidad)} ml` : "—"}</td>
			<td><span class="block font-medium text-sm">${esc(registro.usuario)}</span><span class="block text-base-content/55 text-xs">${esc(registro.cedula)} · ${esc(registro.edad)} años</span><span class="block text-base-content/55 text-xs">${esc(registro.telefono)}</span></td>
			<td><span class="block font-medium text-sm">${esc(registro.centro)}</span><span class="block text-base-content/55 text-xs">${esc(registro.municipio)}, ${esc(registro.estado)}</span></td>
			<td><span class="block font-medium text-sm">${esc(registro.aplicador)}</span><span class="block text-base-content/55 text-xs">${esc(registro.cargo)}</span></td>
			<td><span class="block max-w-64 text-sm">${esc(registro.atencion)}</span></td>
		</tr>`;
	}

	function iniciarHistorial() {
		const contenedor = $("[data-historial]");
		if (!contenedor) {
			return;
		}
		const registros = leerRegistros();
		const filtros = {
			busqueda: "",
			cedula: "",
			orden: "fecha-desc",
			aplicador: "",
			desde: "",
			hasta: "",
			vacunas: new Set(),
			tipos: new Set(),
			anios: new Set(),
			usuarios: new Set(),
			lotes: new Set(),
			centros: new Set()
		};
		const tbody = $("[data-tabla-historial]", contenedor);
		const contador = $("[data-historial-contador]", contenedor);
		const botonLimpiar = $("[data-limpiar-filtros]", contenedor);

		$$("[data-filtro]", contenedor).forEach((control) => {
			const campo = control.dataset.filtro;
			control.addEventListener("input", () => {
				filtros[campo] = control.value;
				actualizar();
			});
			control.addEventListener("change", () => {
				filtros[campo] = control.value;
				actualizar();
			});
		});

		$$("[data-filtro-multiple]", contenedor).forEach((detalle) => {
			const campo = detalle.dataset.filtroMultiple;
			const caja = $("[data-opciones]", detalle);
			const resumen = $("[data-resumen]", detalle);
			const placeholder = detalle.dataset.placeholder ?? "Todos";
			const opciones = opcionesMultiples(registros, campo);

			caja.innerHTML = opciones.length
				? opciones
						.map(
							(opcion) => `<label class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-200">
								<input type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5" value="${esc(opcion.valor)}" />
								<span class="min-w-0"><span class="block text-sm">${esc(opcion.etiqueta)}</span>${opcion.detalle ? `<span class="block text-base-content/55 text-xs">${esc(opcion.detalle)}</span>` : ""}</span>
							</label>`
						)
						.join("")
				: `<p class="px-2 py-1 text-base-content/55 text-sm">Sin opciones</p>`;

			caja.addEventListener("change", (evento) => {
				const casilla = evento.target.closest("input[type=checkbox]");
				if (!casilla) {
					return;
				}
				if (casilla.checked) {
					filtros[campo].add(casilla.value);
				} else {
					filtros[campo].delete(casilla.value);
				}
				resumen.textContent = filtros[campo].size
					? `${filtros[campo].size} seleccionada${filtros[campo].size === 1 ? "" : "s"}`
					: placeholder;
				actualizar();
			});

			const limpiar = $("[data-limpiar-contenedor]", detalle);
			limpiar.innerHTML = `<button type="button" class="btn btn-ghost btn-xs justify-start text-primary">Limpiar selección</button>`;
			$("button", limpiar).addEventListener("click", () => {
				$$("input[type=checkbox]", caja).forEach((casilla) => {
					casilla.checked = false;
				});
				filtros[campo].clear();
				resumen.textContent = placeholder;
				actualizar();
			});
		});

		function iniciarFiltroUsuarios() {
			const nodo = $("[data-filtro-usuarios]", contenedor);
			if (!nodo) {
				return () => {};
			}
			const entrada = $("[data-filtro-usuarios-busqueda]", nodo);
			const sugerencias = $("[data-filtro-usuarios-sugerencias]", nodo);
			const chips = $("[data-filtro-usuarios-chips]", nodo);
			const usuarios = opcionesMultiples(registros, "usuarios");

			function ocultarSugerencias() {
				sugerencias.hidden = true;
				sugerencias.innerHTML = "";
			}

			function renderChips() {
				const elegidos = usuarios.filter((usuario) => filtros.usuarios.has(usuario.valor));
				chips.innerHTML = elegidos.length
					? elegidos
							.map(
								(usuario) => `<span class="badge badge-primary badge-lg h-auto gap-1 py-1.5">
									<span class="max-w-56 truncate">${esc(usuario.etiqueta)} · ${esc(usuario.valor)}</span>
									<button type="button" class="rounded-full p-0.5 hover:bg-primary-content/20" data-quitar-usuario-filtro="${esc(usuario.valor)}" aria-label="Quitar ${esc(usuario.etiqueta)}">
										<span class="icono icono-x size-3.5" aria-hidden="true"></span>
									</button>
								</span>`
							)
							.join("")
					: "";
			}

			function renderSugerencias() {
				const consulta = normalizar(entrada.value);
				if (consulta.length < 2) {
					ocultarSugerencias();
					return;
				}
				const coincidencias = usuarios.filter(
					(usuario) =>
						!filtros.usuarios.has(usuario.valor) &&
						(normalizar(usuario.etiqueta).includes(consulta) ||
							coincideCedula(usuario.valor, entrada.value))
				);
				sugerencias.innerHTML = coincidencias.length
					? coincidencias
							.map(
								(usuario) => `<button type="button" class="block w-full px-3 py-2 text-left hover:bg-base-200" data-elegir-usuario-filtro="${esc(usuario.valor)}">
									<span class="block font-medium text-sm">${esc(usuario.etiqueta)}</span>
									<span class="block text-base-content/55 text-xs">${esc(usuario.detalle)}</span>
								</button>`
							)
							.join("")
					: `<p class="px-3 py-2 text-base-content/55 text-sm">No se encontraron usuarios con ese nombre o cédula.</p>`;
				sugerencias.hidden = false;
			}

			entrada.addEventListener("input", renderSugerencias);
			entrada.addEventListener("focus", renderSugerencias);
			entrada.addEventListener("blur", () => {
				window.setTimeout(ocultarSugerencias, 120);
			});

			sugerencias.addEventListener("click", (evento) => {
				const boton = evento.target.closest("[data-elegir-usuario-filtro]");
				if (!boton) {
					return;
				}
				filtros.usuarios.add(boton.dataset.elegirUsuarioFiltro);
				entrada.value = "";
				ocultarSugerencias();
				renderChips();
				actualizar();
			});

			chips.addEventListener("click", (evento) => {
				const boton = evento.target.closest("[data-quitar-usuario-filtro]");
				if (!boton) {
					return;
				}
				filtros.usuarios.delete(boton.dataset.quitarUsuarioFiltro);
				renderChips();
				actualizar();
			});

			renderChips();
			return () => {
				entrada.value = "";
				filtros.usuarios.clear();
				ocultarSugerencias();
				renderChips();
			};
		}

		const limpiarUsuarios = iniciarFiltroUsuarios();

		function coincide(registro) {
			const busqueda = normalizar(filtros.busqueda);
			if (
				busqueda &&
				!normalizar(
					[registro.usuario, registro.vacuna, registro.lote, registro.aplicador, registro.centro, registro.cedula].join(" ")
				).includes(busqueda)
			) {
				return false;
			}
			if (filtros.cedula && !coincideCedula(registro.cedula, filtros.cedula)) {
				return false;
			}
			if (filtros.aplicador && !normalizar(registro.aplicador).includes(normalizar(filtros.aplicador))) {
				return false;
			}
			if (filtros.desde && registro.fecha < filtros.desde) {
				return false;
			}
			if (filtros.hasta && registro.fecha > filtros.hasta) {
				return false;
			}
			const campos = {
				vacunas: registro.vacuna,
				tipos: registro.tipo,
				anios: registro.anio,
				usuarios: registro.cedula,
				lotes: registro.lote,
				centros: registro.centro
			};
			return Object.entries(campos).every(
				([campo, valor]) => !filtros[campo].size || filtros[campo].has(valor)
			);
		}

		function ordenar(lista) {
			const copia = [...lista];
			switch (filtros.orden) {
				case "fecha-asc":
					return copia.sort((a, b) => a.fecha.localeCompare(b.fecha));
				case "usuario-asc":
					return copia.sort((a, b) => ordenarPorTexto(a.usuario, b.usuario));
				case "vacuna-asc":
					return copia.sort((a, b) => ordenarPorTexto(a.vacuna, b.vacuna));
				case "aplicador-asc":
					return copia.sort((a, b) => ordenarPorTexto(a.aplicador, b.aplicador));
				case "lote-asc":
					return copia.sort((a, b) => ordenarPorTexto(a.lote, b.lote));
				default:
					return copia.sort((a, b) => b.fecha.localeCompare(a.fecha));
			}
		}

		function actualizar() {
			const filtrados = ordenar(registros.filter(coincide));
			tbody.innerHTML = filtrados.length
				? filtrados.map(filaHistorial).join("")
				: `<tr><td colspan="9" class="p-6 text-center text-base-content/55 text-sm">${
						registros.length === 0
							? "Todavía no hay dosis registradas."
							: "No hay resultados con los filtros seleccionados."
					}</td></tr>`;
			if (contador) {
				contador.textContent = `${filtrados.length} de ${registros.length} dosis registradas`;
			}
			if (botonLimpiar) {
				const activo =
					Boolean(
						filtros.busqueda ||
							filtros.cedula ||
							filtros.aplicador ||
							filtros.desde ||
							filtros.hasta ||
							filtros.orden !== "fecha-desc"
					) ||
					Object.entries(filtros).some(([clave, valor]) => valor instanceof Set && valor.size > 0);
				botonLimpiar.disabled = !activo;
			}
			const unicos = (clave) => new Set(registros.map((registro) => registro[clave])).size;
			$$("[data-stat-usuarios]").forEach((nodo) => (nodo.textContent = unicos("usuarioId")));
			$$("[data-stat-vacunas]").forEach((nodo) => (nodo.textContent = unicos("vacunaId")));
			$$("[data-stat-centros]").forEach((nodo) => (nodo.textContent = unicos("centroId")));
		}

		if (botonLimpiar) {
			botonLimpiar.addEventListener("click", () => {
				$$("[data-filtro]", contenedor).forEach((control) => {
					if (control.tagName === "SELECT") {
						control.selectedIndex = 0;
						filtros[control.dataset.filtro] = control.value;
					} else {
						control.value = "";
						filtros[control.dataset.filtro] = "";
					}
				});
				$$("[data-filtro-multiple]", contenedor).forEach((detalle) => {
					const campo = detalle.dataset.filtroMultiple;
					filtros[campo].clear();
					$$("input[type=checkbox]", detalle).forEach((casilla) => {
						casilla.checked = false;
					});
					const resumen = $("[data-resumen]", detalle);
					if (resumen) {
						resumen.textContent = detalle.dataset.placeholder ?? "Todos";
					}
					detalle.open = false;
				});
				limpiarUsuarios();
				filtros.orden = "fecha-desc";
				actualizar();
			});
		}

		actualizar();
	}

	/* ------------------------------------------------------------------ */
	/* Centros de vacunación                                               */
	/* ------------------------------------------------------------------ */

	function iniciarCentros() {
		const contenedor = $("[data-centros]");
		if (!contenedor) {
			return;
		}
		const tbody = $("[data-tabla-centros]", contenedor);
		const formulario = $("[data-form-centro]", contenedor);
		const alerta = $("[data-centro-alerta]", contenedor);

		function htmlFilaCentro(centro) {
			return `<tr class="align-top">
				<td><span class="block font-medium text-sm">${esc(centro.nombre)}</span><span class="block max-w-72 text-base-content/55 text-xs">${esc(centro.direccion || "Sin dirección registrada")}</span></td>
				<td>
					<div class="flex flex-wrap gap-1">
						<span class="badge badge-primary badge-sm">${esc(etiquetaTipoCentro(centro.tipoCentro))}</span>
						<span class="badge ${centro.autorizado ? "badge-success" : "badge-warning"} badge-sm">${centro.autorizado ? "Autorizado" : "No autorizado"}</span>
					</div>
				</td>
				<td><span class="block text-sm">${esc(centro.municipio)}${centro.parroquia ? `, ${esc(centro.parroquia)}` : ""}</span><span class="text-base-content/55 text-xs">${esc(centro.estado)}</span></td>
				<td class="text-sm">${esc(centro.telefono || "—")}</td>
				<td class="text-right" data-acciones-centro="${esc(centro.id)}">
					<button type="button" class="btn btn-ghost btn-sm text-error" data-eliminar-centro="${esc(centro.id)}">
						<span class="icono icono-trash size-4" aria-hidden="true"></span>
						Eliminar
					</button>
				</td>
			</tr>`;
		}

		function render() {
			const centros = leerCentros();
			tbody.innerHTML = centros.length
				? centros.map(htmlFilaCentro).join("")
				: `<tr><td colspan="5" class="p-6 text-center text-base-content/55 text-sm">No hay centros de vacunación registrados.</td></tr>`;
		}

		render();

		if (formulario) {
			formulario.addEventListener("submit", (evento) => {
				evento.preventDefault();
				const datos = new FormData(formulario);
				const nombre = String(datos.get("nombre") ?? "").trim();
				const tipoCentro = Number(datos.get("tipoCentro") || 0);
				const autorizado = datos.get("autorizado") === "on";
				const estado = String(datos.get("estado") ?? "").trim();
				const municipio = String(datos.get("municipio") ?? "").trim();
				const parroquia = String(datos.get("parroquia") ?? "").trim();
				const direccion = String(datos.get("direccion") ?? "").trim();
				const telefono = String(datos.get("telefono") ?? "").trim();

				if (!nombre || !estado || !municipio) {
					mostrarAlerta(alerta, "error", "El nombre, el estado y el municipio son obligatorios.");
					return;
				}
				if (![1, 2, 3, 4].includes(tipoCentro)) {
					mostrarAlerta(alerta, "error", "Debes seleccionar un tipo de centro válido.");
					return;
				}
				if (telefono && !telefonoValido(telefono)) {
					mostrarAlerta(alerta, "error", "El teléfono debe tener entre 7 y 15 dígitos.");
					return;
				}
				const existente = leerCentros().some(
					(centro) => normalizar(centro.nombre) === normalizar(nombre)
				);
				if (existente) {
					mostrarAlerta(alerta, "error", "Ya existe un centro de vacunación con ese nombre.");
					return;
				}

				const regiones = {
					"Distrito Capital": "Capital",
					Miranda: "Capital",
					Carabobo: "Central",
					Aragua: "Central",
					Zulia: "Occidente",
					Táchira: "Occidente"
				};
				const nuevo = {
					id: `c-${Date.now()}`,
					nombre,
					tipoCentro,
					autorizado,
					estado,
					municipio,
					parroquia,
					direccion,
					telefono,
					region: regiones[estado] ?? "Capital"
				};
				modificarSesion((sesion) => {
					sesion.centrosNuevos = sesion.centrosNuevos ?? [];
					sesion.centrosNuevos.push(nuevo);
				});
				formulario.reset();
				mostrarAlerta(
					alerta,
					"success",
					`Centro <strong>${esc(nombre)}</strong> registrado como ${esc(etiquetaTipoCentro(tipoCentro))} en ${esc(municipio)}, ${esc(estado)}. ${autorizado ? "Autorizado para operar." : "Pendiente de autorización."}`
				);
				render();
			});
		}

		tbody.addEventListener("click", (evento) => {
			const eliminar = evento.target.closest("[data-eliminar-centro]");
			if (eliminar) {
				const id = eliminar.dataset.eliminarCentro;
				const celda = eliminar.closest("[data-acciones-centro]");
				celda.innerHTML = `<div class="flex flex-wrap justify-end gap-1">
					<span class="self-center text-base-content/60 text-xs">¿Eliminar?</span>
					<button type="button" class="btn btn-error btn-xs" data-confirmar-eliminar="${esc(id)}">Sí, eliminar</button>
					<button type="button" class="btn btn-ghost btn-xs" data-cancelar-eliminar>Cancelar</button>
				</div>`;
				return;
			}

			const confirmar = evento.target.closest("[data-confirmar-eliminar]");
			if (confirmar) {
				const id = confirmar.dataset.confirmarEliminar;
				const centro = leerCentros().find((item) => item.id === id);
				if (!centro) {
					render();
					return;
				}
				const usuarios = leerUsuarios().filter((usuario) => usuario.centroId === id).length;
				const registros = leerRegistros().filter((registro) => registro.centroId === id).length;
				modificarSesion((sesion) => {
					sesion.centrosEliminados = sesion.centrosEliminados ?? [];
					if (!sesion.centrosEliminados.includes(id)) {
						sesion.centrosEliminados.push(id);
					}
				});
				mostrarAlerta(
					alerta,
					"success",
					`Centro <strong>${esc(centro.nombre)}</strong> eliminado. Se conservaron ${usuarios} usuario${usuarios === 1 ? "" : "s"} y ${registros} dosis registrada${registros === 1 ? "" : "s"}.`
				);
				render();
				return;
			}

			if (evento.target.closest("[data-cancelar-eliminar]")) {
				render();
			}
		});
	}

	Object.assign(window.Pro2, {
		iniciarHistorial,
		iniciarCentros
	});
})();
