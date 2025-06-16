/**
 * Calcula el número de sesiones de clase en tres periodos de evaluación.
 * Los resultados se mostrarán en tres celdas adyacentes.
 *
 * @param {date} fechaInicio Fecha de inicio del curso.
 * @param {date} fechaFin Fecha de fin del curso.
 * @param {A1:A10} vacaciones Rango de celdas con las fechas de vacaciones.
 * @param {date} eval1 Fecha de la primera evaluación.
 * @param {date} eval2 Fecha de la segunda evaluación.
 * @param {date} eval3 Fecha de la tercera evaluación (o examen final).
 * @param {B1:B2} diasClase Rango con los nombres de los días de clase (ej. "Lunes").
 * @param {C1:C2} sesionesPorDia Rango con el número de sesiones para cada día de clase.
 * @returns {Array<Array<number>>} Un array con el conteo de sesiones para cada uno de los 3 periodos.
 * @customfunction
 */
function SESIONESCLASE(fechaInicio, fechaFin, vacaciones, eval1, eval2, eval3, diasClase, sesionesPorDia) {
  // Helper para convertir rangos de celdas (que son arrays 2D) en arrays 1D.
  const flattenRange = (range) => {
    if (!Array.isArray(range)) return [range]; // Si es una sola celda, la convierte en array
    return range.flat();
  };

  // Llama a la función de lógica principal con los datos aplanados
  return [contarSesionesClasePorEvaluacion(
    fechaInicio,
    fechaFin,
    [eval1, eval2, eval3],
    flattenRange(diasClase),
    flattenRange(sesionesPorDia),
    flattenRange(vacaciones)
  )];
}


/**
 * Función interna de lógica (no se llama directamente desde la hoja).
 * NO necesita el tag @customfunction.
 */
function contarSesionesClasePorEvaluacion(fechaInicio, fechaFin, fechasEvaluaciones, diasClase, sesionesPorDia, vacaciones) {
  const diasSemanaNum = (diasClase || [])
    .filter(d => typeof d === 'string' && d.length > 0)
    .map(d => {
      switch (d.toLowerCase()) {
        case 'domingo': return 0;
        case 'lunes': return 1;
        case 'martes': return 2;
        case 'miércoles': return 3;
        case 'miercoles': return 3;
        case 'jueves': return 4;
        case 'viernes': return 5;
        case 'sábado': return 6;
        case 'sabado': return 6;
        default: return -1;
      }
    })
    .filter(n => n >= 0);

  const sesionesMap = {};
  diasSemanaNum.forEach((diaNum, index) => {
    sesionesMap[diaNum] = sesionesPorDia[index] || 0;
  });

  const vacacionesSet = new Set(
    vacaciones
      .filter(v => v instanceof Date && !isNaN(v))
      .map(d => new Date(d).setHours(0, 0, 0, 0))
  );

  const [eval1, eval2] = fechasEvaluaciones.map(f => {
    const d = new Date(f);
    d.setHours(0, 0, 0, 0);
    return d;
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
      if (actual <= eval1) {
        resultado[0] += sesiones;
      } else if (actual <= eval2) {
        resultado[1] += sesiones;
      } else {
        resultado[2] += sesiones;
      }
    }
    actual.setDate(actual.getDate() + 1);
  }
  return resultado;
}