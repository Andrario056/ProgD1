/*
	PREPARAR RECURSOS LOCALES (vendor/)
	-----------------------------------
	Qué hace: copia a vendor/ los archivos que necesitan las páginas
	HTML de esta carpeta para funcionar sin CDN ni internet:
	- Inter Variable (tipografía) ... desde @fontsource-variable/inter
	- Tabler Icons (webfont) ....... desde @tabler/icons-webfont
	- daisyUI 5 (componentes) ...... desde daisyui
	- Tailwind CSS v4 (navegador) .. desde @tailwindcss/browser
	Cómo se usa:
	- Automáticamente después de `pnpm install` (script postinstall).
	- A mano con `pnpm preparar` (por ejemplo si borraste vendor/).
*/
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Carpeta raíz de Pro2 (este script vive en Pro2/scripts/)
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// Origen dentro de node_modules -> destino dentro de vendor/
const RECURSOS = [
	{
		origen: 'node_modules/@fontsource-variable/inter/index.css',
		destino: 'vendor/inter/index.css'
	},
	{
		origen: 'node_modules/@fontsource-variable/inter/files',
		destino: 'vendor/inter/files'
	},
	{
		origen: 'node_modules/@tabler/icons-webfont/dist/tabler-icons.min.css',
		destino: 'vendor/tabler/tabler-icons.min.css'
	},
	{
		origen: 'node_modules/@tabler/icons-webfont/dist/fonts',
		destino: 'vendor/tabler/fonts'
	},
	{
		origen: 'node_modules/daisyui/daisyui.css',
		destino: 'vendor/daisyui/daisyui.css'
	},
	{
		origen: 'node_modules/@tailwindcss/browser/dist/index.global.js',
		destino: 'vendor/tailwind/index.global.js'
	}
];

function Preparar() {
	for (const Recurso of RECURSOS) {
		const Origen = join(RAIZ, Recurso.origen);
		const Destino = join(RAIZ, Recurso.destino);

		if (!existsSync(Origen)) {
			throw new Error(
				`No se encontró ${Recurso.origen}. ` +
					'Ejecuta "pnpm install" en esta carpeta primero.'
			);
		}

		mkdirSync(dirname(Destino), {
			recursive: true
		});
		cpSync(Origen, Destino, {
			recursive: true
		});
	}

	console.log(`Recursos copiados a vendor/ (${RECURSOS.length} elementos).`);
}

// Se regenera vendor/ completo para no arrastrar archivos viejos
if (existsSync(join(RAIZ, 'vendor'))) {
	rmSync(join(RAIZ, 'vendor'), {
		recursive: true,
		force: true
	});
}

Preparar();
