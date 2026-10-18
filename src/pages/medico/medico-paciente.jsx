/*
	MedicoPaciente · Registro de pacientes: formulario de cuenta y
	ficha (maqueta: no guarda datos).
*/
import { REGIONES } from '../../data/data-frontend.js';

export function MedicoPaciente() {
	return (
		<div className='flex flex-col gap-6'>
			<header>
				<h1 className='font-bold text-2xl'>Registro de pacientes</h1>
				<p className='text-sm opacity-70'>
					Creación de cuenta y ficha para las personas que llegan a
					atenderse a la clínica.
				</p>
			</header>

			<form className='card bg-base-100 shadow-sm'>
				<div className='card-body grid gap-4 sm:grid-cols-2'>
					<div className='flex flex-col gap-1 sm:col-span-2'>
						<label
							className='label'
							htmlFor='nombre'
						>
							Nombre completo
						</label>
						<input
							id='nombre'
							type='text'
							className='input w-full'
							placeholder='Ana Torres'
							required
						/>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='cedula'
						>
							Cédula
						</label>
						<input
							id='cedula'
							type='text'
							className='input w-full'
							placeholder='V-00000000'
							required
						/>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='fechaNacimiento'
						>
							Fecha de nacimiento
						</label>
						<input
							id='fechaNacimiento'
							type='date'
							className='input w-full'
							required
						/>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='sexo'
						>
							Sexo
						</label>
						<select
							id='sexo'
							className='select w-full'
							defaultValue='Femenino'
						>
							<option>Femenino</option>
							<option>Masculino</option>
							<option>Otro</option>
						</select>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='telefono'
						>
							Teléfono
						</label>
						<input
							id='telefono'
							type='tel'
							className='input w-full'
							placeholder='0414-0000000'
						/>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='email'
						>
							Correo electrónico
						</label>
						<input
							id='email'
							type='email'
							className='input w-full'
							placeholder='correo@ejemplo.com'
						/>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='region'
						>
							Región
						</label>
						<select
							id='region'
							className='select w-full'
							defaultValue={REGIONES[0]}
						>
							{REGIONES.map((region) => (
								<option key={region}>{region}</option>
							))}
						</select>
					</div>

					<div className='flex flex-col gap-1 sm:col-span-2'>
						<label
							className='label'
							htmlFor='direccion'
						>
							Dirección
						</label>
						<input
							id='direccion'
							type='text'
							className='input w-full'
							placeholder='Av. Libertador, Caracas'
						/>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='tipoSangre'
						>
							Tipo de sangre
						</label>
						<input
							id='tipoSangre'
							type='text'
							className='input w-full'
							placeholder='O+'
						/>
					</div>

					<div className='flex flex-col gap-1'>
						<label
							className='label'
							htmlFor='alergias'
						>
							Alergias
						</label>
						<input
							id='alergias'
							type='text'
							className='input w-full'
							placeholder='Ninguna'
						/>
					</div>

					<div className='sm:col-span-2'>
						<button
							type='button'
							className='btn btn-primary'
						>
							Guardar paciente
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
