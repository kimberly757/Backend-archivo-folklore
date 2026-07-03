const { Cultores, Obras, Municipios, Parroquias, CategoriasObra, Multimedia } = require('../models');
const { Op } = require('sequelize');

function inicioDeMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

// Crecimiento porcentual real comparando registros de este mes vs el mes anterior.
// null cuando no hay base de comparación (mes anterior en 0), para que el frontend
// pueda mostrar un estado neutral en vez de un porcentaje engañoso (división por cero).
function calcularCrecimientoPct(esteMes, mesAnterior) {
  if (mesAnterior === 0) return null;
  return Math.round(((esteMes - mesAnterior) / mesAnterior) * 100);
}

exports.getResumen = async (req, res, next) => {
  try {
    const ahora = new Date();
    const inicioMesActual = inicioDeMes(ahora);
    const inicioMesAnterior = new Date(inicioMesActual);
    inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);

    const [
      totalCultores,
      cultoresMesActual,
      cultoresMesAnterior,
      totalObras,
      todasLasCategorias,
      obrasConCategoria,
      cultoresConParroquia,
      totalMunicipios,
      recientes,
      piezaDestacada,
    ] = await Promise.all([
      Cultores.count(),
      Cultores.count({ where: { fecha_registro: { [Op.gte]: inicioMesActual } } }),
      Cultores.count({ where: { fecha_registro: { [Op.gte]: inicioMesAnterior, [Op.lt]: inicioMesActual } } }),
      Obras.count({ where: { estatus: { [Op.ne]: 'eliminado' } } }),
      CategoriasObra.findAll({ attributes: ['nombre'], order: [['nombre', 'ASC']] }),
      Obras.findAll({
        where: { estatus: { [Op.ne]: 'eliminado' } },
        attributes: ['id_obra'],
        include: [{ model: CategoriasObra, as: 'categoria', attributes: ['nombre'] }],
      }),
      Cultores.findAll({
        attributes: ['id_cultor'],
        include: [{ model: Parroquias, as: 'parroquia', attributes: ['id_municipio'] }],
      }),
      Municipios.count(),
      Obras.findAll({
        where: { estatus: { [Op.ne]: 'eliminado' } },
        order: [['fecha_postulacion', 'DESC']],
        limit: 5,
        include: [
          { model: Cultores, as: 'cultor', attributes: ['primer_nombre', 'primer_apellido'] },
          {
            model: Parroquias,
            as: 'parroquia',
            attributes: ['nombre'],
            include: [{ model: Municipios, as: 'municipio', attributes: ['nombre'] }],
          },
        ],
      }),
      Obras.findOne({
        where: { estatus: 'aprobado', destacado_galeria: 'si' },
        order: [['fecha_aprobacion', 'DESC']],
        include: [{ model: Multimedia, as: 'multimedia' }],
      }),
    ]);

    // Distribución por categoría de obra: se parte de TODAS las categorías existentes
    // en categorias_obra (aunque tengan 0 obras) para que el resumen se vea completo,
    // y se les suma el conteo real de obras (se agrupan en memoria porque el volumen
    // de datos es bajo). Una obra sin id_categoria asignado no cuenta en ninguna barra
    // (es un dato inconsistente, no una categoría real).
    const conteoPorCategoria = new Map(todasLasCategorias.map((c) => [c.nombre, 0]));
    obrasConCategoria.forEach((obra) => {
      if (!obra.categoria?.nombre) return;
      const nombre = obra.categoria.nombre;
      conteoPorCategoria.set(nombre, (conteoPorCategoria.get(nombre) || 0) + 1);
    });
    // El porcentaje es la proporción real de cada categoría sobre el total de obras
    // categorizadas (no relativo a la categoría con más obras), para que la altura de
    // la barra refleje el peso real de esa categoría y no infle la más numerosa a 100%.
    const totalCategorizadas = Math.max(1, [...conteoPorCategoria.values()].reduce((suma, n) => suma + n, 0));
    const distribucionCategorias = Array.from(conteoPorCategoria.entries()).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: Math.round((cantidad / totalCategorizadas) * 100),
    }));

    const municipiosCubiertos = new Set(
      cultoresConParroquia
        .map((c) => c.parroquia?.id_municipio)
        .filter((id) => id !== undefined && id !== null)
    ).size;

    const recientesFormateados = recientes.map((obra) => ({
      id_obra: obra.id_obra,
      titulo: obra.titulo || 'Sin título',
      cultorNombre: obra.cultor
        ? `${obra.cultor.primer_nombre || ''} ${obra.cultor.primer_apellido || ''}`.trim()
        : null,
      region: obra.parroquia?.municipio?.nombre || obra.parroquia?.nombre || null,
      fecha: obra.fecha_postulacion,
    }));

    const portada = piezaDestacada?.multimedia?.find((m) => m.es_portada === 'si') || piezaDestacada?.multimedia?.[0];

    res.json({
      cultores: {
        total: totalCultores,
        crecimientoPct: calcularCrecimientoPct(cultoresMesActual, cultoresMesAnterior),
      },
      obras: {
        total: totalObras,
      },
      territorio: {
        municipiosCubiertos,
        totalMunicipios,
        porcentaje: totalMunicipios > 0 ? Math.round((municipiosCubiertos / totalMunicipios) * 100) : 0,
      },
      distribucionCategorias,
      recientes: recientesFormateados,
      piezaDestacada: piezaDestacada
        ? {
            titulo: piezaDestacada.titulo || 'Sin título',
            imagenUrl: portada?.url_archivo || null,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

exports.getReportesResumen = async (req, res, next) => {
  try {
    const [totalCultores, totalObras, totalCategorias, todosMunicipios, obrasConUbicacion, obrasConFecha] = await Promise.all([
      Cultores.count(),
      Obras.count({ where: { estatus: { [Op.ne]: 'eliminado' } } }),
      CategoriasObra.count(),
      // Traemos TODOS los municipios registrados en la BD
      Municipios.findAll({ attributes: ['nombre'], order: [['nombre', 'ASC']] }),
      Obras.findAll({
        where: { estatus: { [Op.ne]: 'eliminado' } },
        attributes: ['id_obra'],
        include: [{
          model: Parroquias,
          as: 'parroquia',
          attributes: ['nombre'],
          include: [{ model: Municipios, as: 'municipio', attributes: ['nombre'] }],
        }],
      }),
      Obras.findAll({
        where: { estatus: { [Op.ne]: 'eliminado' }, fecha_postulacion: { [Op.ne]: null } },
        attributes: ['fecha_postulacion'],
      }),
    ]);

    // Patrimonio por municipio: se parte de TODOS los municipios en la BD (con 0 obras),
    // luego se suman las obras reales que tienen parroquia asociada a cada uno.
    // El porcentaje se calcula sobre el total de obras CON ubicación registrada.
    const conteoPorMunicipio = new Map(todosMunicipios.map((m) => [m.nombre, 0]));
    obrasConUbicacion.forEach((obra) => {
      const nombre = obra.parroquia?.municipio?.nombre;
      if (!nombre) return;
      conteoPorMunicipio.set(nombre, (conteoPorMunicipio.get(nombre) || 0) + 1);
    });
    const totalConUbicacion = Math.max(1, [...conteoPorMunicipio.values()].reduce((s, n) => s + n, 0));
    const patrimonioPorMunicipio = Array.from(conteoPorMunicipio.entries())
      .map(([municipio, cantidad]) => ({
        municipio,
        cantidad,
        porcentaje: Math.round((cantidad / totalConUbicacion) * 100),
      }))
      // Ordenar: primero los que tienen obras (mayor a menor), luego los que tienen 0 (alfabético)
      .sort((a, b) => {
        if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;
        return a.municipio.localeCompare(b.municipio, 'es');
      });

    // Tendencia de crecimiento del inventario: total acumulado de obras por mes,
    // en los últimos 6 meses (incluye lo acumulado antes de esa ventana como base).
    const ahora = new Date();
    const meses = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      meses.push({ year: d.getFullYear(), month: d.getMonth(), label: MESES_CORTOS[d.getMonth()] });
    }
    const inicioVentana = new Date(meses[0].year, meses[0].month, 1);
    const conteoPorMes = meses.map(() => 0);
    let acumuladoPrevio = 0;
    obrasConFecha.forEach((obra) => {
      const fecha = new Date(obra.fecha_postulacion);
      if (fecha < inicioVentana) {
        acumuladoPrevio += 1;
        return;
      }
      const idx = meses.findIndex((m) => m.year === fecha.getFullYear() && m.month === fecha.getMonth());
      if (idx !== -1) conteoPorMes[idx] += 1;
    });
    let acumulado = acumuladoPrevio;
    const tendenciaMensual = meses.map((m, i) => {
      acumulado += conteoPorMes[i];
      return { mes: m.label, cantidad: conteoPorMes[i], acumulado };
    });

    res.json({
      totalCultores,
      totalObras,
      totalCategorias,
      patrimonioPorMunicipio,
      tendenciaMensual,
    });
  } catch (err) {
    next(err);
  }
};
