// grabar_estructura.js — Captura la estructura semántica de un generador.
//
//   node skill/scripts/grabar_estructura.js <protocolo.js> <salida.json>
//
// Sustituye la librería de composición por una que registra cada llamada antes
// de delegar en la real, y anula escribir() para no tocar el .docx. El resultado
// es la secuencia de llamadas en orden documental, que es de donde
// armar_jsonld.py reconstruye las secciones.
//
// Se lee el generador en vez de el .docx a propósito: el .docx ya perdió la
// distinción entre un párrafo y una viñeta, entre una tabla de glosario y una
// de indicadores. El generador la conserva.
'use strict';

const fs = require('fs');
const path = require('path');

const protocolo = path.resolve(process.argv[2]);
const salida = path.resolve(process.argv[3]);

if (!protocolo || !salida) {
  console.error('Uso: node grabar_estructura.js <protocolo.js> <salida.json>');
  process.exit(2);
}

const libPath = require.resolve(path.join(__dirname, '..', 'lib', 'hecam-lib.js'));
const real = require(libPath);

const SEMANTICAS = ['h1', 'h2', 'h3', 'bp', 'blt', 'nmb', 'note', 'who', 'caption',
                    'mkT', 'rTable', 'semaforo', 'biblio', 'tocItem', 'portada',
                    'firmas', 'controlCambios', 'dvd', 'blk'];

const rec = [];
const envuelto = Object.assign({}, real);

for (const fn of SEMANTICAS) {
  if (typeof real[fn] !== 'function') continue;
  envuelto[fn] = (...args) => {
    let seguros;
    try {
      seguros = JSON.parse(JSON.stringify(args));
    } catch (e) {
      seguros = ['<no serializable>'];
    }
    rec.push({ fn, args: seguros });
    return real[fn](...args);
  };
}

// buildDoc recibe los objetos de docx ya construidos: no son serializables y
// tampoco hacen falta, porque la estructura ya quedó en las llamadas anteriores.
envuelto.buildDoc = (titulo, codigo, version, children, fechaElab) => {
  rec.push({ fn: 'buildDoc', args: [titulo, codigo, version, null, fechaElab] });
  return {};
};

envuelto.escribir = (doc, ruta) => {
  rec.push({ fn: 'escribir', args: [String(ruta)] });
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, JSON.stringify(rec, null, 2), 'utf8');
  return Promise.resolve();
};

require.cache[libPath].exports = envuelto;
require(protocolo);
