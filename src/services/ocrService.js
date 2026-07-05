const { createWorker } = require('tesseract.js');

const WORKER_TIMEOUT = 45_000;
const OCR_TIMEOUT = 20_000;

let workerPromise = null;

function conTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

async function obtenerWorker() {
  if (!workerPromise) {
    workerPromise = conTimeout(createWorker('spa'), WORKER_TIMEOUT, 'Worker creation')
      .catch(err => {
        workerPromise = null;
        throw err;
      });
  }
  return workerPromise;
}

const KEYWORD_PATTERNS = [
  /REP[BÚU]BLICA\s+BOLIVARIANA\s+DE\s+VENEZUELA/i,
  /C[CÉE]DULA\s+DE\s+IDENTIDAD/i,
];

// Las cédulas venezolanas reales se imprimen con puntos como separador de miles
// (ej. "V 30.981.941"), no como un bloque de dígitos seguidos — por eso el patrón
// acepta puntos/espacios opcionales entre grupos de dígitos, además del formato
// sin separadores que se usa al escribir la cédula en el formulario ("V-30981941").
const ID_PATTERN = /[VE]\s*-?\s*[\d.]{6,12}/i;

// Extrae el número de cédula del texto OCR y lo normaliza a "V-30981941"
// (sin puntos ni espacios), sin importar cómo estuviera separado en la imagen.
function extraerCedula(text) {
  const match = text.match(ID_PATTERN);
  if (!match) return null;
  const limpio = match[0].replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const letra = limpio[0];
  const numero = limpio.slice(1);
  return `${letra}-${numero}`;
}

// Intenta extraer nombres y apellidos del texto OCR.
// Patrones comunes en cédulas venezolanas:
//   "APELLIDOS: PÉREZ\nNOMBRES: JUAN"
//   "PÉREZ, JUAN" (cerca del nro de cédula)
//   "PÉREZ JUAN"
function extraerNombres(text) {
  console.log('[OCR EXTRAER] INICIO - versión con filtro');
  let apellidos = null;
  let nombres = null;

  // Patrón 1: se busca primero NOMBRES y luego APELLIDOS (mismo orden en que se
  // llenan los campos del formulario). La etiqueta "NOMBRES" es tolerante a errores
  // de OCR en la letra intermedia — el Tesseract suele leerla mal (ej. "NOMBRES" ->
  // "nomeres", perdiendo la B) — por eso "NOM[A-Z]?RES?" acepta cualquier letra (o
  // ninguna) en esa posición y sigue reconociendo la etiqueta como "nombres" real.
  //
  // Importante: la etiqueta se busca sin distinguir mayúsculas (puede venir mal
  // leída en minúscula), pero el VALOR capturado despues de la etiqueta exige
  // mayúsculas real (sin /i) — así se ignora el ruido en minúscula que deja el OCR
  // alrededor (firmas, palabras sueltas como "Director", "my", etc.), que de otra
  // forma se colaba como si fuera parte del nombre.
  const patronEtiquetaNombres = /NOM[A-Z]?RES?\s*:?\s*/i;
  // Tolerante a que el OCR lea la 'P' de "APELLIDOS" como otra letra
  // (ej. "areLLIDOS", "APELLIDOS", "AELLIDOS").
  const patronEtiquetaApellidos = /A[A-Z]?ELLIDOS?\s*:?\s*/i;

  function valorDespuesDe(patronEtiqueta) {
    const matchEtiqueta = text.match(patronEtiqueta);
    if (!matchEtiqueta) return null;
    const restante = text.slice(matchEtiqueta.index + matchEtiqueta[0].length);
    // Solo se toma la primera línea después de la etiqueta — así no se arrastran
    // palabras de etiquetas posteriores (CEDULA, NACIONALIDAD, etc.) como parte
    // del nombre.
    const lineaRestante = restante.split('\n')[0];
    const matchValor = lineaRestante.match(/[A-ZÁÉÍÓÚÑ]+(?:\s+[A-ZÁÉÍÓÚÑ]+)*/);
    if (!matchValor) return null;

    // Se filtran palabras que:
    //   - tienen menos de 3 caracteres (ej. "NX", ruido de OCR)
    //   - corresponden a etiquetas o datos de la cédula, no a nombres reales
    //     (ej. "VENEZOLANO", "IDENTIDAD", "NACIMIENTO")
    const NO_NOMBRES = new Set([
      'VENEZOLANO', 'VENEZOLANA', 'NACIONALIDAD', 'CEDULA', 'IDENTIDAD',
      'FECHA', 'SEXO', 'ESTADO', 'LUGAR', 'FIRMA', 'EXPEDICION',
      'VENCIMIENTO', 'NACIMIENTO', 'SOLTERA', 'SOLTERO', 'CASADA', 'CASADO',
    ]);
    const palabrasReales = matchValor[0].trim().split(/\s+/)
      .filter(p => p.length >= 3 && !NO_NOMBRES.has(p));

    return palabrasReales.length > 0 ? palabrasReales.join(' ') : null;
  }

  nombres = valorDespuesDe(patronEtiquetaNombres);
  apellidos = valorDespuesDe(patronEtiquetaApellidos);
  console.log('[OCR EXTRAER] nombres extraídos:', nombres, 'apellidos extraídos:', apellidos);

  if (apellidos && nombres) {
    return { apellidos, nombres };
  }

  // Si se encontraron los nombres pero no los apellidos (el OCR pudo haber leído
  // mal la etiqueta APELLIDOS como gibberish), se buscan los apellidos en las
  // líneas anteriores, recorriendo de abajo arriba para encontrar la línea más
  // cercana que contenga 2+ palabras en mayúsculas (apellidos reales).
  if (!apellidos && nombres) {
    console.log('[OCR EXTRAER] buscando apellidos en líneas anteriores a NOMBRES');
    const matchNombres = text.match(patronEtiquetaNombres);
    console.log('[OCR EXTRAER] matchNombres:', matchNombres ? matchNombres[0] + ' en índice ' + matchNombres.index : 'null');
    if (matchNombres) {
      const textoAntes = text.slice(0, matchNombres.index);
      const lineasAntes = textoAntes.split('\n').map(l => l.trim()).filter(Boolean);
      console.log('[OCR EXTRAER] lineasAntes:', JSON.stringify(lineasAntes));
      for (let i = lineasAntes.length - 1; i >= 0; i--) {
        const linea = lineasAntes[i];
        const palabras = linea.match(/[A-ZÁÉÍÓÚÑ]{3,}/g);
        console.log('[OCR EXTRAER] línea', i, JSON.stringify(linea), '→ palabras:', JSON.stringify(palabras));
        if (palabras && palabras.length >= 2) {
          const NO_NOMBRES = new Set([
            'VENEZOLANO', 'VENEZOLANA', 'NACIONALIDAD', 'CEDULA', 'IDENTIDAD',
            'FECHA', 'SEXO', 'ESTADO', 'LUGAR', 'FIRMA', 'EXPEDICION',
            'VENCIMIENTO', 'NACIMIENTO', 'SOLTERA', 'SOLTERO', 'CASADA', 'CASADO',
          ]);
          const palabrasReales = palabras.filter(p => !NO_NOMBRES.has(p));
          if (palabrasReales.length >= 2) {
            apellidos = palabrasReales.slice(0, 2).join(' ');
            console.log('[OCR EXTRAER] heurística encontró apellidos:', apellidos);
            break;
          }
        }
      }
      if (!apellidos) console.log('[OCR EXTRAER] heurística no encontró apellidos en ninguna línea');
    }
  }

  if (apellidos && nombres) {
    return { apellidos, nombres };
  }

  // Patrón 2: "APELLIDO, NOMBRE" cerca de línea con cédula
  const lineas = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const linea of lineas) {
    const matchComa = linea.match(/^([A-ZÁÉÍÓÚÑ\s]+),\s*([A-ZÁÉÍÓÚÑ\s]+)$/i);
    if (matchComa) {
      if (!apellidos) apellidos = matchComa[1].trim();
      if (!nombres) nombres = matchComa[2].trim();
      if (apellidos && nombres) return { apellidos, nombres };
    }
  }

  // Patrón 3: última línea con dos palabras (solo letras mayúsculas y espacios,
  // sin guiones, puntuación ni números).
  if (lineas.length >= 2 && (!apellidos || !nombres)) {
    const ultimaLinea = lineas[lineas.length - 1];
    if (/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(ultimaLinea)) {
      const palabras = ultimaLinea.split(/\s+/).filter(Boolean);
      if (palabras.length >= 2) {
        if (!apellidos) apellidos = palabras.slice(0, -1).join(' ');
        if (!nombres) nombres = palabras[palabras.length - 1];
        return { apellidos, nombres };
      }
    }
  }

  return { apellidos, nombres };
}

