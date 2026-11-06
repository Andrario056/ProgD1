# Pro2 · Salud Vacunas (HTML, CSS y JavaScript nativo)

Sistema de vacunación con tres perfiles de acceso, construido con páginas HTML
independientes, CSS y JavaScript sin frameworks de interfaz. Se abre directamente
desde `index.html`, sin servidor ni compilación previa.

## Cómo abrir

1. Abre `Pro2/index.html` en el navegador.
2. En **Vistas de los perfiles**, selecciona:
   - **Perfil 1 · Centro de salud**.
   - **Perfil 2 · Sub-región**.
   - **Perfil 3 · Master**.

También puedes abrir directamente las páginas de `centro/`, `subregion/` o
`master/`. En este boceto no hay usuarios de login configurados: el formulario
de acceso y la recuperación de contraseña son maquetas visuales. Los usuarios
de login de las regiones se agregarán posteriormente.

Los registros creados durante la navegación (usuarios, vacunaciones, centros y
certificados) se conservan en la misma pestaña al pasar de una vista a otra.

## Perfiles y vistas

- **Perfil 1 · Centro de salud** (`centro/`)
  - Registro de usuarios.
  - Registro de vacunación con selección de vacuna, lote y disponibilidad.
  - Los datos se limitan al centro de salud asignado.
- **Perfil 2 · Sub-región** (`subregion/`)
  - Historial de certificados médicos otorgados.
  - Registro de certificados médicos, con opción de registrar un usuario nuevo
    si todavía no existe y de agregar varios exámenes.
  - Verificación de certificados por cédula, nombre o código, con filtros por
    estado, centro y rango de fechas.
- **Perfil 3 · Master** (`master/`)
  - Historial de vacunaciones de toda la red nacional.
  - Historial de certificados médicos otorgados.
  - Gestión de centros de vacunación.
  - Consulta de perfil en toda la red.
  - Avisos a usuarios registrados.

En la esquina superior derecha de cada vista solo se muestra el perfil
correspondiente: **Perfil 1**, **Perfil 2** o **Perfil 3**.

## Páginas públicas

- `index.html`: inicio de sesión de boceto y acceso a las vistas.
- `recuperar-contrasena.html`: recuperación de contraseña de boceto.
- `verificar.html`: consulta pública de certificados por código o cédula. También es accesible desde el Perfil 2.

## Datos de demostración

Los registros, usuarios, vacunas, centros y certificados están escritos en
bloques ocultos dentro de cada página HTML mediante atributos `data-*`. Los
módulos de `src/js/` los leen para filtrar, calcular esquemas y validar
formularios. Los datos creados durante la sesión (usuarios, vacunaciones,
centros y certificados) se guardan en la sesión del navegador y no en archivos
`.js`.

## Documentación

- `documentacion-proyecto.pdf`: explicación de los datos `data-*`, la carpeta `src`, la estructura del proyecto y cómo modificar el código.
- `docs/documentacion.html`: fuente HTML del documento anterior.

## Estructura

- `index.html`: inicio de sesión y entrada principal.
- `recuperar-contrasena.html`: recuperación de contraseña.
- `verificar.html`: consulta pública de certificados.
- `centro/`, `subregion/`, `master/`: una página HTML por vista.
- `assets/css/estilos.css`: CSS compilado (Tailwind CSS + daisyUI).
- `assets/fuentes/`: tipografía Inter Variable de Fontsource.
- `src/css/estilos-fuente.css`: fuente del tema, iconos SVG incrustados y estilos globales.
- `src/js/`: módulos de comportamiento cargados como scripts clásicos para
  mantener la compatibilidad con `file://`.
  - `nucleo.js`: constantes, utilidades, sesión y alertas.
  - `datos.js`: lectura de los datos de demostración desde el HTML y la sesión.
  - `comun.js`: ficha de usuario, esquema de vacunación y certificados.
  - `publico.js`: login de boceto, navegación entre vistas, verificación y recuperación.
  - `historial.js`: historial, catálogo de vacunas y centros.
  - `consulta.js`: consulta de perfil.
  - `certificados.js`: gestión de certificados médicos.
  - `centro.js`: registro de usuarios y registro de vacunación.
  - `avisos.js`: avisos y preparación de correos.
  - `app.js`: arranque y despacho de la vista según `data-pagina`.

## Dependencias

- `tailwindcss` y `@tailwindcss/cli`
- `daisyui`
- `@fontsource-variable/inter`

## Desarrollo de estilos

El CSS ya está compilado. Si se modifica el tema o se añaden clases nuevas,
desde la carpeta `Pro2`:

```bash
npm install
npm run css
```

Para vigilar cambios:

```bash
npm run css:watch
```
