const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('../core.js');
require('../planning.js');
require('../workflows.js');
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
  const prompt=C.missionPrompt(p,'standard','programmation','','',[],'Claude',true);assert(prompt.includes('RÉSULTAT VALIDÉ'));assert(!prompt.includes('NE PAS UTILISER'));assert(!prompt.includes('NON VALIDÉ'));
  assert(C.markdown(p).includes('Résultat validé : RÉSULTAT VALIDÉ'));
});

test('V3 context selection, task proposal and normalization are deterministic and idempotent',()=>{
  assert.throws(()=>C.proposeTask('   '));const t=C.proposeTask('Créer une illustration');assert.equal(t.role,'medias');
  const override=C.proposeTask('Créer une illustration','tests','Claude');assert.equal(override.role,'tests');assert.equal(override.owner,'Claude');
  const p=C.starter().projects[0];p.documents.find(d=>d.id==='design').content='CHARTE SÉLECTIONNABLE';p.documents.find(d=>d.id==='technical').content='TECHNIQUE SÉLECTIONNABLE';
  let prompt=C.missionPrompt(p,'standard','medias','','',undefined,'ChatGPT',true);assert(prompt.includes('CHARTE SÉLECTIONNABLE'));assert(!prompt.includes('TECHNIQUE SÉLECTIONNABLE'));
  prompt=C.missionPrompt(p,'standard','medias','','',['technical'],'Claude',true);assert(!prompt.includes('CHARTE SÉLECTIONNABLE'));assert(prompt.includes('TECHNIQUE SÉLECTIONNABLE'));
  const s=C.normalizeState(C.starter());assert.deepEqual(C.normalizeState(s),s);
});


