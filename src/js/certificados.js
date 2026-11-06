/*
	Gestión de certificados médicos del Perfil 2.
*/
(function () {
	"use strict";

	const { $, esc, normalizar, cedulaDigitos, cedulaValida, formatearCedula, buscarPorNombreOCedula, calcularEdad, hoyISO, sumarMeses, fechaCorta, fechaLarga, correoValido, telefonoValido, mostrarAlerta, limpiarAlerta, htmlAlerta, modificarSesion, leerUsuarios, leerCentros, leerRegistros, leerCertificados, vacunasObligatoriasFaltantes, datoCertificado, htmlCertificado } = window.Pro2;

	function ultimaMedidaRegistrada(registros, usuarioId) {
		return (
			(registros ?? [])
				.filter((registro) => registro.usuarioId === usuarioId && (registro.peso || registro.altura))
				.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))[0] ?? null
		);
	}

	function iniciarCertificados() {
		const contenedor = $("[data-certificados]");
		if (!contenedor) {
			return;
		}
		const usuarios = leerUsuarios();
		const centros = leerCentros();
		const registros = leerRegistros();
		const buscador = $("[data-cert-buscar-usuario]", contenedor);
		const sugerencias = $("[data-cert-sugerencias]", contenedor);
		const ficha = $("[data-cert-usuario]", contenedor);
		const alerta = $("[data-cert-alerta]", contenedor);
		const alertaExamen = $("[data-cert-examen-alerta]", contenedor);
		const fecha = $("[data-cert-fecha]", contenedor);
		const centro = $("[data-cert-centro]", contenedor);
		const bioanalista = $("[data-cert-bioanalista]", contenedor);
		const medico = $("[data-cert-medico]", contenedor);
		const tablaExamenes = $("[data-cert-examenes]", contenedor);
		const contadorExamenes = $("[data-cert-examenes-contador]", contenedor);
		const formNuevoUsuario = $("[data-form-nuevo-usuario-cert]", contenedor);
		const alertaNuevoUsuario = $("[data-nuevo-usuario-cert-alerta]", contenedor);
		const panelNuevoUsuario = $("[data-nuevo-usuario-cert-panel]", contenedor);
		const nuevoCentro = $("[data-nuevo-cert-centro]", contenedor);
		const campoTipo = $("[data-examen-tipo]", contenedor);
		const campoDescripcion = $("[data-examen-descripcion]", contenedor);
		const campoResultado = $("[data-examen-resultado]", contenedor);
		const campoUnidad = $("[data-examen-unidad]", contenedor);
		const campoReferencia = $("[data-examen-referencia]", contenedor);
		const botonExamen = $("[data-examen-agregar]", contenedor);
		const botonCancelarExamen = $("[data-examen-cancelar]", contenedor);
		const entradaArchivo = $("[data-cert-archivo]", contenedor);
		const entradaReemplazo = $("[data-cert-reemplazo]", contenedor);
		const listaArchivos = $("[data-cert-archivos]", contenedor);
		const verificaciones = $("[data-cert-verificaciones]", contenedor);
		const requisitos = $("[data-cert-requisitos]", contenedor);
		const botonGuardar = $("[data-cert-guardar]", contenedor);
		const botonProcesar = $("[data-cert-procesar]", contenedor);
		const resultado = $("[data-cert-resultado]", contenedor);

		const estado = {
			usuario: null,
			examenes: [],
			editando: -1,
			archivos: [],
			reemplazando: -1,
			sello: false,
			firma: false,
			procesado: false,
			codigo: "",
			certificado: null
		};

		fecha.max = hoyISO();
		fecha.value = hoyISO();

		if (centro) {
			centro.innerHTML = `<option value="">Selecciona un centro</option>${centros
				.map((item) => `<option value="${esc(item.nombre)}">${esc(item.nombre)} · ${esc(item.municipio)}</option>`)
				.join("")}`;
		}

		if (nuevoCentro) {
			nuevoCentro.innerHTML = `<option value="">Selecciona un centro</option>${centros
				.map((item) => `<option value="${esc(item.id)}">${esc(item.nombre)} · ${esc(item.municipio)}</option>`)
				.join("")}`;
		}

		function actualizarRequisitos() {
			const faltantes = estado.usuario ? vacunasObligatoriasFaltantes(estado.usuario, registros) : [];
			const examenesAptos =
				estado.examenes.length > 0 &&
				estado.examenes.every((examen) => !normalizar(examen.resultado).includes("no apto"));
			const documentacion = estado.archivos.length > 0;
			const verificados = estado.sello && estado.firma;
			const usuarioOk = Boolean(estado.usuario);
			const items = [
				{
					ok: usuarioOk,
					titulo: "Usuario registrado seleccionado",
					detalle: usuarioOk ? "Usuario validado dentro de la sub-región." : "Primero busca y selecciona un usuario registrado."
				},
				{
					ok: faltantes.length === 0 && usuarioOk,
					titulo: "Vacunas obligatorias completas",
					detalle: faltantes.length
						? faltantes.map((item) => `${item.nombre}: faltan ${item.faltan} dosis`).join(" · ")
						: usuarioOk
							? "COVID-19 y fiebre amarilla completas."
							: "Se valida al seleccionar un usuario."
				},
				{
					ok: examenesAptos,
					titulo: "Exámenes requeridos aptos",
					detalle: examenesAptos
						? `${estado.examenes.length} tipo${estado.examenes.length === 1 ? "" : "s"} de examen registrado${estado.examenes.length === 1 ? "" : "s"}.`
						: "Agrega al menos un examen con resultado apto."
				},
				{
					ok: documentacion,
					titulo: "Documentación obligatoria adjunta",
					detalle: documentacion
						? `${estado.archivos.length} archivo${estado.archivos.length === 1 ? "" : "s"} adjunto${estado.archivos.length === 1 ? "" : "s"}.`
						: "Adjunta un PDF o una foto del documento."
				},
				{
					ok: verificados,
					titulo: "Sello y firma digital verificados",
					detalle: verificados
						? "Sello válido y firma digital válida."
						: "Verifica el sello y la firma del documento."
				}
			];
			requisitos.innerHTML = items
				.map(
					(item) => `<li class="flex items-start gap-2 rounded-lg p-2 ${item.ok ? "bg-success/10" : "bg-base-200/70"}">
						<span class="icono ${item.ok ? "icono-circle-check text-success" : "icono-circle-x text-error"} mt-0.5 size-5 shrink-0" aria-hidden="true"></span>
						<span class="min-w-0"><span class="block font-medium text-sm">${esc(item.titulo)}</span><span class="block text-base-content/60 text-xs">${esc(item.detalle)}</span></span>
					</li>`
				)
				.join("");
		}

		function renderExamenes() {
			tablaExamenes.innerHTML = estado.examenes.length
				? `<div class="overflow-x-auto"><table class="table table-sm">
					<thead><tr><th>Tipo</th><th>Descripción</th><th>Resultado</th><th>Unidad</th><th>Referencia</th><th></th></tr></thead>
					<tbody>${estado.examenes
						.map(
							(examen, indice) => `<tr>
								<td class="text-sm">${esc(examen.tipo)}</td>
								<td class="text-sm">${esc(examen.descripcion)}</td>
								<td class="font-medium text-sm">${esc(examen.resultado)}</td>
								<td class="text-sm">${esc(examen.unidad)}</td>
								<td class="text-sm">${esc(examen.referencia)}</td>
								<td class="text-right whitespace-nowrap">
									<button type="button" class="btn btn-ghost btn-xs text-primary" data-examen-editar="${indice}">Editar</button>
									<button type="button" class="btn btn-ghost btn-xs text-error" data-examen-quitar="${indice}">Quitar</button>
								</td>
							</tr>`
						)
						.join("")}</tbody>
				</table></div>`
				: `<p class="rounded-xl border border-base-300 border-dashed p-4 text-base-content/55 text-sm">Todavía no hay tipos de examen registrados.</p>`;
			if (contadorExamenes) {
				contadorExamenes.textContent = `${estado.examenes.length} ${estado.examenes.length === 1 ? "examen" : "exámenes"}`;
			}
			actualizarRequisitos();
		}

		function renderArchivos() {
			listaArchivos.innerHTML = estado.archivos.length
				? estado.archivos
						.map(
							(archivo, indice) => `<div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-300 p-3">
								<div class="min-w-0">
									<p class="truncate font-medium text-sm">${esc(archivo.nombre)}</p>
									<p class="text-base-content/55 text-xs">${esc(archivo.tipo || "Archivo")} · ${Math.max(1, Math.round(archivo.tamano / 1024))} KB</p>
								</div>
								<div class="flex gap-1">
									<button type="button" class="btn btn-ghost btn-xs text-primary" data-reemplazar-archivo="${indice}">Reemplazar</button>
									<button type="button" class="btn btn-ghost btn-xs text-error" data-quitar-archivo="${indice}">Eliminar</button>
								</div>
							</div>`
						)
						.join("")
				: `<p class="rounded-xl border border-base-300 border-dashed p-4 text-base-content/55 text-sm">Sin documentación adjunta.</p>`;
			verificaciones.innerHTML = `<div class="grid gap-2 sm:grid-cols-2">
				<div class="rounded-xl ${estado.sello ? "bg-success/10" : "bg-base-200/70"} p-3">
					<p class="font-medium text-sm">Sello del documento</p>
					<p class="text-base-content/60 text-xs">${estado.sello ? "Verificado: válido" : "Sin verificar"}</p>
				</div>
				<div class="rounded-xl ${estado.firma ? "bg-success/10" : "bg-base-200/70"} p-3">
					<p class="font-medium text-sm">Firma digital</p>
					<p class="text-base-content/60 text-xs">${estado.firma ? "Verificada: válida" : "Sin verificar"}</p>
				</div>
			</div>`;
			actualizarRequisitos();
		}

		function mostrarUsuario(usuario) {
			estado.usuario = usuario;
			const medida = ultimaMedidaRegistrada(leerRegistros(), usuario.id);
			buscador.value = `${usuario.nombre} · ${usuario.cedula}`;
			sugerencias.innerHTML = "";
			sugerencias.hidden = true;
			ficha.innerHTML = `<div class="rounded-xl border border-base-300 p-4">
				<div class="flex flex-wrap items-start justify-between gap-2">
					<div>
						<p class="font-semibold">${esc(usuario.nombre)}</p>
						<p class="text-base-content/60 text-sm">${esc(usuario.cedula)} · ${calcularEdad(usuario.nacimiento)} años · ${esc(usuario.sexo)}</p>
					</div>
					<span class="badge badge-primary badge-sm">${esc(usuario.region)}</span>
				</div>
				<dl class="mt-3 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
					${datoCertificado("Fecha de nacimiento", fechaLarga(usuario.nacimiento))}
					${datoCertificado("Teléfono", usuario.telefono)}
					${datoCertificado("Correo", usuario.correo)}
					${datoCertificado("Centro de salud", usuario.centro)}
					${datoCertificado("Dirección del centro", usuario.centroDireccion)}
					${datoCertificado("Teléfono del centro", usuario.centroTelefono)}
					${datoCertificado("Registrado por", usuario.registradoPor || usuario.enfermero)}
					${datoCertificado("Cédula del registrador", usuario.registradoPorCedula || usuario.enfermeroCedula)}
					${datoCertificado("Dirección", usuario.direccion)}
					${datoCertificado("Tipo de sangre", usuario.sangre)}
					${datoCertificado("Peso", medida?.peso ? `${medida.peso} kg` : "No registrado")}
					${datoCertificado("Altura", medida?.altura ? `${medida.altura} cm` : "No registrado")}
					${datoCertificado("Alergias", usuario.alergias)}
					${datoCertificado("Ubicación", `${usuario.municipio}, ${usuario.estado}`)}
				</dl>
			</div>`;
			limpiarAlerta(alerta);
			actualizarRequisitos();
		}

		if (formNuevoUsuario) {
			formNuevoUsuario.addEventListener("submit", (evento) => {
				evento.preventDefault();
				limpiarAlerta(alertaNuevoUsuario);
				const datos = new FormData(formNuevoUsuario);
				const valor = (campo) => String(datos.get(campo) ?? "").trim();
				const primerNombre = valor("nombre");
				const segundoNombre = valor("segundoNombre");
				const primerApellido = valor("apellido");
				const segundoApellido = valor("segundoApellido");
				const nombre = [primerNombre, segundoNombre, primerApellido, segundoApellido]
					.filter(Boolean)
					.join(" ");
				const cedula = formatearCedula(valor("cedula"));
				const nacimiento = valor("nacimiento");
				const centroId = valor("centro");
				const centroElegido = centros.find((item) => item.id === centroId);
				const telefono = valor("telefono");
				const correo = valor("correo");
				const errores = [];

				if (!primerNombre) {
					errores.push("El primer nombre es obligatorio.");
				}
				if (!segundoNombre) {
					errores.push("El segundo nombre es obligatorio.");
				}
				if (!primerApellido) {
					errores.push("El primer apellido es obligatorio.");
				}
				if (!segundoApellido) {
					errores.push("El segundo apellido es obligatorio.");
				}
				if (nombre.length < 3) {
					errores.push("El nombre completo debe tener al menos 3 caracteres.");
				}
				if (!cedulaValida(valor("cedula"))) {
					errores.push("La cédula no tiene un formato válido.");
				} else if (usuarios.some((usuario) => cedulaDigitos(usuario.cedula) === cedulaDigitos(cedula))) {
					errores.push("La cédula ya está registrada en otro usuario.");
				}
				if (!nacimiento) {
					errores.push("La fecha de nacimiento es obligatoria.");
				} else if (nacimiento > hoyISO()) {
					errores.push("La fecha de nacimiento no puede ser futura.");
				} else if (calcularEdad(nacimiento) > 120 || nacimiento < "1900-01-01") {
					errores.push("La fecha de nacimiento no es coherente.");
				}
				if (!centroElegido) {
					errores.push("Selecciona el centro de salud del usuario.");
				}
				if (telefono && !telefonoValido(telefono)) {
					errores.push("El teléfono debe tener entre 7 y 15 dígitos.");
				}
				if (correo && !correoValido(correo)) {
					errores.push("El correo electrónico no tiene un formato válido.");
				}
				if (errores.length) {
					mostrarAlerta(
						alertaNuevoUsuario,
						"error",
						`Revisa los siguientes datos:<ul class="mt-2 list-disc pl-5">${errores
							.map((error) => `<li>${esc(error)}</li>`)
							.join("")}</ul>`
					);
					return;
				}

				const nuevo = {
					id: `p-${Date.now()}`,
					nombre,
					primerNombre,
					segundoNombre,
					primerApellido,
					segundoApellido,
					cedula,
					nacimiento,
					sexo: valor("sexo"),
					region: centroElegido.region ?? "Capital",
					estado: centroElegido.estado ?? "",
					municipio: centroElegido.municipio ?? "",
					telefono,
					correo,
					centroId: centroElegido.id,
					centro: centroElegido.nombre,
					centroDireccion: centroElegido.direccion ?? "",
					centroTelefono: centroElegido.telefono ?? "",
					sangre: valor("sangre"),
					direccion: valor("direccion"),
					alergias: valor("alergias")
				};
				modificarSesion((sesion) => {
					sesion.usuariosNuevos = sesion.usuariosNuevos ?? [];
					sesion.usuariosNuevos.push(nuevo);
				});
				usuarios.push(nuevo);
				formNuevoUsuario.reset();
				if (panelNuevoUsuario) {
					panelNuevoUsuario.open = false;
				}
				mostrarUsuario(nuevo);
				mostrarAlerta(
					alerta,
					"success",
					`Usuario <strong>${esc(nuevo.nombre)}</strong> registrado y seleccionado para el certificado.`
				);
			});
		}

		buscador.addEventListener("input", () => {
			const consulta = normalizar(buscador.value);
			estado.usuario = null;
			ficha.innerHTML = "";
			if (consulta.length < 2) {
				sugerencias.innerHTML = "";
				sugerencias.hidden = true;
				actualizarRequisitos();
				return;
			}
			const coincidencias = buscarPorNombreOCedula(usuarios, buscador.value);
			sugerencias.innerHTML = coincidencias.length
				? coincidencias
						.map(
							(usuario) => `<button type="button" class="block w-full rounded-lg px-3 py-2 text-left hover:bg-base-200" data-cert-usuario="${esc(usuario.id)}">
								<span class="block font-medium text-sm">${esc(usuario.nombre)}</span>
								<span class="block text-base-content/55 text-xs">${esc(usuario.cedula)} · ${calcularEdad(usuario.nacimiento)} años · ${esc(usuario.centro)}</span>
							</button>`
						)
						.join("")
				: `<div class="px-3 py-3 text-sm"><p class="font-medium">Usuario no registrado</p><p class="mt-1 text-base-content/60 text-xs">Usa el apartado “¿El usuario no está registrado? Regístralo aquí” para agregarlo.</p></div>`;
			sugerencias.hidden = false;
		});

		sugerencias.addEventListener("click", (evento) => {
			const boton = evento.target.closest("[data-cert-usuario]");
			if (!boton) {
				return;
			}
			const usuario = usuarios.find((item) => item.id === boton.dataset.certUsuario);
			if (usuario) {
				mostrarUsuario(usuario);
			}
		});

		document.addEventListener("click", (evento) => {
			if (!sugerencias.contains(evento.target) && evento.target !== buscador) {
				sugerencias.hidden = true;
			}
		});

		botonExamen.addEventListener("click", () => {
			const examen = {
				tipo: campoTipo.value,
				descripcion: campoDescripcion.value.trim(),
				resultado: campoResultado.value.trim(),
				unidad: campoUnidad.value.trim(),
				referencia: campoReferencia.value.trim()
			};
			if (!examen.tipo || !examen.descripcion || !examen.resultado || !examen.unidad || !examen.referencia) {
				mostrarAlerta(alertaExamen, "error", "Completa el tipo, la descripción, el resultado, la unidad y los valores de referencia.");
				return;
			}
			if (estado.editando >= 0) {
				estado.examenes[estado.editando] = examen;
				estado.editando = -1;
				botonExamen.textContent = "Agregar examen";
				botonCancelarExamen.hidden = true;
			} else {
				estado.examenes.push(examen);
			}
			limpiarAlerta(alertaExamen);
			[campoDescripcion, campoResultado, campoUnidad, campoReferencia].forEach((campo) => {
				campo.value = "";
			});
			campoTipo.selectedIndex = 0;
			renderExamenes();
		});

		botonCancelarExamen.addEventListener("click", () => {
			estado.editando = -1;
			botonExamen.textContent = "Agregar examen";
			botonCancelarExamen.hidden = true;
			[campoDescripcion, campoResultado, campoUnidad, campoReferencia].forEach((campo) => {
				campo.value = "";
			});
			campoTipo.selectedIndex = 0;
			limpiarAlerta(alertaExamen);
		});

		tablaExamenes.addEventListener("click", (evento) => {
			const editar = evento.target.closest("[data-examen-editar]");
			if (editar) {
				const indice = Number(editar.dataset.examenEditar);
				const examen = estado.examenes[indice];
				estado.editando = indice;
				campoTipo.value = examen.tipo;
				campoDescripcion.value = examen.descripcion;
				campoResultado.value = examen.resultado;
				campoUnidad.value = examen.unidad;
				campoReferencia.value = examen.referencia;
				botonExamen.textContent = "Guardar cambios";
				botonCancelarExamen.hidden = false;
				limpiarAlerta(alertaExamen);
				return;
			}
			const quitar = evento.target.closest("[data-examen-quitar]");
			if (quitar) {
				estado.examenes.splice(Number(quitar.dataset.examenQuitar), 1);
				estado.editando = -1;
				botonExamen.textContent = "Agregar examen";
				botonCancelarExamen.hidden = true;
				renderExamenes();
			}
		});

		function reiniciarVerificacion() {
			estado.sello = false;
			estado.firma = false;
		}

		entradaArchivo.addEventListener("change", () => {
			const archivos = Array.from(entradaArchivo.files ?? []);
			const invalidos = archivos.filter(
				(archivo) => archivo.type !== "application/pdf" && !archivo.type.startsWith("image/")
			);
			if (invalidos.length) {
				mostrarAlerta(alerta, "error", "Solo se permiten archivos PDF o fotografías.");
			}
			archivos
				.filter((archivo) => archivo.type === "application/pdf" || archivo.type.startsWith("image/"))
				.forEach((archivo) => {
					estado.archivos.push({ nombre: archivo.name, tipo: archivo.type, tamano: archivo.size });
				});
			entradaArchivo.value = "";
			reiniciarVerificacion();
			renderArchivos();
		});

		entradaReemplazo.addEventListener("change", () => {
			const archivo = entradaReemplazo.files?.[0];
			if (archivo && estado.reemplazando >= 0) {
				if (archivo.type !== "application/pdf" && !archivo.type.startsWith("image/")) {
					mostrarAlerta(alerta, "error", "Solo se permiten archivos PDF o fotografías.");
				} else {
					estado.archivos[estado.reemplazando] = {
						nombre: archivo.name,
						tipo: archivo.type,
						tamano: archivo.size
					};
					reiniciarVerificacion();
					renderArchivos();
				}
			}
			estado.reemplazando = -1;
			entradaReemplazo.value = "";
		});

		listaArchivos.addEventListener("click", (evento) => {
			const reemplazar = evento.target.closest("[data-reemplazar-archivo]");
			if (reemplazar) {
				estado.reemplazando = Number(reemplazar.dataset.reemplazarArchivo);
				entradaReemplazo.click();
				return;
			}
			const quitar = evento.target.closest("[data-quitar-archivo]");
			if (quitar) {
				estado.archivos.splice(Number(quitar.dataset.quitarArchivo), 1);
				reiniciarVerificacion();
				renderArchivos();
			}
		});

		$("[data-cert-verificar-sello]", contenedor).addEventListener("click", () => {
			if (!estado.archivos.length) {
				estado.sello = false;
				mostrarAlerta(alerta, "warning", "No válido: primero adjunta la documentación del examen.");
			} else {
				estado.sello = true;
				mostrarAlerta(alerta, "success", "Sello del documento verificado como válido.");
			}
			renderArchivos();
		});

		$("[data-cert-verificar-firma]", contenedor).addEventListener("click", () => {
			if (!estado.archivos.length) {
				estado.firma = false;
				mostrarAlerta(alerta, "warning", "No válido: primero adjunta la documentación del examen.");
			} else {
				estado.firma = true;
				mostrarAlerta(alerta, "success", "Firma digital verificada como válida.");
			}
			renderArchivos();
		});

		botonGuardar.addEventListener("click", () => {
			if (!estado.usuario) {
				mostrarAlerta(alerta, "warning", "Selecciona un usuario registrado antes de guardar el examen.");
				return;
			}
			mostrarAlerta(
				alerta,
				"info",
				"Examen guardado en estado pendiente. Puedes completar los datos y procesarlo después."
			);
		});

		botonProcesar.addEventListener("click", () => {
			if (estado.procesado) {
				mostrarAlerta(alerta, "warning", "Este examen ya fue procesado. No se puede procesar dos veces.");
				return;
			}
			const errores = [];
			if (!estado.usuario) {
				errores.push("Selecciona un usuario registrado dentro de la sub-región.");
			}
			if (!fecha.value) {
				errores.push("La fecha del examen es obligatoria.");
			} else if (fecha.value > hoyISO()) {
				errores.push("La fecha del examen no puede ser futura.");
			}
			if (!centro.value) {
				errores.push("Selecciona el centro de salud del examen.");
			}
			if (!bioanalista.value.trim()) {
				errores.push("El nombre del bioanalista es obligatorio.");
			}
			if (!medico.value.trim()) {
				errores.push("El nombre del médico evaluador es obligatorio.");
			}
			if (!estado.examenes.length) {
				errores.push("Debe existir al menos un tipo de examen registrado.");
			}
			if (!estado.archivos.length) {
				errores.push("La documentación obligatoria debe estar adjunta.");
			}
			if (!estado.sello || !estado.firma) {
				errores.push("El sello y la firma digital deben estar verificados como válidos.");
			}
			const faltantes = estado.usuario ? vacunasObligatoriasFaltantes(estado.usuario, registros) : [];
			if (faltantes.length) {
				errores.push(
					`El usuario no cumple las vacunas obligatorias: ${faltantes
						.map((item) => `${item.nombre} (faltan ${item.faltan})`)
						.join(", ")}.`
				);
			}
			if (errores.length) {
				mostrarAlerta(
					alerta,
					"error",
					`No se pudo procesar el certificado:<ul class="mt-2 list-disc pl-5">${errores
						.map((error) => `<li>${esc(error)}</li>`)
						.join("")}</ul>`
				);
				return;
			}

			const codigo = `CERT-${new Date().getFullYear()}-${String(leerCertificados().length + 1).padStart(4, "0")}`;
			const centroEmisor = centros.find((item) => item.nombre === centro.value);
			const dosisRespaldo = registros
				.filter((registro) => registro.usuarioId === estado.usuario.id)
				.slice()
				.sort((a, b) => String(b.fecha ?? "").localeCompare(String(a.fecha ?? "")));
			const certificado = {
				codigo,
				usuarioId: estado.usuario.id,
				estado: "Vigente",
				emision: hoyISO(),
				vigencia: sumarMeses(hoyISO(), 12),
				examenFecha: fecha.value,
				centroId: centroEmisor?.id ?? "",
				centro: centro.value,
				centroDireccion: centroEmisor?.direccion ?? "",
				centroTelefono: centroEmisor?.telefono ?? "",
				centroMunicipio: centroEmisor?.municipio ?? "",
				centroEstado: centroEmisor?.estado ?? "",
				centroTipo: centroEmisor?.tipoCentro ?? "",
				bioanalista: bioanalista.value.trim(),
				medico: medico.value.trim(),
				emisor: "Sub-región Capital · Salud Vacunas",
				observaciones: "Certificado emitido tras verificar el cumplimiento de las vacunas obligatorias.",
				sello: "Válido",
				firma: "Válida",
				examenes: estado.examenes.map((examen) => ({
					...examen,
					fecha: examen.fecha || fecha.value,
					centro: examen.centro || centro.value,
					bioanalista: examen.bioanalista || bioanalista.value.trim()
				})),
				documentacion: estado.archivos.map((archivo) => ({ ...archivo })),
				dosisRespaldo,
				dosisPrincipal: dosisRespaldo[0] ?? null,
				usuario: { ...estado.usuario }
			};
			modificarSesion((sesion) => {
				sesion.certificadosNuevos = sesion.certificadosNuevos ?? [];
				sesion.certificadosNuevos.push(certificado);
			});
			estado.procesado = true;
			estado.codigo = codigo;
			estado.certificado = certificado;
			botonProcesar.disabled = true;
			botonProcesar.textContent = "Examen procesado";
			mostrarAlerta(
				alerta,
				"success",
				`Examen procesado correctamente. Se habilitó el certificado <strong>${esc(codigo)}</strong>.`
			);
			resultado.hidden = false;
			resultado.innerHTML = `<div class="flex flex-col gap-4">
				<div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
					<div>
						<h2 class="font-semibold text-xl tracking-tight">Certificado generado</h2>
						<p class="text-base-content/60 text-sm">Código único ${esc(codigo)} · vigencia hasta ${esc(fechaCorta(certificado.vigencia))}.</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<button type="button" class="btn btn-primary btn-sm min-h-10 rounded-xl" data-cert-descargar>
							<span class="icono icono-printer size-4" aria-hidden="true"></span>
							Descargar PDF
						</button>
					</div>
				</div>
				${htmlCertificado(certificado)}
				<div class="rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-300/50 print:hidden">
					<h3 class="font-semibold text-lg">Enviar certificado por correo</h3>
					<p class="mt-1 text-base-content/60 text-sm">En la demostración no se envía un correo real.</p>
					<div class="mt-3 flex flex-col gap-2 sm:flex-row">
						<input type="email" class="input h-12 w-full rounded-xl" data-cert-correo value="${esc(estado.usuario.correo)}" placeholder="correo@ejemplo.com" />
						<button type="button" class="btn btn-outline min-h-12 rounded-xl" data-cert-enviar>
							<span class="icono icono-send size-4" aria-hidden="true"></span>
							Enviar
						</button>
					</div>
					<div class="mt-3" data-cert-correo-alerta></div>
				</div>
			</div>`;
			$("[data-cert-descargar]", resultado).addEventListener("click", () => {
				mostrarAlerta(
					$("[data-cert-correo-alerta]", resultado),
					"info",
					"Se abrirá el diálogo de impresión. Elige “Guardar como PDF” para descargar el certificado."
				);
				window.print();
			});
			$("[data-cert-enviar]", resultado).addEventListener("click", () => {
				const correo = $("[data-cert-correo]", resultado);
				const aviso = $("[data-cert-correo-alerta]", resultado);
				if (!correoValido(correo.value)) {
					mostrarAlerta(aviso, "error", "Escribe un correo electrónico válido.");
					return;
				}
				mostrarAlerta(
					aviso,
					"success",
					`Certificado ${esc(codigo)} enviado a <strong>${esc(correo.value)}</strong> (demostración, sin envío real).`
				);
			});
			resultado.scrollIntoView({ behavior: "smooth", block: "start" });
		});

		renderExamenes();
		renderArchivos();
		actualizarRequisitos();
	}

	function iniciarHistorialCertificados() {
		const contenedor = $("[data-cert-historial]");
		if (!contenedor) {
			return;
		}
		const tbody = $("[data-cert-historial-tabla]", contenedor);
		const contador = $("[data-cert-historial-contador]", contenedor);
		const enlaceVerificar = contenedor.dataset.certHistorialVerificar ?? "../verificar.html";
		const certificados = leerCertificados()
			.slice()
			.sort((a, b) => String(b.emision ?? "").localeCompare(String(a.emision ?? "")));

		function fila(certificado) {
			const usuario = certificado.usuario ?? {};
			const vigente = certificado.estado !== "Vencido";
			const examenes = certificado.examenes ?? [];
			const documentos = certificado.documentacion ?? [];
			const centroUbicacion = [certificado.centroMunicipio, certificado.centroEstado].filter(Boolean).join(", ");
			return `<tr class="align-top">
				<td>
					<span class="block font-mono font-medium text-sm">${esc(certificado.codigo)}</span>
					<span class="block text-base-content/55 text-xs">Examen: ${esc(fechaCorta(certificado.examenFecha))}</span>
				</td>
				<td><span class="block font-medium text-sm">${esc(usuario.nombre || "Sin usuario")}</span><span class="block text-base-content/55 text-xs">${esc(usuario.cedula || "—")}</span></td>
				<td class="whitespace-nowrap text-sm">${esc(fechaCorta(certificado.emision))}</td>
				<td class="whitespace-nowrap text-sm">${esc(fechaCorta(certificado.vigencia))}</td>
				<td><span class="badge ${vigente ? "badge-success" : "badge-error"} badge-sm">${esc(certificado.estado)}</span></td>
				<td>
					<span class="block max-w-56 text-sm">${esc(certificado.centro || "—")}</span>
					${centroUbicacion ? `<span class="block text-base-content/55 text-xs">${esc(centroUbicacion)}</span>` : ""}
					${certificado.centroTelefono ? `<span class="block text-base-content/55 text-xs">Tel. ${esc(certificado.centroTelefono)}</span>` : ""}
				</td>
				<td>
					<span class="block text-base-content/55 text-xs">${examenes.length} ${examenes.length === 1 ? "examen" : "exámenes"}</span>
					${examenes.length ? `<ul class="mt-1 list-disc pl-4 text-xs">${examenes.map((examen) => `<li>${esc(examen.tipo)}: <strong>${esc(examen.resultado || "—")}</strong>${examen.unidad ? ` ${esc(examen.unidad)}` : ""}</li>`).join("")}</ul>` : `<span class="text-base-content/55 text-xs">Sin resultados registrados.</span>`}
				</td>
				<td>
					<span class="block text-sm">${esc(certificado.bioanalista || "—")}</span>
					<span class="block text-base-content/55 text-xs">Bioanalista</span>
					<span class="mt-1 block text-sm">${esc(certificado.medico || "—")}</span>
					<span class="block text-base-content/55 text-xs">Médico evaluador</span>
					<span class="mt-1 block text-sm">${esc(certificado.emisor || "—")}</span>
					<span class="block text-base-content/55 text-xs">Emisor</span>
				</td>
				<td>
					<span class="block text-sm">${documentos.length} ${documentos.length === 1 ? "archivo" : "archivos"}</span>
					${documentos.length ? `<ul class="mt-1 list-disc pl-4 text-xs">${documentos.map((documento) => `<li>${esc(documento.nombre)}</li>`).join("")}</ul>` : `<span class="block text-base-content/55 text-xs">Sin documentación</span>`}
				</td>
				<td class="text-right">
					<a href="${enlaceVerificar}?codigo=${encodeURIComponent(certificado.codigo)}" class="btn btn-ghost btn-sm min-h-9 rounded-lg text-primary">
						<span class="icono icono-external-link size-4" aria-hidden="true"></span>
						Ver
					</a>
				</td>
			</tr>`;
		}

		tbody.innerHTML = certificados.length
			? certificados.map(fila).join("")
			: `<tr><td colspan="10" class="p-6 text-center text-base-content/55 text-sm">Todavía no hay certificados médicos otorgados.</td></tr>`;
		if (contador) {
			contador.textContent = `${certificados.length} certificado${certificados.length === 1 ? "" : "s"} otorgado${certificados.length === 1 ? "" : "s"}`;
		}
	}

	Object.assign(window.Pro2, {
		iniciarCertificados,
		iniciarHistorialCertificados
	});
})();
