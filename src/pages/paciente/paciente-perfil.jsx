/*
	PacientePerfil · "Mi perfil": ficha del paciente en sesión (p1) y
	su esquema de vacunación (aplicadas y faltantes).
*/
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';
import { FichaPaciente } from '../../components/ficha-paciente.jsx';
import { PACIENTES, REGISTROS, VACUNAS } from '../../data/data-frontend.js';

export function PacientePerfil() {
	const Paciente = PACIENTES[0] ?? null;

	if (!Paciente) {
		return (
			<div
				role='alert'
				className='alert alert-warning'
			>
				No se encontró la ficha del paciente.
			</div>
		);
	}

	// Vacunas aplicadas del paciente y cuáles le faltan según el esquema
	const Aplicaciones = REGISTROS.filter(
		(registro) => registro.pacienteId === Paciente.id
	).sort((a, b) => b.fecha.localeCompare(a.fecha));

	const VacunasAplicadas = new Set(
		Aplicaciones.map((registro) => registro.vacunaId)
	).size;

	const Faltantes = VACUNAS.filter(
		(vacuna) =>
			!Aplicaciones.some((registro) => registro.vacunaId === vacuna.id)
	);

	return (
		<div className='flex flex-col gap-6'>
			<header>
				<h1 className='font-bold text-2xl'>Mi perfil</h1>
				<p className='text-sm opacity-70'>
					Información personal y esquema de vacunación.
				</p>
			</header>

			<FichaPaciente Paciente={Paciente} />

			<section className='flex flex-col gap-4'>
				<div>
					<h2 className='font-bold text-xl'>Mis vacunas</h2>
					<p className='text-sm opacity-70'>
						Esquema de vacunación registrado en el centro.
					</p>
				</div>

				<div className='flex flex-wrap items-center gap-3'>
					<span className='text-sm opacity-70'>
						{VacunasAplicadas} de {VACUNAS.length} vacunas aplicadas
					</span>
				</div>

				<div className='grid gap-4 lg:grid-cols-2'>
					<div className='card bg-base-100 shadow-sm'>
						<div className='card-body gap-3'>
							<h3 className='card-title text-base'>Vacunas aplicadas</h3>
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
					</div>

					<div className='card bg-base-100 shadow-sm'>
						<div className='card-body gap-3'>
							<h3 className='card-title text-base'>Vacunas faltantes</h3>
							{Faltantes.length === 0 ? (
								<p className='text-sm opacity-70'>
									Esquema de vacunación completo.
								</p>
							) : (
								<>
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
									<p className='text-xs opacity-60'>
										Acude al centro para completar el esquema.
									</p>
								</>
							)}
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