function validatedTask(id,role='programmation',deps=[]) {return {...C.proposeTask('Mission '+id,role),id,status:'done',legacyCompleted:false,result:'Résultat '+id,evidence:'Contrôles réellement exécutés',dependsOn:deps};}
test('V3.1 dependencies detect missing, transitive and cyclic prerequisites without losing data',()=>{
  const a=validatedTask('a'),b=validatedTask('b','tests',['a']),c=validatedTask('c','livraison',['b']);const p=C.normalizeProject({name:'Chaîne',workItems:[a,b,c]});
  assert.equal(C.dependencyIssues(p,p.workItems[2]).length,0);p.workItems[0].status='review';C.reconcileDependencies(p);
  assert.equal(p.workItems[1].status,'review');assert.equal(p.workItems[2].status,'review');assert.equal(p.workItems[2].result,'Résultat c');assert.equal(C.completedTasks(p).length,0);
  p.workItems[0].dependsOn=['missing'];assert(C.dependencyIssues(p,p.workItems[0]).some(x=>x.reason==='Prérequis introuvable'));
  p.workItems[0].dependsOn=['b'];assert(C.dependencyIssues(p,p.workItems[0]).some(x=>x.reason==='Dépendance circulaire'));
  assert.throws(()=>C.validateTask(p,p.workItems[2],{...p.workItems[2],status:'doing'}),/prérequis/);
});
test('V3.1 suggested relays are explicit, editable and deduplicated',()=>{
  const p=C.normalizeProject({name:'Relais',workItems:[validatedTask('a')]});const s=C.nextSuggestions(p);assert.equal(s.length,1);assert.equal(s[0].role,'tests');assert.equal(p.workItems.length,1);
  const t=C.suggestedTask(p,s[0].key);assert.deepEqual(t.dependsOn,['a']);assert(t.inputs.includes('Résultat a'));p.workItems.push(t);assert.equal(C.nextSuggestions(p).length,0);
  assert.throws(()=>C.suggestedTask(p,s[0].key));t.status='done';t.result='Tests';t.evidence='Succès';assert(C.nextSuggestions(p).some(x=>x.role==='livraison'));
  p.workItems[0].status='review';assert.equal(C.nextSuggestions(p).length,0);
});
test('V3.1 release requires validated tasks, test evidence and renewed signoff after changes',()=>{
  const p=C.normalizeProject({name:'Livraison',workItems:[validatedTask('a'),validatedTask('b','tests',['a'])]});assert.equal(C.releaseReadiness(p).ready,false);
  p.releasePlan={version:'1.2.0',rollback:'Restaurer la version précédente et la sauvegarde',checks:Object.fromEntries(C.RELEASE_CHECKS.map(([id])=>[id,true])),reviewSignature:C.releaseSignature(p)};
  assert.equal(C.releaseReadiness(p).ready,true);assert(C.releaseNotes(p).includes('Résultat a'));
  const restored=C.normalizeProject(JSON.parse(JSON.stringify(p)));assert.equal(C.releaseReadiness(restored).ready,true);
  restored.workItems[0].evidence='Nouveaux tests';assert.equal(C.releaseReadiness(restored).ready,false);assert(C.releaseReadiness(restored).missing.some(x=>x.includes('changé')));
});
test('V3.1 GitHub overview is GET-only and retains partial permission errors',async()=>{
  const calls=[];const gh=new GitHub(()=>'',async(url,opt)=>{calls.push({url,opt});if(url.endsWith('/repos/me/project'))return response(200,{default_branch:'main'});if(url.includes('check-runs'))return response(403,{});if(url.endsWith('/releases/latest'))return response(404,{});if(url.includes('/status'))return response(200,{sha:'abc',statuses:[]});return response(200,[]);});
  const o=await gh.overview({owner:'me',repo:'project',branch:'feature/été'});assert.equal(o.branch,'feature/été');assert(o.errors.checks);assert.equal(o.release,null);assert(calls.every(x=>x.opt.method==='GET'));assert(calls.some(x=>x.url.includes('feature%2F%C3%A9t%C3%A9')));
  assert.equal(C.githubHealth(o).clear,false);
});
test('V3.1 GitHub never treats empty, failed, pending or inconsistent checks as confirmed',()=>{
  assert.equal(C.githubHealth({}).clear,false);
  const good={errors:{},status:{sha:'abc',statuses:[]},checks:{check_runs:[{head_sha:'abc',status:'completed',conclusion:'success'}]}};assert(C.githubHealth(good).clear);
  assert(C.githubHealth({...good,status:{statuses:[{state:'failure'}]}}).failed);
  assert(C.githubHealth({...good,checks:{check_runs:[{status:'in_progress'}]}}).pending);
  assert.equal(C.githubHealth({...good,status:{sha:'changed',statuses:[]}}).clear,false);
  assert.equal(C.githubHealth({...good,errors:{checks:'Interdit'}}).clear,false);
});


test('V3.1 shared dossier keeps the dependency chain and revalidation rules',()=>{
  const p=C.normalizeProject({name:'Source',workItems:[validatedTask('a'),validatedTask('b','tests',['a'])]});const other=C.normalizeProject({name:'Destination'});
  const received=C.applyShared(other,C.sharedPayload(p));assert.deepEqual(received.workItems.find(t=>t.id==='b').dependsOn,['a']);assert.equal(C.completedTasks(received).length,2);
  received.workItems.find(t=>t.id==='a').status='review';C.reconcileDependencies(received);assert.equal(received.workItems.find(t=>t.id==='b').status,'review');assert.equal(C.completedTasks(received).length,0);
});


