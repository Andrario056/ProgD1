/// DATOS MOSTRADOS EN FRONTEND PARA PRUEBAS DE FUNCIONALIDAD
// Regiones usadas en direcciones y disponibilidad regional
export const REGIONES = [
	'Capital',
	'Zona Norte',
	'Zona Sur',
	'Zona Este',
	'Zona Oeste'
];

// Catálogo de vacunas: stock, esquema de dosis y regiones disponibles
export const VACUNAS = [
	{
		id: 'v1',
		nombre: 'COVID-19',
		laboratorio: 'Pfizer',
		stock: 320,
		stockMinimo: 100,
		dosisTotal: 2,
		intervaloDias: 21,
		regiones: [
			'Capital',
			'Zona Norte',
			'Zona Este',
			'Zona Oeste'
		],
		descripcion: 'Vacuna de ARN mensajero contra el SARS-CoV-2.'
	},
	{
		id: 'v2',
		nombre: 'Influenza',
		laboratorio: 'Sanofi',
		stock: 180,
		stockMinimo: 80,
		dosisTotal: 1,
		intervaloDias: 365,
		regiones: [
			'Capital',
			'Zona Sur',
			'Zona Oeste'
		],
		descripcion: 'Vacuna anual contra los virus de la influenza estacional.'
	},
	{
		id: 'v3',
		nombre: 'Hepatitis B',
		laboratorio: 'GlaxoSmithKline',
		stock: 75,
		stockMinimo: 90,
		dosisTotal: 3,
		intervaloDias: 30,
		regiones: [
			'Capital',
			'Zona Norte',
			'Zona Oeste'
		],
		descripcion: 'Esquema de tres dosis para inmunización contra hepatitis B.'
	},
	{
		id: 'v4',
		nombre: 'Sarampión',
		laboratorio: 'Serum Institute',
		stock: 140,
		stockMinimo: 60,
		dosisTotal: 2,
		intervaloDias: 30,
		regiones: [
			'Zona Norte',
			'Zona Sur',
			'Zona Este',
			'Zona Oeste'
		],
		descripcion: 'Vacuna triple viral para poblaciones pediátricas.'
	},
	{
		id: 'v5',
		nombre: 'Tétanos',
		laboratorio: 'Instituto Butantan',
		stock: 55,
		stockMinimo: 70,
		dosisTotal: 1,
		intervaloDias: 3650,
		regiones: [
			'Capital',
			'Zona Norte',
			'Zona Oeste'
		],
		descripcion: 'Toxoide tetánico de refuerzo cada diez años.'
	}
];

// Pacientes registrados
export const PACIENTES = [
	{
		id: 'p1',
		nombre: 'Ana Torres',
		cedula: 'V-10234567',
		fechaNacimiento: '1992-04-18',
		sexo: 'Femenino',
		telefono: '0414-1234567',
		email: 'ana.torres@correo.com',
		direccion: 'Av. Libertador, Caracas',
		region: 'Capital',
		tipoSangre: 'O+',
		alergias: 'Ninguna'
	},
	{
		id: 'p2',
		nombre: 'Luis Mendoza',
		cedula: 'V-14567890',
		fechaNacimiento: '1985-11-02',
		sexo: 'Masculino',
		telefono: '0424-7654321',
		email: 'luis.mendoza@correo.com',
		direccion: 'Calle 5, Maracaibo',
		region: 'Zona Oeste',
		tipoSangre: 'A+',
		alergias: 'Penicilina'
	},
	{
		id: 'p3',
		nombre: 'Carla Rivas',
		cedula: 'V-18987654',
		fechaNacimiento: '2015-07-25',
		sexo: 'Femenino',
		telefono: '0412-9988776',
		email: 'representante.rivas@correo.com',
		direccion: 'Urbanismo Los Pinos, Valencia',
		region: 'Zona Norte',
		tipoSangre: 'B+',
		alergias: 'Ninguna'
	}
];

