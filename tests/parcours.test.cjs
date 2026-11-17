const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {IDBFactory}=require('./node_modules/fake-indexeddb');
const APP=path.resolve(__dirname,'..');
let Window;
const tick=()=>new Promise(resolve=>setTimeout(resolve,12));
async function setup(raw=null,fetcher=async()=>{throw new TypeError('Offline');},options={}){
  if(!Window)({Window}=await import('./node_modules/happy-dom/lib/index.js'));
  const window=new Window({url:'https://atelier.test/index.html',settings:{enableJavaScriptEvaluation:true,suppressInsecureJavaScriptEnvironmentWarning:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
  window.Blob=Blob;window.File=File;window.TextEncoder=TextEncoder;window.TextDecoder=TextDecoder;window.AbortController=AbortController;
  Object.defineProperty(window,'indexedDB',{value:new IDBFactory(),configurable:true});
  const downloads=[],objectURLs=new Map();let urlIndex=0;
  window.URL.createObjectURL=blob=>{const url='blob:test-'+(++urlIndex);objectURLs.set(url,blob);return url;};window.URL.revokeObjectURL=url=>objectURLs.delete(url);
  window.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push({name:this.download,blob:objectURLs.get(this.href)});};
  const copied=[];Object.defineProperty(window.navigator,'clipboard',{value:{writeText:async s=>copied.push(s)},configurable:true});
  window.confirm=()=>true;window.fetch=fetcher;
  if(!window.HTMLDialogElement.prototype.showModal)window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  if(!window.HTMLDialogElement.prototype.close)window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  if(raw!==null)window.localStorage.setItem('atelier-ia-v1',typeof raw==='string'?raw:JSON.stringify(raw));
  if(options.before)options.before(window);
  window.document.write(fs.readFileSync(path.join(APP,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''));
  for(const file of ['core.js','github.js','app.js'])window.eval(fs.readFileSync(path.join(APP,file),'utf8'));
  const $=selector=>window.document.querySelector(selector);
  const click=async(selector)=>{const el=$(selector);assert(el,'Missing control '+selector);el.click();await tick();};
  const fill=(selector,value,type='input')=>{const el=$(selector);assert(el,'Missing field '+selector);el.value=value;el.dispatchEvent(new window.Event(type,{bubbles:true}));};
  const submit=async(selector)=>{$(selector).dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await tick();};
  const nav=async(page)=>{window.location.hash='#'+page;window.dispatchEvent(new window.Event('hashchange'));await tick();};
  const state=()=>JSON.parse(window.localStorage.getItem('atelier-ia-v1'));
  const upload=async(selector,name,bytes,type)=>{const input=$(selector);Object.defineProperty(input,'files',{value:[new File([bytes],name,{type})],configurable:true});input.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();await tick();};
  return {window,$,click,fill,submit,nav,state,downloads,copied,upload,close:()=>window.happyDOM.close()};
}
function legacy(){return {projects:[{id:'old',name:'Projet existant',description:'Données de travail',context:'Contexte personnel conservé',decisions:'Une règle validée',tasks:'Ancienne tâche'}],prompts:[{id:'p',title:'Ma consigne',text:'À conserver'}],comparisons:[{id:'c',title:'Avant',a:'Réponse A',b:'Réponse B',date:'16/11/2026'}]};}
async function newTask(env,{title,role='programmation',status='ready',blocked='',depends=''}={}){
  await env.click('[data-action="new-task"]');env.fill('#taskTitle',title);env.fill('#taskRole',role);env.fill('#taskStatus',status);env.fill('#taskDeliverable','Un résultat concret');env.fill('#taskCriteria','Un contrôle observable');env.fill('#taskBlocked',blocked);if(depends){env.$('#taskDeps').value=depends;}await env.submit('#editorForm');
}

test('boot: dashboard, ten roles, documents and all navigation pages',async()=>{const e=await setup();try{assert.equal(e.state().projects.length,3);await e.nav('postes');assert.equal(e.$('#main').querySelectorAll('.role-card').length,10);for(const page of ['taches','dossier','transmissions','decisions','github','livraison','bilans','prompts','comparateur','sauvegardes','pilotage']){await e.nav(page);assert(e.$('h1')?.textContent,page);}assert.equal(e.$('#notice').hidden,true);}finally{await e.close();}});
test('migration and autosave preserve V1, create backup, survive restart',async()=>{const raw=legacy(),e=await setup(raw);let saved;try{const data=e.state();assert.equal(data.projects[0].context,raw.projects[0].context);assert.deepEqual(JSON.parse(e.window.localStorage.getItem('atelier-ia-before-v2')),raw);assert.equal(data.prompts[0].text,'À conserver');assert.equal(data.comparisons[0].a,'Réponse A');await e.nav('dossier');e.fill('#projectContext','Contexte enrichi sans perdre les données');saved=e.state();assert.equal(saved.projects[0].context,'Contexte enrichi sans perdre les données');assert(e.window.localStorage.getItem('atelier-ia-snapshots-v2'));}finally{await e.close();}const restarted=await setup(saved);try{assert.equal(restarted.state().projects[0].context,'Contexte enrichi sans perdre les données');assert.equal(restarted.state().projects[0].workItems.length,1);}finally{await restarted.close();}});
async function returnAndReview(e,id){
  await e.click('[data-action="edit-task"][data-id="'+id+'"]');
  await e.click('[data-action="return-task"]');e.fill('#missionResult','Résultat livré pour '+id);e.fill('#missionChecks','Vérifié sur la version de travail');await e.submit('#editorForm');
  await e.click('[data-action="edit-task"][data-id="'+id+'"]');e.fill('#taskStatus','review');await e.submit('#editorForm');
}
test('tasks: guided return, review, validation and dependency guards',async()=>{
  const e=await setup(legacy());try{
    await e.nav('taches');await newTask(e,{title:'Créer une illustration',role:'medias'});
    const first=e.state().projects[0].workItems.find(t=>t.title==='Créer une illustration');
    await newTask(e,{title:'Intégrer une illustration',depends:first.id});
    const second=e.state().projects[0].workItems.find(t=>t.title==='Intégrer une illustration');
    await e.click('[data-action="edit-task"][data-id="'+first.id+'"]');e.fill('#taskStatus','done');await e.submit('#editorForm');
    assert(e.$('#toast').textContent.includes('À vérifier'));await e.click('[data-action="close-dialog"]');
    await returnAndReview(e,second.id);await e.click('[data-action="edit-task"][data-id="'+second.id+'"]');e.fill('#taskStatus','done');await e.submit('#editorForm');
    assert(e.$('#toast').textContent.includes('blocages'));await e.click('[data-action="close-dialog"]');
    await returnAndReview(e,first.id);await e.click('[data-action="edit-task"][data-id="'+first.id+'"]');e.fill('#taskStatus','done');await e.submit('#editorForm');
    assert.equal(e.state().projects[0].workItems.find(t=>t.id===first.id).status,'done');
    await e.click('[data-action="edit-task"][data-id="'+second.id+'"]');e.fill('#taskStatus','done');await e.submit('#editorForm');
    assert.equal(e.state().projects[0].workItems.find(t=>t.id===second.id).status,'done');
    await e.click('[data-action="edit-task"][data-id="'+second.id+'"]');e.fill('#taskResult','Correction après validation');await e.submit('#editorForm');
    assert.equal(e.state().projects[0].workItems.find(t=>t.id===second.id).status,'review');
    e.fill('#taskSearch','introuvable');assert.equal(e.$('#main').querySelectorAll('.task-card').length,0);
  }finally{await e.close();}
});
test('common docs, decisions and contextual AI transmissions',async()=>{const e=await setup(legacy());try{await e.nav('dossier');await e.click('[data-action="edit-document"][data-id="design"]');e.fill('#documentContent','Couleurs vert sauge, photos en haute définition');await e.submit('#editorForm');await e.nav('decisions');await e.click('[data-action="new-decision"]');e.fill('#decisionText','Choix confirmé unique');e.fill('#decisionStatus','validated');await e.submit('#editorForm');await e.click('[data-action="new-decision"]');e.fill('#decisionText','Proposition encore incertaine');await e.submit('#editorForm');await e.nav('transmissions');let output=e.$('#transferOutput').value;assert(output.includes('Choix confirmé unique'));assert(!output.includes('vert sauge'));e.$('[data-context-doc="design"]').checked=true;e.$('[data-context-doc="design"]').dispatchEvent(new e.window.Event('input',{bubbles:true}));output=e.$('#transferOutput').value;assert(output.includes('vert sauge'));assert(!output.includes('Proposition encore incertaine'));e.fill('#transferLevel','court');let short=e.$('#transferOutput').value;assert(short.length<output.length);e.fill('#transferRequest','Produire un patron lisible');await e.click('[data-action="copy-transfer"]');assert(e.copied.at(-1).includes('Produire un patron lisible'));await e.click('[data-action="archive-transfer"]');assert.equal(e.state().projects[0].handoffs.length,1);}finally{await e.close();}});
test('files, full backup, ZIP and restore retain exact original bytes',async()=>{const e=await setup(legacy());let backup;try{await e.nav('dossier');await e.click('[data-action="dossier-tab"][data-id="assets"]');await e.click('[data-action="add-assets"]');const bytes=Uint8Array.from([0,255,21,33,17,200]);await e.upload('#assetFiles','original-haute-definition.bin',bytes,'application/octet-stream');assert.equal(e.state().projects[0].assets.length,1);await e.click('[data-action="export-all"]');await tick();assert.equal(e.downloads.length,1);backup=JSON.parse(await e.downloads[0].blob.text());assert.equal(Buffer.from(backup.attachments[0].base64,'base64').compare(Buffer.from(bytes)),0);await e.click('[data-action="export-project"]');await tick();const zip=e.downloads.at(-1);assert(zip.name.endsWith('.zip'));fs.writeFileSync(path.join(__dirname,'project-export.zip'),Buffer.from(await zip.blob.arrayBuffer()));}finally{await e.close();}const restored=await setup();try{await restored.nav('sauvegardes');await restored.click('[data-action="import-all"]');await restored.upload('#importFile','save.json',JSON.stringify(backup),'application/json');assert.equal(restored.state().projects[0].name,'Projet existant');assert.equal(restored.state().projects[0].assets.length,1);await restored.click('[data-action="export-all"]');await tick();const again=JSON.parse(await restored.downloads.at(-1).blob.text());assert.equal(again.attachments[0].base64,backup.attachments[0].base64);}finally{await restored.close();}});
test('project duplication shares original files but backup deduplicates attachments',async()=>{const e=await setup(legacy());try{await e.nav('dossier');await e.click('[data-action="dossier-tab"][data-id="assets"]');await e.click('[data-action="add-assets"]');await e.upload('#assetFiles','photo.bin','exact','application/octet-stream');await e.nav('sauvegardes');await e.click('[data-action="duplicate-project"][data-id="old"]');assert.equal(e.state().projects.length,2);await e.click('[data-action="export-all"]');await tick();const backup=JSON.parse(await e.downloads.at(-1).blob.text());assert.equal(backup.attachments.length,1);assert.equal(backup.data.projects[0].assets[0].id,backup.data.projects[1].assets[0].id);}finally{await e.close();}});
test('comparisons preserve drafts, notes and chosen result',async()=>{const e=await setup(legacy());try{await e.nav('comparateur');e.fill('#compareTitle','Ma question');e.fill('#answerA','Une réponse vérifiée');e.fill('#answerB','Une autre réponse');e.fill('#compareNotes','Source à vérifier');e.fill('#compareVerdict','Fusionner les passages confirmés');e.fill('#compareScoreA','4');await e.click('[data-action="save-comparison"]');const saved=e.state().comparisons[0];assert.equal(saved.notes,'Source à vérifier');assert.equal(saved.verdict,'Fusionner les passages confirmés');assert.equal(saved.scoreA,'4');await e.click('[data-action="reset-comparison"]');await e.click('[data-action="load-comparison"][data-id="'+saved.id+'"]');assert.equal(e.$('#answerA').value,'Une réponse vérifiée');assert.equal(e.$('#compareVerdict').value,saved.verdict);}finally{await e.close();}});
function apiResponse(status,body){return {ok:status>=200&&status<300,status,json:async()=>body};}
test('GitHub UI: public read, session token, issue dedup, preview, explicit send, no secret export',async()=>{
  const calls=[];let remote=null,writes=0;
  const fetcher=async(url,opt)=>{calls.push({url,opt});const u=new URL(url);if(u.pathname==='/user')return apiResponse(200,{login:'webfourmi'});if(u.pathname==='/repos/webfourmi/dragon-de-jade')return apiResponse(200,{full_name:'webfourmi/dragon-de-jade',default_branch:'main',private:false});if(u.pathname.endsWith('/issues'))return apiResponse(200,[{number:9,title:'Corriger un bouton',body:'À vérifier',html_url:'https://github.com/webfourmi/dragon-de-jade/issues/9',state:'open'},{number:10,title:'PR',pull_request:{}}]);if(u.pathname.endsWith('/contents/'))return apiResponse(200,[{name:'index.html',path:'index.html',type:'file'}]);if(u.pathname.endsWith('/dossier-commun.json')){if(opt.method==='PUT'){writes++;remote={sha:'sha-next',type:'file',encoding:'base64',content:JSON.parse(opt.body).content};return apiResponse(201,{content:{sha:'sha-next'}});}return remote?apiResponse(200,remote):apiResponse(404,{});}return apiResponse(404,{});};
  const e=await setup(null,fetcher);try{await e.nav('github');await e.click('[data-action="github-test"]');assert(e.$('#main').textContent.includes('Accès vérifié'));await e.click('[data-action="github-files"]');assert(e.$('#main').textContent.includes('index.html'));await e.click('[data-action="github-issues"]');assert(e.$('#main').textContent.includes('Corriger un bouton'));await e.click('[data-action="import-issue"][data-id="0"]');await e.click('[data-action="import-issue"][data-id="0"]');assert.equal(e.state().projects[0].workItems.filter(t=>t.source?.number===9).length,1);e.fill('#githubToken','github_session_fake_secret');await e.submit('#tokenForm');assert(e.$('#main').textContent.includes('Connecté en tant que webfourmi'));await e.click('[data-action="github-prepare"]');await e.click('[data-action="github-publish"]');assert.equal(writes,0);e.$('#publishConsent').checked=true;await e.click('[data-action="github-publish"]');assert.equal(writes,1);assert(e.state().projects[0].github.lastSync);await e.click('[data-action="export-all"]');await tick();const exported=await e.downloads.at(-1).blob.text();assert(!exported.includes('github_session_fake_secret'));assert(!e.window.localStorage.getItem('atelier-ia-v1').includes('github_session_fake_secret'));await e.click('[data-action="github-read-dossier"]');assert(e.$('#main').textContent.includes('Dossier actuellement sur GitHub'));await e.click('[data-action="github-disconnect"]');assert(!e.$('#main').textContent.includes('Connecté en tant que'));assert(calls.filter(c=>c.opt.method==='PUT').every(c=>c.url.startsWith('https://api.github.com/')));}finally{await e.close();}
});
test('corrupt storage is preserved and protected, invalid import does not overwrite',async()=>{const raw='{broken:json',e=await setup(raw);try{assert.equal(e.window.localStorage.getItem('atelier-ia-v1'),raw);assert(!e.$('#notice').hidden);await e.click('[data-action="new-project"]');assert(!e.$('#editor').hasAttribute('open'));await e.nav('sauvegardes');await e.click('[data-action="import-all"]');await e.upload('#importFile','bad.json','{"data":{"projects":[]}}','application/json');assert.equal(e.window.localStorage.getItem('atelier-ia-v1'),raw);}finally{await e.close();}});
test('quota failure preserves old storage, permits export and does not become a false conflict',async()=>{const e=await setup(legacy());try{const old=e.window.localStorage.getItem('atelier-ia-v1'),original=e.window.localStorage.setItem.bind(e.window.localStorage);Object.defineProperty(e.window.localStorage,'setItem',{value:function(key,val){if(key==='atelier-ia-v1')throw new Error('quota');return original(key,val);},configurable:true});await e.nav('dossier');e.fill('#projectContext','Travail non enregistré');e.fill('#projectContext','Travail non enregistré encore');assert.equal(e.window.localStorage.getItem('atelier-ia-v1'),old);assert(e.$('#notice').textContent.includes('échoué'));assert(!e.$('#notice').textContent.includes('autre fenêtre'));await e.click('[data-action="export-all"]');await tick();assert((await e.downloads.at(-1).blob.text()).includes('Travail non enregistré encore'));}finally{await e.close();}});
test('cross-window modifications protect against silent overwriting',async()=>{const e=await setup(legacy());try{const raw=e.window.localStorage.getItem('atelier-ia-v1');e.window.dispatchEvent(new e.window.StorageEvent('storage',{key:'atelier-ia-v1',newValue:'different'}));await e.nav('dossier');e.fill('#projectContext','Ne doit pas écraser');assert.equal(e.window.localStorage.getItem('atelier-ia-v1'),raw);assert(e.$('#notice').textContent.includes('autre fenêtre'));}finally{await e.close();}});
test('user content is rendered as text, never executed as HTML',async()=>{const raw=legacy();raw.projects[0].name='<img src=x onerror="alert(1)">';raw.projects[0].context='<script>alert(2)</script>';const e=await setup(raw);try{assert.equal(e.$('#main').querySelectorAll('img').length,0);await e.nav('dossier');assert.equal(e.$('#projectContext').value,raw.projects[0].context);assert.equal(e.$('#main').querySelectorAll('script').length,0);}finally{await e.close();}});
test('local-folder export writes the shared dossier and importable project to a dedicated subfolder',async()=>{const files=new Map();function directory(prefix=''){return {name:'Dossier choisi',queryPermission:async()=> 'granted',getDirectoryHandle:async name=>directory(prefix+name+'/'),getFileHandle:async name=>({createWritable:async()=>({write:async blob=>files.set(prefix+name,blob),close:async()=>{}})})};}const e=await setup(legacy(),undefined,{before:w=>w.showDirectoryPicker=async()=>directory()});try{await e.nav('dossier');await e.click('[data-action="dossier-tab"][data-id="folder"]');await e.click('[data-action="choose-folder"]');await tick();assert([...files.keys()].some(k=>k.endsWith('DOSSIER_COMMUN.md')));const project=[...files].find(([k])=>k.endsWith('projet.json'));assert(project);assert.equal(JSON.parse(await project[1].text()).data.projects[0].name,'Projet existant');assert([...files.keys()].every(k=>k.startsWith('mon-atelier-ia/')));}finally{await e.close();}});
test('AI drafts stay with their project when creating or switching projects',async()=>{const e=await setup(legacy());try{await e.nav('transmissions');e.fill('#transferRequest','Mission propre au premier projet');await e.click('[data-action="new-project"]');e.fill('#editName','Nouveau projet distinct');await e.submit('#editorForm');assert.equal(e.$('#transferRequest').value,'');e.fill('#projectSelect','old','change');assert.equal(e.$('#transferRequest').value,'Mission propre au premier projet');}finally{await e.close();}});
test('adding an exported project keeps existing projects',async()=>{const e=await setup(legacy());try{await e.nav('sauvegardes');await e.click('[data-action="import-project"]');await e.upload('#importFile','project.json',JSON.stringify({version:2,data:legacy()}),'application/json');assert.equal(e.state().projects.length,2);assert.notEqual(e.state().projects[0].id,e.state().projects[1].id);assert(e.state().projects[1].name.includes('importé'));}finally{await e.close();}});
test('GitHub read results from an earlier repository are discarded after changing repository',async()=>{let release;const e=await setup(null,async()=>new Promise(resolve=>release=resolve));try{await e.nav('github');e.$('[data-action="github-issues"]').click();await tick();e.fill('#repoUrl','webfourmi/le-fil-des-52-semaines');await e.submit('#repoForm');release(apiResponse(200,[{number:5,title:'Issue de l’ancien dépôt',state:'open'}]));await tick();assert(!e.$('#main').textContent.includes('Issue de l’ancien dépôt'));assert(e.$('#toast').textContent.includes('changé pendant la lecture'));}finally{await e.close();}});

test('V3 idea produces editable task, local prompt, persists selection and guided dashboard',async()=>{
  const e=await setup(legacy());let saved;try{
    await e.click('[data-action="guided-idea"]');e.fill('#idea','Ajouter une fonction de sauvegarde');await e.submit('#editorForm');
    assert.equal(e.window.location.hash,'#transmissions');const t=e.state().projects[0].workItems.at(-1);
    assert.equal(t.role,'programmation');assert.equal(t.owner,'ChatGPT');assert(t.criteria);assert(e.$('#transferOutput').value.includes(t.objective));
    e.fill('#transferTo','Claude');assert(e.$('#transferOutput').value.includes('Mission pour Claude'));
    await e.click('[data-action="archive-transfer"]');assert(e.state().projects[0].handoffs[0].content.includes('Mission pour Claude'));
    saved=e.state();
  }finally{await e.close();}
  const restart=await setup(saved);try{await restart.nav('transmissions');assert(restart.$('#transferOutput').value.includes('Mission pour Claude'));}finally{await restart.close();}
});

test('V2.3 completed task is kept, backed up, excluded from references until reviewed',async()=>{
  const raw=legacy();raw.schemaVersion=2;raw.projects[0].workItems=[{id:'old-done',title:'Ancien résultat',status:'done',deliverable:'Ancien livrable',criteria:'Contrôler',evidence:'Ancienne preuve',result:'Ancien texte',role:'contenus'}];
  const e=await setup(raw);try{
    const t=e.state().projects[0].workItems[0];assert.equal(t.status,'done');assert(t.legacyCompleted);
    assert.deepEqual(JSON.parse(e.window.localStorage.getItem('atelier-ia-before-v3')),raw);
    assert(e.$('#main').textContent.includes('à revérifier'));
    assert.equal(e.window.AtelierCore.completedTasks(e.state().projects[0]).length,0);
    await e.nav('taches');await e.click('[data-action="edit-task"][data-id="old-done"]');await e.submit('#editorForm');assert(e.$('#toast').textContent.includes('À vérifier'));
    e.fill('#taskStatus','review');await e.submit('#editorForm');await e.click('[data-action="edit-task"][data-id="old-done"]');e.fill('#taskStatus','done');await e.submit('#editorForm');
    assert.equal(e.window.AtelierCore.completedTasks(e.state().projects[0]).length,1);
  }finally{await e.close();}
});


function continuityFixture(){
  const C=require('../core.js'),raw=legacy();raw.schemaVersion=3;
  raw.projects[0].workItems=[{...C.proposeTask('Amélioration sauvegarde','programmation'),id:'program',status:'done',legacyCompleted:false,result:'Sauvegarde améliorée',evidence:'Export et import testés',workBranch:'feature/sauvegarde',pullRequest:'https://github.com/me/project/pull/12'}];
  raw.projects[0].github={owner:'me',repo:'project',branch:'feature/sauvegarde'};return raw;
}
test('V3.1 suggestions create one editable task with dependencies and GitHub mission context',async()=>{
  const e=await setup(continuityFixture());try{
    assert(e.$('#main').textContent.includes('La suite du projet'));await e.click('[data-action="accept-suggestion"]');assert.equal(e.$('#taskRole').value,'tests');e.fill('#taskTitle','Tests de sauvegarde');await e.submit('#editorForm');
    let p=e.state().projects[0];assert.equal(p.workItems.length,2);assert.deepEqual(p.workItems[1].dependsOn,['program']);assert.equal(e.$('[data-action="accept-suggestion"]'),null);
    await e.nav('taches');await e.click('[data-action="edit-task"][data-id="program"]');assert.equal(e.$('#taskWorkBranch').value,'feature/sauvegarde');await e.click('[data-action="task-to-transfer"]');assert(e.$('#transferOutput').value.includes('feature/sauvegarde'));assert(e.$('#transferOutput').value.includes('/pull/12'));
    await e.nav('taches');await e.click('[data-action="edit-task"][data-id="program"]');e.fill('#taskResult','Résultat repris');await e.submit('#editorForm');p=e.state().projects[0];assert.equal(p.workItems[0].status,'review');assert(e.$('#main').textContent.includes('Prérequis non validé'));
  }finally{await e.close();}
});
test('V3.1 delivery plan saves, downloads and survives full backup restore',async()=>{
  const raw=continuityFixture(),C=require('../core.js');raw.projects[0].workItems.push({...C.proposeTask('Tests de sauvegarde','tests'),id:'test',status:'done',legacyCompleted:false,result:'Tests réussis',evidence:'Parcours exécuté',dependsOn:['program']});
  const e=await setup(raw);let backup;try{
    await e.nav('livraison');e.fill('#releaseVersion','1.5.0');e.fill('#releaseNotes','Nouvelle sauvegarde');e.fill('#releaseRollback','Restaurer 1.4 et le JSON');
    for(const id of ['backup','scope','tests','rollback'])e.$('#releaseForm input[name="check-'+id+'"]').checked=true;
    await e.submit('#releaseForm');assert(e.$('#main').textContent.includes('Dossier prêt pour une revue de livraison'));
    await e.click('[data-action="export-release"]');assert((await e.downloads.at(-1).blob.text()).includes('1.5.0'));await e.click('[data-action="export-all"]');backup=JSON.parse(await e.downloads.at(-1).blob.text());assert(backup.data.projects[0].releasePlan.checks.backup);
  }finally{await e.close();}
  const restored=await setup();try{await restored.nav('sauvegardes');await restored.click('[data-action="import-all"]');await restored.upload('#importFile','backup.json',JSON.stringify(backup),'application/json');await restored.nav('livraison');assert.equal(restored.$('#releaseVersion').value,'1.5.0');assert(restored.$('#main').textContent.includes('Dossier prêt pour une revue de livraison'));}finally{await restored.close();}
});
test('V3.1 GitHub assistant handles partial reads without writes or false success',async()=>{
  const calls=[];const e=await setup(continuityFixture(),async(url,opt)=>{
    calls.push(opt.method);if(url.endsWith('/repos/me/project'))return apiResponse(200,{full_name:'me/project',default_branch:'main'});
    if(url.includes('/branches?'))return apiResponse(200,[{name:'main'},{name:'feature/sauvegarde'}]);
    if(url.includes('/pulls?'))return apiResponse(200,[{number:12,title:'Sauvegarde',head:{ref:'feature/sauvegarde'},base:{ref:'main'},draft:true}]);
    if(url.includes('/check-runs'))return apiResponse(403,{});if(url.endsWith('/status'))return apiResponse(200,{statuses:[]});if(url.endsWith('/releases/latest'))return apiResponse(404,{});throw Error('Unexpected URL '+url);
  });try{await e.nav('github');await e.click('[data-action="github-overview"]');assert(e.$('#main').textContent.includes('Contrôles non confirmés'));assert(e.$('#main').textContent.includes('Accès refusé'));assert(e.$('#main').textContent.includes('#12'));assert(calls.every(x=>x==='GET'));}finally{await e.close();}
});


test('V3.2 mode switch preserves data, exposes advanced tools and survives backup restore',async()=>{
  const e=await setup(continuityFixture());let backup;try{
    assert.equal(e.$('#detailMode').value,'beginner');assert(e.$('.nav-more'));await e.nav('taches');assert(e.$('.task-list'));await e.click('[data-action="edit-task"][data-id="program"]');assert(!e.$('.detail-options').open);assert.equal(e.$('#taskWorkBranch').value,'feature/sauvegarde');await e.submit('#editorForm');assert.equal(e.state().projects[0].workItems[0].workBranch,'feature/sauvegarde');
    e.fill('#detailMode','advanced','change');assert.equal(e.state().preferences.detailMode,'advanced');assert.equal(e.$('.nav-more'),null);assert(e.$('.board'));await e.click('[data-action="edit-task"][data-id="program"]');assert(e.$('.detail-options').open);await e.click('[data-action="close-dialog"]');
    await e.click('[data-action="export-all"]');backup=JSON.parse(await e.downloads.at(-1).blob.text());
    e.fill('#detailMode','beginner','change');e.fill('#pageJump','postes','change');await tick();assert.equal(e.window.location.hash,'#postes');assert(e.$('.nav-more').open);assert.equal(e.$('#pageJump').value,'postes');
  }finally{await e.close();}
  const restored=await setup();try{await restored.nav('sauvegardes');await restored.click('[data-action="import-all"]');await restored.upload('#importFile','backup.json',JSON.stringify(backup),'application/json');assert.equal(restored.$('#detailMode').value,'advanced');assert.equal(restored.state().projects[0].workItems[0].workBranch,'feature/sauvegarde');}finally{await restored.close();}
});

test('V3.2 evaluating, correcting and reopening a mission recomputes AI report',async()=>{
  const raw=legacy();raw.projects[0].handoffs=[{id:'mission',title:'Évaluation réelle',role:'tests',to:'Claude',from:'Moi',content:'Consigne',date:'2026-11-17T10:00:00Z',outcome:'pending',rating:0,result:''}];const e=await setup(raw);try{
    await e.nav('bilans');assert(e.$('#main').textContent.includes('0 mission(s) évaluée(s)'));e.fill('#bilanView','excluded','change');await e.click('[data-action="edit-mission"][data-id="mission"]');e.fill('#missionOutcome','done');await e.submit('#editorForm');assert(e.$('#toast').textContent.includes('Décris le résultat'));assert.equal(e.state().projects[0].handoffs[0].outcome,'pending');e.fill('#missionResult','Livrable contrôlé');e.fill('#missionRating','4');await e.submit('#editorForm');
    e.fill('#bilanView','evaluated','change');assert(e.$('#main').textContent.includes('4.0/5 sur 1'));await e.click('[data-action="export-bilan"]');const report=await e.downloads.at(-1).blob.text();assert(report.includes('Évaluation réelle [mission]'));assert(report.includes('Livrable contrôlé'));
    await e.click('[data-action="edit-mission"][data-id="mission"]');e.fill('#missionOutcome','pending');await e.submit('#editorForm');assert.equal(e.state().projects[0].handoffs[0].evaluatedAt,'');assert(e.$('#main').textContent.includes('Aucune note exploitable'));
  }finally{await e.close();}
});
