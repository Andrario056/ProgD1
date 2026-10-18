/*
	FILTRO DE REGISTROS DE VACUNACIÓN · mockup admin/vacunas.html
	-------------------------------------------------------------
	Qué hace: oculta o muestra las filas de la tabla #tabla-registros
	según el texto buscado y el tipo de vacuna seleccionado, y
	actualiza el contador (agregando las personas distintas con la
	vacuna cuando hay una vacuna filtrada).
	Piezas clave:
	- Cada <tr> lleva data-vacuna="Nombre" y data-paciente="Nombre"
	  para filtrar por vacuna y contar personas distintas.
	- El texto se busca solo en vacuna, paciente y cédula, igual que
	  en la app React (src/pages/admin/admin-vacunas.jsx).
	- Normalizar() quita mayúsculas y tildes para comparar textos.
	En la app React este mismo filtro se resuelve con estado (.filter).
*/

// Elementos de la interfaz que participan en el filtro
const Busqueda = document.getElementById('busqueda');
const FiltroVacuna = document.getElementById('filtro-vacuna');
const Contador = document.getElementById('contador');
const SinResultados = document.getElementById('sin-resultados');

// Filas filtrables de la tabla (solo las que tienen data-vacuna)
const Filas = Array.from(
	document.querySelectorAll('#tabla-registros tbody tr[data-vacuna]')
);

// Pasa un texto a minúsculas y sin tildes para comparar sin distinción
function Normalizar(texto) {
	return texto
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

// Recorre las filas y oculta las que no cumplen el texto y/o la vacuna;
// al final actualiza el contador (con el conteo de personas distintas
// de la vacuna filtrada) y el aviso de "sin resultados"
function Filtrar() {
	const Texto = Normalizar(Busqueda.value.trim());
	const Vacuna = FiltroVacuna.value;
	let Visibles = 0;

	for (const Fila of Filas) {
		const Buscable = Normalizar(
			`${Fila.cells[0].textContent} ${Fila.cells[1].textContent} ` +
				Fila.cells[2].textContent
		);
		const CoincideTexto = Texto === '' || Buscable.includes(Texto);
		const CoincideVacuna = Vacuna === '' || Fila.dataset.vacuna === Vacuna;
		const Mostrar = CoincideTexto && CoincideVacuna;

		Fila.hidden = !Mostrar;

		if (Mostrar) {
			Visibles += 1;
		}
	}

	let TextoContador = `Mostrando ${Visibles} de ${Filas.length} registros`;

	if (Vacuna !== '') {
		const Personas = new Set(
			Filas.filter((Fila) => Fila.dataset.vacuna === Vacuna).map(
				(Fila) => Fila.dataset.paciente
			)
		);
		const Sujeto =
			Personas.size === 1 ? 'persona registrada' : 'personas registradas';

		TextoContador += ` · ${Personas.size} ${Sujeto} con ${Vacuna}`;
	}

	Contador.textContent = TextoContador;
	SinResultados.hidden = Visibles !== 0;
}

// Se vuelve a filtrar al escribir en el buscador o al cambiar la vacuna
Busqueda.addEventListener('input', Filtrar);
FiltroVacuna.addEventListener('change', Filtrar);

// Ejecuta el filtro al cargar la página para dejar el contador correcto
Filtrar();