// Vacunas aplicadas: paciente, vacuna, lote y fecha de cada registro
export const REGISTROS = [
	{
		id: 'r1',
		pacienteId: 'p1',
		vacunaId: 'v2',
		lote: 'SNF-8871',
		fecha: '2025-12-15',
		atencion: 'Influenza estacional',
		medico: 'Dr. Andrés Gómez',
		centro: 'Centro de Vacunación Salud'
	},
	{
		id: 'r2',
		pacienteId: 'p3',
		vacunaId: 'v1',
		lote: 'PFZ-2026-B7',
		fecha: '2026-08-05',
		atencion: 'Refuerzo COVID-19 pediátrico',
		medico: 'Dr. Andrés Gómez',
		centro: 'Centro de Vacunación Salud'
	},
	{
		id: 'r3',
		pacienteId: 'p1',
		vacunaId: 'v5',
		lote: 'BTN-1123',
		fecha: '2026-08-14',
		atencion: 'Refuerzo tétanos',
		medico: 'Dra. Elena Pérez',
		centro: 'Centro de Vacunación Salud'
	},
	{
		id: 'r4',
		pacienteId: 'p2',
		vacunaId: 'v1',
		lote: 'PFZ-2026-A2',
		fecha: '2026-09-22',
		atencion: 'Refuerzo COVID-19',
		medico: 'Dra. Elena Pérez',
		centro: 'Centro de Vacunación Salud'
	},
	{
		id: 'r5',
		pacienteId: 'p2',
		vacunaId: 'v3',
		lote: 'GSK-5510',
		fecha: '2026-10-11',
		atencion: 'Primera dosis Hepatitis B',
		medico: 'Dr. Andrés Gómez',
		centro: 'Centro de Vacunación Salud'
	},
	{
		id: 'r6',
		pacienteId: 'p1',
		vacunaId: 'v1',
		lote: 'PFZ-2026-A1',
		fecha: '2026-10-13',
		atencion: 'Primera dosis COVID-19',
		medico: 'Dra. Elena Pérez',
		centro: 'Centro de Vacunación Salud'
	},
	{
		id: 'r7',
		pacienteId: 'p3',
		vacunaId: 'v4',
		lote: 'SRM-2290',
		fecha: '2026-10-14',
		atencion: 'Primera dosis sarampión',
		medico: 'Dra. Elena Pérez',
		centro: 'Centro de Vacunación Salud'
	}
];

// CUENTAS DE USUARIO DEL SISTEMA
export const CUENTAS = [
	{
		id: 'u1',
		usuario: 'admin',
		rol: 'admin',
		nombre: 'Carlos Núñez',
		correo: 'admin@salud.com',
		estado: 'Activo',
		pacienteId: null
	},
	{
		id: 'u2',
		usuario: 'medico',
		rol: 'medico',
		nombre: 'Dra. Elena Pérez',
		correo: 'medico@salud.com',
		estado: 'Activo',
		pacienteId: null
	},
	{
		id: 'u3',
		usuario: 'paciente',
		rol: 'paciente',
		nombre: 'Ana Torres',
		correo: 'ana.torres@correo.com',
		estado: 'Activo',
		pacienteId: 'p1'
	},
	{
		id: 'u4',
		usuario: 'lmendoza',
		rol: 'paciente',
		nombre: 'Luis Mendoza',
		correo: 'luis.mendoza@correo.com',
		estado: 'Activo',
		pacienteId: 'p2'
	},
	{
		id: 'u5',
		usuario: 'agomez',
		rol: 'medico',
		nombre: 'Dr. Andrés Gómez',
		correo: 'agomez@salud.com',
		estado: 'Activo',
		pacienteId: null
	},
	{
		id: 'u6',
		usuario: 'crivas',
		rol: 'paciente',
		nombre: 'Carla Rivas',
		correo: 'representante.rivas@correo.com',
		estado: 'Activo',
		pacienteId: 'p3'
	}
];

// Nombre visible de cada rol y su ruta inicial en la app
export const ROLES = {
	admin: 'Admin',
	medico: 'Médico',
	paciente: 'Paciente'
};

export const RUTA_POR_ROL = {
	admin: '/admin',
	medico: '/medico',
	paciente: '/paciente'
};
