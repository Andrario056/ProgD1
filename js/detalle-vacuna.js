/*
	SELECTOR DE VACUNA · mockup admin/vacunas.html
	----------------------------------------------
	Qué hace: muestra la ficha (alertas, próximo llamado y
	disponibilidad regional) de la vacuna elegida en el
	<select id="vacuna"> y oculta las demás.
	Cada ficha es un contenedor con data-detalle-vacuna="Nombre" que
	coincide con el value de la opción del selector.
	En la app React esta selección se resuelve con estado (useState en
	src/pages/admin/admin-vacunas.jsx).
*/

// Selector de vacuna y fichas de cada vacuna
const Selector = document.getElementById('vacuna');
const Fichas = Array.from(document.querySelectorAll('[data-detalle-vacuna]'));

// Muestra solo la ficha cuya vacuna coincide con la opción elegida
function MostrarFicha() {
	for (const Ficha of Fichas) {
		Ficha.hidden = Ficha.dataset.detalleVacuna !== Selector.value;
	}
}

// Cambia la ficha al elegir otra vacuna y la deja lista al cargar
Selector.addEventListener('change', MostrarFicha);
MostrarFicha();
