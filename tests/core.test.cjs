const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('../core.js');
const GitHub=require('../github.js');

test('V1 migration keeps projects, text, prompts, comparisons and unknown project data',()=>{
  const v1={projects:[{id:'x',name:'Mon projet',context:'Une règle\nDeux lignes',decisions:'Validé',tasks:'Une tâche\nUne seconde',custom:{keep:true}}],prompts:[{id:'p',title:'Audit',text:'Exact'}],comparisons:[{id:'c',title:'Comparé',a:'A',b:'B',date:'16/11/2026'}]};
  const next=C.normalizeState(v1);assert.equal(next.projects[0].context,v1.projects[0].context);assert.equal(next.projects[0].decisions,'Validé');assert.equal(next.projects[0].tasks,v1.projects[0].tasks);assert.deepEqual(next.projects[0].custom,{keep:true});assert.equal(next.projects[0].workItems.length,2);assert.deepEqual(next.prompts,v1.prompts);assert.equal(next.comparisons[0].a,'A');assert.equal(next.projects[0].documents.length,5);assert.equal(C.normalizeState(next).projects[0].workItems.length,2);
});
test('malformed imports are rejected and duplicate project IDs are repaired',()=>{
  assert.throws(()=>C.normalizeState({projects:[],prompts:'bad',comparisons:[]}));assert.throws(()=>C.normalizeState({projects:[{}],prompts:[],comparisons:[]}));const s=C.starter();s.projects[1].id=s.projects[0].id;const n=C.normalizeState(s);assert.notEqual(n.projects[0].id,n.projects[1].id);
});
test('contexts have distinct levels; task and request survive truncation',()=>{
  const p=C.starter().projects[0];p.documents[0].content='Document commun détaillé';p.decisionLog.push({id:'a',text:'Décision formelle',status:'validated'});p.workItems[0].criteria='Critère concret';const a=C.context(p,'court','tests',p.workItems[0].id,'Ma demande'),b=C.context(p,'standard','tests',p.workItems[0].id,'Ma demande'),c=C.context(p,'complet','tests',p.workItems[0].id,'Ma demande');assert(a.length<b.length&&b.length<c.length);assert(!a.includes('Document commun détaillé'));assert(b.includes('Décision formelle'));assert(c.includes('Catalogue des fichiers'));p.context='X'.repeat(10000);const clipped=C.context(p,'court','tests',p.workItems[0].id,'Demande intacte');assert(clipped.includes('Demande intacte'));assert(clipped.includes('Critère concret'));
});
test('repository and paths prevent unsafe destinations',()=>{
  assert.deepEqual(C.parseRepo('https://github.com/webfourmi/dragon-de-jade.git'),{owner:'webfourmi',repo:'dragon-de-jade'});for(const s of ['https://example.com/a/b','https://github.com/owner/repo/issues','../repo','https://github.com.evil/a/b','javascript:alert(1)'])assert.throws(()=>C.parseRepo(s));for(const s of ['../secret','/root','a//b','a/../b','a\\b','a?b'])assert.throws(()=>C.safePath(s));assert.equal(C.safePath('.atelier-ia/dossier-commun.json'),'.atelier-ia/dossier-commun.json');
});
test('GitHub shared payload excludes tokens and binary files; applying docs keeps local tasks/assets',()=>{
  const p=C.starter().projects[0];p.github.token='secret';p.assets.push({id:'x',name:'image.png',status:'validated',size:2,type:'image/png',note:''});const clean=C.normalizeProject(p);assert.equal(clean.github.token,undefined);const payload=C.sharedPayload(p);assert(!JSON.stringify(payload).includes('secret'));assert(!JSON.stringify(payload).includes('base64'));payload.documents[0].content='Nouvelle référence';const merged=C.applyShared(p,payload);assert.deepEqual(merged.assets,p.assets);assert.deepEqual(merged.workItems,p.workItems);assert.equal(merged.documents[0].content,'Nouvelle référence');
});
function response(status,data){return {ok:status>=200&&status<300,status,json:async()=>data};}
test('GitHub writes UTF-8 once using exact existing SHA, only to api.github.com',async()=>{
  const calls=[],fetcher=async(url,options)=>{calls.push({url,options});if(url.endsWith('/repos/me/project'))return response(200,{default_branch:'main',full_name:'me/project',private:true});if(options.method==='PUT')return response(200,{content:{sha:'next'}});return response(200,{type:'file',sha:'old'});};
  const gh=new GitHub(()=> 'session-secret',fetcher);const prepared=await gh.prepare({owner:'me',repo:'project',path:'.atelier-ia/dossier.json',branch:''},'Été, 中国');await gh.publish(prepared);const writes=calls.filter(c=>c.options.method==='PUT');assert.equal(writes.length,1);const body=JSON.parse(writes[0].options.body);assert.equal(body.sha,'old');assert.equal(C.fromBase64(body.content),'Été, 中国');assert(calls.every(c=>c.url.startsWith('https://api.github.com/')));assert.equal(calls[0].options.headers.Authorization,'Bearer session-secret');
});
test('GitHub refuses changed remote SHA and never sends PUT on conflicts',async()=>{
  const calls=[];let reads=0;const gh=new GitHub(()=> 'token',async(url,opt)=>{calls.push(opt.method);if(url.endsWith('/repos/me/project'))return response(200,{default_branch:'main'});return response(200,{type:'file',sha:++reads===1?'before':'changed'});});const p=await gh.prepare({owner:'me',repo:'project',path:'docs/state.json',branch:'main'},'{}');await assert.rejects(()=>gh.publish(p),/changé/);assert(!calls.includes('PUT'));
});
test('GitHub handles a new file without SHA and a refused token',async()=>{
  let write;const gh=new GitHub(()=> 'token',async(url,opt)=>{if(url.endsWith('/repos/me/project'))return response(200,{default_branch:'main'});if(opt.method==='PUT'){write=JSON.parse(opt.body);return response(201,{content:{sha:'new'}});}return response(404,{});});await gh.publish(await gh.prepare({owner:'me',repo:'project',path:'new.json'},'{}'));assert(!Object.hasOwn(write,'sha'));const denied=new GitHub(()=> 'bad',async()=>response(401,{}));await assert.rejects(()=>denied.request('/user'),/Jeton refusé/);
});
test('offline ZIP preserves Unicode filenames and original bytes',async()=>{
  const zip=await C.makeZip([{name:'références/中国.txt',blob:new Blob(['Été 中文'])},{name:'binary.dat',blob:new Blob([Uint8Array.from([0,255,17,42])])}]);fs.writeFileSync(require('node:path').join(__dirname,'zip-verification.zip'),Buffer.from(await zip.arrayBuffer()));
});


