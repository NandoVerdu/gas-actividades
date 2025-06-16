function showActividadesDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Dialog_Actividades')
      .setWidth(900)
      .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'Gestor de Actividades');
}

function getActividadesInitialData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetToObjects = (sheetName) => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw new Error(`La hoja "${sheetName}" no existe.`);
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) return [];
      const headers = data.shift();
      return data.map(row => {
        const obj = {};
        headers.forEach((header, i) => { if (header) obj[header] = row[i]; });
        return obj;
      });
    };
    
    const resultados = sheetToObjects('RESULTADOS');
    const criterios = sheetToObjects('CRITERIOS');
    const actividades = sheetToObjects('ACTIVIDADES');

    const groupedActividades = {};
    actividades.forEach(act => {
      const codigo = act.Código;
      if (!codigo) return;
      if (!groupedActividades[codigo]) groupedActividades[codigo] = [];
      groupedActividades[codigo].push(act);
    });

    return {
      resultados: resultados.map(r => r.resultadoAprendizaje).filter(Boolean),
      criteriosPorRA: resultados.reduce((acc, ra) => {
        const raText = ra.resultadoAprendizaje;
        if (raText) {
          acc[raText] = criterios.filter(c => c.resultadoAprendizaje === raText).map(c => c.criterioEvaluacion);
        }
        return acc;
      }, {}),
      existingActividades: groupedActividades
    };
  } catch (e) { return { error: e.message }; }
}

/**
 * Guarda la actividad creando UNA FILA POR CADA CRITERIO con horas o peso.
 */
function saveActividad(payload) {
  try {
    const sheetName = 'ACTIVIDADES';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    const generalData = payload.generalData;
    const vinculaciones = payload.vinculaciones;

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const newHeaders = ['Código', 'Nombre', 'Descripción', 'Duración', 'Sesiones', 'unidadDidactica', 'resultadoAprendizaje', 'criterioEvaluacion', 'distribucionPeso', 'horasCriterio', 'Contenidos', 'periodoEvaluacion', 'metodologia', 'agrupamientos', 'herramientasTic'];
      sheet.appendRow(newHeaders);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const allData = sheet.getDataRange().getValues();
    const idColumnIndex = headers.indexOf('Código');
    if (idColumnIndex === -1) throw new Error("La columna 'Código' no existe en 'ACTIVIDADES'.");

    for (let i = allData.length - 1; i >= 1; i--) {
        if (allData[i][idColumnIndex] == generalData.Código) {
            sheet.deleteRow(i + 1);
        }
    }

    const rowsToInsert = [];
    vinculaciones.forEach(vinc => {
      // Por cada criterio dentro de la vinculación, se crea una fila
      vinc.criterios.forEach(crit => {
        const rowData = headers.map(header => {
            switch (header) {
                case 'Código': return generalData.Código;
                case 'Nombre': return generalData.Nombre;
                case 'Descripción': return generalData.Descripción;
                case 'Duración': return generalData.Duración;
                case 'unidadDidactica': return generalData.unidadDidactica;
                case 'periodoEvaluacion': return generalData.periodoEvaluacion;
                case 'metodologia': return generalData.metodologia;
                case 'agrupamientos': return generalData.agrupamientos;
                case 'herramientasTic': return generalData.herramientasTic;
                
                // Datos del Resultado de Aprendizaje de este bloque
                case 'resultadoAprendizaje': return vinc.resultadoAprendizaje;
                
                // Datos específicos de este criterio
                case 'criterioEvaluacion': return crit.criterio;
                case 'horasCriterio': return crit.horas;
                case 'distribucionPeso': return crit.peso;
                
                default: return '';
            }
        });
        rowsToInsert.push(rowData);
      });
    });

    if (rowsToInsert.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
    }

    return { success: true, message: `Actividad "${generalData.Nombre}" guardada con ${rowsToInsert.length} registros de criterios.` };
  } catch (e) {
    Logger.log(e.stack);
    return { error: `Error al guardar: ${e.message}` };
  }
}