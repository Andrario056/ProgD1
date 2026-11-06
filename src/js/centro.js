/*
	Flujos del Perfil 1: registro de usuarios y registro de vacunación.
*/
(function () {
	"use strict";

	const { $, $$, esc, normalizar, cedulaDigitos, buscarPorNombreOCedula, cedulaValida, formatearCedula, calcularEdad, iniciales, hoyISO, fechaCorta, telefonoValido, correoValido, mostrarAlerta, limpiarAlerta, htmlAlerta, modificarSesion, leerUsuarios, leerVacunas, leerRegistros } = window.Pro2;

	function leerCentroActual() {
		const nodo = $("[data-centro-actual]");
		return {
			id: nodo?.dataset.centroId ?? "c1",
			nombre: nodo?.dataset.nombre ?? "Centro de salud",
			estado: nodo?.dataset.estado ?? "Distrito Capital",
			municipio: nodo?.dataset.municipio ?? "Libertador",
			region: nodo?.dataset.region ?? "Capital",
			direccion: nodo?.dataset.direccion ?? "",
			telefono: nodo?.dataset.telefono ?? ""
		};
	}

	// Superficie corporal por la fórmula de Mosteller: √(peso kg × altura cm / 3600).
	// La dosis escrita por el aplicador se escala respecto a una superficie de
	// referencia de 1,73 m² (adulto promedio).
	const SUPERFICIE_REFERENCIA = 1.73;

	function calcularSuperficieCorporal(peso, altura) {
		if (!(peso > 0) || !(altura > 0)) {
			return null;
		}
		return Math.sqrt((peso * altura) / 3600);
	}

	function calcularCantidadAplicada(base, peso, altura) {
		const superficie = calcularSuperficieCorporal(peso, altura);
		if (!(base > 0) || !superficie) {
			return null;
		}
		return Math.round(base * (superficie / SUPERFICIE_REFERENCIA) * 100) / 100;
	}

	function iniciarRegistroUsuario() {
		const formulario = $("[data-form-usuario]");
		if (!formulario) {
			return;
		}
		const alerta = $("[data-form-usuario-alerta]");
		const exito = $("[data-registro-exito]");
		const centro = leerCentroActual();
		const centroFijo = $("[data-centro-fijo]");
		const listaCedulas = $("[data-cedulas-registradas]");

		function colocarCentro() {
			if (centroFijo) {
				centroFijo.value = centro.nombre;
			}
			$$("[data-centro-nombre]").forEach((nodo) => {
				nodo.textContent = centro.nombre;
			});
		}

		colocarCentro();

		function cedulasRegistradas() {
			return $$("[data-cedula]", listaCedulas).map((nodo) => cedulaDigitos(nodo.dataset.cedula));
		}

		formulario.addEventListener("submit", (evento) => {
			evento.preventDefault();
			limpiarAlerta(alerta);
			if (exito) {
				exito.hidden = true;
				exito.innerHTML = "";
			}

			const datos = new FormData(formulario);
			const valor = (campo) => String(datos.get(campo) ?? "").trim();
			const nombre = valor("nombre");
			const segundoNombre = valor("segundoNombre");
			const apellido = valor("apellido");
			const segundoApellido = valor("segundoApellido");
			const cedula = formatearCedula(valor("cedula"));
			const nacimiento = valor("fechaNacimiento");
			const telefono = valor("telefono");
			const correo = valor("correo");
			const region = valor("region");
			const crearCuenta = datos.get("crearCuenta") === "on";
			const enfermero = valor("enfermero");
			const enfermeroCedula = formatearCedula(valor("enfermeroCedula"));
			const errores = [];

			if (!enfermero) {
				errores.push("El nombre del enfermero o personal de consulta es obligatorio.");
			}
			if (!cedulaValida(valor("enfermeroCedula"))) {
				errores.push("La cédula del enfermero o personal de consulta no es válida.");
			}
			if (!nombre) {
				errores.push("El primer nombre es obligatorio.");
			}
			if (!segundoNombre) {
				errores.push("El segundo nombre es obligatorio.");
			}
			if (!apellido) {
				errores.push("El primer apellido es obligatorio.");
			}
			if (!segundoApellido) {
				errores.push("El segundo apellido es obligatorio.");
			}
			const nombreCompleto = [nombre, segundoNombre, apellido, segundoApellido]
				.filter(Boolean)
				.join(" ");
			if (nombreCompleto.length < 3) {
				errores.push("El nombre completo debe tener al menos 3 caracteres.");
			}
			if (!cedulaValida(valor("cedula"))) {
				errores.push("La cédula del usuario no tiene un formato válido.");
			} else if (cedulasRegistradas().includes(cedulaDigitos(cedula))) {
				errores.push("La cédula ya está registrada en otro usuario.");
			}
			if (!nacimiento) {
				errores.push("La fecha de nacimiento es obligatoria.");
			} else {
				if (nacimiento > hoyISO()) {
					errores.push("La fecha de nacimiento no puede ser futura.");
				}
				const edad = calcularEdad(nacimiento);
				if (edad < 0 || edad > 120 || nacimiento < "1900-01-01") {
					errores.push("La fecha de nacimiento no es coherente.");
				}
			}
			if (telefono && !telefonoValido(telefono)) {
				errores.push("El teléfono debe tener entre 7 y 15 dígitos.");
			}
			if (correo && !correoValido(correo)) {
				errores.push("El correo electrónico no tiene un formato válido.");
			}
			if (crearCuenta && !correo) {
				errores.push("El correo es obligatorio para crear la cuenta de acceso del usuario.");
			}
			if (!["Capital", "Central", "Occidente"].includes(region)) {
				errores.push("La región seleccionada no es válida.");
			}
			if (!centro.nombre) {
				errores.push("No se pudo determinar el centro de salud de la vista.");
			}
			if (errores.length) {
				mostrarAlerta(
					alerta,
					"error",
					`Revisa los siguientes datos:<ul class="mt-2 list-disc pl-5">${errores
						.map((error) => `<li>${esc(error)}</li>`)
						.join("")}</ul>`
				);
				return;
			}

			const identificador = `USR-${String(cedulasRegistradas().length + 1).padStart(3, "0")}`;
			const usuario = `${normalizar(nombre).charAt(0)}${normalizar(apellido).replace(/\s/g, "")}${cedulaDigitos(cedula).slice(-2)}`;
			const nuevo = {
				id: `p-${Date.now()}`,
				nombre: nombreCompleto,
				primerNombre: nombre,
				segundoNombre,
				primerApellido: apellido,
				segundoApellido,
				cedula,
				nacimiento,
				sexo: valor("sexo"),
				region,
				estado: centro.estado,
				municipio: centro.municipio,
				telefono,
				correo,
				centroId: centro.id,
				centro: centro.nombre,
				centroDireccion: centro.direccion,
				centroTelefono: centro.telefono,
				sangre: valor("tipoSangre"),
				direccion: valor("direccion"),
				alergias: valor("alergias"),
				usuarioAcceso: crearCuenta ? usuario : "",
				enfermero,
				enfermeroCedula,
				registradoPor: enfermero,
				registradoPorCedula: enfermeroCedula
			};
			modificarSesion((actual) => {
				actual.usuariosNuevos = actual.usuariosNuevos ?? [];
				actual.usuariosNuevos.push(nuevo);
			});
			listaCedulas.insertAdjacentHTML(
				"beforeend",
				`<span data-cedula="${esc(cedula)}" data-usuario-id="${esc(nuevo.id)}"></span>`
			);

			if (exito) {
				exito.hidden = false;
				exito.innerHTML = `<div class="flex flex-col gap-4">
					${htmlAlerta(
						"success",
						`<p class="font-semibold">Usuario registrado correctamente.</p><p class="mt-1">Identificador: <strong>${esc(identificador)}</strong> · ${esc(nombreCompleto)} · ${esc(cedula)}.</p>`
					)}
					${
						crearCuenta
							? `<div class="rounded-xl border border-base-300 bg-base-100 p-4">
								<p class="font-medium text-sm">Cuenta de acceso creada</p>
								<div class="mt-2 grid gap-2 sm:grid-cols-2">
									<p class="text-sm">Usuario: <strong class="font-mono">${esc(usuario)}</strong></p>
									<p class="text-sm">Contraseña temporal: <strong class="font-mono">demo</strong></p>
								</div>
								<p class="mt-2 text-base-content/55 text-xs">La cuenta pertenece al usuario y no crea un perfil adicional en esta demostración.</p>
							</div>`
							: `<div class="rounded-xl border border-base-300 bg-base-100 p-4"><p class="font-medium text-sm">No se creó cuenta de acceso</p><p class="mt-1 text-base-content/60 text-sm">El usuario quedó registrado sin credenciales de consulta.</p></div>`
					}
					<div class="flex flex-wrap gap-2">
						<a href="../vacunas/registrar.html" class="btn btn-primary min-h-11 rounded-xl font-medium text-base">Registrar vacunación</a>
						<button type="button" class="btn btn-outline min-h-11 rounded-xl font-medium text-base" data-registrar-otro>Registrar otro usuario</button>
					</div>
				</div>`;
				$("[data-registrar-otro]", exito).addEventListener("click", () => {
					exito.hidden = true;
					exito.innerHTML = "";
					formulario.reset();
					colocarCentro();
					$("#nombre", formulario)?.focus();
				});
				exito.scrollIntoView({ behavior: "smooth", block: "start" });
			}

			formulario.reset();
			colocarCentro();
		});

		formulario.addEventListener("reset", () => {
			window.setTimeout(() => {
				colocarCentro();
				limpiarAlerta(alerta);
			}, 0);
		});

		formulario.querySelector('button[type="reset"]')?.addEventListener("click", () => {
			if (exito) {
				exito.hidden = true;
				exito.innerHTML = "";
			}
		});
	}

	function iniciarVacunacion() {
		const contenedor = $("[data-vacunacion]");
		if (!contenedor) {
			return;
		}
		const centro = leerCentroActual();
		const usuarios = leerUsuarios().filter((usuario) => usuario.centroId === centro.id);
		const vacunas = leerVacunas();
		const personal = $$("[data-datos-personal] [data-personal]")
			.filter((nodo) => nodo.dataset.centroId === centro.id)
			.map((nodo) => ({ nombre: nodo.dataset.nombre, cargo: nodo.dataset.cargo }));
		const registros = leerRegistros();
		const buscador = $("[data-usuario-busqueda]", contenedor);
		const sugerencias = $("[data-usuario-sugerencias]", contenedor);
		const seleccionado = $("[data-usuario-seleccionado]", contenedor);
		const limpiarUsuario = $("[data-limpiar-usuario]", contenedor);
		const campoPeso = $("[data-campo-peso]", contenedor);
		const campoAltura = $("[data-campo-altura]", contenedor);
		const fecha = $("[data-campo-fecha]", contenedor);
		const aplicador = $("[data-campo-aplicador]", contenedor);
		const sugerenciasAplicador = $("[data-aplicador-sugerencias]", contenedor);
		const ayudaAplicador = $("[data-aplicador-ayuda]", contenedor);
		const atencion = $("[data-campo-atencion]", contenedor);
		const selectVacuna = $("[data-campo-vacuna]", contenedor);
		const selectLote = $("[data-campo-lote]", contenedor);
		const campoCantidad = $("[data-campo-cantidad]", contenedor);
		const campoCantidadFinal = $("[data-campo-cantidad-final]", contenedor);
		const calculoDosis = $("[data-calculo-dosis]", contenedor);
		const calculoSuperficie = $("[data-calculo-superficie]", contenedor);
		const calculoFactor = $("[data-calculo-factor]", contenedor);
		const calculoCantidad = $("[data-calculo-cantidad]", contenedor);
		const infoCantidadFinal = $("[data-cantidad-final-info]", contenedor);
		const infoVacuna = $("[data-vacuna-info]", contenedor);
		const infoLote = $("[data-lote-info]", contenedor);
		const avisoVacuna = $("[data-vacuna-aviso]", contenedor);
		const resumen = $("[data-resumen-seleccion]", contenedor);
		const alerta = $("[data-vacunacion-alerta]", contenedor);
		const exito = $("[data-vacunacion-exito]", contenedor);
		const avisoSinUsuarios = $("[data-sin-usuarios]", contenedor);
		const avisoSinVacunas = $("[data-sin-vacunas]", contenedor);
		const formulario = $("[data-form-vacunacion]", contenedor);
		let usuario = null;

		// Última medida registrada en una dosis anterior del usuario.
		function medidaPrevia(personaId) {
			const previas = registros
				.filter((registro) => registro.usuarioId === personaId && (registro.peso || registro.altura))
				.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
			return previas[0] ?? null;
		}

		// Calcula y pinta la cantidad que corresponde según peso y altura.
		function actualizarCalculoDosis() {
			const peso = Number(campoPeso?.value);
			const altura = Number(campoAltura?.value);
			const base = Number(campoCantidad?.value);
			const superficie = calcularSuperficieCorporal(peso, altura);
			const aplicada = calcularCantidadAplicada(base, peso, altura);
			if (calculoDosis) {
				calculoDosis.hidden = !superficie;
			}
			if (calculoSuperficie) {
				calculoSuperficie.textContent = superficie ? `${superficie.toFixed(2)} m²` : "—";
			}
			if (calculoFactor) {
				calculoFactor.textContent = superficie ? `${(superficie / SUPERFICIE_REFERENCIA).toFixed(2)}×` : "—";
			}
			if (calculoCantidad) {
				calculoCantidad.textContent = aplicada == null ? "—" : `${aplicada.toFixed(2)} ml`;
			}
			if (campoCantidadFinal) {
				campoCantidadFinal.value = aplicada == null ? "" : aplicada.toFixed(2);
			}
			if (infoCantidadFinal) {
				if (aplicada != null) {
					infoCantidadFinal.textContent = `Calculada con ${superficie.toFixed(2)} m² de superficie corporal.`;
				} else if (!superficie) {
					infoCantidadFinal.textContent = "Completa el peso y la altura para calcular la cantidad.";
				} else {
					infoCantidadFinal.textContent = "Escribe la cantidad de referencia para calcular la cantidad a aplicar.";
				}
			}
			return aplicada;
		}

		fecha.max = hoyISO();
		fecha.value = hoyISO();

		if (!usuarios.length) {
			if (avisoSinUsuarios) {
				avisoSinUsuarios.hidden = false;
			}
			if (formulario) {
				formulario.hidden = true;
			}
			return;
		}
		if (!vacunas.length) {
			if (avisoSinVacunas) {
				avisoSinVacunas.hidden = false;
			}
			if (formulario) {
				formulario.hidden = true;
			}
			return;
		}

		if (personal.length) {
			if (ayudaAplicador) {
				ayudaAplicador.hidden = false;
				ayudaAplicador.textContent = "Escribe el nombre del aplicador y selecciónalo de la lista.";
			}
		} else {
			aplicador.value = centro.nombre;
			if (ayudaAplicador) {
				ayudaAplicador.hidden = false;
				ayudaAplicador.textContent = "No hay personal registrado en el centro; se usa el usuario de la sesión como aplicador.";
			}
		}

		function cargoDeAplicador(nombre) {
			const texto = normalizar(nombre);
			const encontrado = personal.find((item) => normalizar(item.nombre) === texto);
			return encontrado?.cargo ?? "Usuario del centro";
		}

		function ocultarSugerenciasAplicador() {
			sugerenciasAplicador.hidden = true;
			sugerenciasAplicador.innerHTML = "";
		}

		function renderSugerenciasAplicador() {
			if (!personal.length) {
				ocultarSugerenciasAplicador();
				return;
			}
			const consulta = normalizar(aplicador.value);
			const coincidencias = personal.filter(
				(item) => !consulta || normalizar(item.nombre).includes(consulta)
			);
			sugerenciasAplicador.innerHTML = coincidencias.length
				? coincidencias
						.map(
							(item) => `<button type="button" class="block w-full px-3 py-2 text-left hover:bg-base-200" data-elegir-aplicador="${esc(item.nombre)}">
								<span class="block font-medium text-sm">${esc(item.nombre)}</span>
								<span class="block text-base-content/55 text-xs">${esc(item.cargo)}</span>
							</button>`
						)
						.join("")
				: `<p class="px-3 py-2 text-base-content/55 text-sm">No hay personal que coincida con el nombre escrito.</p>`;
			sugerenciasAplicador.hidden = false;
		}

		aplicador.addEventListener("input", renderSugerenciasAplicador);
		aplicador.addEventListener("focus", renderSugerenciasAplicador);
		aplicador.addEventListener("keydown", (evento) => {
			if (evento.key === "Enter") {
				evento.preventDefault();
			}
		});
		aplicador.addEventListener("blur", () => {
			window.setTimeout(ocultarSugerenciasAplicador, 120);
		});

		sugerenciasAplicador.addEventListener("click", (evento) => {
			const boton = evento.target.closest("[data-elegir-aplicador]");
			if (!boton) {
				return;
			}
			aplicador.value = boton.dataset.elegirAplicador;
			ocultarSugerenciasAplicador();
		});

		function previasDe(vacunaId) {
			return registros.filter(
				(registro) => registro.usuarioId === usuario?.id && registro.vacunaId === vacunaId
			).length;
		}

		function etiquetaDosis(vacuna, previas) {
			return previas >= vacuna.dosisEsquema ? "Refuerzo" : `Dosis ${previas + 1} de ${vacuna.dosisEsquema}`;
		}

		function vacunaElegida() {
			return vacunas.find((vacuna) => vacuna.id === selectVacuna.value) ?? null;
		}

		function loteElegido() {
			const vacuna = vacunaElegida();
			return vacuna?.lotes.find((lote) => lote.codigo === selectLote.value) ?? null;
		}

		function renderSelectVacunas() {
			selectVacuna.innerHTML = `<option value="">Selecciona una vacuna</option>${vacunas
				.map(
					(vacuna) => `<option value="${esc(vacuna.id)}">${esc(vacuna.nombre)} · ${esc(vacuna.tipo)} · ${esc(vacuna.procedencia)}</option>`
				)
				.join("")}`;
		}

		function renderLotes() {
			const vacuna = vacunaElegida();
			if (!vacuna) {
				selectLote.innerHTML = `<option value="">Selecciona primero una vacuna</option>`;
				selectLote.disabled = true;
				return;
			}
			selectLote.innerHTML = `<option value="">Selecciona un lote</option>${vacuna.lotes
				.map(
					(lote) => `<option value="${esc(lote.codigo)}">${esc(lote.codigo)} · vence ${esc(fechaCorta(lote.vence))}</option>`
				)
				.join("")}`;
			selectLote.disabled = false;
		}

		function actualizarInfoVacuna() {
			const vacuna = vacunaElegida();
			if (!vacuna) {
				infoVacuna.textContent = "Selecciona una vacuna para ver su información.";
				if (avisoVacuna) {
					avisoVacuna.hidden = true;
					avisoVacuna.innerHTML = "";
				}
				return;
			}
			let texto = `${vacuna.tipo} · ${vacuna.procedencia} · ${vacuna.laboratorio}.`;
			if (usuario) {
				const previas = previasDe(vacuna.id);
				texto += ` Aplicaciones previas: ${previas || "Sin iniciar"}. Corresponde: ${etiquetaDosis(vacuna, previas)}.`;
			} else {
				texto += " Selecciona el usuario para calcular la dosis que corresponde.";
			}
			infoVacuna.textContent = texto;
			if (!avisoVacuna) {
				return;
			}
			if (usuario && !vacuna.cobertura.includes(usuario.region)) {
				avisoVacuna.hidden = false;
				avisoVacuna.innerHTML = htmlAlerta(
					"error",
					`<p class="font-medium text-sm">Vacuna no disponible</p><p class="mt-1 text-sm">${esc(vacuna.nombre)} no está disponible en la región ${esc(usuario.region)} del usuario seleccionado.</p>`
				);
			} else {
				avisoVacuna.hidden = true;
				avisoVacuna.innerHTML = "";
			}
		}

		function actualizarInfoLote() {
			const vacuna = vacunaElegida();
			const lote = loteElegido();
			if (!vacuna) {
				infoLote.textContent = "Selecciona primero una vacuna.";
				return;
			}
			if (!lote) {
				infoLote.textContent = "Selecciona un lote.";
				return;
			}
			let texto = `Fecha de vencimiento: ${fechaCorta(lote.vence)}.`;
			if (fecha.value && lote.vence < fecha.value) {
				texto += " El lote está vencido para la fecha indicada.";
			}
			infoLote.textContent = texto;
		}

		function seleccionarUsuario(nuevo) {
			usuario = nuevo;
			buscador.value = `${nuevo.nombre} · ${nuevo.cedula}`;
			sugerencias.hidden = true;
			sugerencias.innerHTML = "";
			seleccionado.hidden = false;
			const previa = medidaPrevia(nuevo.id);
			if (campoPeso) {
				campoPeso.disabled = false;
				campoPeso.value = previa?.peso ?? "";
			}
			if (campoAltura) {
				campoAltura.disabled = false;
				campoAltura.value = previa?.altura ?? "";
			}
			seleccionado.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/20">
				<div class="flex items-center gap-3">
					<span class="flex size-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">${esc(iniciales(nuevo.nombre))}</span>
					<div>
						<p class="font-medium">${esc(nuevo.nombre)}</p>
						<p class="text-base-content/60 text-sm">${esc(nuevo.cedula)} · ${calcularEdad(nuevo.nacimiento)} años · ${esc(nuevo.region)} · ${esc(nuevo.centro)}</p>
					</div>
				</div>
				<button type="button" class="btn btn-ghost btn-sm text-primary" data-quitar-usuario>Cambiar usuario</button>
			</div>`;
			$("[data-quitar-usuario]", seleccionado).addEventListener("click", limpiarSeleccionUsuario);
			limpiarUsuario.hidden = false;
			limpiarAlerta(alerta);
			actualizarInfoVacuna();
			actualizarCalculoDosis();
			actualizarResumen();
		}

		function limpiarSeleccionUsuario() {
			usuario = null;
			buscador.value = "";
			seleccionado.hidden = true;
			seleccionado.innerHTML = "";
			limpiarUsuario.hidden = true;
			sugerencias.hidden = true;
			if (campoPeso) {
				campoPeso.value = "";
				campoPeso.disabled = true;
			}
			if (campoAltura) {
				campoAltura.value = "";
				campoAltura.disabled = true;
			}
			actualizarInfoVacuna();
			actualizarCalculoDosis();
			actualizarResumen();
			buscador.focus();
		}

		buscador.addEventListener("input", () => {
			const consulta = normalizar(buscador.value);
			if (consulta.length < 2) {
				sugerencias.innerHTML = "";
				sugerencias.hidden = true;
				return;
			}
			const coincidencias = buscarPorNombreOCedula(usuarios, buscador.value);
			sugerencias.innerHTML = coincidencias.length
				? coincidencias
						.map(
							(item) => `<button type="button" class="block w-full rounded-lg px-3 py-2 text-left hover:bg-base-200" data-elegir-usuario="${esc(item.id)}">
								<span class="block font-medium text-sm">${esc(item.nombre)}</span>
								<span class="block text-base-content/55 text-xs">${esc(item.cedula)} · ${calcularEdad(item.nacimiento)} años · ${esc(item.region)}</span>
							</button>`
						)
						.join("")
				: `<p class="px-3 py-2 text-base-content/55 text-sm">No se encontraron usuarios en este centro.</p>`;
			sugerencias.hidden = false;
		});

		sugerencias.addEventListener("click", (evento) => {
			const boton = evento.target.closest("[data-elegir-usuario]");
			if (!boton) {
				return;
			}
			const encontrado = usuarios.find((item) => item.id === boton.dataset.elegirUsuario);
			if (encontrado) {
				seleccionarUsuario(encontrado);
			}
		});

		limpiarUsuario.addEventListener("click", limpiarSeleccionUsuario);

		selectVacuna.addEventListener("change", () => {
			renderLotes();
			actualizarInfoVacuna();
			actualizarInfoLote();
			actualizarResumen();
		});

		selectLote.addEventListener("change", () => {
			actualizarInfoLote();
			actualizarResumen();
		});

		campoCantidad?.addEventListener("input", () => {
			actualizarCalculoDosis();
			actualizarResumen();
		});
		campoPeso?.addEventListener("input", actualizarCalculoDosis);
		campoAltura?.addEventListener("input", actualizarCalculoDosis);

		function actualizarResumen() {
			const vacuna = vacunaElegida();
			const lote = loteElegido();
			const dosis = vacuna && usuario ? etiquetaDosis(vacuna, previasDe(vacuna.id)) : "—";
			const base = campoCantidad?.value.trim() ?? "";
			const aplicada = calcularCantidadAplicada(Number(base), Number(campoPeso?.value), Number(campoAltura?.value));
			resumen.innerHTML = `<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
				<div><p class="text-base-content/55 text-xs">Usuario</p><p class="font-medium text-sm">${usuario ? esc(usuario.nombre) : "Sin seleccionar"}</p></div>
				<div><p class="text-base-content/55 text-xs">Vacuna</p><p class="font-medium text-sm">${vacuna ? esc(vacuna.nombre) : "Sin seleccionar"}</p></div>
				<div><p class="text-base-content/55 text-xs">Lote</p><p class="font-medium text-sm">${lote ? esc(lote.codigo) : "Sin seleccionar"}</p></div>
				<div><p class="text-base-content/55 text-xs">Cantidad a aplicar</p><p class="font-medium text-sm">${aplicada == null ? (base ? "Falta peso y altura" : "Sin indicar") : `${aplicada.toFixed(2)} ml`}</p>${base ? `<p class="text-base-content/55 text-xs">Base: ${esc(base)} ml</p>` : ""}</div>
				<div><p class="text-base-content/55 text-xs">Dosis · Fecha</p><p class="font-medium text-sm">${esc(dosis)} · ${esc(fechaCorta(fecha.value))}</p></div>
			</div>`;
		}

		fecha.addEventListener("change", () => {
			actualizarInfoLote();
			actualizarResumen();
		});

		function limpiarSeleccion() {
			selectVacuna.value = "";
			renderLotes();
			actualizarInfoVacuna();
			actualizarInfoLote();
			atencion.value = "";
			if (campoCantidad) {
				campoCantidad.value = "";
			}
			actualizarCalculoDosis();
			actualizarResumen();
		}

		$("[data-limpiar-seleccion]", contenedor)?.addEventListener("click", limpiarSeleccion);
		$("[data-cancelar-seleccion]", contenedor)?.addEventListener("click", () => {
			limpiarSeleccion();
			limpiarAlerta(alerta);
		});

		formulario.addEventListener("submit", (evento) => {
			evento.preventDefault();
			limpiarAlerta(alerta);
			if (exito) {
				exito.hidden = true;
				exito.innerHTML = "";
			}
			const aplicadorNombre = aplicador.value.trim();
			const peso = campoPeso?.value.trim() ?? "";
			const altura = campoAltura?.value.trim() ?? "";
			const cantidadBase = campoCantidad?.value.trim() ?? "";
			const cantidadAplicada = actualizarCalculoDosis();
			const errores = [];
			if (!usuario) {
				errores.push("Debes seleccionar un usuario.");
			}
			if (!cantidadBase) {
				errores.push("Debes indicar la cantidad de referencia en mililitros.");
			} else if (!Number.isFinite(Number(cantidadBase)) || Number(cantidadBase) <= 0 || Number(cantidadBase) > 100) {
				errores.push("La cantidad de referencia debe ser un número mayor que 0 y menor o igual a 100 ml.");
			}
			if (!peso) {
				errores.push("El peso es obligatorio para calcular la cantidad a aplicar.");
			} else if (!Number.isFinite(Number(peso)) || Number(peso) <= 0 || Number(peso) > 500) {
				errores.push("El peso debe ser un número mayor que 0 y menor o igual a 500 kg.");
			}
			if (!altura) {
				errores.push("La altura es obligatoria para calcular la cantidad a aplicar.");
			} else if (!Number.isFinite(Number(altura)) || Number(altura) <= 0 || Number(altura) > 300) {
				errores.push("La altura debe ser un número mayor que 0 y menor o igual a 300 cm.");
			}
			if (cantidadAplicada != null && cantidadAplicada > 100) {
				errores.push("La cantidad calculada supera los 100 ml. Revisa el peso, la altura y la cantidad de referencia.");
			}
			const vacuna = vacunaElegida();
			const lote = loteElegido();
			if (!vacuna) {
				errores.push("Debes seleccionar una vacuna.");
			}
			if (!lote) {
				errores.push("Debes seleccionar el lote de la vacuna.");
			}
			if (!aplicadorNombre) {
				errores.push("Debes escribir el nombre del médico o enfermero que aplica.");
			} else if (
				personal.length &&
				!personal.some((item) => normalizar(item.nombre) === normalizar(aplicadorNombre))
			) {
				errores.push("Selecciona un aplicador de la lista de personal del centro.");
			}
			if (!atencion.value.trim()) {
				errores.push("La atención prestada es obligatoria.");
			}
			if (!fecha.value) {
				errores.push("La fecha de aplicación es obligatoria.");
			} else if (fecha.value > hoyISO()) {
				errores.push("La fecha de aplicación no puede ser futura.");
			}
			if (vacuna && lote) {
				if (lote.vence < fecha.value) {
					errores.push(`El lote ${lote.codigo} de ${vacuna.nombre} está vencido para la fecha indicada.`);
				}
				if (usuario && !vacuna.cobertura.includes(usuario.region)) {
					errores.push(`${vacuna.nombre} no está disponible en la región ${usuario.region}.`);
				}
			}
			if (errores.length) {
				mostrarAlerta(
					alerta,
					"error",
					`No se pudo guardar la vacunación:<ul class="mt-2 list-disc pl-5">${errores
						.map((error) => `<li>${esc(error)}</li>`)
						.join("")}</ul>`
				);
				return;
			}

			const cargo = cargoDeAplicador(aplicadorNombre);
			const nuevas = [
				{
					id: `r-${Date.now()}`,
					fecha: fecha.value,
					anio: fecha.value.slice(0, 4),
					vacunaId: vacuna.id,
					vacuna: vacuna.nombre,
					tipo: vacuna.tipo,
					procedencia: vacuna.procedencia,
					lote: lote.codigo,
					cantidad: cantidadAplicada,
					peso: Number(peso),
					altura: Number(altura),
					dosis: etiquetaDosis(vacuna, previasDe(vacuna.id)),
					usuarioId: usuario.id,
					usuario: usuario.nombre,
					cedula: usuario.cedula,
					edad: calcularEdad(usuario.nacimiento),
					telefono: usuario.telefono,
					centroId: centro.id,
					centro: centro.nombre,
					centroDireccion: centro.direccion,
					centroTelefono: centro.telefono,
					municipio: centro.municipio,
					estado: centro.estado,
					region: usuario.region,
					loteVence: lote.vence,
					aplicador: aplicadorNombre,
					cargo,
					atencion: atencion.value.trim()
				}
			];
			modificarSesion((actual) => {
				actual.registrosNuevos = actual.registrosNuevos ?? [];
				actual.registrosNuevos.push(...nuevas);
			});
			nuevas.forEach((registro) => registros.push(registro));

			if (exito) {
				exito.hidden = false;
				exito.innerHTML = htmlAlerta(
					"success",
					`<p class="font-semibold">Vacunación registrada correctamente.</p><ul class="mt-2 list-disc pl-5">${nuevas
						.map((registro) => `<li>${esc(registro.vacuna)} · ${esc(registro.dosis)} · ${esc(registro.cantidad)} ml · ${esc(registro.peso)} kg · ${esc(registro.altura)} cm · lote ${esc(registro.lote)}</li>`)
						.join("")}</ul><p class="mt-2 text-sm">Usuario: ${esc(usuario.nombre)} · ${esc(usuario.cedula)} · ${esc(fechaCorta(fecha.value))}</p>`
				);
				exito.scrollIntoView({ behavior: "smooth", block: "nearest" });
			}
			limpiarSeleccion();
		});

		renderSelectVacunas();
		renderLotes();
		actualizarInfoVacuna();
		actualizarInfoLote();
		actualizarCalculoDosis();
		actualizarResumen();
	}

	Object.assign(window.Pro2, {
		iniciarRegistroUsuario,
		iniciarVacunacion
	});
})();
