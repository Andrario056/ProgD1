/*
	Núcleo compartido: constantes, utilidades, sesión y alertas.
*/
(function () {
	"use strict";

	window.Pro2 = window.Pro2 || {};

	const CLAVE_SESION = "pro2-sesion";
	const PREFIJO_NOMBRE = "pro2-sesion:";
	const CLAVE_TEMA = "pro2-tema";
	const TEMA_CLARO = "salud";
	const TEMA_OSCURO = "saluddark";
	const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
	const VACUNAS_OBLIGATORIAS = [
		{ id: "v-covid", nombre: "COVID-19", dosis: 2 },
		{ id: "v-fiebre", nombre: "Fiebre amarilla", dosis: 1 }
	];

	/* ------------------------------------------------------------------ */
	/* Tema claro / oscuro                                                 */
	/* ------------------------------------------------------------------ */

	function temaGuardado() {
		try {
			return localStorage.getItem(CLAVE_TEMA) === "oscuro" ? TEMA_OSCURO : TEMA_CLARO;
		} catch (error) {
			return TEMA_CLARO;
		}
	}

	document.documentElement.dataset.theme = temaGuardado();

	function temaEsOscuro() {
		return document.documentElement.dataset.theme === TEMA_OSCURO;
	}

	function actualizarBotonesTema() {
		const oscuro = temaEsOscuro();
		const etiqueta = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
		$$("[data-tema]").forEach((boton) => {
			boton.setAttribute("aria-label", etiqueta);
			boton.setAttribute("title", etiqueta);
			boton.setAttribute("aria-pressed", String(oscuro));
			const luna = $('[data-tema-icono="luna"]', boton);
			const sol = $('[data-tema-icono="sol"]', boton);
			if (luna) {
				luna.hidden = oscuro;
			}
			if (sol) {
				sol.hidden = !oscuro;
			}
			const texto = $("[data-tema-texto]", boton);
			if (texto) {
				texto.textContent = oscuro ? "Modo claro" : "Modo oscuro";
			}
		});
	}

	function alternarTema() {
		const oscuro = temaEsOscuro();
		document.documentElement.dataset.theme = oscuro ? TEMA_CLARO : TEMA_OSCURO;
		try {
			localStorage.setItem(CLAVE_TEMA, oscuro ? "claro" : "oscuro");
		} catch (error) {
			/* localStorage puede estar bloqueado en file:// */
		}
		actualizarBotonesTema();
	}

	function iniciarTema() {
		$$("[data-tema]").forEach((boton) => {
			if (boton.dataset.temaListo === "1") {
				return;
			}
			boton.dataset.temaListo = "1";
			boton.addEventListener("click", alternarTema);
		});
		actualizarBotonesTema();
	}

	/* ------------------------------------------------------------------ */
	/* Utilidades                                                          */
	/* ------------------------------------------------------------------ */

	const $ = (selector, raiz = document) => raiz.querySelector(selector);
	const $$ = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));

	function esc(valor) {
		return String(valor ?? "")
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}

	function normalizar(valor) {
		return String(valor ?? "")
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.trim();
	}

	function soloDigitos(valor) {
		return String(valor ?? "").replace(/\D/g, "");
	}

	function cedulaDigitos(valor) {
		return soloDigitos(valor);
	}

	function coincideCedula(cedula, consulta) {
		const digitos = cedulaDigitos(consulta);
		return digitos.length > 0 && cedulaDigitos(cedula).includes(digitos);
	}

	function buscarPorNombreOCedula(lista, consulta, limite = 6) {
		const texto = normalizar(consulta);
		if (texto.length < 2) {
			return [];
		}
		return lista
			.filter(
				(item) =>
					normalizar(item.nombre).includes(texto) ||
					coincideCedula(item.cedula, consulta)
			)
			.slice(0, limite);
	}

	function cedulaValida(valor) {
		const texto = String(valor ?? "").trim();
		if (!/^[VEJP]?[-\s]?\d{6,9}$/i.test(texto)) {
			return false;
		}
		const digitos = cedulaDigitos(texto);
		return digitos.length >= 6 && digitos.length <= 9;
	}

	function formatearCedula(valor) {
		const texto = String(valor ?? "").trim();
		const digitos = cedulaDigitos(texto);
		if (!digitos) {
			return "";
		}
		const prefijo = /^E/i.test(texto) ? "E" : "V";
		return `${prefijo}-${digitos}`;
	}

	function hoyISO() {
		const fecha = new Date();
		return isoDe(fecha);
	}

	function isoDe(fecha) {
		return [
			fecha.getFullYear(),
			String(fecha.getMonth() + 1).padStart(2, "0"),
			String(fecha.getDate()).padStart(2, "0")
		].join("-");
	}

	function sumarDias(iso, dias) {
		const [anio, mes, dia] = String(iso).split("-").map(Number);
		const fecha = new Date(anio, mes - 1, dia + dias);
		return isoDe(fecha);
	}

	function sumarMeses(iso, meses) {
		const [anio, mes, dia] = String(iso).split("-").map(Number);
		const fecha = new Date(anio, mes - 1 + meses, dia);
		return isoDe(fecha);
	}

	function calcularEdad(nacimiento) {
		if (!nacimiento) {
			return "";
		}
		const [anio, mes, dia] = nacimiento.split("-").map(Number);
		const hoy = new Date();
		let edad = hoy.getFullYear() - anio;
		const aunNoCumple =
			hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia);
		if (aunNoCumple) {
			edad -= 1;
		}
		return Math.max(0, edad);
	}

	function fechaCorta(iso) {
		if (!iso) {
			return "—";
		}
		const [anio, mes, dia] = String(iso).split("-");
		return `${Number(dia)} ${MESES[Number(mes) - 1] ?? ""} ${anio}`;
	}

	function fechaLarga(iso) {
		if (!iso) {
			return "—";
		}
		const [anio, mes, dia] = String(iso).split("-");
		return `${Number(dia)} de ${MESES[Number(mes) - 1] ?? ""} de ${anio}`;
	}

	function iniciales(nombre) {
		return String(nombre ?? "")
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((parte) => parte.charAt(0).toUpperCase())
			.join("");
	}

	function correoValido(valor) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(valor ?? "").trim());
	}

	function telefonoValido(valor) {
		const digitos = soloDigitos(valor);
		return digitos.length >= 7 && digitos.length <= 15;
	}

	function ordenarPorTexto(a, b) {
		return String(a).localeCompare(String(b), "es", { sensitivity: "base" });
	}

	/* ------------------------------------------------------------------ */
	/* Sesión                                                              */
	/* ------------------------------------------------------------------ */

	function leerSesion() {
		try {
			const bruto = sessionStorage.getItem(CLAVE_SESION);
			if (bruto) {
				return JSON.parse(bruto);
			}
		} catch (error) {
			/* sessionStorage puede estar bloqueado en file:// */
		}
		if (window.name && window.name.startsWith(PREFIJO_NOMBRE)) {
			try {
				return JSON.parse(window.name.slice(PREFIJO_NOMBRE.length));
			} catch (error) {
				return null;
			}
		}
		return null;
	}

	function guardarSesion(sesion) {
		const bruto = JSON.stringify(sesion);
		try {
			sessionStorage.setItem(CLAVE_SESION, bruto);
		} catch (error) {
			/* se usa window.name como respaldo */
		}
		window.name = PREFIJO_NOMBRE + bruto;
	}

	function cerrarSesion() {
		try {
			sessionStorage.removeItem(CLAVE_SESION);
		} catch (error) {
			/* sin acción */
		}
		window.name = "";
	}

	function modificarSesion(cambio) {
		const sesion = leerSesion() ?? {};
		cambio(sesion);
		guardarSesion(sesion);
		return sesion;
	}

	/* ------------------------------------------------------------------ */
	/* Alertas                                                             */
	/* ------------------------------------------------------------------ */

	function htmlAlerta(tipo, contenido) {
		const iconos = {
			success: "circle-check",
			error: "circle-x",
			warning: "alert-triangle",
			info: "info-circle"
		};
		return `<div role="alert" class="alert alert-${tipo} items-start rounded-xl text-sm"><span class="icono icono-${iconos[tipo] ?? "info-circle"} mt-0.5 size-5 shrink-0" aria-hidden="true"></span><div class="min-w-0">${contenido}</div></div>`;
	}

	function mostrarAlerta(contenedor, tipo, contenido) {
		if (!contenedor) {
			return;
		}
		contenedor.innerHTML = htmlAlerta(tipo, contenido);
		contenedor.hidden = false;
	}

	function limpiarAlerta(contenedor) {
		if (!contenedor) {
			return;
		}
		contenedor.innerHTML = "";
		contenedor.hidden = true;
	}

	Object.assign(window.Pro2, {
		CLAVE_SESION,
		PREFIJO_NOMBRE,
		CLAVE_TEMA,
		TEMA_CLARO,
		TEMA_OSCURO,
		MESES,
		VACUNAS_OBLIGATORIAS,
		$,
		$$,
		esc,
		normalizar,
		soloDigitos,
		cedulaDigitos,
		coincideCedula,
		buscarPorNombreOCedula,
		cedulaValida,
		formatearCedula,
		hoyISO,
		isoDe,
		sumarDias,
		sumarMeses,
		calcularEdad,
		fechaCorta,
		fechaLarga,
		iniciales,
		correoValido,
		telefonoValido,
		ordenarPorTexto,
		leerSesion,
		guardarSesion,
		cerrarSesion,
		modificarSesion,
		htmlAlerta,
		mostrarAlerta,
		limpiarAlerta,
		iniciarTema,
		alternarTema,
		actualizarBotonesTema
	});
})();
