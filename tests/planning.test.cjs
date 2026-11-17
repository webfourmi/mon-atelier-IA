const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../planning.js');
function project(){return C.normalizeProject({name:'Dragon de Jade',context:'Ancien cahier conservé',projectType:'educational',memory:{specification:'Objectif HSK',features:[{id:'search',title:'Recherche',areas:'vocabulaire',description:'Rechercher les mots',checks:'Rechercher un mot connu'},{id:'save',title:'Sauvegarde',areas:'vocabulaire',description:'Conserver les acquis',checks:'Restaurer le carnet'},{id:'nav',title:'Navigation',areas:'épisodes',description:'Changer d’épisode',checks:'Ouvrir chaque épisode'}],issues:[]},workItems:[{...C.proposeTask('Modifier le carnet de vocabulaire','programmation'),id:'task',status:'done',result:'Carnet modifié',evidence:'Test déclaré',validationVersion:3}]});}
test('structured memory keeps legacy data and survives normalization and shared transfer',()=>{
 const p=project();assert.equal(p.context,'Ancien cahier conservé');assert.equal(C.memory(p).specification,'Objectif HSK');assert.deepEqual(C.normalizeProject(p),p);
 const remote=C.sharedPayload(p),local=C.normalizeProject({name:'Autre',memory:{specification:'Cap local',features:[{id:'search',title:'Recherche locale'}]}}),next=C.applyShared(local,remote);
 assert.equal(next.memory.specification,'Cap local');assert.equal(next.memory.features[0].title,'Recherche locale');assert.equal(next.memory.features.length,3);assert.equal(C.applyShared(next,remote).memory.features.length,3);assert(C.markdown(p).includes('Fonctions existantes à préserver'));
});
test('project templates adapt new task criteria without rewriting existing tasks',()=>{
 for(const type of ['educational','game','articles','professional']){const p=project();p.projectType=type;const before=C.clone(p.workItems);const t=C.makeTask(p,'Ajouter une fonction');assert(t.criteria.includes(C.TEMPLATES[type].checks[0]));assert.deepEqual(p.workItems,before);}
});
test('regression plan covers pedagogical baseline and related or explicitly selected features',()=>{
 const p=project(),t=p.workItems[0],plan=C.regressionPlan(p,t);assert(plan.some(x=>x.label==='Recherche et filtres'));assert(plan.some(x=>x.label==='Sauvegarde et progression'));assert(plan.some(x=>x.label==='Révisions et exercices'));assert(plan.some(x=>x.label==='Navigation entre épisodes ou cours'));assert(plan.some(x=>x.featureId==='search'));assert(!plan.some(x=>x.featureId==='nav'));t.affectedFeatureIds=['nav'];assert(C.regressionPlan(p,t).some(x=>x.featureId==='nav'));
});
test('regression evidence is reset after result or memory changes',()=>{
 const p=project(),t=p.workItems[0];t.regressionSignature=C.regressionSignature(p,t);t.regressionChecks=C.regressionPlan(p,t).map(r=>({...r,status:'passed',evidence:'Observé'}));assert(C.regressionPlan(p,t).every(x=>x.status==='passed'));
 t.result='Nouveau code';assert(C.regressionPlan(p,t).every(x=>x.status==='todo'));t.regressionSignature=C.regressionSignature(p,t);p.memory.features[0].checks+='\nNouveau contrôle';assert(C.regressionPlan(p,t).every(x=>x.status==='todo'));
});
test('task-only prompt includes only explicitly linked feature references',()=>{
 const p=project(),t=p.workItems[0];t.affectedFeatureIds=['save'];const prompt=C.missionPrompt(p,'complet','programmation',t.id,'',undefined,'ChatGPT');assert(prompt.includes('Conserver les acquis'));assert(!prompt.includes('Rechercher les mots'));assert(!prompt.includes('Objectif HSK'));assert(prompt.includes('progression pédagogique'));
});
test('text and JSON response extraction is local and retains source without executing it',()=>{
 const source='## Livrable\nFonction ajoutée\n## Fichiers modifiés\n- app.js\n## Tests réalisés\n- Recherche testée\n## Limites\nTéléphone non testé\n## Prochaines étapes\n- Vérifier les sauvegardes\n- Relire le cours';const draft=C.parseResult(source);assert.equal(draft.result,'Fonction ajoutée');assert.equal(draft.original,source);assert(draft.files.includes('app.js'));assert(draft.evidence.includes('Recherche testée'));assert(draft.limits.includes('Téléphone'));assert.equal(draft.nextTasks.length,2);
 const json=C.parseResult(JSON.stringify({result:'<script>evil()</script>',files:['a.js'],tests:'À confirmer',nextTasks:['Revoir']}));assert.equal(json.result,'<script>evil()</script>');assert.equal(json.files,'a.js');assert.throws(()=>C.parseResult(''));assert.throws(()=>C.parseResult('x'.repeat(2000001)));
});
test('confirming imported results never validates tasks or tests, and next tasks deduplicate',()=>{
 const p=project(),t=p.workItems[0],draft=C.parseResult(JSON.stringify({result:'Nouveau résultat',tests:'IA dit succès',nextTasks:['Vérifier navigation']}));assert.equal(C.completedTasks(p).length,1);C.applyResult(p,t,draft,draft.nextTasks);assert.equal(t.status,'returned');assert.equal(C.completedTasks(p).length,0);assert.equal(p.workItems.length,2);assert.deepEqual(p.workItems[1].dependsOn,['task']);C.applyResult(p,t,draft,draft.nextTasks);assert.equal(p.workItems.length,2);assert(C.regressionPlan(p,t).every(x=>x.status==='todo'));
});
test('coherence exposes missing files, unperformed regressions and unconfirmed GitHub integration',()=>{
 const p=project(),t=p.workItems[0];p.assets=[{id:'a',name:'photo.png'}];t.assetIds=['absent'];t.pullRequest='https://github.com/me/repo/pull/1';p.memory.issues.push({id:'bug',title:'Erreur connue',open:true,severity:'blocking'});let issues=C.coherenceIssues(p);for(const kind of ['file','regression','github','known'])assert(issues.some(x=>x.kind===kind));
 t.regressionSignature=C.regressionSignature(p,t);t.regressionChecks=C.regressionPlan(p,t).map(x=>({...x,status:'passed',evidence:'Vérifié'}));t.githubIntegration={merged:true,signature:C.taskSignature(t)};t.assetIds=['a'];p.fileAudit={session:C.auditSession,signature:C.assetSignature(p),missing:[],checkedAt:'2026-11-17'};p.memory.issues[0].open=false;assert.equal(C.coherenceIssues(p).length,0);t.result='Code repris';assert(C.coherenceIssues(p).some(x=>x.kind==='github'));
});
test('version history preserves snapshots and compares changes after the requested baseline',()=>{
 const p=project();const first=C.recordVersion(p,{version:'V0.10',publishedAt:'2026-10-01',notes:'Base',reference:'https://github.com/me/repo/tree/v0.10'});p.memory.specification='Nouveau besoin';const next=C.recordVersion(p,{version:'V0.11',publishedAt:'2026-11-01',notes:'Recherche améliorée',files:'app.js',tests:'Recherche testée',knownIssues:'Mobile non testé'});assert.equal(first.snapshot.memory.specification,'Objectif HSK');assert.equal(next.snapshot.releases,undefined);assert.deepEqual(C.versionChanges(p,first.id).map(r=>r.version),['V0.11']);assert.throws(()=>C.recordVersion(p,{version:'V0.10',publishedAt:'2026-11-02'}));assert.throws(()=>C.recordVersion(p,{version:'bad',publishedAt:'bad'}));assert.throws(()=>C.recordVersion(p,{version:'unsafe',publishedAt:'2026-11-02',reference:'javascript:alert(1)'}));
});
