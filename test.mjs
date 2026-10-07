import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import worker from './dist/server/index.js';
// Isolated R2 contract double; never touches the live collection.
const data=new Map();const bucket={async put(key,value,options={}){const body=Buffer.from(await new Response(value).arrayBuffer());data.set(key,{body,httpMetadata:options.httpMetadata||{}})},async get(key,options={}){const o=data.get(key);if(!o)return null;const r=options.range;return {...o,size:o.body.length,body:r?o.body.subarray(r.offset,r.offset+r.length):o.body,json:async()=>JSON.parse(o.body.toString())}},async head(key){const o=data.get(key);return o?{size:o.body.length,httpMetadata:o.httpMetadata}:null},async delete(keys){for(const k of Array.isArray(keys)?keys:[keys])data.delete(k)},async list({prefix}){return {objects:[...data.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}}};
const origin='https://mauzer-highlights.danya-voloshko.chatgpt.site';let cookie='';
async function request(path,method='GET',body,headers={}){const r=await worker.fetch(new Request(origin+path,{method,headers:{origin,...(cookie?{cookie}:{}),...headers},...(body===undefined?{}:{body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)})}),{BUCKET:bucket});return r}
assert.equal((await request('/')).status,200);
assert.equal((await request('/api/highlights','POST',{})).status,401);
assert.equal((await request('/api/login','POST',{password:'wrong'})).status,401);
const login=await request('/api/login','POST',{password:'123'});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];assert.equal((await (await request('/api/session')).json()).admin,true);
const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';const bytes=new Uint8Array([1,2,3,4,5,6]);assert.equal((await request('/api/upload/'+id,'PUT',bytes,{'Content-Type':'video/mp4','Content-Length':'6'})).status,200);
assert.equal((await request('/api/highlights','POST',{id,title:'Test',start:8,end:3,duration:10})).status,400);
assert.equal((await request('/api/highlights','POST',{id,title:'Клатч',playlist:'Mirage',start:2,end:6,duration:10})).status,201);
assert.equal((await (await request('/api/highlights')).json()).items.length,1);
const range=await request('/media/'+id,'GET',undefined,{range:'bytes=2-4'});assert.equal(range.status,206);assert.deepEqual([...new Uint8Array(await range.arrayBuffer())],[3,4,5]);assert.equal((await request('/media/'+id,'GET',undefined,{range:'bytes=99-100'})).status,416);
assert.equal((await request('/api/highlights/'+id,'PATCH',{title:'Новий клатч',playlist:'Ейси',start:1,end:8})).status,200);
assert.equal((await (await request('/api/highlights')).json()).items[0].playlist,'Ейси');
assert.equal((await request('/api/highlights/'+id,'DELETE')).status,200);assert.equal((await (await request('/api/highlights')).json()).items.length,0);assert.equal((await request('/media/'+id)).status,404);
await request('/api/logout','POST');assert.equal((await (await request('/api/session')).json()).admin,false);
assert.equal((await request('/api/upload/'+id,'PUT',bytes,{'Content-Type':'video/mp4','Content-Length':'6'})).status,401);
const html=await fs.readFile('public/index.html','utf8'),client=await fs.readFile('public/app.js','utf8');for(const [,id]of client.matchAll(/\$\('#([a-zA-Z-]+)'\)/g))assert.ok(html.includes('id="'+id+'"'),'Missing UI '+id);
for(const [,src]of html.matchAll(/(?:src|href)="(\/[a-z][^"?]*)"/g))await fs.access('public'+src);
console.log('PASS: login, authorization, upload, create, invalid trim, playlist, edit, range playback, delete, logout, local assets and UI selectors.');
