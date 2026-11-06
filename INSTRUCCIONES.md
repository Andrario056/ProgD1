# Funcionalidades de las vistas — tres perfiles

Documento con las funcionalidades y opciones que debe tener cada vista de los tres perfiles del sistema.

---

## Tema de la interfaz

- La barra superior de cada perfil incluye un botón para alternar entre modo claro y modo oscuro.
- En las vistas sin barra superior, como el inicio de sesión y la recuperación de contraseña, el botón aparece en la esquina superior derecha.
- En modo claro el botón muestra una luna y el texto “Modo oscuro”; en modo oscuro muestra un sol y el texto “Modo claro”.
- La preferencia se conserva al navegar entre las vistas.
- El certificado médico conserva su diseño claro para que siga siendo legible e imprimible en modo oscuro.

---

## Inicio de sesión

Vista de acceso al sistema para los tres perfiles.

Campos:

- Nombre de usuario.
- Contraseña.

Opciones:

- Iniciar sesión.
- Recuperar contraseña.
- Accesos directos de demostración para entrar como Perfil 1, Perfil 2 y Perfil 3.

Comportamiento:

- Si falta el usuario o la contraseña, mostrar un mensaje de error.
- Si las credenciales no coinciden, mostrar “Usuario o contraseña incorrectos”.
- Si las credenciales son correctas, entrar a la vista principal del perfil correspondiente.
- Al cerrar sesión desde cualquier perfil, volver al inicio de sesión.

---

## Perfil 1 — Centro de salud

Vistas del perfil:

- Registrar usuario.
- Registrar vacunación.

### Registrar usuario

Vista para registrar un usuario y, opcionalmente, crear su cuenta de acceso.

Campos del formulario:

- Nombre del enfermero o personal de consulta.
- Cédula del enfermero o personal de consulta.
- Nombre.
- Segundo nombre.
- Apellido.
- Segundo apellido.
- Cédula del usuario.
- Fecha de nacimiento.
- Sexo: Femenino, Masculino u Otro.
- Teléfono.
- Correo electrónico.
- Región: Capital, Central u Occidente.
- Tipo de sangre.
- Alergias.
- Centro de salud: se muestra fijado automáticamente con el centro del usuario.
- Dirección.
- Casilla “Crear cuenta de acceso del usuario”, activada por defecto.

Opciones:

- Registrar usuario.
- Limpiar o restablecer el formulario.

Validaciones:

- El nombre y el apellido son obligatorios.
- El nombre completo debe tener al menos 3 caracteres.
- La cédula debe tener un formato válido y no puede estar registrada en otro usuario.
- La fecha de nacimiento es obligatoria, no puede ser futura y debe ser coherente.
- El teléfono, si se escribe, debe tener entre 7 y 15 dígitos.
- El correo, si se escribe, debe tener un formato válido.
- Si se crea la cuenta de acceso, el correo es obligatorio.
- La región y el centro de salud deben ser válidos.

Al registrar:

- Mostrar un mensaje de éxito con el identificador del usuario.
- Si se creó la cuenta, mostrar el usuario generado y la contraseña temporal.
- Ofrecer las acciones “Registrar vacunación” y “Registrar otro usuario”.
- Si no se creó cuenta, indicarlo claramente.

### Registrar vacunación

Vista para registrar una vacuna aplicada a un usuario del centro.

Debe mostrar:

- Aviso y acceso para registrar un usuario cuando el centro todavía no tiene usuarios.
- Aviso cuando no hay vacunas disponibles en el catálogo.

Campos y opciones:

- Buscar al usuario por cédula o nombre, con autocompletado.
- Peso y altura tomados en la aplicación, editables; se guardan en la dosis y se usan para calcular la cantidad a aplicar.
- Fecha de aplicación, por defecto la fecha actual y sin permitir fechas futuras.
- Médico o enfermero que aplica, con búsqueda por nombre.
- Si el centro no tiene personal registrado, mostrar como aplicador al usuario de la sesión.
- Atención prestada, en un campo de texto obligatorio.
- Cantidad de referencia en mililitros, escrita por el aplicador.
- Cantidad a aplicar calculada según el peso y la altura.
- Selector de vacunas disponibles, visible sin necesidad de seleccionar primero al usuario.

