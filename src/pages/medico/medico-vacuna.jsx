/*
	MedicoVacuna · Registro de vacunas aplicadas: formulario de carga
	(maqueta: no guarda datos).
*/
import { PACIENTES, VACUNAS } from '../../data/data-frontend.js';

export function MedicoVacuna() {
	return (
		<div className='flex flex-col gap-6'>
			<header>
				<h1 className='font-bold text-2xl'>
					Registro de vacunas aplicadas
				</h1>
				<p className='text-sm opacity-70'>
					Carga de datos sobre las vacunas aplicadas en la consulta.
				</p>
			</header>

			<form className='card bg-base-100 shadow-sm'>
				<div className='card-body grid gap-4 sm:grid-cols-2'>
					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='paciente'
						>
							Paciente
						</label>
						<select
							id='paciente'
							className='select w-full'
							defaultValue={PACIENTES[0]?.id ?? ''}
							required
						>
							{PACIENTES.map((paciente) => (
								<option
									key={paciente.id}
									value={paciente.id}
								>
									{paciente.nombre} — {paciente.cedula}
								</option>
							))}
						</select>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='vacuna'
						>
							Tipo de vacuna
						</label>
						<select
							id='vacuna'
							className='select w-full'
							defaultValue={VACUNAS[0]?.id ?? ''}
							required
						>
							{VACUNAS.map((vacuna) => (
								<option
									key={vacuna.id}
									value={vacuna.id}
								>
									{vacuna.nombre} — {vacuna.laboratorio}
								</option>
							))}
						</select>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='lote'
						>
							Lote
						</label>
						<input
							id='lote'
							type='text'
							className='input w-full'
							placeholder='PFZ-2026-01'
							required
						/>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='fecha'
						>
							Fecha de aplicación
						</label>
						<input
							id='fecha'
							type='date'
							className='input w-full'
							required
						/>
					</div>

					<div className='flex flex-col gap-1 sm:col-span-2'>
						<label
							className='label'
							htmlFor='atencion'
						>
							Atención prestada
						</label>
						<textarea
							id='atencion'
							className='textarea w-full'
							rows={3}
							placeholder='Ej: Primera dosis, paciente sin reacciones adversas.'
							required
						/>
					</div>

					<div className='sm:col-span-2'>
						<button
							type='button'
							className='btn btn-primary'
						>
							Guardar registro
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
