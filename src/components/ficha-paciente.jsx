/*
	FichaPaciente
	-------------
	Tarjeta con los datos personales de un paciente: avatar, nombre,
	cédula y datos de contacto. Se usa en "Mi perfil" (paciente) y en
	la consulta de perfiles por cédula (ConsultaPerfil).
*/
import {
	IconDroplet,
	IconMail,
	IconMapPin,
	IconPhone,
	IconUser
} from '@tabler/icons-react';

// Fila de dato: etiqueta + valor, con icono opcional
function Dato({ etiqueta, valor, icono: Icono }) {
	return (
		<div className='flex items-start gap-3 rounded-box bg-base-200 p-3'>
			{Icono && (
				<Icono
					size={20}
					className='mt-0.5 text-primary'
				/>
			)}
			<div>
				<p className='text-xs opacity-60'>{etiqueta}</p>
				<p className='font-medium'>{valor || '—'}</p>
			</div>
		</div>
	);
}

export function FichaPaciente({ Paciente }) {
	return (
		<div className='card bg-base-100 shadow-sm'>
			<div className='card-body gap-4'>
				<div className='flex items-center gap-4'>
					<div className='avatar avatar-placeholder'>
						<div className='w-16 rounded-full bg-primary text-primary-content'>
							<IconUser size={32} />
						</div>
					</div>
					<div>
						<h2 className='card-title text-lg'>{Paciente.nombre}</h2>
						<p className='text-sm opacity-70'>{Paciente.cedula}</p>
					</div>
				</div>

				<div className='grid gap-3 sm:grid-cols-2'>
					<Dato
						etiqueta='Fecha de nacimiento'
						valor={Paciente.fechaNacimiento}
					/>
					<Dato
						etiqueta='Sexo'
						valor={Paciente.sexo}
					/>
					<Dato
						etiqueta='Teléfono'
						valor={Paciente.telefono}
						icono={IconPhone}
					/>
					<Dato
						etiqueta='Correo electrónico'
						valor={Paciente.email}
						icono={IconMail}
					/>
					<Dato
						etiqueta='Dirección'
						valor={Paciente.direccion}
						icono={IconMapPin}
					/>
					<Dato
						etiqueta='Región'
						valor={Paciente.region}
						icono={IconMapPin}
					/>
					<Dato
						etiqueta='Tipo de sangre'
						valor={Paciente.tipoSangre}
						icono={IconDroplet}
					/>
					<Dato
						etiqueta='Alergias'
						valor={Paciente.alergias}
					/>
				</div>
			</div>
		</div>
	);
}
