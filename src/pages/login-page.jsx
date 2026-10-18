/*
	LoginPage · Inicio de sesión (maqueta: no valida credenciales).
	Incluye accesos rápidos de demostración para cada rol.
*/
import { IconVaccine } from '@tabler/icons-react';
import { ROLES, RUTA_POR_ROL } from '../data/data-frontend.js';

// Roles con acceso rápido (demo)
const ACCESO = [
	'admin',
	'medico',
	'paciente'
];

export function LoginPage() {
	return (
		<main className='flex min-h-svh items-center justify-center bg-base-200 p-4'>
			<div className='w-full max-w-md'>
				<div className='mb-6 flex flex-col items-center gap-2 text-center'>
					<IconVaccine
						size={44}
						className='text-primary'
					/>
					<h1 className='font-bold text-2xl'>Centro de Vacunación</h1>
					<p className='text-sm opacity-70'>
						Sistema de gestión e inventario de vacunación
					</p>
				</div>

				<form className='card bg-base-100 shadow-sm'>
					<div className='card-body gap-4'>
						<h2 className='card-title text-lg'>Iniciar sesión</h2>

						<div className='flex flex-col gap-1'>
							<label
								className='label'
								htmlFor='usuario'
							>
								Usuario
							</label>
							<input
								id='usuario'
								type='text'
								className='input w-full'
								placeholder='Ingrese su usuario'
							/>
						</div>

						<div className='flex flex-col gap-1'>
							<label
								className='label'
								htmlFor='clave'
							>
								Contraseña
							</label>
							<input
								id='clave'
								type='password'
								className='input w-full'
								placeholder='Ingrese su contraseña'
							/>
						</div>

						<button
							type='submit'
							className='btn btn-primary mt-2'
						>
							Entrar
						</button>
					</div>
				</form>

				<div className='mt-6'>
					<p className='mb-2 text-center text-xs opacity-60'>
						Acceso rápido temporal
					</p>
					<div className='flex flex-wrap justify-center gap-2'>
						{ACCESO.map((rol) => (
							<a
								key={rol}
								href={RUTA_POR_ROL[rol]}
								className='btn btn-sm btn-outline'
							>
								{ROLES[rol]}
							</a>
						))}
					</div>
				</div>
			</div>
		</main>
	);
}
