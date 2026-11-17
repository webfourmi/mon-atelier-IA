(function(root){
  'use strict';
  const C=root.AtelierCore||(typeof require==='function'?require('./core.js'):null),txt=C.text,auditSession=C.uid();
  const TEMPLATES={
    general:{name:'Projet général',roles:['pilotage','programmation','tests','livraison'],checks:['Fonctions existantes conservées','Sauvegarde et restauration','Navigation et erreurs'],guidance:'Préserver les fonctions existantes et décrire les vérifications réelles.'},
    educational:{name:'Application pédagogique',roles:['contenus','usages','programmation','tests'],checks:['Recherche et filtres','Sauvegarde et progression','Révisions et exercices','Navigation entre épisodes ou cours'],guidance:'Respecter la progression pédagogique, les acquis et les exercices existants.'},
    game:{name:'Jeu',roles:['usages','medias','programmation','tests'],checks:['Règles et progression','Sauvegarde de partie','Commandes et interactions','Transitions entre scènes'],guidance:'Préserver les règles, les sauvegardes et la continuité des scènes.'},
    articles:{name:'Site d’articles',roles:['recherche','contenus','design','tests'],checks:['Recherche et navigation','Liens et médias','Lisibilité mobile','Contenus et crédits conservés'],guidance:'Préserver les articles validés, les liens, les sources et les crédits.'},
    professional:{name:'Outil professionnel',roles:['pilotage','usages','programmation','tests'],checks:['Saisie et validation','Calculs et traitements','Import et export des données','Accès et confidentialité'],guidance:'Préserver les données, les règles métier et les droits d’accès.'}
  };
  function memory(p){const m=p.memory||{};return {specification:typeof m.specification==='string'?m.specification:p.context,features:Array.isArray(m.features)?m.features:[],issues:Array.isArray(m.issues)?m.issues:[]};}
  function template(p){return TEMPLATES[p.projectType]||TEMPLATES.general;}
  function makeTask(p,idea,roleId='',ai=''){const t=C.proposeTask(idea,roleId,ai);t.criteria+='\n'+template(p).checks.join('\n');return t;}
  const fold=s=>txt(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function relevantFeatures(p,t){const words=new Set(fold(t.title+' '+t.objective+' '+t.inputs).match(/[a-z0-9]{4,}/g)||[]);return memory(p).features.filter(f=>(t.affectedFeatureIds||[]).includes(f.id)||(fold(f.title+' '+f.areas).match(/[a-z0-9]{4,}/g)||[]).some(w=>words.has(w)));}
  function regressionSignature(p,t){return JSON.stringify([p.projectType||'general',memory(p).features,t.title,t.objective,t.inputs,txt(t.result),txt(t.resultFiles),t.affectedFeatureIds||[]]);}
  function regressionPlan(p,t){
    if(!['programmation','optimisation','design','usages','contenus','medias'].includes(t.role))return [];
    const features=relevantFeatures(p,t),rows=template(p).checks.map(label=>({id:'base-'+C.slug(label),label,featureId:''}));
    for(const f of features)for(const label of (txt(f.checks).trim()?f.checks.split('\n').filter(x=>x.trim()):['Préserver '+f.title]))rows.push({id:f.id+'-'+C.slug(label),label,featureId:f.id});
    const fresh=t.regressionSignature===regressionSignature(p,t),seen=new Set();
    return rows.filter(r=>!seen.has(r.id)&&seen.add(r.id)).map(r=>{const old=fresh?(t.regressionChecks||[]).find(x=>x.id===r.id):null;return {...r,status:old?.status||'todo',evidence:txt(old?.evidence)};});
  }
  function saveRegression(p,previous,next,values){
    const changed=regressionSignature(p,previous)!==regressionSignature(p,next);
    next.regressionChecks=regressionPlan(p,next).map(r=>({...r,status:changed?'todo':values[r.id]?.status||'todo',evidence:changed?'':txt(values[r.id]?.evidence)}));next.regressionSignature=regressionSignature(p,next);
  }
  function taskSignature(t){return JSON.stringify([t.title,t.result,t.resultFiles,t.workBranch,t.pullRequest]);}
  function assetSignature(p){return JSON.stringify(p.assets.map(a=>[a.id,a.name,a.size]));}
  function coherenceIssues(p){
    const issues=[];
    for(const t of p.workItems){
      const checks=regressionPlan(p,t),pending=checks.filter(r=>r.status!=='passed'||!r.evidence.trim());
      if(pending.length)issues.push({kind:'regression',taskId:t.id,message:t.title+' : '+pending.length+' contrôle(s) de régression sans réussite documentée.'});
      if(!C.isValidated(t)||C.dependencyIssues(p,t).length||t.blocked)issues.push({kind:'task',taskId:t.id,message:t.title+' : tâche ou prérequis non validé.'});
      if((t.workBranch||t.pullRequest)&&!(t.githubIntegration?.merged===true&&t.githubIntegration?.signature===taskSignature(t)))issues.push({kind:'github',taskId:t.id,message:t.title+' : intégration GitHub non confirmée.'});
      for(const id of t.assetIds||[])if(!p.assets.some(a=>a.id===id))issues.push({kind:'file',taskId:t.id,message:t.title+' : référence de fichier absente ('+id+').'});
    }
    if(p.assets.length){if((p.fileAudit?.signature!==assetSignature(p)||p.fileAudit?.session!==auditSession))issues.push({kind:'file',message:'Présence des fichiers originaux à contrôler.'});else for(const name of p.fileAudit.missing||[])issues.push({kind:'file',message:'Original introuvable : '+name});}
    for(const issue of memory(p).issues.filter(x=>x.open!==false))issues.push({kind:'known',warning:issue.severity!=='blocking',message:'Problème connu ouvert : '+issue.title});
    return issues;
  }
  function preparationReadiness(p){const r=C.releaseReadiness(p),extra=coherenceIssues(p);return {...r,ready:r.ready&&!extra.some(x=>!x.warning),missing:[...r.missing,...extra.map(x=>x.message)]};}
  function deliveryNotes(p){const r=preparationReadiness(p);return C.releaseNotes(p).replace('État local : Dossier prêt pour une revue de livraison',r.ready?'État local : Dossier prêt pour une revue de livraison':'État local : Préparation incomplète')+'\n## Contrôle de cohérence\n'+(coherenceIssues(p).map(x=>'- '+x.message).join('\n')||'Aucun oubli détecté dans les données consultées. Ceci ne remplace pas les tests.')+'\n';}
  function parseResult(source){
    source=txt(source).trim();if(!source)throw Error('Colle une réponse ou choisis un fichier texte.');if(source.length>2000000)throw Error('La réponse dépasse 2 Mo.');
    const out={result:source,files:'',evidence:'',limits:'',nextTasks:[],original:source};
    try{const j=JSON.parse(source);if(j&&typeof j==='object'&&!Array.isArray(j)){const value=v=>Array.isArray(v)?v.map(txt).join('\n'):txt(v);out.result=value(j.result||j.livrables)||source;out.files=value(j.files||j.fichiers);out.evidence=value(j.tests||j.verifications);out.limits=value(j.limits||j.limites);out.nextTasks=(Array.isArray(j.nextTasks)?j.nextTasks:Array.isArray(j.tachesSuivantes)?j.tachesSuivantes:[]).map(x=>typeof x==='string'?x:txt(x?.title)).filter(Boolean).slice(0,30);return out;}}catch{}
    const groups={result:[],files:[],evidence:[],limits:[]};let section='';
    for(const line of source.split(/\r?\n/)){
      const heading=line.replace(/^\s*#{1,6}\s*|\*\*/g,'').trim().replace(/:$/,'');
      if(/^(livrables?|résultats?(?: obtenus?)?|resultats?(?: obtenus?)?|modifications réalisées|modifications realisees)$/i.test(heading)){section='result';continue;}
      if(/^(fichiers(?: modifies| modifiés| concernes| concernés)?|livrables? fichiers?)$/i.test(heading)){section='files';continue;}
      if(/^(tests?(?: realises| réalisés)?|vérifications|verifications)$/i.test(heading)){section='evidence';continue;}
      if(/^(limites|problèmes connus|problemes connus|points à reprendre)$/i.test(heading)){section='limits';continue;}
      if(/^(prochaines étapes|prochaines etapes|tâches suivantes|taches suivantes|à faire|todo)$/i.test(heading)){section='next';continue;}
      if(/^\s*#{1,6}\s/.test(line)){section='';continue;}
      if(section==='next'){const m=line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)/);if(m&&out.nextTasks.length<30)out.nextTasks.push(m[1]);}else if(section)groups[section].push(line);
    }
    for(const key of Object.keys(groups)){const value=groups[key].join('\n').trim();if(key!=='result'||value)out[key]=value;}
    out.nextTasks=[...new Set(out.nextTasks)];return out;
  }
  function applyResult(p,t,draft,selected){
    if(!txt(draft.result).trim())throw Error('Le résultat est vide.');
    Object.assign(t,{result:txt(draft.result),resultFiles:txt(draft.files),evidence:txt(draft.evidence),resultLimits:txt(draft.limits),status:'returned',completedAt:'',updatedAt:new Date().toISOString(),importedResponse:draft.original===draft.result?'':txt(draft.original)});
    const created=[];
    for(const title of selected){if(!txt(title).trim())continue;const key='import:'+t.id+':'+C.slug(title);if(p.workItems.some(x=>x.suggestionKey===key))continue;const next=makeTask(p,title);next.dependsOn=[t.id];next.suggestionKey=key;p.workItems.push(next);created.push(next);}
    return created;
  }
  function recordVersion(p,data){
    const version=txt(data.version).trim();if(!version)throw Error('Indique une version.');if((p.releases||[]).some(r=>r.version===version))throw Error('Cette version est déjà dans l’historique.');
    if(!txt(data.publishedAt).trim()||!Number.isFinite(Date.parse(data.publishedAt)))throw Error('Indique une date de publication valide.');
    if(data.reference){const u=new URL(data.reference);if(u.protocol!=='https:'||u.hostname!=='github.com')throw Error('Utilise un lien de version GitHub en HTTPS.');}
    const {releases,...snapshot}=C.clone(p);const entry={id:C.uid(),...data,version,snapshot,recordedAt:new Date().toISOString()};(p.releases||(p.releases=[])).push(entry);return entry;
  }
  function versionChanges(p,from,to=''){
    const releases=[...(p.releases||[])].sort((a,b)=>Date.parse(a.publishedAt)-Date.parse(b.publishedAt)||txt(a.recordedAt).localeCompare(txt(b.recordedAt))),start=releases.findIndex(r=>r.id===from),end=to?releases.findIndex(r=>r.id===to):releases.length-1;
    if(start<0||end<start)throw Error('Choisis des versions dans l’ordre de publication.');return releases.slice(start+1,end+1);
  }
  const oldShared=C.sharedPayload,oldApply=C.applyShared,oldMarkdown=C.markdown;
  C.sharedPayload=function(p){const raw=oldShared(p);raw.project.projectType=p.projectType||'general';raw.memory=C.clone(memory(p));for(const item of raw.completedTasks){const t=p.workItems.find(t=>t.id===item.id);for(const k of ['affectedFeatureIds','regressionChecks','regressionSignature'])if(t[k]!==undefined)item[k]=C.clone(t[k]);}return raw;};
  C.applyShared=function(p,raw){const next=oldApply(p,raw);if(raw.memory){const incoming=C.normalizeProject({...p,memory:raw.memory}).memory,local=memory(p),merge=(a,b)=>[...a,...b.filter(x=>!a.some(y=>y.id===x.id))];next.memory={...local,specification:p.memory?local.specification:incoming.specification,features:merge(local.features,incoming.features),issues:merge(local.issues,incoming.issues)};}if(!p.projectType||p.projectType==='general')next.projectType=Object.hasOwn(TEMPLATES,raw.project.projectType)?raw.project.projectType:'general';for(const t of next.workItems){if(p.workItems.some(x=>x.id===t.id))continue;const source=(raw.completedTasks||[]).find(x=>x.id===t.id);if(source)for(const k of ['affectedFeatureIds','regressionChecks','regressionSignature'])if(source[k]!==undefined)t[k]=C.clone(source[k]);}return next;};
  C.markdown=function(p){const m=memory(p);return oldMarkdown(p)+'\n## Mémoire structurée · cahier des charges\n'+m.specification+'\n\n## Fonctions existantes à préserver\n'+m.features.map(f=>'- '+f.title+' : '+f.description+'\n  Zones : '+f.areas+'\n  Contrôles : '+f.checks).join('\n')+'\n\n## Problèmes connus\n'+m.issues.map(x=>'- '+(x.open===false?'Résolu':'Ouvert')+' : '+x.title+' — '+x.detail).join('\n')+'\n';};
  const oldPrompt=C.missionPrompt;
  C.missionPrompt=function(p,level,roleId,taskId,...rest){let result=oldPrompt(p,level,roleId,taskId,...rest);const t=p.workItems.find(x=>x.id===taskId);if(t&&p.projectType&&p.projectType!=='general')result+='\nRepère pour cette tâche : '+template(p).guidance+'\n';if(t&&(t.affectedFeatureIds||[]).length)result+='\nFonctions explicitement liées à préserver :\n'+memory(p).features.filter(f=>t.affectedFeatureIds.includes(f.id)).map(f=>'- '+f.title+' : '+txt(f.description)).join('\n')+'\n';return result;};
  Object.assign(C,{auditSession,TEMPLATES,memory,template,makeTask,relevantFeatures,regressionSignature,regressionPlan,saveRegression,taskSignature,assetSignature,coherenceIssues,preparationReadiness,deliveryNotes,parseResult,applyResult,recordVersion,versionChanges});
  if(typeof module!=='undefined'&&module.exports)module.exports=C;
})(typeof window!=='undefined'?window:globalThis);
