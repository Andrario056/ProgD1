/*
	Vistas públicas y navegación: login de boceto, salida, verificación y recuperación.
*/
(function () {
	"use strict";

	const { $, $$, esc, normalizar, cedulaDigitos, mostrarAlerta, limpiarAlerta, htmlAlerta, correoValido, fechaCorta, datoCertificado, htmlCertificado, leerCertificados, iniciarTema } = window.Pro2;

	function iniciarLogin() {
		const formulario = $("[data-form-login]");
		if (!formulario) {
			return;
		}
		const alerta = $("[data-login-alerta]");

		formulario.addEventListener("submit", (evento) => {
			evento.preventDefault();
			limpiarAlerta(alerta);
			const datos = new FormData(formulario);
			const usuario = String(datos.get("usuario") ?? "").trim();
			const clave = String(datos.get("clave") ?? "").trim();

			if (!usuario || !clave) {
				mostrarAlerta(alerta, "error", "Debes escribir el usuario y la contraseña.");
				return;
			}

			mostrarAlerta(
				alerta,
				"info",
				"El inicio de sesión se habilitará cuando se configuren los usuarios reales. Mientras tanto, usa los accesos a las vistas de cada perfil."
			);
		});
	}

	function crearBotonTema() {
		const boton = document.createElement("button");
		boton.type = "button";
		boton.dataset.tema = "";
		boton.setAttribute("aria-label", "Cambiar a modo oscuro");
		boton.setAttribute("title", "Cambiar a modo oscuro");
		boton.setAttribute("aria-pressed", "false");
		boton.className =
			"inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-medium text-base-content/70 text-sm transition hover:bg-base-200 hover:text-base-content";
		boton.innerHTML = `
			<span data-tema-icono="luna" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/></svg>
			</span>
			<span data-tema-icono="sol" hidden aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/></svg>
			</span>
			<span class="hidden sm:inline" data-tema-texto>Modo oscuro</span>`;
		return boton;
	}

	function insertarBotonTema() {
		$$("[data-salir]").forEach((salir) => {
			const contenedor = salir.parentElement;
			if (!contenedor || $("[data-tema]", contenedor)) {
				return;
			}
			contenedor.insertBefore(crearBotonTema(), salir);
		});
		if (document.querySelector("[data-tema]")) {
			return;
		}
		const flotante = crearBotonTema();
		flotante.classList.add(
			"fixed",
			"right-4",
			"top-4",
			"z-30",
			"bg-base-100/90",
			"shadow-sm",
			"ring-1",
			"ring-base-300/50",
			"backdrop-blur"
		);
		const texto = $("[data-tema-texto]", flotante);
		if (texto) {
			texto.classList.remove("sm:inline");
			texto.classList.add("hidden");
		}
		document.body.append(flotante);
	}

	function iniciarNavegacion() {
		const inicio = document.documentElement.dataset.inicio ?? "index.html";
		insertarBotonTema();
		iniciarTema();
		$$("[data-salir]").forEach((boton) => {
			boton.addEventListener("click", () => {
				window.location.href = inicio;
			});
		});
	}

	function iniciarVerificar() {
		const formulario = $("[data-form-verificar]");
		if (!formulario) {
			return;
		}
		const campo = $("[data-verificar-busqueda]") ?? $("[data-verificar-codigo]");
		const alerta = $("[data-verificar-alerta]");
		const resultado = $("[data-verificar-resultado]");
		const limpiar = $("[data-verificar-limpiar]");
		const filtrosContenedor = $("[data-verificar-filtros]");
		const descripcion = $("[data-verificar-descripcion]");
		const filtroEstado = $("[data-verificar-estado]");
		const filtroCentro = $("[data-verificar-centro]");
		const filtroDesde = $("[data-verificar-desde]");
		const filtroHasta = $("[data-verificar-hasta]");
		const certificados = leerCertificados();

		if (!campo || !resultado) {
			return;
		}

		if (filtroCentro) {
			const centros = [...new Set(certificados.map((certificado) => certificado.centro).filter(Boolean))].sort((a, b) =>
				a.localeCompare(b, "es", { sensitivity: "base" })
			);
			filtroCentro.innerHTML = `<option value="">Todos los centros</option>${centros
				.map((centro) => `<option value="${esc(centro)}">${esc(centro)}</option>`)
				.join("")}`;
		}

		function tarjeta(certificado) {
			const usuario = certificado.usuario ?? {};
			const vigente = certificado.estado !== "Vencido";
			const examenes = certificado.examenes ?? [];
			const documentos = certificado.documentacion ?? [];
			const centroUbicacion = [certificado.centroMunicipio, certificado.centroEstado].filter(Boolean).join(", ");
			return `<div class="flex flex-col gap-5">
				<div class="rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-300/50">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="flex items-start gap-3">
							<span class="icono ${vigente ? "icono-circle-check text-success" : "icono-circle-x text-error"} mt-0.5 size-7 shrink-0" aria-hidden="true"></span>
							<div>
								<h2 class="font-semibold text-lg">${vigente ? "Certificado válido y vigente" : "Certificado vencido"}</h2>
								<p class="text-base-content/60 text-sm">${esc(certificado.codigo)} · ${esc(usuario.nombre || "Sin usuario")} · ${esc(usuario.cedula || "—")}</p>
							</div>
						</div>
						<span class="badge ${vigente ? "badge-success" : "badge-error"} badge-sm">${esc(certificado.estado)}</span>
					</div>
					<dl class="mt-4 grid gap-x-6 gap-y-2 border-base-300 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
						${datoCertificado("Emisión", fechaCorta(certificado.emision))}
						${datoCertificado("Vigencia", fechaCorta(certificado.vigencia))}
						${datoCertificado("Centro emisor", certificado.centro)}
						${datoCertificado("Ubicación del centro", centroUbicacion)}
						${datoCertificado("Fecha del examen", fechaCorta(certificado.examenFecha))}
						${datoCertificado("Exámenes", `${examenes.length} ${examenes.length === 1 ? "registrado" : "registrados"}`)}
						${datoCertificado("Documentación", `${documentos.length} ${documentos.length === 1 ? "archivo" : "archivos"}`)}
						${datoCertificado("Sello digital", certificado.sello || "Válido")}
						${datoCertificado("Firma digital", certificado.firma || "Válida")}
						${datoCertificado("Bioanalista", certificado.bioanalista)}
						${datoCertificado("Médico evaluador", certificado.medico)}
						${datoCertificado("Emisor", certificado.emisor)}
					</dl>
				</div>
				${htmlCertificado(certificado)}
			</div>`;
		}

		formulario.addEventListener("submit", (evento) => {
			evento.preventDefault();
			limpiarAlerta(alerta);
			resultado.innerHTML = "";
			const busqueda = campo.value.trim();
			const estado = filtroEstado?.value ?? "";
			const centro = filtroCentro?.value ?? "";
			const desde = filtroDesde?.value ?? "";
			const hasta = filtroHasta?.value ?? "";
			if (!busqueda && !estado && !centro && !desde && !hasta) {
				mostrarAlerta(alerta, "error", "Escribe una cédula o un código de certificado, o selecciona un filtro.");
				return;
			}

			const texto = normalizar(busqueda);
			const digitos = cedulaDigitos(busqueda);
			const encontrados = certificados
				.filter((certificado) => {
					const usuario = certificado.usuario ?? {};
					if (busqueda) {
						const coincide =
							String(certificado.codigo ?? "")
								.toLowerCase()
								.includes(busqueda.toLowerCase()) ||
							normalizar(usuario.nombre).includes(texto) ||
							(digitos.length > 0 && cedulaDigitos(usuario.cedula).includes(digitos)) ||
							normalizar(certificado.centro).includes(texto) ||
							normalizar(certificado.bioanalista).includes(texto) ||
							normalizar(certificado.medico).includes(texto) ||
							(certificado.examenes ?? []).some(
								(examen) =>
									normalizar(examen.tipo).includes(texto) ||
									normalizar(examen.descripcion).includes(texto) ||
									normalizar(examen.resultado).includes(texto)
							);
						if (!coincide) {
							return false;
						}
					}
					if (estado && certificado.estado !== estado) {
						return false;
					}
					if (centro && certificado.centro !== centro) {
						return false;
					}
					if (desde && certificado.emision < desde) {
						return false;
					}
					if (hasta && certificado.emision > hasta) {
						return false;
					}
					return true;
				})
				.sort((a, b) => String(b.emision).localeCompare(String(a.emision)));

			if (!encontrados.length) {
				mostrarAlerta(
					alerta,
					"warning",
					`No se encontraron certificados${busqueda ? ` para <strong>${esc(busqueda)}</strong>` : ""} con los filtros seleccionados.`
				);
				return;
			}

			resultado.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-2">
					<p class="font-medium">${encontrados.length} certificado${encontrados.length === 1 ? "" : "s"} encontrado${encontrados.length === 1 ? "" : "s"}</p>
					<button type="button" class="btn btn-outline btn-sm min-h-10 rounded-xl print:hidden" data-imprimir-verificacion>
						<span class="icono icono-printer size-4" aria-hidden="true"></span>
						Imprimir
					</button>
				</div>
				${encontrados.map(tarjeta).join("")}`;
			$("[data-imprimir-verificacion]", resultado)?.addEventListener("click", () => window.print());
			if (limpiar) {
				limpiar.hidden = false;
			}
		});

		limpiar?.addEventListener("click", () => {
			formulario.reset();
			campo.value = "";
			resultado.innerHTML = "";
			limpiarAlerta(alerta);
			limpiar.hidden = true;
			campo.focus();
		});

		const parametros = new URLSearchParams(window.location.search);
		const codigoInicial = parametros.get("codigo");
		const busquedaInicial = codigoInicial ?? parametros.get("cedula");
		if (codigoInicial && filtrosContenedor) {
			filtrosContenedor.hidden = true;
			if (descripcion) {
				descripcion.textContent = "Consulta el detalle y la validez del certificado seleccionado.";
			}
		}
		if (busquedaInicial) {
			campo.value = busquedaInicial;
			formulario.requestSubmit();
		}
	}

	/* ------------------------------------------------------------------ */
	/* Recuperar contraseña                                                */
	/* ------------------------------------------------------------------ */

	function iniciarRecuperar() {
		const formulario = $("[data-form-recuperar]");
		if (!formulario) {
			return;
		}
		const alerta = $("[data-recuperar-alerta]");
		const exito = $("[data-recuperar-exito]");

		formulario.addEventListener("submit", (evento) => {
			evento.preventDefault();
			limpiarAlerta(alerta);
			if (exito) {
				exito.hidden = true;
				exito.innerHTML = "";
			}
			const datos = new FormData(formulario);
			const usuario = String(datos.get("usuario") ?? "").trim();
			const correo = String(datos.get("correo") ?? "").trim();
			if (!usuario || !correo) {
				mostrarAlerta(alerta, "error", "Escribe tu nombre de usuario y tu correo electrónico.");
				return;
			}
			if (!correoValido(correo)) {
				mostrarAlerta(alerta, "error", "El correo electrónico no tiene un formato válido.");
				return;
			}
			if (exito) {
				exito.hidden = false;
				exito.innerHTML = `<div class="flex flex-col gap-4">
					${htmlAlerta(
						"info",
						"<p class=\"font-semibold\">Recuperación pendiente de configuración.</p><p class=\"mt-1\">Los usuarios de login se agregarán posteriormente. Este formulario es solo un boceto visual.</p>"
					)}
					<a href="index.html" class="btn btn-primary min-h-11 rounded-xl font-medium text-base">Volver al inicio de sesión</a>
				</div>`;
			}
		});
	}

	Object.assign(window.Pro2, {
		iniciarLogin,
		iniciarNavegacion,
		iniciarVerificar,
		iniciarRecuperar
	});
})();