test('V3.2 modes normalize without removing data or unknown preferences',()=>{
  const raw=C.starter();raw.preferences={detailMode:'advanced',custom:'conservé'};raw.projects[0].handoffs=[{id:'old',title:'Ancienne mission',to:'Claude',rating:5,result:'Conservé'}];
  const n=C.normalizeState(raw);assert.equal(n.preferences.detailMode,'advanced');assert.equal(n.preferences.custom,'conservé');assert.equal(n.projects[0].handoffs[0].rating,5);assert.equal(C.normalizeState({...raw,preferences:{detailMode:'inconnu'}}).preferences.detailMode,'beginner');assert.deepEqual(C.normalizeState(n),n);
});
function evaluationFixture(){return C.normalizeProject({name:'Évaluations',handoffs:[
  {id:'a',title:'Mission A',to:'ChatGPT',role:'programmation',outcome:'done',result:'Résultat A',rating:4,evaluatedAt:'2026-11-17T10:00:00Z'},
  {id:'b',title:'Mission B',to:'ChatGPT',role:'tests',outcome:'partial',result:'Résultat B',rating:0,evaluatedAt:'2026-11-17T11:00:00Z'},
  {id:'c',title:'Mission C',to:'Claude',role:'tests',outcome:'failed',result:'Résultat C',rating:2,evaluatedAt:'2026-11-17T12:00:00Z'},
  {id:'pending',title:'Attente',to:'ChatGPT',outcome:'pending',rating:5,result:'Pas encore contrôlé',evaluatedAt:'2026-11-17T12:00:00Z'},
  {id:'legacy',title:'Ancienne note',to:'Claude',outcome:'done',rating:5,result:'Ancien'},
  {id:'empty',title:'Sans résultat',to:'Claude',outcome:'done',rating:5,evaluatedAt:'2026-11-17T12:00:00Z'},
  {id:'invalid',title:'Sans date valide',to:'Claude',outcome:'done',result:'Invalide',rating:5,evaluatedAt:'inconnue'},
  {id:'human',title:'Travail humain',to:'Moi',outcome:'done',result:'Humain',rating:5,evaluatedAt:'2026-11-17T12:00:00Z'}]});}
test('V3.2 AI denominators use evaluated missions and optional ratings correctly',()=>{
  const p=evaluationFixture(),[g,c]=C.missionStats(p);assert.equal(g.total,3);assert.equal(g.evaluated,2);assert.equal(g.excluded,1);assert.equal(g.rated,1);assert.equal(g.average,4);assert.equal(g.successRate,50);assert.equal(c.evaluated,1);assert.equal(c.average,2);assert.equal(c.failed,1);assert.equal(c.excluded,3);
  assert.equal(C.missionStats(p,'programmation','ChatGPT')[0].evaluated,1);assert.equal(C.missionStats(p,'unassigned','Claude')[0].evaluated,0);assert.equal(C.missionStats(p,'design')[0].average,null);
});
test('V3.2 exported AI report is auditable and excludes incomplete evaluations',()=>{
  const report=C.missionReport(evaluationFixture(),'tests','ChatGPT');assert(report.includes('Mission B [b]'));assert(!report.includes('Mission A'));assert(!report.includes('Ancienne note'));assert(!report.includes('Attente'));assert(report.includes('1 évaluée(s) / 1 archivée(s)'));assert(report.includes('Non notée'));
});


test('task prompt contains only the selected task unless context is explicitly requested',()=>{
  const p=C.starter().projects[0];p.context='CONTEXTE À EXCLURE';p.decisions='RÈGLE PROJET À EXCLURE';p.documents[0].content='DOCUMENT À EXCLURE';p.workItems=[{...C.proposeTask('Corriger le bouton'),id:'selected',objective:'Objectif précis',inputs:'fichier.js',criteria:'Cliquer fonctionne',result:'ANCIEN RÉSULTAT À EXCLURE',evidence:'ANCIEN TEST À EXCLURE'},validatedTask('AUTRE TÂCHE À EXCLURE')];
  const prompt=C.missionPrompt(p,'complet','programmation','selected','Tester au clavier',undefined,'Claude');
  for(const value of ['Corriger le bouton','Objectif précis','fichier.js','Cliquer fonctionne','Tester au clavier','Mission pour Claude'])assert(prompt.includes(value));
  for(const value of ['CONTEXTE À EXCLURE','RÈGLE PROJET À EXCLURE','DOCUMENT À EXCLURE','AUTRE TÂCHE À EXCLURE','ANCIEN RÉSULTAT À EXCLURE','ANCIEN TEST À EXCLURE',p.name])assert(!prompt.includes(value));
  assert(C.missionPrompt(p,'complet','programmation','selected','',undefined,'Claude',true).includes('CONTEXTE À EXCLURE'));
});
