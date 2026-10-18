/*
	AppShell · Estructura general de la sesión: barra superior fija,
	menú lateral según el rol y contenido de la ruta activa.
*/
import {
	IconBoxSeam,
	IconClipboardPlus,
	IconLayoutDashboard,
	IconLogout,
	IconMenu2,
	IconSearch,
	IconUserCircle,
	IconUserPlus,
	IconUserSearch,
	IconVaccine
} from '@tabler/icons-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROLES } from '../data/data-frontend.js';

// Ítems del menú lateral según el rol
const NAV_POR_ROL = {
	admin: [
		{
			ruta: '/admin',
			etiqueta: 'Panel general',
			icono: IconLayoutDashboard,
			exacto: true
		},
		{
			ruta: '/admin/inventario',
			etiqueta: 'Inventario y cuentas',
			icono: IconBoxSeam
		},
		{
			ruta: '/admin/vacunas',
			etiqueta: 'Buscar vacuna',
			icono: IconSearch
		}
	],
	medico: [
		{
			ruta: '/medico',
			etiqueta: 'Panel de atención',
			icono: IconLayoutDashboard,
			exacto: true
		},
		{
			ruta: '/medico/pacientes',
			etiqueta: 'Registrar paciente',
			icono: IconUserPlus
		},
		{
			ruta: '/medico/consulta',
			etiqueta: 'Consultar perfil',
			icono: IconUserSearch
		},
		{
			ruta: '/medico/vacunas',
			etiqueta: 'Registrar vacuna',
			icono: IconClipboardPlus
		}
	],
	paciente: [
		{
			ruta: '/paciente',
			etiqueta: 'Mi perfil',
			icono: IconUserCircle,
			exacto: true
		},
		{
			ruta: '/paciente/consulta',
			etiqueta: 'Consultar perfil',
			icono: IconUserSearch
		}
	]
};

export function AppShell() {
	const Navegar = useNavigate();
	const Ubicacion = useLocation();
	const Rol = Ubicacion.pathname.split('/')[1];
	const Items = NAV_POR_ROL[Rol] ?? [];

	function Salir() {
		Navegar('/login', {
			replace: true
		});
	}

	return (
		<div className='drawer lg:drawer-open'>
			<input
				id='menu-principal'
				type='checkbox'
				className='drawer-toggle'
			/>
			<div className='drawer-content flex min-h-svh flex-col bg-base-200'>
				<div className='navbar sticky top-0 z-10 border-base-300 border-b bg-base-100'>
					<div className='navbar-start gap-2'>
						<label
							htmlFor='menu-principal'
							className='btn btn-ghost btn-square drawer-button lg:hidden'
							aria-label='Abrir menú'
						>
							<IconMenu2 size={22} />
						</label>
						<span className='flex items-center gap-2 font-semibold'>
							<IconVaccine
								size={24}
								className='text-primary'
							/>
							<span className='hidden sm:inline'>
								Centro de Vacunación Salud
							</span>
						</span>
					</div>
					<div className='navbar-end gap-3'>
						<span className='hidden text-right text-xs sm:block'>
							<span className='block font-medium'>
								{ROLES[Rol] ?? 'Invitado'}
							</span>
						</span>
						<button
							type='button'
							className='btn btn-outline btn-sm'
							onClick={Salir}
						>
							<IconLogout size={18} />
							Salir
						</button>
					</div>
				</div>
				<main className='mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6'>
					<Outlet />
				</main>
			</div>
			<div className='drawer-side z-20'>
				<label
					htmlFor='menu-principal'
					aria-label='Cerrar menú'
					className='drawer-overlay'
				/>
				<aside className='flex min-h-full w-72 flex-col bg-base-100'>
					<div className='border-base-300 border-b p-4'>
						<p className='font-semibold'>Menú</p>
						<p className='text-xs opacity-60'>{ROLES[Rol]}</p>
					</div>
					<ul className='menu w-full flex-1 p-3'>
						{Items.map((item) => {
							const Icono = item.icono;

							return (
								<li key={item.ruta}>
									<NavLink
										to={item.ruta}
										end={item.exacto}
										className={({ isActive }) =>
											isActive ? 'menu-active' : ''
										}
									>
										<Icono size={20} />
										{item.etiqueta}
									</NavLink>
								</li>
							);
						})}
					</ul>
				</aside>
			</div>
		</div>
	);
}
