/*
	App · Rutas: /login y un AppShell por rol (/admin, /medico,
	/paciente). "Consultar perfil" se comparte entre médico y
	paciente.
*/
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell.jsx';
import { AdminDashboard } from './pages/admin/admin-dashboard.jsx';
import { AdminInventario } from './pages/admin/admin-inventario.jsx';
import { AdminVacunas } from './pages/admin/admin-vacunas.jsx';
import { ConsultaPerfil } from './pages/consulta/consulta-perfil.jsx';
import { LoginPage } from './pages/login-page.jsx';
import { MedicoDashboard } from './pages/medico/medico-dashboard.jsx';
import { MedicoPaciente } from './pages/medico/medico-paciente.jsx';
import { MedicoVacuna } from './pages/medico/medico-vacuna.jsx';
import { PacientePerfil } from './pages/paciente/paciente-perfil.jsx';

function App() {
	return (
		<Routes>
			<Route
				path='/login'
				element={<LoginPage />}
			/>

			<Route
				path='/admin'
				element={<AppShell />}
			>
				<Route
					index
					element={<AdminDashboard />}
				/>
				<Route
					path='inventario'
					element={<AdminInventario />}
				/>
				<Route
					path='vacunas'
					element={<AdminVacunas />}
				/>
			</Route>

			<Route
				path='/medico'
				element={<AppShell />}
			>
				<Route
					index
					element={<MedicoDashboard />}
				/>
				<Route
					path='pacientes'
					element={<MedicoPaciente />}
				/>
				<Route
					path='consulta'
					element={<ConsultaPerfil />}
				/>
				<Route
					path='vacunas'
					element={<MedicoVacuna />}
				/>
			</Route>

			<Route
				path='/paciente'
				element={<AppShell />}
			>
				<Route
					index
					element={<PacientePerfil />}
				/>
				<Route
					path='consulta'
					element={<ConsultaPerfil />}
				/>
			</Route>

			<Route
				path='*'
				element={
					<Navigate
						to='/login'
						replace
					/>
				}
			/>
		</Routes>
	);
}

export default App;
