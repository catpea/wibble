#!/usr/bin/env node
//#g main { group: 'nodes', data: { id: 'src-index' } }

import fs from 'fs';
import {access, readFile, writeFile, mkdir} from 'fs/promises';
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
const template = ejs.compile( (await readFile(path.join(__dirname, 'src', 'template.ejs'))).toString(), {});

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

for (const entry of registry.keys()){
  const htmlPath = path.join('wibble', `graph-${entry}.html`);
  const jsonPath = path.join('wibble', `graph-${entry}.json`);
  const data = registry.get(entry);
  try { await access('wibble') } catch { await mkdir('wibble') }
  await writeFile(jsonPath, JSON.stringify(data))
  await writeFile(htmlPath, template({data}))
}
