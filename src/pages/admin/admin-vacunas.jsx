/*
	AdminVacunas · Búsqueda por vacuna específica: filtro de
	registros, ficha de la vacuna con alertas de stock, próximo
	llamado estimado y disponibilidad regional.
*/
import {
	IconAlertTriangle,
	IconCalendarEvent,
	IconMapPin
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import {
	PACIENTES,
	REGIONES,
	REGISTROS,
	VACUNAS
} from '../../data/data-frontend.js';

// Utilidades: sumar días a una fecha y comparar textos sin tildes
function SumarDias(fecha, dias) {
	const Base = new Date(fecha);
	Base.setDate(Base.getDate() + dias);
	return Base.toISOString().slice(0, 10);
}

function Normalizar(texto) {
	return texto
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

export function AdminVacunas() {
	const [Seleccionada, SetSeleccionada] = useState(VACUNAS[0]?.id ?? '');
	const [Busqueda, SetBusqueda] = useState('');
	const [FiltroVacuna, SetFiltroVacuna] = useState('');

	const Vacuna = VACUNAS.find((item) => item.id === Seleccionada) ?? null;

	// Resumen de la vacuna seleccionada: aplicaciones, última dosis y próximo llamado
	const Resumen = useMemo(() => {
		if (!Vacuna) {
			return null;
		}

		const Aplicaciones = REGISTROS.filter(
			(registro) => registro.vacunaId === Vacuna.id
		).sort((a, b) => b.fecha.localeCompare(a.fecha));

		const Ultima = Aplicaciones[0] ?? null;

		return {
			Aplicaciones,
			Ultima,
			ProximaLlamado: Ultima
				? SumarDias(Ultima.fecha, Vacuna.intervaloDias)
				: null
		};
	}, [
		Vacuna
	]);

	const VacunaFiltro =
		VACUNAS.find((item) => item.id === FiltroVacuna) ?? null;

	// Registros filtrados por texto (vacuna, paciente, cédula) y por vacuna
	const RegistrosFiltrados = useMemo(() => {
		const Texto = Normalizar(Busqueda.trim());

		return REGISTROS.filter((registro) => {
			const VacunaRegistro = VACUNAS.find(
				(item) => item.id === registro.vacunaId
			);
			const PacienteRegistro = PACIENTES.find(
				(item) => item.id === registro.pacienteId
			);
			const CoincideTexto =
				Texto === '' ||
				Normalizar(VacunaRegistro?.nombre ?? '').includes(Texto) ||
				Normalizar(PacienteRegistro?.nombre ?? '').includes(Texto) ||
				Normalizar(PacienteRegistro?.cedula ?? '').includes(Texto);
			const CoincideVacuna =
				FiltroVacuna === '' || registro.vacunaId === FiltroVacuna;

			return CoincideTexto && CoincideVacuna;
		}).sort((a, b) => b.fecha.localeCompare(a.fecha));
	}, [
		Busqueda,
		FiltroVacuna
	]);

	// Personas distintas con la vacuna filtrada (contador)
	const PersonasConVacuna = useMemo(() => {
		if (FiltroVacuna === '') {
			return null;
		}

		const PacientesFiltrados = new Set(
			REGISTROS.filter((registro) => registro.vacunaId === FiltroVacuna).map(
				(registro) => registro.pacienteId
			)
		);

		return PacientesFiltrados.size;
	}, [
		FiltroVacuna
	]);

	let TextoContador = `Mostrando ${RegistrosFiltrados.length} de ${REGISTROS.length} registros`;

	if (PersonasConVacuna !== null && VacunaFiltro) {
		const Sujeto =
			PersonasConVacuna === 1
				? 'persona registrada'
				: 'personas registradas';

		TextoContador += ` · ${PersonasConVacuna} ${Sujeto} con ${VacunaFiltro.nombre}`;
	}

	return (
		<div className='flex flex-col gap-6'>
			<header>
				<h1 className='font-bold text-2xl'>
					Búsqueda por vacuna específica
				</h1>
				<p className='text-sm opacity-70'>
					Filtra los registros por vacuna, nombre o cédula. Consulta
					información, alertas de aplicación y disponibilidad regional de
					una vacuna.
				</p>
			</header>

			<section className='card bg-base-100 shadow-sm'>
				<div className='card-body gap-4'>
					<h2 className='card-title text-base'>
						Filtro de registros de vacunación
					</h2>

					<div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
						<div className='flex flex-1 flex-col gap-1'>
							<label
								className='label'
								htmlFor='busqueda'
							>
								Buscar
							</label>
							<input
								id='busqueda'
								type='text'
								className='input w-full'
								placeholder='Vacuna, nombre o cédula'
								value={Busqueda}
								onChange={(evento) => SetBusqueda(evento.target.value)}
							/>
						</div>
						<div className='flex flex-col gap-1'>
							<label
								className='label'
								htmlFor='filtro-vacuna'
							>
								Vacuna
							</label>
							<select
								id='filtro-vacuna'
								className='select w-full sm:w-56'
								value={FiltroVacuna}
								onChange={(evento) =>
									SetFiltroVacuna(evento.target.value)
								}
							>
								<option value=''>Todas las vacunas</option>
								{VACUNAS.map((item) => (
									<option
										key={item.id}
										value={item.id}
									>
										{item.nombre}
									</option>
								))}
							</select>
						</div>
					</div>

					<p className='text-xs opacity-60'>{TextoContador}</p>

					<div className='overflow-x-auto'>
						<table className='table table-sm'>
							<thead>
								<tr>
									<th>Vacuna</th>
									<th>Paciente</th>
									<th>Cédula</th>
									<th>Lote</th>
									<th>Fecha</th>
									<th>Atención</th>
									<th>Médico</th>
								</tr>
							</thead>
							<tbody>
								{RegistrosFiltrados.map((registro) => {
									const PacienteRegistro = PACIENTES.find(
										(item) => item.id === registro.pacienteId
									);
									const VacunaRegistro = VACUNAS.find(
										(item) => item.id === registro.vacunaId
									);

									return (
										<tr key={registro.id}>
											<td>
												<span className='badge badge-ghost badge-sm'>
													{VacunaRegistro?.nombre ?? '—'}
												</span>
											</td>
											<td className='font-medium'>
												{PacienteRegistro?.nombre ?? '—'}
											</td>
											<td>{PacienteRegistro?.cedula ?? '—'}</td>
											<td>{registro.lote}</td>
											<td>{registro.fecha}</td>
											<td className='max-w-48 truncate'>
												{registro.atencion}
											</td>
											<td>{registro.medico}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{RegistrosFiltrados.length === 0 && (
						<p className='text-sm opacity-70'>
							Sin registros que coincidan con el filtro.
						</p>
					)}
				</div>
			</section>

			<section className='card bg-base-100 shadow-sm'>
				<div className='card-body gap-4'>
					<label
						className='label'
						htmlFor='vacuna'
					>
						Seleccione una vacuna
					</label>
					<select
						id='vacuna'
						className='select w-full sm:max-w-md'
						value={Seleccionada}
						onChange={(evento) => SetSeleccionada(evento.target.value)}
					>
						{VACUNAS.map((item) => (
							<option
								key={item.id}
								value={item.id}
							>
								{item.nombre} — {item.laboratorio}
							</option>
						))}
					</select>
				</div>
			</section>

			{Vacuna && Resumen && (
				<div className='grid gap-4 lg:grid-cols-3'>
					<div className='card bg-base-100 shadow-sm lg:col-span-2'>
						<div className='card-body'>
							<h2 className='card-title text-base'>{Vacuna.nombre}</h2>
							<p className='text-sm opacity-70'>{Vacuna.descripcion}</p>
							<div className='mt-2 grid gap-3 sm:grid-cols-2'>
								<div className='rounded-box bg-base-200 p-3'>
									<p className='text-xs opacity-60'>Laboratorio</p>
									<p className='font-medium'>{Vacuna.laboratorio}</p>
								</div>
								<div className='rounded-box bg-base-200 p-3'>
									<p className='text-xs opacity-60'>Esquema</p>
									<p className='font-medium'>
										{Vacuna.dosisTotal} dosis · cada{' '}
										{Vacuna.intervaloDias} días
									</p>
								</div>
								<div className='rounded-box bg-base-200 p-3'>
									<p className='text-xs opacity-60'>Disponible</p>
									<p className='font-medium'>{Vacuna.stock} dosis</p>
								</div>
								<div className='rounded-box bg-base-200 p-3'>
									<p className='text-xs opacity-60'>
										Aplicaciones registradas
									</p>
									<p className='font-medium'>
										{Resumen.Aplicaciones.length}
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className='flex flex-col gap-4'>
						<div className='card bg-base-100 shadow-sm'>
							<div className='card-body gap-3'>
								<h2 className='card-title text-base'>
									Alertas y recordatorios
								</h2>
								{Vacuna.stock < Vacuna.stockMinimo && (
									<div
										role='alert'
										className='alert alert-error text-sm'
									>
										<IconAlertTriangle size={18} />
										Stock por debajo del mínimo ({Vacuna.stockMinimo}{' '}
										dosis).
									</div>
								)}
								{Resumen.ProximaLlamado ? (
									<div className='flex items-start gap-2 text-sm'>
										<IconCalendarEvent
											size={18}
											className='mt-0.5 text-primary'
										/>
										<span>
											Próximo llamado estimado:{' '}
											<strong>{Resumen.ProximaLlamado}</strong> (
											{Vacuna.intervaloDias} días desde la última
											aplicación).
										</span>
									</div>
								) : (
									<p className='text-sm opacity-70'>
										Aún no hay aplicaciones registradas para calcular
										el próximo llamado.
									</p>
								)}
							</div>
						</div>

						<div className='card bg-base-100 shadow-sm'>
							<div className='card-body gap-3'>
								<h2 className='card-title flex items-center gap-2 text-base'>
									<IconMapPin size={18} />
									Disponibilidad regional
								</h2>
								<div className='flex flex-wrap gap-2'>
									{REGIONES.map((region) => {
										const Disponible =
											Vacuna.regiones.includes(region);

										return (
											<span
												key={region}
												className={`badge ${
													Disponible
														? 'badge-success'
														: 'badge-ghost'
												}`}
											>
												{region}
											</span>
										);
									})}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
