#!/usr/bin/env node
import util from 'util';
const glob = util.promisify((await import("glob")).default);

// scan all files,
// extract tags
// create graph

const files = await glob('**/*.js', {ignore: '**/node_modules/**'});
console.log(files);