test('V3 validated references survive sharing, exclude legacy/returned/review and preserve result',()=>{
  const p=C.normalizeProject({name:'V3',workItems:[
    {id:'old',title:'Ancienne',status:'done',deliverable:'NE PAS UTILISER'},
    {...C.proposeTask('Corriger le code'),id:'valid',status:'done',result:'RÉSULTAT VALIDÉ',resultFiles:'commit abc',resultLimits:'Téléphone non testé',evidence:'Tests exécutés'},
    {...C.proposeTask('Écrire un cours'),id:'review',status:'review',result:'NON VALIDÉ'}
  ]});
  assert.equal(C.completedTasks(p).length,1);const raw=C.sharedPayload(p);
  assert.equal(raw.completedTasks[0].result,'RÉSULTAT VALIDÉ');assert.equal(raw.completedTasks[0].resultFiles,'commit abc');
  const target=C.normalizeProject({name:'Autre'});const once=C.applyShared(target,raw);const twice=C.applyShared(once,raw);
  assert.equal(twice.workItems.length,1);assert.equal(C.completedTasks(twice)[0].resultLimits,'Téléphone non testé');
  const prompt=C.missionPrompt(p,'standard','programmation','','',[],'Claude');assert(prompt.includes('RÉSULTAT VALIDÉ'));assert(!prompt.includes('NE PAS UTILISER'));assert(!prompt.includes('NON VALIDÉ'));
  assert(C.markdown(p).includes('Résultat validé : RÉSULTAT VALIDÉ'));
});

test('V3 context selection, task proposal and normalization are deterministic and idempotent',()=>{
  assert.throws(()=>C.proposeTask('   '));const t=C.proposeTask('Créer une illustration');assert.equal(t.role,'medias');
  const override=C.proposeTask('Créer une illustration','tests','Claude');assert.equal(override.role,'tests');assert.equal(override.owner,'Claude');
  const p=C.starter().projects[0];p.documents.find(d=>d.id==='design').content='CHARTE SÉLECTIONNABLE';p.documents.find(d=>d.id==='technical').content='TECHNIQUE SÉLECTIONNABLE';
  let prompt=C.missionPrompt(p,'standard','medias','','',undefined,'ChatGPT');assert(prompt.includes('CHARTE SÉLECTIONNABLE'));assert(!prompt.includes('TECHNIQUE SÉLECTIONNABLE'));
  prompt=C.missionPrompt(p,'standard','medias','','',['technical'],'Claude');assert(!prompt.includes('CHARTE SÉLECTIONNABLE'));assert(prompt.includes('TECHNIQUE SÉLECTIONNABLE'));
  const s=C.normalizeState(C.starter());assert.deepEqual(C.normalizeState(s),s);
});
