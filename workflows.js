(function(root){
  'use strict';
  const C=root.AtelierCore||(typeof require==='function'?require('./planning.js'):null),text=C.text;
  const step=(title,role,ai,instruction,deliverable,criteria)=>({title,role,ai,instruction,deliverable,criteria});
  const DEFAULT_WORKFLOWS=[
    {id:'circuit-code',name:'Développer et vérifier',type:'Programmation',description:'Cadrer, développer puis contrôler le résultat.',steps:[step('Cadrer la demande','pilotage','ChatGPT','Clarifie le besoin et les fonctions à préserver.','Plan de modification et critères observables.','Le périmètre et les critères sont explicites.'),step('Programmer','programmation','Claude','Applique le plan validé en préservant les données existantes.','Code modifié et références des fichiers ou commits.','Les changements répondent au plan validé.'),step('Contrôler les régressions','tests','ChatGPT','Vérifie le résultat et les régressions, sans confondre tests déclarés et tests exécutés.','Compte rendu des tests et limites.','Les observations et les limites sont documentées.')]},
    {id:'circuit-fix',name:'Corriger un problème',type:'Correction',description:'Comprendre l’anomalie, corriger puis reproduire les contrôles.',steps:[step('Reproduire le problème','tests','Claude','Décris les étapes de reproduction et le comportement attendu.','Diagnostic reproductible.','L’anomalie et son périmètre sont identifiés.'),step('Corriger','programmation','ChatGPT','Corrige la cause identifiée sans supprimer de fonction existante.','Correction ciblée et fichiers modifiés.','Le cas signalé et les fonctions voisines sont vérifiés.'),step('Recontrôler','tests','Claude','Rejoue le scénario et les régressions du diagnostic.','Preuves de correction et problèmes restants.','Les vérifications réellement réalisées sont distinguées des vérifications manquantes.')]},
    {id:'circuit-content',name:'Rédiger et relire',type:'Contenus',description:'Préparer le fond, rédiger et effectuer une relecture.',steps:[step('Préparer les sources','recherche','ChatGPT','Rassemble les informations utiles et signale les incertitudes.','Sources et plan de contenu.','Les affirmations importantes ont une source identifiable.'),step('Rédiger','contenus','Claude','Rédige pour le public du projet à partir du plan validé.','Contenu rédigé et structuré.','Le niveau et la continuité sont respectés.'),step('Relire','contenus','ChatGPT','Contrôle cohérence, exactitude et clarté du contenu reçu.','Relecture et corrections explicites.','Les corrections et incertitudes sont indiquées.')]},
    {id:'circuit-media',name:'Préparer des illustrations',type:'Médias',description:'Définir le besoin, préparer les médias puis contrôler leur intégration.',steps:[step('Préparer le brief','design','Claude','Définis la composition, les contraintes et les références visuelles.','Brief illustré ou consigne de création.','Les dimensions et usages attendus sont précisés.'),step('Produire les médias','medias','ChatGPT','Produis ou prépare les médias demandés dans les formats prévus.','Fichiers, légendes et références.','Les livrables respectent le brief validé.'),step('Vérifier leur usage','tests','Claude','Contrôle lisibilité, crédits et emplacement dans le projet.','Contrôles des médias et limites.','Les fichiers et leur affichage sont vérifiés.')]} 
  ];
  function normalizeWorkflow(raw){
    if(!raw||typeof raw!=='object'||!text(raw.name).trim())throw Error('Un circuit doit avoir un nom.');
    if(!Array.isArray(raw.steps)||raw.steps.length<1||raw.steps.length>10)throw Error('Un circuit doit contenir de 1 à 10 étapes.');
    const steps=raw.steps.map(s=>{if(!s||!text(s.title).trim()||!C.ROLES.some(r=>r.id===s.role)||!['ChatGPT','Claude','Moi'].includes(s.ai))throw Error('Chaque étape doit avoir un titre, un poste et un intervenant valides.');return {...s,title:text(s.title).trim(),role:s.role,ai:s.ai,instruction:text(s.instruction),deliverable:text(s.deliverable),criteria:text(s.criteria)};});
    return {...raw,id:text(raw.id)||C.uid(),name:text(raw.name).trim(),type:text(raw.type).trim()||'Personnalisé',description:text(raw.description),archived:raw.archived===true,steps};
  }
  function normalizeWorkflows(raw){if(raw===undefined)return DEFAULT_WORKFLOWS.map(normalizeWorkflow);if(!Array.isArray(raw))throw Error('Format des circuits non reconnu.');const ids=new Set();return raw.map(w=>{const n=normalizeWorkflow(w);if(ids.has(n.id))n.id=C.uid();ids.add(n.id);return n;});}
  function eligibleSource(p,t){return !!t&&['draft','ready'].includes(t.status)&&!t.workflowRunId&&!text(t.result).trim()&&!text(t.evidence).trim()&&!p.handoffs.some(h=>h.taskId===t.id);}
  function workflowPreview(p,raw,request,sourceId=''){
    const w=normalizeWorkflow(raw);if(w.archived)throw Error('Restaure ce circuit avant de l’utiliser.');
    const source=sourceId?p.workItems.find(t=>t.id===sourceId):null;if(sourceId&&!eligibleSource(p,source))throw Error('Choisis une tâche non commencée et sans mission archivée, ou crée une nouvelle demande.');
    const need=text(source?(source.objective||source.title):request).trim();if(!need)throw Error('Décris le travail à confier à l’équipe.');
    const id=C.uid(),taskIds=w.steps.map((s,i)=>i===0&&source?source.id:C.uid());
    const tasks=w.steps.map((s,i)=>{
      const t=i===0&&source?C.clone(source):C.makeTask(p,s.title+' · '+need.slice(0,80),s.role,s.ai);
      return {...t,id:taskIds[i],role:s.role,owner:s.ai,status:i===0?(source?.status||'ready'):'draft',objective:i===0&&source?source.objective:need,deliverable:s.deliverable||t.deliverable,criteria:[t.criteria,s.criteria].filter(Boolean).join('\n'),dependsOn:i?[taskIds[i-1]]:[...(source?.dependsOn||[])],workflowRunId:id,workflowId:w.id,workflowName:w.name,workflowStepIndex:i,workflowStepCount:w.steps.length,workflowStepTitle:s.title,workflowInstruction:s.instruction,updatedAt:new Date().toISOString()};
    });
    return {id,workflow:C.clone(w),request:need,sourceTaskId:sourceId,sourceSnapshot:source?C.clone(source):null,tasks,taskIds,createdAt:new Date().toISOString()};
  }
  function applyWorkflow(p,preview){
    if(!preview?.id||!Array.isArray(preview.tasks))throw Error('Prépare un aperçu du circuit.');
    if((p.workflowRuns||[]).some(r=>r.id===preview.id)||preview.tasks.some(t=>p.workItems.some(x=>x.id===t.id&&x.id!==preview.sourceTaskId)))throw Error('Ce circuit a déjà été créé.');
    const source=preview.sourceTaskId?p.workItems.find(t=>t.id===preview.sourceTaskId):null;
    if(preview.sourceTaskId&&(!eligibleSource(p,source)||JSON.stringify(source)!==JSON.stringify(preview.sourceSnapshot)))throw Error('La tâche source a changé. Prépare un nouvel aperçu.');
    const additions=preview.tasks.map(C.clone),record={id:preview.id,workflow:C.clone(preview.workflow),request:preview.request,sourceTaskId:preview.sourceTaskId,sourceSnapshot:C.clone(preview.sourceSnapshot),taskIds:[...preview.taskIds],createdAt:preview.createdAt};
    if(source)Object.assign(source,additions.shift());p.workItems.push(...additions);(p.workflowRuns||(p.workflowRuns=[])).push(record);return record;
  }
  const prompt=C.missionPrompt;
  C.missionPrompt=function(p,level,roleId,taskId,...args){let out=prompt(p,level,roleId,taskId,...args);const t=p.workItems.find(x=>x.id===taskId);if(!t?.workflowRunId)return out;out+='\n## Étape '+(t.workflowStepIndex+1)+'/'+t.workflowStepCount+' · '+t.workflowStepTitle+'\n'+text(t.workflowInstruction)+'\n';
    for(const id of t.dependsOn||[]){const prev=p.workItems.find(x=>x.id===id);if(prev?.workflowRunId!==t.workflowRunId)continue;if(C.isValidated(prev)&&!C.dependencyIssues(p,prev).length){out+='\n## Résultat validé de l’étape précédente\n'+text(prev.result).slice(0,6000)+'\n'+text(prev.resultFiles)+'\n';if(text(prev.result).length>6000)out+='[Extrait : relire le résultat complet dans la tâche précédente.]\n';}else out+='\nÉtape précédente non validée : attendre sa validation avant de commencer.\n';}
    return out;
  };
  Object.assign(C,{DEFAULT_WORKFLOWS,normalizeWorkflow,normalizeWorkflows,eligibleSource,workflowPreview,applyWorkflow});
  if(typeof module!=='undefined'&&module.exports)module.exports=C;
})(typeof window!=='undefined'?window:globalThis);
