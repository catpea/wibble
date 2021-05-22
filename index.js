#!/usr/bin/env node
//#g main { group: 'nodes', data: { label: 'Wibble', id: 'src-index' } }

import fs from 'fs';
import {access, readFile, writeFile, mkdir, copyFile} from 'fs/promises';
import path from 'path';
import { dirname } from 'path';
import util from 'util';
import JSON5 from 'json5';
const glob = util.promisify((await import("glob")).default);
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const registry = new Map();
const files = (await glob('**/*.js', {ignore: 'node_modules/**'})).map(fileName=>path.resolve(fileName));
import ejs from 'ejs';
const template = ejs.compile( (await readFile(path.join(__dirname, 'src', 'template.ejs'))).toString(), {delimiter: '?'});

//#g main { group: 'nodes', data: { label: 'File Processor', id: 'file-processor' } }
//#g main { group: 'edges', data: { label: 'uses', id: 'src-index--file-processor', source: 'src-index', target: 'file-processor' } }
for (const filePath of files){
  for (const fileLine of (await readFile(filePath)).toString().split("\n")){
    if(fileLine.startsWith('//#g ')){
      const components = fileLine.substr(5).match(/(?<id>[a-zA-Z0-9-_]+)\s(?<data>.+)$/)
      const data = JSON5.parse(components.groups.data);
      const location = registry.has(components.groups.id)?registry.get(components.groups.id):registry.set(components.groups.id,[]).get(components.groups.id);
      location.push(data)
    }
  }
}

//#g main { group: 'nodes', data: { label: 'Registry Saver', id: 'registry-saver' } }
//#g main { group: 'edges', data: { label: 'uses', id: 'file-processor--registry-saver', source: 'file-processor', target: 'registry-saver' } }
for (const entry of registry.keys()){
  const htmlPath = path.join('wibble', `graph-${entry}.html`);
  const fileName = path.join(`graph-${entry}.json`);
  const jsonPath = path.join('wibble', fileName);
  const data = registry.get(entry);
  try { await access('wibble') } catch { await mkdir('wibble') }
  await writeFile(jsonPath, JSON.stringify(data, null, '  '))
  await writeFile(htmlPath, template({fileName}))
}

//#g main { group: 'nodes', data: { label: 'Static Assets', id: 'static-assets' } }
//#g main { group: 'edges', data: { label: 'uses', id: 'registry-saver--static-assets', source: 'registry-saver', target: 'static-assets' } }
await copyFile(path.join(__dirname, 'src', 'cy-style.json'), path.join('wibble', 'cy-style.json'));
