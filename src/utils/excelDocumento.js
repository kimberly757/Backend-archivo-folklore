const ExcelJS = require('exceljs');

const COLOR_TERRACOTA = 'FFC05640';
const COLOR_ENCABEZADO_TABLA = 'FF3B2C28';
const COLOR_FILA_PAR = 'FFF7F2EC';

async function enviarExcel(res, nombreArchivo, { titulo, columnas, filas }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Archivo de Folklore - Región Táchira';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Reporte', {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  // Fila 1: título de marca, con celdas combinadas y color de la identidad del panel.
  hoja.mergeCells(1, 1, 1, columnas.length);
  const celdaTitulo = hoja.getCell(1, 1);
  celdaTitulo.value = 'ARCHIVO DE FOLKLORE — REGIÓN TÁCHIRA';
  celdaTitulo.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 13 };
  celdaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TERRACOTA } };
  celdaTitulo.alignment = { vertical: 'middle', horizontal: 'left' };
  hoja.getRow(1).height = 26;

  // Fila 2: subtítulo del documento + fecha de generación
  hoja.mergeCells(2, 1, 2, columnas.length);
  const celdaSubtitulo = hoja.getCell(2, 1);
  celdaSubtitulo.value = `${titulo}  —  Generado: ${new Date().toLocaleString('es-VE')}`;
  celdaSubtitulo.font = { italic: true, color: { argb: 'FF807471' }, size: 9 };
  hoja.getRow(2).height = 18;

  // Fila 3: encabezados de columna con estilo
  const filaEncabezado = hoja.getRow(3);
  columnas.forEach((col, i) => {
    const celda = filaEncabezado.getCell(i + 1);
    celda.value = col.header;
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO_TABLA } };
    celda.alignment = { vertical: 'middle' };
    hoja.getColumn(i + 1).width = col.width || 20;
  });
  filaEncabezado.height = 20;

  // Filas de datos, alternando color de fondo para facilitar la lectura
  filas.forEach((fila, idx) => {
    const filaExcel = hoja.addRow(fila);
    if (idx % 2 === 1) {
      filaExcel.eachCell((celda) => {
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_FILA_PAR } };
      });
    }
    filaExcel.eachCell((celda) => {
      celda.border = {
        bottom: { style: 'thin', color: { argb: 'FFE8E4DE' } },
      };
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { enviarExcel };
