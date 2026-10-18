/*
	MedicoDashboard · Panel de atención: accesos rápidos, stock del
	inventario y últimos registros de vacunación.
*/
import {
	IconBoxSeam,
	IconClipboardPlus,
	IconUserPlus
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { PACIENTES, REGISTROS, VACUNAS } from '../../data/data-frontend.js';

export function MedicoDashboard() {
	// Últimos 5 registros (más recientes primero)
	const Recientes = [
		...REGISTROS
	]
		.reverse()
		.slice(0, 5);

	return (
		<div className='flex flex-col gap-6'>
			<header>
				<h1 className='font-bold text-2xl'>Panel de atención</h1>
				<p className='text-sm opacity-70'>
					Registro de pacientes y carga de vacunas aplicadas en consulta.
				</p>
			</header>

			<div className='grid gap-4 sm:grid-cols-2'>
				<Link
					to='/medico/pacientes'
					className='card bg-base-100 shadow-sm transition hover:bg-base-200'
				>
					<div className='card-body flex-row items-center gap-4'>
						<IconUserPlus
							size={32}
							className='text-primary'
						/>
						<div>
							<h2 className='card-title text-base'>
								Registrar paciente
							</h2>
							<p className='text-sm opacity-70'>
								Crea la cuenta y ficha de la persona atendida.
							</p>
						</div>
					</div>
				</Link>

				<Link
					to='/medico/vacunas'
					className='card bg-base-100 shadow-sm transition hover:bg-base-200'
				>
					<div className='card-body flex-row items-center gap-4'>
						<IconClipboardPlus
							size={32}
							className='text-accent'
						/>
						<div>
							<h2 className='card-title text-base'>
								Registrar vacuna aplicada
							</h2>
							<p className='text-sm opacity-70'>
								Carga tipo de vacuna, lote, fecha y atención.
							</p>
						</div>
					</div>
				</Link>
			</div>

			<div className='grid gap-4'>
				<section className='card bg-base-100 shadow-sm'>
					<div className='card-body gap-3'>
						<h2 className='card-title flex items-center gap-2 text-base'>
							<IconBoxSeam size={18} />
							Stock de inventario
						</h2>
						{VACUNAS.map((vacuna) => {
							const Bajo = vacuna.stock < vacuna.stockMinimo;

							return (
								<div
									key={vacuna.id}
									className='flex items-center justify-between gap-3 rounded-box bg-base-200 p-3'
								>
									<div>
										<p className='font-medium'>{vacuna.nombre}</p>
										<p className='text-xs opacity-60'>
											Mínimo {vacuna.stockMinimo} dosis
										</p>
									</div>
									<span
										className={`badge badge-sm ${
											Bajo ? 'badge-warning' : 'badge-success'
										}`}
									>
										{vacuna.stock} dosis
									</span>
								</div>
							);
						})}
					</div>
				</section>
			</div>

			<section className='card bg-base-100 shadow-sm'>
				<div className='card-body'>
					<h2 className='card-title text-base'>
						Últimos registros de vacunación
					</h2>
					<div className='overflow-x-auto'>
						<table className='table table-sm'>
							<thead>
								<tr>
									<th>Paciente</th>
									<th>Vacuna</th>
									<th>Lote</th>
									<th>Fecha</th>
									<th>Atención</th>
								</tr>
							</thead>
							<tbody>
								{Recientes.map((registro) => {
									const Paciente = PACIENTES.find(
										(item) => item.id === registro.pacienteId
									);
									const Vacuna = VACUNAS.find(
										(item) => item.id === registro.vacunaId
									);

									return (
										<tr key={registro.id}>
											<td className='font-medium'>
												{Paciente?.nombre ?? '—'}
											</td>
											<td>{Vacuna?.nombre ?? '—'}</td>
											<td>{registro.lote}</td>
											<td>{registro.fecha}</td>
											<td className='max-w-48 truncate'>
												{registro.atencion}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</section>
		</div>
	);
}
