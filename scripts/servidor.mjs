/*
	SERVIDOR DE DESARROLLO LOCAL
	----------------------------
	Qué hace: sirve esta carpeta (Pro2) por HTTP para navegar los
	mockups con `pnpm servir` y abrir http://localhost:4173.
	Es solo desarrollo: no hay build ni producción. Sirve los
	archivos tal cual están y usa index.html en cada carpeta.
	Cómo se detiene: Ctrl+C en la terminal.
*/
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Carpeta raíz de Pro2 (este script vive en Pro2/scripts/)
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.env.PORT ?? 4173);

// Tipo de contenido por extensión de archivo
const TIPOS = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.ttf': 'font/ttf',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2'
};

const Servidor = createServer((Peticion, Respuesta) => {
	let Ruta = '/';

	try {
		Ruta = decodeURIComponent(
			new URL(Peticion.url ?? '/', 'http://localhost').pathname
		);
	} catch {
		Respuesta.writeHead(400, {
			'Content-Type': 'text/plain; charset=utf-8'
		});
		Respuesta.end('Solicitud inválida');
		return;
	}

	// Evita salir de la carpeta del proyecto con ".." en la ruta
	const Absoluta = normalize(join(RAIZ, Ruta));

	if (Absoluta !== RAIZ && !Absoluta.startsWith(RAIZ + sep)) {
		Respuesta.writeHead(403, {
			'Content-Type': 'text/plain; charset=utf-8'
		});
		Respuesta.end('Prohibido');
		return;
	}

	// Una carpeta sirve su index.html (ej: /admin -> /admin/index.html)
	const Archivo =
		existsSync(Absoluta) && statSync(Absoluta).isDirectory()
			? join(Absoluta, 'index.html')
			: Absoluta;

	if (!existsSync(Archivo) || !statSync(Archivo).isFile()) {
		Respuesta.writeHead(404, {
			'Content-Type': 'text/plain; charset=utf-8'
		});
		Respuesta.end(`No encontrado: ${Ruta}`);
		return;
	}

	Respuesta.writeHead(200, {
		'Content-Type':
			TIPOS[extname(Archivo).toLowerCase()] ?? 'application/octet-stream'
	});
	createReadStream(Archivo).pipe(Respuesta);
});

Servidor.listen(PUERTO, () => {
	console.log(`Mockups disponibles en http://localhost:${PUERTO}`);
	console.log('Detén el servidor con Ctrl+C.');
});