Cada opción del selector de vacunas muestra:

- Nombre.
- Tipo.
- Procedencia.

Al seleccionar una vacuna:

- Habilitar el selector de lote de esa vacuna.
- Mostrar el laboratorio y la disponibilidad según la región del usuario cuando esté seleccionado.
- Mostrar la fecha de vencimiento del lote elegido.
- Mostrar cuántas dosis faltan del esquema y cuándo corresponde un refuerzo.

Opciones:

- Guardar vacunación.
- Limpiar selección.
- Cancelar selección.
- Ver el resumen de la selección con el usuario, la vacuna, el lote, la cantidad y la fecha.

Validaciones antes de guardar:

- Debe haber un usuario seleccionado.
- Debe haber una vacuna seleccionada.
- Debe elegirse el lote de la vacuna.
- Debe indicarse la cantidad de referencia, mayor que 0 y menor o igual a 100 ml.
- Debe indicarse el aplicador.
- La atención prestada es obligatoria.
- La fecha no puede ser futura.
- El peso es obligatorio y debe estar entre 1 y 500 kg.
- La altura es obligatoria y debe estar entre 30 y 300 cm.
- El lote elegido debe ser válido y no puede estar vencido para la fecha indicada.
- La vacuna debe estar disponible en la región del usuario.

Al guardar:

- Registrar la aplicación de la vacuna seleccionada con su lote.
- Guardar usuario, vacuna, lote, cantidad aplicada, peso, altura, dosis, tipo, fecha, atención, centro y aplicador.
- Mostrar un mensaje de éxito con la dosis y la cantidad registradas.
- Limpiar la selección y la atención prestada.

La cantidad a aplicar se calcula con la superficie corporal de Mosteller: `√(peso kg × altura cm / 3600)`, escalada respecto a `1,73 m²`. El aplicador escribe la cantidad de referencia y el formulario muestra la cantidad calculada antes de guardar.

---

## Perfil 2 — Sub-región

Vistas del perfil:

- Historial de certificados médicos.
- Registrar certificado médico, accesible desde la barra superior.
- Verificar certificado médico, accesible desde la barra superior.

Todas las búsquedas, listados y certificados deben quedar limitados a los usuarios de la sub-región del usuario.

### Historial de certificados médicos

Debe mostrar los certificados médicos otorgados en la sub-región:

- Código único.
- Usuario y cédula.
- Fecha de emisión.
- Fecha de vigencia.
- Estado: Vigente o Vencido.
- Centro de salud.
- Cantidad de exámenes.
- Acción para ver el certificado y descargarlo desde la verificación pública.

Debe incluir un contador de certificados otorgados. El afiche descargable del certificado médico está disponible en la vista de registrar certificado.

Debe incluir el botón **Verificar estado de todos**, que comprueba si algún certificado está vencido. Por ahora solo se implementa el diseño del botón.

### Verificar certificado médico

Debe permitir buscar y verificar certificados por:

- Cédula del usuario.
- Nombre del usuario.
- Código único del certificado.
- Estado: vigente o vencido.
- Centro de salud.
- Rango de fechas de emisión: desde y hasta.

Debe mostrar todos los certificados que coincidan con la búsqueda y los filtros, con su estado, vigencia, sello, firma digital y opción de imprimir o guardar como PDF.

### Registrar certificado médico

> **Perfil 2 — Sub-región.** La gestión de certificados médicos de la región de salud recopila, en la sección de datos del examen, la fecha, el centro, el bioanalista y el médico evaluador; permite registrar los tipos de exámenes realizados con sus respectivas descripciones, resultados, unidades y valores de referencia; y cuenta con un apartado de documentación para adjuntar archivos (PDF o foto), verificar el sello y la firma digital, confirmar que el usuario cumple con los requisitos, y procesar o guardar el examen para, finalmente, descargar el certificado en PDF o enviarlo por correo.

La vista debe organizarse en las siguientes secciones:

#### Datos del usuario y del examen

El formulario debe permitir buscar un usuario registrado o registrar uno nuevo cuando no exista.

Datos del usuario:

- Buscar al usuario por cédula o nombre.
- Seleccionar un usuario registrado dentro de la sub-región.
- Cargar automáticamente sus datos: nombre completo, cédula, fecha de nacimiento, sexo, teléfono, correo, centro de salud, región, dirección, tipo de sangre y alergias. El peso y la altura se muestran desde la última dosis registrada.
- Mostrar los datos del usuario solo como referencia; no deben modificarse desde este formulario.
- Si el usuario no está registrado, ofrecer un apartado para registrarlo con nombre completo, cédula, fecha de nacimiento, sexo, teléfono, correo, centro de salud, dirección, tipo de sangre y alergias.
- Al registrar un usuario nuevo, agregarlo a la sub-región y seleccionarlo automáticamente para el certificado.
- No permitir guardar ni procesar el certificado sin un usuario registrado seleccionado.

Datos del examen:

- Fecha del examen.
- Centro de salud.
- Bioanalista.
- Médico evaluador.

Todos los datos del examen son obligatorios. La fecha no debe ser futura.

#### Tipos de exámenes realizados

Debe permitir registrar uno o varios tipos de examen realizados. Por cada tipo de examen:

- Tipo de examen.
- Descripción.
- Resultado.
- Unidad.
- Valores de referencia.

Opciones:

- Agregar un tipo de examen.
- Agregar varios exámenes antes de procesar el certificado.
- Editar los datos de un tipo de examen.
- Quitar un tipo de examen de la lista.
- Ver el listado completo de exámenes registrados para el certificado.
- Mostrar el contador de exámenes agregados.

Debe existir al menos un examen registrado para poder procesar el certificado.

#### Documentación

Debe permitir:

- Adjuntar archivos en formato PDF o foto.
- Ver el nombre y el tipo de cada archivo adjunto.
- Reemplazar o eliminar un archivo adjunto.
- Verificar el sello del documento.
- Verificar la firma digital del documento.
- Mostrar el resultado de cada verificación como válido o no válido.

El sistema no debe permitir procesar el certificado si la documentación obligatoria no está adjunta o si el sello y la firma digital no fueron verificados correctamente.

#### Requisitos del usuario

Debe mostrar una lista de comprobación con:

- Vacunas obligatorias completas.
- Exámenes requeridos procesados como aptos.
- Documentación obligatoria adjunta.
- Sello y firma digital verificados.

Cada requisito debe mostrar si se cumple o no. Si falta algún requisito, indicar cuál falta y bloquear el procesamiento del certificado.

#### Procesar o guardar

Debe ofrecer dos acciones:

- **Guardar:** conserva el examen en estado pendiente o borrador para completarlo después.
- **Procesar:** valida toda la información y deja el examen en estado procesado.

Antes de procesar, validar:

- Usuario previamente registrado y seleccionado.
- Fecha, centro, bioanalista y médico evaluador completos.
- Al menos un tipo de examen con descripción, resultado, unidad y valores de referencia.
- Documentación adjunta.
- Sello y firma digital verificados.
- Requisitos del usuario cumplidos.

Al procesar:

- Cambiar el estado del examen a procesado.
- Impedir que se procese dos veces el mismo examen.
- Mostrar un mensaje de éxito.
- Habilitar la generación del certificado.

#### Certificado

Cuando el examen esté procesado y el usuario cumpla los requisitos, debe permitir:

- Ver una vista previa del certificado.
- Descargar el certificado en PDF.
- Enviar el certificado por correo electrónico.

El certificado debe incluir:

- Datos del usuario.
- Datos del examen: fecha, centro, bioanalista y médico evaluador.
- Tipos de exámenes realizados con descripción, resultado, unidad y valores de referencia.
- Resultado de la verificación del sello y la firma digital.
- Fecha de emisión y vigencia.
- Código único del certificado.
- Datos del emisor.
- Observaciones cuando correspondan.

No se debe permitir descargar ni enviar el certificado si el examen no está procesado o si el usuario no cumple los requisitos.