function normalizarTexto(t) {
  return t ? t.replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, '').trim().toUpperCase() : '';
}

async function validarCedula(buffer) {
  let w;
  try {
    w = await obtenerWorker();
  } catch (err) {
    throw Object.assign(new Error('El servicio OCR no está disponible en este momento. Intente más tarde.'), {
      status: 503,
      ocrError: err.message,
      ocrFallo: true,
    });
  }

  let resultado;
  try {
    resultado = await conTimeout(w.recognize(buffer), OCR_TIMEOUT, 'OCR recognition');
  } catch (err) {
    throw Object.assign(new Error('No se pudo analizar la imagen. Asegúrese de que sea una imagen clara de una Cédula de Identidad.'), {
      status: 422,
      ocrError: err.message,
      ocrFallo: true,
    });
  }

  const text = resultado.data.text;
  const tienePalabrasClave = KEYWORD_PATTERNS.some(p => p.test(text));
  const tieneNumeroIdentidad = ID_PATTERN.test(text);

  const valido = tienePalabrasClave && tieneNumeroIdentidad;

  const resultadoExtraccion = {
    valido,
    textoExtraido: text.trim(),
    coincidencias: {
      palabrasClave: tienePalabrasClave,
      numeroIdentidad: tieneNumeroIdentidad,
    },
    cedulaExtraida: valido ? extraerCedula(text) : null,
    nombresExtraidos: valido ? extraerNombres(text) : null,
  };

  return resultadoExtraccion;
}

async function cerrarWorker() {
  if (workerPromise) {
    try {
      const w = await workerPromise;
      await w.terminate();
    } catch (_) {}
    workerPromise = null;
  }
}

module.exports = { validarCedula, cerrarWorker };
