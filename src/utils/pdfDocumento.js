const PDFDocument = require('pdfkit');

// Paleta de marca del Archivo de Folklore (mismos tonos tierra del panel administrativo)
const COLOR_TERRACOTA = '#C05640';
const COLOR_TEXTO = '#281b18';
const COLOR_TEXTO_SECUNDARIO = '#807471';
const COLOR_ENCABEZADO_TABLA = '#3b2c28';
const COLOR_FILA_PAR = '#f7f2ec';
const COLOR_BORDE = '#e8e4de';

const MARGEN_X = 40;

function crearDocumentoPdf(res, nombreArchivo) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
  doc.pipe(res);
  return doc;
}

// Franja de color superior con el nombre del archivo y la fecha de generación.
// Se repite (más angosta) en cada página nueva para que el documento se sienta
// diseñado y no una simple lista de texto plano.
function dibujarBandaMarca(doc, { alta = false } = {}) {
  const anchoPagina = doc.page.width;
  const altura = alta ? 72 : 34;
  doc.rect(0, 0, anchoPagina, altura).fill(COLOR_TERRACOTA);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(alta ? 15 : 10)
    .text('ARCHIVO DE FOLKLORE', MARGEN_X, alta ? 18 : 10);
  if (alta) {
    doc.font('Helvetica').fontSize(9).text('Región Táchira · Patrimonio Cultural', MARGEN_X, 40);
  }
  doc.font('Helvetica').fontSize(8)
    .text(`Generado: ${new Date().toLocaleString('es-VE')}`, 0, alta ? 20 : 12, { align: 'right', width: anchoPagina - MARGEN_X });
  doc.fillColor(COLOR_TEXTO);
}

function dibujarEncabezado(doc, titulo, subtitulo) {
  dibujarBandaMarca(doc, { alta: true });
  doc.y = 90;
  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLOR_TEXTO).text(titulo, MARGEN_X);
  if (subtitulo) {
    doc.font('Helvetica').fontSize(10).fillColor(COLOR_TEXTO_SECUNDARIO).text(subtitulo, MARGEN_X);
  }
  doc.moveDown(1);

  // Redibuja una franja angosta en cada página siguiente, para que las tablas
  // largas que se parten en varias hojas no pierdan la identidad visual.
  doc.on('pageAdded', () => {
    dibujarBandaMarca(doc, { alta: false });
    doc.y = 50;
    doc.fillColor(COLOR_TEXTO);
  });
}

// Tabla con encabezado de color, bordes y filas alternadas. `columnas` es
// [{ header, prop }] y `anchos` proporciones relativas (no necesitan sumar 100).
function dibujarTabla(doc, { columnas, anchos, filas }) {
  const anchoDisponible = doc.page.width - MARGEN_X * 2;
  const totalProp = anchos.reduce((s, a) => s + a, 0);
  const anchosPx = anchos.map((a) => (a / totalProp) * anchoDisponible);
  const altoFila = 20;
  const altoEncabezado = 22;

  // width Y height juntos fuerzan que pdfkit trunque con "…" en una sola línea
  // en vez de envolver a una segunda línea que se monta sobre la fila siguiente.
  function dibujarFilaEncabezado(y) {
    doc.rect(MARGEN_X, y, anchoDisponible, altoEncabezado).fill(COLOR_ENCABEZADO_TABLA);
    let x = MARGEN_X;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
    columnas.forEach((col, i) => {
      doc.text(col, x + 6, y + 6, { width: anchosPx[i] - 10, height: altoEncabezado - 8, ellipsis: true, lineBreak: false });
      x += anchosPx[i];
    });
    return y + altoEncabezado;
  }

  let y = dibujarFilaEncabezado(doc.y);

  filas.forEach((fila, idx) => {
    if (y + altoFila > doc.page.height - 50) {
      doc.addPage();
      y = dibujarFilaEncabezado(70);
    }
    if (idx % 2 === 1) {
      doc.rect(MARGEN_X, y, anchoDisponible, altoFila).fill(COLOR_FILA_PAR);
    }
    doc.rect(MARGEN_X, y, anchoDisponible, altoFila).strokeColor(COLOR_BORDE).lineWidth(0.5).stroke();
    let x = MARGEN_X;
    doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_TEXTO);
    fila.forEach((valor, i) => {
      doc.text(String(valor ?? ''), x + 6, y + 5, { width: anchosPx[i] - 10, height: altoFila - 8, ellipsis: true, lineBreak: false });
      x += anchosPx[i];
    });
    y += altoFila;
  });

  doc.y = y + 16;
}

// Dibuja una tarjeta resumen en una posición fija (x, y) sin que el cursor
// interno de pdfkit (doc.x/doc.y) quede alterado al terminar: así se pueden
// dibujar varias tarjetas seguidas en la misma fila usando el mismo `y` y sin
// que cada llamada empuje a la siguiente hacia abajo.
function dibujarTarjetaResumen(doc, etiqueta, valor, x, y, ancho) {
  const cursorX = doc.x;
  const cursorY = doc.y;
  doc.roundedRect(x, y, ancho, 54, 8).fillAndStroke('#fdf7f2', COLOR_BORDE);
  doc.fillColor(COLOR_TEXTO_SECUNDARIO).font('Helvetica-Bold').fontSize(8)
    .text(etiqueta.toUpperCase(), x + 12, y + 10, { width: ancho - 24, height: 12, ellipsis: true, lineBreak: false });
  doc.fillColor(COLOR_TERRACOTA).font('Helvetica-Bold').fontSize(17)
    .text(String(valor), x + 12, y + 26, { width: ancho - 24, height: 20, ellipsis: true, lineBreak: false });
  doc.x = cursorX;
  doc.y = cursorY;
}

// Pie de página con numeración, agregado al final sobre todas las páginas ya generadas.
function agregarPiesDePagina(doc) {
  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i += 1) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(8).fillColor(COLOR_TEXTO_SECUNDARIO)
      .text(`Página ${i + 1} de ${rango.count} · Archivo de Folklore - Región Táchira`, MARGEN_X, doc.page.height - 30, {
        width: doc.page.width - MARGEN_X * 2,
        align: 'center',
      });
  }
}

module.exports = {
  MARGEN_X,
  COLOR_TERRACOTA,
  COLOR_TEXTO,
  COLOR_TEXTO_SECUNDARIO,
  COLOR_BORDE,
  crearDocumentoPdf,
  dibujarEncabezado,
  dibujarTabla,
  dibujarTarjetaResumen,
  agregarPiesDePagina,
};
