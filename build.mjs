import fs from 'node:fs/promises';
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',png:'image/png',svg:'image/svg+xml'};
const assets={};for(const file of await fs.readdir('public')){assets['/'+file]={type:types[file.split('.').pop()]||'application/octet-stream',data:(await fs.readFile('public/'+file)).toString('base64')}}
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await fs.writeFile('dist/server/index.js','const ASSETS='+JSON.stringify(assets)+';\n'+await fs.readFile('src/worker.js','utf8'));
await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Mauzer built: '+Object.keys(assets).length+' assets');