---

## Perfil 3 — Master

Vistas del perfil:

- Historial de vacunaciones.
- Historial de certificados médicos.
- Centros de vacunación.
- Consultar perfil.
- Avisos.

### Historial de vacunaciones

Debe mostrar el historial completo de la red con filtros por:

- Búsqueda por texto.
- Cédula.
- Orden por fecha, usuario, vacuna, aplicador o lote.
- Selección múltiple de vacunas, tipos, años, usuarios, lotes y centros. Los usuarios se buscan escribiendo su nombre o cédula.
- Aplicado por.
- Rango de fechas.
- Limpiar filtros.

Además, debe mostrar estadísticas de:

- Usuarios vacunados.
- Vacunas y centros con actividad.

La tabla debe incluir el centro de salud de cada aplicación, además de los datos de fecha, vacuna, lote, dosis o refuerzo, cantidad aplicada, usuario, aplicador y atención.

### Historial de certificados médicos

Debe mostrar los certificados médicos otorgados en toda la red:

- Código único.
- Usuario y cédula.
- Fecha de emisión y vigencia.
- Estado: Vigente o Vencido.
- Centro de salud.
- Cantidad de exámenes.
- Acción para ver el certificado y descargarlo desde la verificación pública.

Debe incluir un contador de certificados otorgados y el afiche descargable del certificado médico.

### Centros de vacunación

Debe permitir registrar un nuevo centro con:

- Nombre del centro.
- Estado.
- Municipio.
- Parroquia.
- Dirección.
- Teléfono.

Validaciones:

- Nombre, estado y municipio son obligatorios.
- No se puede registrar un centro con un nombre que ya exista.

Debe mostrar el listado de centros con:

- Nombre y dirección.
- Ubicación: municipio, parroquia y estado.
- Teléfono.
- Acción de eliminar.

Al eliminar un centro:

- Pedir confirmación en la misma vista.
- Permitir cancelar la eliminación.
- Conservar los usuarios y el historial de vacunación.
- Eliminar las cuentas de acceso del Perfil 1 vinculadas al centro.
- Mostrar un mensaje con el resultado y la cantidad de registros conservados.

Debe mostrar el mensaje “No hay centros de vacunación registrados” dentro de la tabla, sin ocultarla.

### Consultar perfil

Debe permitir buscar un usuario por cédula en toda la red y mostrar:

- Ficha completa del usuario.
- Esquema de vacunación.
- Aplicaciones registradas.
- Vacunas y dosis pendientes.
- Estado del certificado.
- Vista previa e impresión del certificado cuando el usuario cumpla los requisitos.
- Advertencia con los requisitos faltantes cuando no los cumpla.

### Avisos

Debe permitir preparar avisos por correo para los usuarios de la red.

Campos y opciones:

- Tipo de aviso: Vacunación pendiente, Vacunas faltantes o Emergencia.
- Usuario de referencia, opcional, con búsqueda por cédula o nombre.
- Resumen del usuario seleccionado, con centro y vacunas pendientes.
- Búsqueda de destinatarios por nombre o correo.
- Agregar destinatarios con correo electrónico.
- Quitar destinatarios seleccionados.
- Asunto del aviso.
- Mensaje del aviso.
- Variables disponibles en el mensaje: nombre del destinatario, usuario, centro y vacunas faltantes.
- Botón “Registrar y preparar correo”.
- Botón “Limpiar formulario”.

Comportamiento:

- Al cambiar el tipo de aviso, cargar la plantilla correspondiente de asunto y mensaje.
- Al seleccionar un usuario, mostrar su información y las vacunas pendientes.
- Validar que haya al menos un destinatario.
- Validar que el asunto y el mensaje no estén vacíos.
- Registrar los avisos generados.
- Mantener visible la tabla de avisos; si no hay avisos, mostrar el mensaje dentro de la tabla.
- Mostrar un mensaje de éxito con la cantidad de avisos y los correos.
- Ofrecer la opción de abrir el cliente de correo.
- Indicar que, en la demostración, el correo no se envía realmente.
