/*
	AdminDashboard · Resumen general para el admin: totales del
	sistema y alerta de stock mínimo de vacunas.
*/
import {
	IconAlertTriangle,
	IconClipboardPlus,
	IconUsers,
	IconVaccine
} from '@tabler/icons-react';
import { PACIENTES, REGISTROS, VACUNAS } from '../../data/data-frontend.js';

export function AdminDashboard() {
	const StockBajo = VACUNAS.filter(
		(vacuna) => vacuna.stock < vacuna.stockMinimo
	);

	return (
		<div className='flex flex-col gap-6'>
			<header>
				<h1 className='font-bold text-2xl'>Panel general</h1>
				<p className='text-sm opacity-70'>
					Resumen del sistema y control global de inventario.
				</p>
			</header>

			<div className='stats stats-vertical w-full bg-base-100 shadow-sm sm:stats-horizontal'>
				<div className='stat'>
					<div className='stat-figure text-primary'>
						<IconUsers size={28} />
					</div>
					<div className='stat-title'>Pacientes registrados</div>
					<div className='stat-value text-primary'>{PACIENTES.length}</div>
					<div className='stat-desc'>Cuentas de pacientes activas</div>
				</div>
				<div className='stat'>
					<div className='stat-figure text-primary'>
						<IconVaccine size={28} />
					</div>
					<div className='stat-title'>Vacunas en inventario</div>
					<div className='stat-value text-primary'>
						{VACUNAS.reduce((total, vacuna) => total + vacuna.stock, 0)}
					</div>
					<div className='stat-desc'>{VACUNAS.length} tipos de vacuna</div>
				</div>
				<div className='stat'>
					<div className='stat-figure text-accent'>
						<IconClipboardPlus size={28} />
					</div>
					<div className='stat-title'>Dosis aplicadas</div>
					<div className='stat-value text-accent'>{REGISTROS.length}</div>
					<div className='stat-desc'>Registros históricos</div>
				</div>
			</div>

			<div className='grid gap-4'>
				<div className='card bg-base-100 shadow-sm'>
					<div className='card-body'>
						<h2 className='card-title text-base'>
							Alerta de stock mínimo
						</h2>
						{StockBajo.length === 0 ? (
							<p className='text-sm opacity-70'>
								Sin alertas de inventario.
							</p>
						) : (
							<ul className='flex flex-col gap-2'>
								{StockBajo.map((vacuna) => (
									<li
										key={vacuna.id}
										className='flex items-center justify-between gap-2 rounded-box bg-base-200 px-3 py-2'
									>
										<span className='flex items-center gap-2 text-sm'>
											<IconAlertTriangle
												size={18}
												className='text-warning'
											/>
											{vacuna.nombre}
										</span>
										<span className='badge badge-warning badge-sm'>
											{vacuna.stock} / mín. {vacuna.stockMinimo}
										</span>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
