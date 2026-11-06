/*
	Consulta de perfil dentro de una sub-región o de toda la red.
*/
(function () {
	"use strict";

	const { $, esc, cedulaValida, cedulaDigitos, formatearCedula, mostrarAlerta, limpiarAlerta, leerUsuarios, leerRegistros, leerVacunas, esquemaUsuario, htmlFichaUsuario, htmlResumenEsquema, htmlEstadoCertificado } = window.Pro2;

	function iniciarConsulta() {
		const contenedor = $("[data-consulta-perfil]");
		if (!contenedor) {
			return;
		}
		const formulario = $("[data-form-consulta]", contenedor);
		const campo = $("[data-consulta-cedula]", contenedor);
		const alerta = $("[data-consulta-alerta]", contenedor);
		const resultados = $("[data-consulta-resultados]", contenedor);
		const limpiar = $("[data-consulta-limpiar]", contenedor);
		const alcance = contenedor.dataset.alcance === "red" ? "la red" : "la sub-región";
		const usuarios = leerUsuarios();
		const registros = leerRegistros();
		const vacunas = leerVacunas();

		function limpiarConsulta() {
			campo.value = "";
			resultados.innerHTML = "";
			limpiarAlerta(alerta);
			if (limpiar) {
				limpiar.hidden = true;
			}
			campo.focus();
		}

		formulario.addEventListener("submit", (evento) => {
			evento.preventDefault();
			const valor = campo.value.trim();
			if (!valor) {
				mostrarAlerta(alerta, "error", "Escribe la cédula del usuario.");
				return;
			}
			if (!cedulaValida(valor)) {
				mostrarAlerta(alerta, "warning", "La cédula no tiene un formato válido. Un ejemplo válido es V-10234567.");
				return;
			}
			const digitos = cedulaDigitos(valor);
			const usuario = usuarios.find((item) => cedulaDigitos(item.cedula) === digitos);
			if (!usuario) {
				mostrarAlerta(
					alerta,
					"warning",
					`No se encontró un usuario con la cédula ${esc(formatearCedula(valor))} dentro de ${alcance}.`
				);
				resultados.innerHTML = "";
				limpiar.hidden = false;
				return;
			}

			limpiarAlerta(alerta);
			limpiar.hidden = false;
			const delUsuario = registros.filter((registro) => registro.usuarioId === usuario.id);
			const esquema = esquemaUsuario(usuario, registros, vacunas);
			resultados.innerHTML = `<div class="grid gap-5 xl:grid-cols-2">
				${htmlFichaUsuario(usuario, registros)}
				${htmlResumenEsquema(usuario, esquema, delUsuario)}
			</div>
			${htmlEstadoCertificado(usuario, registros)}`;
			$("[data-imprimir-certificado]", resultados)?.addEventListener("click", () => {
				window.print();
			});
		});

		limpiar?.addEventListener("click", limpiarConsulta);
	}

	Object.assign(window.Pro2, {
		iniciarConsulta
	});
})();
