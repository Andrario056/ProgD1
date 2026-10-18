/*
	ConsultaPerfil
	--------------
	Página "Consultar perfil": muestra la ficha y el esquema de
	vacunación de cualquier paciente ingresando su cédula (solo
	números; "V-" es opcional). Se usa en las rutas /paciente/consulta
	y /medico/consulta, desde la barra lateral.
*/
import {
	IconAlertTriangle,
	IconCircleCheck,
	IconSearch
} from '@tabler/icons-react';
import { useState } from 'react';
import { FichaPaciente } from '../../components/ficha-paciente.jsx';
import { PACIENTES, REGISTROS, VACUNAS } from '../../data/data-frontend.js';

// Deja solo los números: "V-10234567", "v10234567" y "10234567" son iguales
function SoloDigitos(Valor) {
	return Valor.replace(/\D/g, '');
}

export function ConsultaPerfil() {
	const [Cedula, SetCedula] = useState('');
	const [Consulta, SetConsulta] = useState(null);

	function Buscar(evento) {
		evento.preventDefault();

		const Normalizada = SoloDigitos(Cedula);

		SetConsulta({
			cedula: Cedula.trim(),
			paciente:
				PACIENTES.find(
					(paciente) => SoloDigitos(paciente.cedula) === Normalizada
				) ?? null
		});
	}

	const Paciente = Consulta?.paciente ?? null;

	const Aplicaciones = Paciente
		? REGISTROS.filter(
				(registro) => registro.pacienteId === Paciente.id
			).sort((a, b) => b.fecha.localeCompare(a.fecha))
		: [];

	const Faltantes = Paciente
		? VACUNAS.filter(
				(vacuna) =>
					!Aplicaciones.some((registro) => registro.vacunaId === vacuna.id)
			)
		: [];

	return (
		<div className='flex flex-col gap-6'>
			<header>
				<h1 className='font-bold text-2xl'>Consultar perfil</h1>
				<p className='text-sm opacity-70'>
					Ingresa la cédula de un paciente registrado para ver su ficha y
					su esquema de vacunación.
				</p>
			</header>

			<form
				className='card bg-base-100 shadow-sm'
				onSubmit={Buscar}
			>
				<div className='card-body gap-3'>
					<div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
						<div className='flex flex-col gap-1 sm:flex-1'>
							<label
								className='label'
								htmlFor='consultaCedula'
							>
								Cédula
							</label>
							<input
								id='consultaCedula'
								type='text'
								className='input w-full'
								placeholder='10234567'
								value={Cedula}
								onChange={(evento) => SetCedula(evento.target.value)}
								required
							/>
						</div>
						<button
							type='submit'
							className='btn btn-primary'
						>
							<IconSearch size={18} />
							Buscar
						</button>
					</div>

					<p className='text-xs opacity-60'>
						Escribe solo los números (el "V-" es opcional). Cédulas de
						prueba:{' '}
						{PACIENTES.map((item) => SoloDigitos(item.cedula)).join(
							' · '
						)}
					</p>
				</div>
			</form>

			{Consulta && !Paciente && (
				<div
					role='alert'
					className='alert alert-warning'
				>
					<IconAlertTriangle size={20} />
					<span>
						No se encontró ningún paciente con la cédula{' '}
						<strong>{Consulta.cedula}</strong>.
					</span>
				</div>
			)}

			{Paciente && (
				<div className='flex flex-col gap-4'>
					<FichaPaciente Paciente={Paciente} />

					<div className='card bg-base-100 shadow-sm'>
						<div className='card-body gap-3'>
							<h3 className='card-title text-base'>
								Esquema de vacunación
							</h3>
							<p className='text-sm opacity-70'>
								{Aplicaciones.length} de {VACUNAS.length} vacunas
								aplicadas
							</p>

							<div className='grid gap-4 lg:grid-cols-2'>
								<div>
									<h4 className='mb-2 text-sm font-medium'>
										Vacunas aplicadas
									</h4>
									{Aplicaciones.length === 0 ? (
										<p className='text-sm opacity-70'>
											Sin vacunas aplicadas registradas.
										</p>
									) : (
										<ul className='flex flex-col gap-2'>
											{Aplicaciones.map((registro) => {
												const Vacuna = VACUNAS.find(
													(item) => item.id === registro.vacunaId
												);

												return (
													<li
														key={registro.id}
														className='flex items-center justify-between gap-3 rounded-box bg-base-200 px-3 py-2'
													>
														<span className='flex items-center gap-2'>
															<IconCircleCheck
																size={18}
																className='text-success'
															/>
															<span>
																<span className='block text-sm font-medium'>
																	{Vacuna?.nombre ?? '—'}
																</span>
																<span className='block text-xs opacity-60'>
																	{registro.atencion} · Lote{' '}
																	{registro.lote}
																</span>
															</span>
														</span>
														<span className='badge badge-success badge-sm'>
															{registro.fecha}
														</span>
													</li>
												);
											})}
										</ul>
									)}
								</div>

								<div>
									<h4 className='mb-2 text-sm font-medium'>
										Vacunas faltantes
									</h4>
									{Faltantes.length === 0 ? (
										<p className='text-sm opacity-70'>
											Esquema de vacunación completo.
										</p>
									) : (
										<ul className='flex flex-col gap-2'>
											{Faltantes.map((vacuna) => (
												<li
													key={vacuna.id}
													className='flex items-center justify-between gap-3 rounded-box bg-base-200 px-3 py-2'
												>
													<span className='flex items-center gap-2'>
														<IconAlertTriangle
															size={18}
															className='text-warning'
														/>
														<span>
															<span className='block text-sm font-medium'>
																{vacuna.nombre}
															</span>
															<span className='block text-xs opacity-60'>
																Pendiente · esquema de{' '}
																{vacuna.dosisTotal} dosis, cada{' '}
																{vacuna.intervaloDias} días
															</span>
														</span>
													</span>
													<span className='badge badge-warning badge-sm'>
														Falta
													</span>
												</li>
											))}
										</ul>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
