/*
	AdminInventario · Tablas de stock de vacunas (con estado por
	mínimos) y de cuentas del sistema.
*/
import {
	CUENTAS,
	REGISTROS,
	ROLES,
	VACUNAS
} from '../../data/data-frontend.js';

export function AdminInventario() {
	// Estado del stock: bajo / medio / suficiente
	function EstadoStock(vacuna) {
		if (vacuna.stock < vacuna.stockMinimo) {
			return {
				clase: 'badge-error',
				texto: 'Stock bajo'
			};
		}

		if (vacuna.stock < vacuna.stockMinimo * 2) {
			return {
				clase: 'badge-warning',
				texto: 'Stock medio'
			};
		}

		return {
			clase: 'badge-success',
			texto: 'Stock suficiente'
		};
	}

	return (
		<div className='flex flex-col gap-6'>
			<header>
				<h1 className='font-bold text-2xl'>Gestión general e inventario</h1>
				<p className='text-sm opacity-70'>
					Control de registros, cuentas del sistema y stock general de
					vacunas.
				</p>
			</header>

			<section className='card bg-base-100 shadow-sm'>
				<div className='card-body'>
					<h2 className='card-title text-base'>Stock de vacunas</h2>
					<div className='overflow-x-auto'>
						<table className='table table-sm'>
							<thead>
								<tr>
									<th>Vacuna</th>
									<th>Laboratorio</th>
									<th>Dosis aplicadas</th>
									<th>Disponible</th>
									<th>Mínimo</th>
									<th>Estado</th>
								</tr>
							</thead>
							<tbody>
								{VACUNAS.map((vacuna) => {
									const Estado = EstadoStock(vacuna);
									const Aplicadas = REGISTROS.filter(
										(registro) => registro.vacunaId === vacuna.id
									).length;

									return (
										<tr key={vacuna.id}>
											<td className='font-medium'>
												{vacuna.nombre}
											</td>
											<td>{vacuna.laboratorio}</td>
											<td>{Aplicadas}</td>
											<td>{vacuna.stock}</td>
											<td>{vacuna.stockMinimo}</td>
											<td>
												<span
													className={`badge badge-sm ${Estado.clase}`}
												>
													{Estado.texto}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<section className='card bg-base-100 shadow-sm'>
				<div className='card-body'>
					<h2 className='card-title text-base'>Cuentas del sistema</h2>
					<div className='overflow-x-auto'>
						<table className='table table-sm'>
							<thead>
								<tr>
									<th>Usuario</th>
									<th>Nombre</th>
									<th>Perfil</th>
									<th>Correo</th>
									<th>Estado</th>
								</tr>
							</thead>
							<tbody>
								{CUENTAS.map((cuenta) => (
									<tr key={cuenta.id}>
										<td className='font-medium'>{cuenta.usuario}</td>
										<td>{cuenta.nombre}</td>
										<td>
											<span className='badge badge-ghost badge-sm'>
												{ROLES[cuenta.rol]}
											</span>
										</td>
										<td>{cuenta.correo}</td>
										<td>
											<span
												className={`badge badge-sm ${
													cuenta.estado === 'Activo'
														? 'badge-success'
														: 'badge-error'
												}`}
											>
												{cuenta.estado}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>
		</div>
	);
}
