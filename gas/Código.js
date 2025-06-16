// =================================================================
//                 CÓDIGO COMPLETO PARA CODE.GS (VERSIÓN FINAL)
// =================================================================

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Acciones')
      .addItem('Abrir Calculadora de Sesiones', 'showDialog')
      .addSeparator()
      .addItem('Gestión Actividades','showActividadesDialog')
      .addToUi();
}

function showDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
      .setWidth(600)
      .setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, 'Calculadora de Sesiones de Clase');
}

/**
 * Lee el rango de vacaciones y devuelve las fechas como cadenas de texto ISO.
 * Esto asegura una transferencia de datos sin problemas al frontend.
 * @returns {Array<string> | {error: string}} Un array de strings de fecha o un objeto de error.
 */
function getVacationDates() {
  try {
    const sheetName = 'CONFIGURACIÓN';
    const rangeName = 'B12:Z13';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return { error: `La hoja llamada "${sheetName}" no fue encontrada.` };
    }
    
    const values = sheet.getRange(rangeName).getValues();
    const dates = values
      .flat()
      .filter(cell => cell instanceof Date && !isNaN(cell))
      .map(date => date.toISOString()); // <-- CAMBIO CLAVE: Convertir a string
      
    return dates;
  } catch (e) {
    return { error: `Error interno al leer vacaciones: ${e.message}` };
  }
}

/**
 * Función pública que recibe los datos, los combina con las vacaciones
 * y llama a la lógica de cálculo principal.
 */
function SESIONESCLASEBACKEND(datosFormulario) {
  try {
    const { fecha_inicio, fecha_fin, eval1, eval2, eval3, dias_sesiones } = datosFormulario;

    // Obtenemos las vacaciones como strings
    const vacacionesStrings = getVacationDates();
    if (vacacionesStrings.error) {
      throw new Error(vacacionesStrings.error);
    }
    
    // <-- CAMBIO CLAVE: Reconstruimos los objetos Date aquí
    const vacacionesFechas = vacacionesStrings.map(dateString => new Date(dateString));
    
    const diasClase = dias_sesiones.map(item => item.dia);
    const sesionesPorDia = dias_sesiones.map(item => parseFloat(item.sesiones));
    const fechasEvaluaciones = [new Date(eval1), new Date(eval2), new Date(eval3)];

    return contarSesionesClasePorEvaluacion(
      new Date(fecha_inicio), new Date(fecha_fin), fechasEvaluaciones,
      diasClase, sesionesPorDia, vacacionesFechas
    );

   
   
     return resultadoCalculado;
    

  } catch (e) {
    return { error: `Error en la función SESIONESCLASE: ${e.message}` };
  }
}

/**
 * FUNCIÓN MOTOR (LÓGICA PRINCIPAL)
 * Esta función no cambia, siempre ha esperado objetos Date.
 */
function contarSesionesClasePorEvaluacion(fechaInicio, fechaFin, fechasEvaluaciones, diasClase, sesionesPorDia, vacaciones) {
  const diasSemanaNum = (diasClase || []).filter(d => typeof d === 'string' && d.length > 0).map(d => {
    switch (d.toLowerCase()) {
      case 'domingo': return 0; case 'lunes': return 1; case 'martes': return 2;
      case 'miércoles': return 3; case 'miercoles': return 3; case 'jueves': return 4;
      case 'viernes': return 5; case 'sábado': return 6; case 'sabado': return 6; default: return -1;
    }
  }).filter(n => n >= 0);

  const sesionesMap = {};
  diasSemanaNum.forEach((diaNum, index) => { sesionesMap[diaNum] = sesionesPorDia[index] || 0; });

  const vacacionesSet = new Set( (vacaciones || []).filter(v => v instanceof Date && !isNaN(v)).map(d => new Date(d).setHours(0, 0, 0, 0)) );

  const [eval1, eval2] = fechasEvaluaciones.map(f => {
    const d = new Date(f); d.setHours(0, 0, 0, 0); return d;
  });

  const resultado = [0, 0, 0];
  let actual = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  actual.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  while (actual <= fin) {
    const diaSemana = actual.getDay();
    const esLectivo = diasSemanaNum.includes(diaSemana);
    const esVacacion = vacacionesSet.has(actual.getTime());

    if (esLectivo && !esVacacion) {
      const sesiones = sesionesMap[diaSemana] || 0;
      if (actual <= eval1) resultado[0] += sesiones;
      else if (actual <= eval2) resultado[1] += sesiones;
      else resultado[2] += sesiones;
    }
    actual.setDate(actual.getDate() + 1);
  }
  return resultado;
}


function writeResultsToSheet(results) {
  try {
    if (!Array.isArray(results) || results.length !== 3) {
      throw new Error("Datos de resultados no válidos.");
    }
    
    const sheetName = 'CONFIGURACIÓN';
    const rangeName = 'C6:E6';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`No se pudo encontrar la hoja "${sheetName}".`);
    }

    const dataToWrite = [results]; // .setValues espera un array 2D
    sheet.getRange(rangeName).setValues(dataToWrite);

    return { success: true, message: "¡Resultados registrados en la hoja!" };

  } catch (e) {
    return { error: `Error al escribir en la hoja: ${e.message}` };
  }
}


