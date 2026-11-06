/*
	Componentes compartidos de perfil, esquema de vacunación y certificados.
*/
(function () {
	"use strict";

	const { esc, hoyISO, sumarDias, sumarMeses, calcularEdad, fechaCorta, fechaLarga, iniciales, VACUNAS_OBLIGATORIAS, leerCertificados } = window.Pro2;

	function esquemaUsuario(usuario, registros, vacunas) {
		const hoy = hoyISO();
		return vacunas
			.filter(
				(vacuna) =>
					vacuna.cobertura.includes(usuario.region) ||
					registros.some(
						(registro) => registro.usuarioId === usuario.id && registro.vacunaId === vacuna.id
					)
			)
			.map((vacuna) => {
				const aplicaciones = registros
					.filter(
						(registro) => registro.usuarioId === usuario.id && registro.vacunaId === vacuna.id
					)
					.sort((a, b) => a.fecha.localeCompare(b.fecha));
				const aplicadas = aplicaciones.length;
				const faltan = Math.max(0, vacuna.dosisEsquema - aplicadas);
				let estado = "Sin iniciar";
				if (aplicadas > 0) {
					estado = faltan === 0 ? "Completa" : "En curso";
				}
				let proxima = "";
				let refuerzoPendiente = false;
				const ultima = aplicaciones[aplicaciones.length - 1];
				if (faltan > 0 && ultima) {
					proxima = `Próxima dosis estimada: ${fechaCorta(sumarDias(ultima.fecha, 30))}`;
				} else if (faltan > 0 && !ultima) {
					proxima = "Sin dosis aplicadas";
				} else if (faltan === 0 && ultima && vacuna.refuerzoMeses > 0) {
					const fechaRefuerzo = sumarMeses(ultima.fecha, vacuna.refuerzoMeses);
					if (fechaRefuerzo <= hoy) {
						refuerzoPendiente = true;
						proxima = `Refuerzo pendiente desde ${fechaCorta(fechaRefuerzo)}`;
					} else {
						proxima = `Refuerzo estimado: ${fechaCorta(fechaRefuerzo)}`;
					}
				}
				return { vacuna, aplicaciones, aplicadas, faltan, estado, proxima, refuerzoPendiente };
			});
	}

	function vacunasObligatoriasFaltantes(usuario, registros) {
		return VACUNAS_OBLIGATORIAS.map((obligatoria) => {
			const aplicadas = registros.filter(
				(registro) =>
					registro.usuarioId === usuario.id && registro.vacunaId === obligatoria.id
			).length;
			return {
				...obligatoria,
				aplicadas,
				faltan: Math.max(0, obligatoria.dosis - aplicadas)
			};
		}).filter((item) => item.faltan > 0);
	}

	function ultimaMedidaRegistrada(registros, usuarioId) {
		return (
			(registros ?? [])
				.filter((registro) => registro.usuarioId === usuarioId && (registro.peso || registro.altura))
				.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))[0] ?? null
		);
	}

	function htmlFichaUsuario(usuario, registros = []) {
		const edad = calcularEdad(usuario.nacimiento);
		const medida = ultimaMedidaRegistrada(registros, usuario.id);
		const registradoPor = usuario.registradoPor || usuario.enfermero || "";
		const registradoPorCedula = usuario.registradoPorCedula || usuario.enfermeroCedula || "";
		const contactoCentro = [];
		if (usuario.centroDireccion) {
			contactoCentro.push(["Dirección del centro", usuario.centroDireccion]);
		}
		if (usuario.centroTelefono) {
			contactoCentro.push(["Teléfono del centro", usuario.centroTelefono]);
		}
		const campos = [
			["Cédula", usuario.cedula],
			["Fecha de nacimiento", fechaLarga(usuario.nacimiento)],
			["Edad", `${edad} años`],
			["Sexo", usuario.sexo],
			["Región", usuario.region],
			["Ubicación", `${usuario.municipio}, ${usuario.estado}`],
			["Teléfono", usuario.telefono || "—"],
			["Correo", usuario.correo || "—"],
			["Centro de registro", usuario.centro],
			...contactoCentro,
			["Registrado por", registradoPor || "—"],
			["Cédula del registrador", registradoPorCedula || "—"],
			["Tipo de sangre", usuario.sangre || "No registrado"],
			["Peso", medida?.peso ? `${medida.peso} kg` : "No registrado"],
			["Altura", medida?.altura ? `${medida.altura} cm` : "No registrado"],
			["Dirección", usuario.direccion || "—"],
			["Alergias", usuario.alergias || "Ninguna"]
		];
		return `<article class="min-w-0 rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-300/50 sm:p-6">
			<div class="flex items-start gap-4">
				<span class="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-lg text-primary">${esc(iniciales(usuario.nombre))}</span>
				<div class="min-w-0">
					<h2 class="font-semibold text-xl tracking-tight">${esc(usuario.nombre)}</h2>
					<p class="text-base-content/60 text-sm">${esc(usuario.cedula)} · ${edad} años · ${esc(usuario.sexo)}</p>
					<div class="mt-2 flex flex-wrap gap-1">
						<span class="badge badge-primary badge-sm">${esc(usuario.region)}</span>
						<span class="badge badge-ghost badge-sm">${esc(usuario.municipio)}, ${esc(usuario.estado)}</span>
					</div>
				</div>
			</div>
			<dl class="mt-5 grid gap-x-6 gap-y-3 border-base-300 border-t pt-5 sm:grid-cols-2">
				${campos
					.map(
						([etiqueta, valor]) => `<div>
							<dt class="text-base-content/55 text-xs">${esc(etiqueta)}</dt>
							<dd class="font-medium text-sm">${esc(valor)}</dd>
						</div>`
					)
					.join("")}
			</dl>
		</article>`;
	}

	function htmlResumenEsquema(usuario, esquema, registros) {
		const totalDosis = esquema.reduce((total, item) => total + item.aplicadas, 0);
		const tipos = esquema.filter((item) => item.aplicadas > 0).length;
		return `<article class="min-w-0 rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-300/50 sm:p-6">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 class="font-semibold text-lg tracking-tight">Esquema de vacunación</h2>
					<p class="text-base-content/60 text-sm">${totalDosis} dosis registradas · ${tipos} tipo${tipos === 1 ? "" : "s"} de vacuna aplicado${tipos === 1 ? "" : "s"}</p>
				</div>
			</div>
			<div class="mt-4 flex flex-col gap-2">
				${esquema
					.map((item) => {
						const clase =
							item.estado === "Completa"
								? "badge-success"
								: item.estado === "En curso"
									? "badge-warning"
									: "badge-ghost";
						return `<div class="rounded-xl border border-base-300 p-3">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="min-w-0">
									<p class="font-medium text-sm">${esc(item.vacuna.nombre)}</p>
									<p class="text-base-content/55 text-xs">${esc(item.vacuna.tipo)} · ${esc(item.aplicadas)} de ${item.vacuna.dosisEsquema} dosis</p>
								</div>
								<span class="badge ${clase} badge-sm">${esc(item.estado)}</span>
							</div>
							${item.faltan > 0 ? `<p class="mt-1 text-base-content/60 text-xs">Faltan ${item.faltan} dosis del esquema.</p>` : ""}
							${item.proxima ? `<p class="mt-1 text-base-content/60 text-xs">${esc(item.proxima)}</p>` : ""}
						</div>`;
					})
					.join("")}
			</div>
			<h3 class="mt-5 font-semibold text-sm">Aplicaciones registradas</h3>
			<div class="mt-2 overflow-x-auto">
				<table class="table table-sm">
					<thead><tr><th>Fecha</th><th>Vacuna</th><th>Dosis</th><th>Cantidad</th><th>Lote / vencimiento</th><th>Aplicador</th></tr></thead>
					<tbody>
						${
							registros.length
								? registros
										.slice()
										.sort((a, b) => b.fecha.localeCompare(a.fecha))
										.map(
											(registro) => `<tr>
												<td class="whitespace-nowrap text-xs">${esc(fechaCorta(registro.fecha))}</td>
												<td><span class="block text-sm">${esc(registro.vacuna)}</span><span class="text-base-content/55 text-xs">${esc(registro.atencion)}</span></td>
												<td class="text-xs">${esc(registro.dosis)}</td>
												<td class="whitespace-nowrap text-xs">${registro.cantidad ? `${esc(registro.cantidad)} ml` : "—"}</td>
												<td><span class="block font-mono text-xs">${esc(registro.lote)}</span>${registro.loteVence ? `<span class="block text-base-content/55 text-xs">Vence ${esc(fechaCorta(registro.loteVence))}</span>` : ""}</td>
												<td><span class="block text-xs">${esc(registro.aplicador)}</span><span class="text-base-content/55 text-xs">${esc(registro.cargo)}</span><span class="block text-base-content/55 text-xs">${esc(registro.centro)}</span></td>
											</tr>`
										)
										.join("")
								: `<tr><td colspan="6" class="text-base-content/55 text-sm">Sin aplicaciones registradas.</td></tr>`
						}
					</tbody>
				</table>
			</div>
		</article>`;
	}

	function datoCertificado(etiqueta, valor) {
		return `<div><dt class="text-base-content/55 text-xs">${esc(etiqueta)}</dt><dd class="font-medium text-sm">${esc(valor || "—")}</dd></div>`;
	}

	function htmlCertificado(certificado) {
		const usuario = certificado.usuario ?? {};
		const examenes = certificado.examenes ?? [];
		const documentos = certificado.documentacion ?? certificado.archivos ?? [];
		const dosis = certificado.dosisRespaldo ?? certificado.dosis ?? [];
		const valido = certificado.estado !== "Vencido";
		const edad = calcularEdad(usuario.nacimiento);
		const centroNombre = certificado.centro || usuario.centro || "";
		const centroUbicacion = [certificado.centroMunicipio, certificado.centroEstado].filter(Boolean).join(", ");
		const centroDireccion = certificado.centroDireccion || "";
		return `<article class="documento-certificado mx-auto w-full max-w-3xl rounded-2xl border border-base-300 bg-white p-6 text-base-content shadow-sm sm:p-8">
			<header class="flex flex-col gap-4 border-base-300 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
				<div class="flex items-center gap-3">
					<span class="flex size-12 items-center justify-center rounded-box bg-primary text-primary-content"><span class="icono icono-certificate size-6" aria-hidden="true"></span></span>
					<div>
						<p class="font-semibold text-lg">Certificado médico</p>
						<p class="text-base-content/60 text-sm">Salud Vacunas · Red nacional de vacunación</p>
						<p class="mt-1 text-base-content/60 text-xs">Centro emisor: ${esc(centroNombre || "—")}</p>
					</div>
				</div>
				<div class="text-left sm:text-right">
					<p class="font-mono font-semibold text-sm">${esc(certificado.codigo)}</p>
					<p class="text-base-content/60 text-xs">Emitido: ${esc(fechaCorta(certificado.emision))}</p>
					<p class="text-base-content/60 text-xs">Vigencia: ${esc(fechaCorta(certificado.vigencia))}</p>
					<span class="badge ${valido ? "badge-success" : "badge-error"} badge-sm mt-1">${esc(certificado.estado)}</span>
				</div>
			</header>

			<section class="mt-5">
				<h3 class="font-semibold text-base-content/60 text-xs uppercase tracking-wide">Datos del usuario</h3>
				<dl class="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
					${datoCertificado("Nombre completo", usuario.nombre)}
					${datoCertificado("Cédula", usuario.cedula)}
					${datoCertificado("Fecha de nacimiento", fechaLarga(usuario.nacimiento))}
					${datoCertificado("Edad", `${edad} años`)}
					${datoCertificado("Sexo", usuario.sexo)}
					${datoCertificado("Teléfono", usuario.telefono)}
					${datoCertificado("Correo", usuario.correo)}
					${datoCertificado("Región", usuario.region)}
					${datoCertificado("Ubicación", [usuario.municipio, usuario.estado].filter(Boolean).join(", "))}
					${datoCertificado("Dirección", usuario.direccion)}
					${datoCertificado("Tipo de sangre", usuario.sangre)}
					${datoCertificado("Alergias", usuario.alergias)}
				</dl>
			</section>

			<section class="mt-5">
				<h3 class="font-semibold text-base-content/60 text-xs uppercase tracking-wide">Datos del certificado y del centro emisor</h3>
				<dl class="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
					${datoCertificado("Fecha de emisión", fechaCorta(certificado.emision))}
					${datoCertificado("Vigencia", fechaCorta(certificado.vigencia))}
					${datoCertificado("Estado del certificado", certificado.estado)}
					${datoCertificado("Centro de salud", centroNombre)}
					${datoCertificado("Ubicación del centro", centroUbicacion)}
					${datoCertificado("Dirección del centro", centroDireccion)}
					${datoCertificado("Teléfono del centro", certificado.centroTelefono)}
					${datoCertificado("Fecha del examen", fechaCorta(certificado.examenFecha))}
					${datoCertificado("Bioanalista", certificado.bioanalista)}
					${datoCertificado("Médico evaluador", certificado.medico)}
					${datoCertificado("Emisor", certificado.emisor)}
				</dl>
			</section>

			<section class="mt-5">
				<h3 class="font-semibold text-base-content/60 text-xs uppercase tracking-wide">Tipos de exámenes realizados</h3>
				<div class="mt-2 overflow-x-auto">
					<table class="table table-sm">
						<thead><tr><th>Tipo / fecha</th><th>Descripción</th><th>Resultado</th><th>Unidad</th><th>Referencia</th></tr></thead>
						<tbody>
							${
								examenes.length
									? examenes
											.map(
												(examen) => `<tr>
													<td><span class="block text-sm">${esc(examen.tipo)}</span>${examen.fecha || examen.centro || examen.bioanalista ? `<span class="block text-base-content/55 text-xs">${[examen.fecha ? fechaCorta(examen.fecha) : "", examen.centro, examen.bioanalista].filter(Boolean).map(esc).join(" · ")}</span>` : ""}</td>
													<td class="text-sm">${esc(examen.descripcion)}</td>
													<td class="font-medium text-sm">${esc(examen.resultado)}</td>
													<td class="text-sm">${esc(examen.unidad)}</td>
													<td class="text-sm">${esc(examen.referencia)}</td>
												</tr>`
											)
											.join("")
									: `<tr><td colspan="5" class="text-base-content/55 text-sm">Sin exámenes registrados.</td></tr>`
							}
						</tbody>
					</table>
				</div>
			</section>

			<section class="mt-5">
				<h3 class="font-semibold text-base-content/60 text-xs uppercase tracking-wide">Documentación adjunta</h3>
				<div class="mt-2 overflow-x-auto">
					<table class="table table-sm">
						<thead><tr><th>Documento</th><th>Tipo</th><th>Tamaño</th><th>Estado</th></tr></thead>
						<tbody>
							${
								documentos.length
									? documentos
											.map(
												(documento) => `<tr>
													<td class="text-sm">${esc(documento.nombre)}</td>
													<td class="text-sm">${esc(documento.tipo || "Archivo")}</td>
													<td class="whitespace-nowrap text-sm">${documento.tamano ? `${Math.max(1, Math.round(documento.tamano / 1024))} KB` : "—"}</td>
													<td><span class="badge badge-success badge-sm">Adjunto</span></td>
												</tr>`
											)
											.join("")
									: `<tr><td colspan="4" class="text-base-content/55 text-sm">Sin documentación adjunta.</td></tr>`
							}
						</tbody>
					</table>
				</div>
			</section>

			<section class="mt-5">
				<h3 class="font-semibold text-base-content/60 text-xs uppercase tracking-wide">Vacunas que sustentan el certificado</h3>
				<div class="mt-2 overflow-x-auto">
					<table class="table table-sm">
						<thead><tr><th>Fecha</th><th>Vacuna</th><th>Dosis</th><th>Lote / vencimiento</th><th>Centro</th><th>Aplicador</th></tr></thead>
						<tbody>
							${
								dosis.length
									? dosis
											.slice()
											.sort((a, b) => String(b.fecha ?? "").localeCompare(String(a.fecha ?? "")))
											.map(
												(registro) => `<tr>
													<td class="whitespace-nowrap text-sm">${esc(fechaCorta(registro.fecha))}</td>
													<td class="text-sm">${esc(registro.vacuna)}</td>
													<td class="text-sm">${esc(registro.dosis)}</td>
													<td><span class="block font-mono text-xs">${esc(registro.lote)}</span>${registro.loteVence ? `<span class="block text-base-content/55 text-xs">Vence ${esc(fechaCorta(registro.loteVence))}</span>` : ""}</td>
													<td class="text-sm">${esc(registro.centro)}</td>
													<td><span class="block text-sm">${esc(registro.aplicador)}</span><span class="block text-base-content/55 text-xs">${esc(registro.cargo)}</span></td>
												</tr>`
											)
											.join("")
									: `<tr><td colspan="6" class="text-base-content/55 text-sm">Sin dosis de respaldo registradas.</td></tr>`
							}
						</tbody>
					</table>
				</div>
			</section>

			<section class="mt-5 grid gap-3 sm:grid-cols-2">
				<div class="rounded-xl bg-success/10 p-3">
					<p class="font-medium text-sm">Sello digital</p>
					<p class="text-base-content/60 text-xs">Verificación: ${esc(certificado.sello || "Válido")}</p>
				</div>
				<div class="rounded-xl bg-success/10 p-3">
					<p class="font-medium text-sm">Firma digital</p>
					<p class="text-base-content/60 text-xs">Verificación: ${esc(certificado.firma || "Válida")}</p>
				</div>
			</section>

			${certificado.observaciones ? `<section class="mt-5 rounded-xl bg-base-200/70 p-3"><p class="font-medium text-sm">Observaciones</p><p class="mt-1 text-base-content/70 text-sm">${esc(certificado.observaciones)}</p></section>` : ""}

			<footer class="mt-8 flex flex-col gap-4 border-base-300 border-t pt-5">
				<div class="grid gap-4 sm:grid-cols-3">
					<div>
						<p class="font-medium text-sm">${esc(certificado.bioanalista || "—")}</p>
						<p class="text-base-content/55 text-xs">Bioanalista</p>
					</div>
					<div>
						<p class="font-medium text-sm">${esc(certificado.medico || "—")}</p>
						<p class="text-base-content/55 text-xs">Médico evaluador</p>
					</div>
					<div class="sm:text-right">
						<p class="font-medium text-sm">${esc(certificado.emisor || "—")}</p>
						<p class="text-base-content/55 text-xs">Emisor · ${esc(certificado.codigo)}</p>
					</div>
				</div>
				<div class="flex flex-wrap items-center justify-between gap-2 border-base-300 border-t pt-3 text-base-content/55 text-xs">
					<span>Sello: ${esc(certificado.sello || "Válido")} · Firma: ${esc(certificado.firma || "Válida")}</span>
					<span class="font-mono">${esc(certificado.codigo)}</span>
				</div>
			</footer>
		</article>`;
	}

	function certificadoParaUsuario(usuario, registros) {
		const existente = leerCertificados().find(
			(certificado) => certificado.usuarioId === usuario.id && certificado.estado === "Vigente"
		);
		if (existente) {
			return existente;
		}
		const codigo = `CERT-${new Date().getFullYear()}-${String(900 + (registros.length % 99)).padStart(4, "0")}`;
		return {
			codigo,
			usuarioId: usuario.id,
			estado: "Vigente",
			emision: hoyISO(),
			vigencia: sumarMeses(hoyISO(), 12),
			examenFecha: hoyISO(),
			centroId: usuario.centroId ?? "",
			centro: usuario.centro,
			centroDireccion: usuario.centroDireccion ?? "",
			centroTelefono: usuario.centroTelefono ?? "",
			centroMunicipio: usuario.municipio ?? "",
			centroEstado: usuario.estado ?? "",
			centroTipo: "",
			bioanalista: "Pendiente de registro",
			medico: "Pendiente de registro",
			emisor: "Red nacional de vacunación",
			observaciones: "Vista previa generada a partir del cumplimiento de vacunas obligatorias.",
			sello: "Válido",
			firma: "Válida",
			examenes: [],
			documentacion: [],
			dosisRespaldo: registros.filter((registro) => registro.usuarioId === usuario.id),
			dosisPrincipal: null,
			usuario
		};
	}

	function htmlEstadoCertificado(usuario, registros) {
		const faltantes = vacunasObligatoriasFaltantes(usuario, registros);
		if (faltantes.length) {
			return `<section class="min-w-0 rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-300/50 sm:p-6">
				<div class="flex items-start gap-3">
					<span class="icono icono-alert-triangle mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true"></span>
					<div>
						<h2 class="font-semibold text-lg tracking-tight">Certificado médico pendiente</h2>
						<p class="mt-1 text-base-content/65 text-sm">El usuario todavía no cumple los requisitos de vacunas obligatorias.</p>
						<ul class="mt-3 list-disc pl-5 text-sm">
							${faltantes.map((item) => `<li>${esc(item.nombre)}: faltan ${item.faltan} dosis (${item.aplicadas} de ${item.dosis} aplicadas).</li>`).join("")}
						</ul>
					</div>
				</div>
			</section>`;
		}
		const certificado = certificadoParaUsuario(usuario, registros);
		return `<section class="min-w-0 rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-300/50 sm:p-6">
			<div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
				<div>
					<h2 class="font-semibold text-lg tracking-tight">Certificado médico</h2>
					<p class="text-base-content/60 text-sm">El usuario cumple los requisitos. Puedes imprimir el certificado.</p>
				</div>
				<button type="button" class="btn btn-primary btn-sm min-h-10 rounded-xl" data-imprimir-certificado>
					<span class="icono icono-printer size-4" aria-hidden="true"></span>
					Imprimir certificado
				</button>
			</div>
			<div class="mt-4">${htmlCertificado(certificado)}</div>
		</section>`;
	}

	Object.assign(window.Pro2, {
		esquemaUsuario,
		vacunasObligatoriasFaltantes,
		htmlFichaUsuario,
		htmlResumenEsquema,
		datoCertificado,
		htmlCertificado,
		certificadoParaUsuario,
		htmlEstadoCertificado
	});
})();
