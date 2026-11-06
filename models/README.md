# Carpeta `models/`

Capa de acceso a datos del sistema **Salud Vacunas**. Cada archivo representa una
tabla y concentra las consultas SQL de crear, leer, actualizar y eliminar
registros. Las rutas y los controladores no escriben SQL: llaman a estas
funciones y reciben promesas.

## Archivos

| Archivo | Tabla | Contenido |
| --- | --- | --- |
| `conexion.js` | — | Pool de MySQL, consultas, transacciones y cierre. |
| `utiles.js` | — | Helpers internos de SQL, mapeo y validación. |
| `centros.js` | `centros` | Centros, subregiones y dependencias. |
| `personas.js` | `personas` | Usuarios/personas y búsqueda por cédula. |
| `vacunas.js` | `vacunas` | Catálogo de vacunas y lotes. |
| `dosis.js` | `dosis` | Aplicaciones, historial, estadísticas y resúmenes. |
| `certificadosSalud.js` | `certificados_salud` | Certificados, verificación y vencimiento. |
| `examenes.js` | `examenes` | Exámenes de cada certificado. |
| `index.js` | — | Exporta todos los modelos. |
| `esquema.mysql.sql` | — | Esquema MySQL 8 equivalente a `esquema.sql`. |

## Instalación

```bash
npm install mysql2
```

El pool se configura con variables de entorno:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=salud_vacunas
DB_POOL_LIMIT=10
```

Si no se definen, se usan los valores anteriores. El esquema de referencia está
en `models/esquema.mysql.sql`; ejecútalo una vez en la base de datos antes de
usar los modelos.

## Uso básico

```js
const { personas, conexion } = require('./models');

personas
	.obtenerPorCedula('V-12345678')
	.then((persona) => {
		if (!persona) {
			return res.status(404).json({ error: 'Persona no encontrada' });
		}
		res.json(persona);
	})
	.catch((error) => {
		res.status(500).json({ error: error.message });
	});
```

También se puede usar `async/await`:

```js
const { vacunas } = require('./models');

async function listarVacunas(req, res) {
	try {
		const datos = await vacunas.listar({ obligatoria: true });
		res.json(datos);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}
```

## Ejemplo con Express

```js
const express = require('express');
const { personas } = require('./models');

const router = express.Router();

router.get('/personas/:cedula', (req, res) => {
	personas
		.obtenerPorCedula(req.params.cedula)
		.then((persona) => {
			if (!persona) {
				return res.status(404).json({ error: 'Persona no encontrada' });
			}
			return res.json(persona);
		})
		.catch((error) => res.status(500).json({ error: error.message }));
});

router.post('/personas', (req, res) => {
	personas
		.crear(req.body)
		.then((persona) => res.status(201).json(persona))
		.catch((error) => res.status(400).json({ error: error.message }));
});

module.exports = router;
```

## Funciones principales

### `centros`

- `listar(filtros)`, `contar(filtros)`
- `obtenerPorId(id)`, `obtenerPorNombre(nombre)`
- `listarSubregiones()`
- `crear(datos)`, `actualizar(id, datos)`, `eliminar(id)`
- `contarDependencias(id)`

### `personas`

- `listar(filtros)`, `contar(filtros)`
- `obtenerPorId(id)`, `obtenerPorCedula(cedula)`, `buscar(texto, opciones)`
- `listarPorCentro(centroId)`, `contarPorCentro(centroId)`
- `crear(datos)`, `actualizar(id, datos)`
- `eliminar(id)`

El peso y la altura no pertenecen a `personas`: se guardan en cada fila de `dosis`.

### `vacunas`

- `listar(filtros)`, `contar(filtros)`
- `obtenerPorId(id)`, `obtenerPorNombre(nombre)`
- `listarLotes(id)`
- `crear(datos)`, `actualizar(id, datos)`
- `agregarLote(id, lote)`, `quitarLote(id, codigo)`
- `eliminar(id)`

### `dosis`

- `listar(filtros)`, `contar(filtros)`
- `obtenerPorId(id)`, `listarPorPersona(personaId)`
- `ultimaDosis(personaId, vacunaId)`, `resumenPorPersona(personaId)`
- `crear(datos)`, `actualizar(id, datos)`, `eliminar(id)`
- `crear(datos)` exige `peso`, `altura` y `cantidad`; las medidas quedan en la dosis.
- `estadisticas(filtros)`, `listarAplicadores(centroId)`, `listarLotes(filtros)`

### `certificadosSalud`

- `listar(filtros)`, `contar(filtros)`
- `obtenerPorId(id)`, `obtenerPorCodigo(codigo)`
- `listarPorPersona(personaId, filtros)`
- `crear(datos)`, `crearConExamenes(datos, examenes)`
- `actualizar(id, datos)`, `actualizarEstado(id, estado)`
- `marcarVencidos(fecha)`
- `obtenerCompleto(id)`, `verificarPorCodigo(codigo)`
- `eliminar(id)`

### `examenes`

- `listar(filtros)`, `contar(filtros)`
- `obtenerPorId(id)`, `listarPorCertificado(certificadoId)`
- `crear(datos)`, `crearMuchos(certificadoId, examenes, centroId)`
- `actualizar(id, datos)`, `eliminar(id)`, `eliminarPorCertificado(certificadoId)`

## Transacciones

Las operaciones que afectan varias tablas usan `conexion.transaccion()`. El
caso más importante es `certificadosSalud.crearConExamenes()`: crea el
certificado y todos sus exámenes en una sola transacción. Si falla cualquier
inserción, no queda ningún registro a medias.

```js
const { certificadosSalud } = require('./models');

certificadosSalud
	.crearConExamenes(datosCertificado, [
		{
			tipo: 'Hematología',
			descripcion: 'Hemograma completo',
			resultado: 'Normal',
			unidad: '—',
			referencia: '—'
		}
	])
	.then((certificado) => console.log(certificado))
	.catch((error) => console.error(error));
```

## Convenciones

- La API de los modelos usa **camelCase**: `primerNombre`, `centroId`,
  `loteVence`. Internamente se mapea a las columnas snake_case de MySQL.
- Todas las consultas usan parámetros (`?`); no se concatenan valores del
  usuario. Los `ORDER BY` y `LIMIT` se resuelven con listas blancas y números
  validados.
- Los campos `JSON` (`lotes`, `documentacion`) se aceptan como arreglos/objetos
  de JavaScript y se serializan automáticamente.
- Las fechas se devuelven como texto `YYYY-MM-DD` (`dateStrings: true`).
- Los errores de clave duplicada se traducen a un error con
  `codigo: 'DUPLICADO'`.
- Los modelos no contienen lógica HTTP ni vistas; tampoco reemplazan las
  validaciones del formulario. Se encargan de la persistencia y de las
  restricciones básicas de integridad.

## Notas sobre MySQL

- El esquema original `esquema.sql` es de PostgreSQL. `models/esquema.mysql.sql`
  es su adaptación a MySQL 8.
- `certificados_salud.examen_id` permite `NULL` para resolver la relación
  circular con `examenes.certificado_id`. El modelo crea el certificado,
  inserta los exámenes y después asigna el examen principal.
- `TEXT[]` y `JSONB` se reemplazan por `JSON`.
- Para agregar una entidad nueva, crea su archivo en `models/`, reutiliza
  `conexion.js` y `utiles.js`, y expórtala en `models/index.js`.
