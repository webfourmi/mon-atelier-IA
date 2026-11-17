(function (root) {
  'use strict';
  const VERSION = '3.3.0';
  const KEY = 'atelier-ia-v1';
  const uid = () => globalThis.crypto?.randomUUID?.() || 'a-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  const text = v => typeof v === 'string' ? v : (typeof v === 'number' ? String(v) : '');
  const clone = v => JSON.parse(JSON.stringify(v));
  const ROLES = [
    {id:'pilotage',n:'01',name:'Pilotage',short:'Donner le cap',mission:'Clarifier le besoin, définir les priorités, découper le travail et lever les blocages.',output:'Fiche projet, priorités, prochaine action et décisions.',prompt:'Agis comme responsable du projet. Propose des étapes concrètes, signale les dépendances et sépare les décisions acquises des propositions.'},
    {id:'recherche',n:'02',name:'Recherche & expertise',short:'Vérifier les fondations',mission:'Vérifier les sources, les contraintes et les connaissances propres au projet.',output:'Références consultées, faits vérifiés et incertitudes.',prompt:'Agis comme chargé de recherche. Vérifie les sources primaires, donne leurs liens et dates, distingue les faits des hypothèses. Ne crée aucune référence.'},
    {id:'usages',n:'03',name:'Usages & parcours',short:'Rendre le parcours évident',mission:'Comprendre le besoin de l’utilisateur et organiser les écrans, les menus et les interactions.',output:'Parcours, schémas d’écrans et critères de réussite.',prompt:'Agis comme concepteur des usages. Pars de situations concrètes, décris les parcours et prévois les états vides, erreurs et usages au clavier.'},
    {id:'design',n:'04',name:'Design de l’interface',short:'Construire une identité',mission:'Définir les couleurs, typographies et composants, avec une lecture confortable sur chaque écran.',output:'Maquettes et charte graphique cohérente.',prompt:'Agis comme designer d’interface. Appuie-toi sur la charte commune, précise les composants, la hiérarchie et les variantes mobile et ordinateur.'},
    {id:'contenus',n:'05',name:'Contenus & pédagogie',short:'Écrire pour transmettre',mission:'Rédiger les cours, textes, dialogues et exercices ; organiser leur progression.',output:'Contenus relus et structurés, prêts à intégrer.',prompt:'Agis comme rédacteur et concepteur pédagogique. Respecte le niveau du public, la continuité et les contenus validés. Signale les connaissances à vérifier.'},
    {id:'medias',n:'06',name:'Illustrations & médias',short:'Donner forme au projet',mission:'Préparer les illustrations, photos, icônes et sons, puis suivre leur validation et leur intégration.',output:'Fichiers définitifs, légendes et catalogue des médias.',prompt:'Agis comme responsable des illustrations et médias. Respecte les références visuelles, la lisibilité et la qualité des originaux. Précise les fichiers attendus et leur emplacement.'},
    {id:'programmation',n:'07',name:'Programmation',short:'Faire fonctionner l’ensemble',mission:'Définir la structure technique, développer, intégrer les contenus et préserver les données.',output:'Version fonctionnelle, intégration et notes techniques.',prompt:'Agis comme développeur. Examine le code existant avant d’éditer, préserve les données et fonctionnalités validées, puis vérifie le résultat avec des tests adaptés.'},
    {id:'tests',n:'08',name:'Tests & qualité',short:'Vérifier dans la pratique',mission:'Contrôler les fonctions, les parcours, les sauvegardes et les régressions.',output:'Tests réalisés, résultats observés et anomalies reproductibles.',prompt:'Agis comme testeur. Décris les manipulations et résultats réellement observés. Distingue les tests exécutés, simulés et non réalisés. N’affirme pas qu’une fonction marche sans preuve.'},
    {id:'livraison',n:'09',name:'Livraison & versions',short:'Publier avec des repères',mission:'Préparer la livraison, identifier la version et vérifier la mise à jour installée.',output:'Version, nouveautés et procédure de retour arrière.',prompt:'Agis comme responsable de livraison. Identifie exactement les fichiers et la version à livrer, vérifie les prérequis et rédige les nouveautés ainsi que le retour arrière.'},
    {id:'optimisation',n:'10',name:'Optimisation & suivi',short:'Améliorer ce qui compte',mission:'Analyser les difficultés, simplifier les usages et corriger les problèmes récurrents.',output:'Améliorations classées selon leur effet et leur effort.',prompt:'Agis comme responsable de l’amélioration continue. Pars des retours et mesures disponibles, propose des améliorations ciblées et indique comment vérifier leur effet.'}
  ];
  // Recommandations modifiables lors de chaque transmission ; aucun service IA payant requis.
  const AI_ASSIGNMENTS = {
    pilotage:['ChatGPT','Claude'],recherche:['ChatGPT','Claude'],usages:['ChatGPT','Claude'],
    design:['Claude','ChatGPT'],contenus:['Claude','ChatGPT'],medias:['ChatGPT','Claude'],
    programmation:['ChatGPT','Claude'],tests:['Claude','ChatGPT'],
    livraison:['ChatGPT','Claude'],optimisation:['ChatGPT','Claude']
  };
  ROLES.forEach(r=>{[r.primaryAI,r.reviewAI]=AI_ASSIGNMENTS[r.id];});
  const STATUSES = [{id:'draft',name:'À préparer'},{id:'ready',name:'Prêt'},{id:'doing',name:'En cours'},{id:'returned',name:'Travail rendu'},{id:'review',name:'À vérifier'},{id:'done',name:'Validé'}];
  const ASSET_STATUSES = [{id:'available',name:'À valider'},{id:'validated',name:'Validé'},{id:'integrated',name:'Intégré'},{id:'tested',name:'Vérifié en place'}];
  const DEFAULT_DOCS = [
    {id:'brief',title:'Cap & objectifs',kind:'brief',content:''},
    {id:'rules',title:'Règles & contraintes',kind:'rules',content:''},
    {id:'design',title:'Charte graphique',kind:'design',content:''},
    {id:'technical',title:'Repères techniques',kind:'technical',content:''},
    {id:'sources',title:'Sources & références',kind:'sources',content:''}
  ];
  function role(id) { return ROLES.find(r=>r.id===id)||ROLES[0]; }
  function normalizeProject(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p) || !text(p.name).trim()) throw Error('Un projet doit avoir un nom.');
    const q = {...p,id:text(p.id)||uid(),name:text(p.name),description:text(p.description),context:text(p.context),decisions:text(p.decisions),tasks:text(p.tasks)};
    q.documents = Array.isArray(p.documents) ? p.documents.map(d=>({id:text(d.id)||uid(),title:text(d.title)||'Document',kind:text(d.kind)||'note',content:text(d.content),updatedAt:text(d.updatedAt)})) : clone(DEFAULT_DOCS).map(d=>({...d,updatedAt:''}));
    q.workItems = Array.isArray(p.workItems) ? p.workItems.map(t=>{
      if (!t || typeof t!=='object' || !text(t.title).trim()) throw Error('Une tâche n’a pas de titre.');
      return {...t,validationVersion:t.validationVersion===3?3:0,legacyCompleted:t.legacyCompleted===true||(t.status==='done'&&t.validationVersion!==3),id:text(t.id)||uid(),title:text(t.title),role:role(t.role).id,status:STATUSES.some(s=>s.id===t.status)?t.status:'draft',owner:text(t.owner)||'Moi',priority:['high','normal','low'].includes(t.priority)?t.priority:'normal',objective:text(t.objective),inputs:text(t.inputs),deliverable:text(t.deliverable),criteria:text(t.criteria),evidence:text(t.evidence),blocked:text(t.blocked),dependsOn:Array.isArray(t.dependsOn)?t.dependsOn.map(text):[],assetIds:Array.isArray(t.assetIds)?t.assetIds.map(text):[],completedAt:t.status==='done'?(text(t.completedAt)||text(t.updatedAt)):text(t.completedAt),updatedAt:text(t.updatedAt)};
    }) : q.tasks.split(/\n/).filter(s=>s.trim()).map(s=>({id:uid(),title:s.replace(/^[-•]\s*/,''),role:'pilotage',status:'draft',owner:'Moi',priority:'normal',objective:'',inputs:'',deliverable:'',criteria:'',evidence:'',blocked:'',dependsOn:[],assetIds:[],completedAt:'',validationVersion:0,legacyCompleted:false,updatedAt:''}));
    q.decisionLog = Array.isArray(p.decisionLog)?p.decisionLog.map(d=>({...d,id:text(d.id)||uid(),text:text(d.text),status:['proposed','validated','retired'].includes(d.status)?d.status:'proposed',date:text(d.date),reason:text(d.reason)})):[];
    q.assets = Array.isArray(p.assets)?p.assets.map(a=>({...a,id:text(a.id)||uid(),name:text(a.name)||'Fichier',size:Number(a.size)||0,type:text(a.type),role:role(a.role||'medias').id,status:ASSET_STATUSES.some(s=>s.id===a.status)?a.status:'available',note:text(a.note),date:text(a.date)})):[];
    q.handoffs = Array.isArray(p.handoffs)?p.handoffs.map(h=>({...h,id:text(h.id)||uid(),content:text(h.content),title:text(h.title),from:text(h.from),to:text(h.to),date:text(h.date),role:ROLES.some(r=>r.id===h.role)?h.role:'',taskId:text(h.taskId),result:text(h.result),notes:text(h.notes),rating:[1,2,3,4,5].includes(Number(h.rating))?Number(h.rating):0,outcome:['pending','done','partial','failed'].includes(h.outcome)?h.outcome:'pending',evaluatedAt:text(h.evaluatedAt)})):[];
    q.github = {owner:text(p.github?.owner),repo:text(p.github?.repo),branch:text(p.github?.branch),path:text(p.github?.path)||'.atelier-ia/dossier-commun.json',lastSync:text(p.github?.lastSync),lastSha:text(p.github?.lastSha)};
    for (const k of ['owner','repo','branch','path']) q.github[k]=text(q.github[k]);
    q.projectType=['general','educational','game','articles','professional'].includes(p.projectType)?p.projectType:'general';
    if(p.memory&&typeof p.memory==='object')q.memory={...p.memory,specification:typeof p.memory.specification==='string'?p.memory.specification:q.context,features:(Array.isArray(p.memory.features)?p.memory.features:[]).filter(f=>f&&typeof f==='object').map(f=>({...f,id:text(f.id)||uid(),title:text(f.title),description:text(f.description),areas:text(f.areas),checks:text(f.checks)})),issues:(Array.isArray(p.memory.issues)?p.memory.issues:[]).filter(x=>x&&typeof x==='object').map(x=>({...x,id:text(x.id)||uid(),title:text(x.title),detail:text(x.detail),open:x.open!==false}))};
    if(Array.isArray(p.releases))q.releases=p.releases.filter(r=>r&&typeof r==='object').map(r=>({...r,id:text(r.id)||uid(),version:text(r.version)}));
    q.activeVersion=text(p.activeVersion);
    return q;
  }
  function normalizeState(raw) {
    if (!raw || typeof raw!=='object' || !Array.isArray(raw.projects) || !Array.isArray(raw.prompts) || !Array.isArray(raw.comparisons)) throw Error('Format de sauvegarde non reconnu.');
    const out={...raw,preferences:{...raw.preferences,detailMode:raw.preferences?.detailMode==='advanced'?'advanced':'beginner'},schemaVersion:3,projects:raw.projects.map(normalizeProject),prompts:raw.prompts.map(p=>({...p,id:text(p.id)||uid(),title:text(p.title)||'Prompt',text:text(p.text)})),comparisons:raw.comparisons.map(c=>({...c,id:text(c.id)||uid(),title:text(c.title)||'Comparaison',a:text(c.a),b:text(c.b),date:text(c.date)})),updatedAt:text(raw.updatedAt)};
    for(const group of [out.projects,out.prompts,out.comparisons]) { const ids=new Set(); for(const x of group){if(ids.has(x.id))x.id=uid();ids.add(x.id);} }
    return out;
  }
  function starter() {
    return normalizeState({projects:[
      {id:'dragon',name:'Le Dragon de Jade',description:'Apprendre le chinois au fil d’une aventure.',context:'Objectif : HSK1 et HSKK1. Préserver les fonctionnalités validées et tester les évolutions avant publication.',decisions:'Ne jamais supprimer une fonctionnalité validée sans accord.',tasks:'Vérifier les évolutions et les aquarelles.',github:{owner:'webfourmi',repo:'dragon-de-jade'}},
      {id:'couture',name:'De fil en aiguille',description:'Couture, patchwork et découvertes textiles.',context:'Application pédagogique avec cours, patrons et journal de projets.',decisions:'Ne publier que les contenus validés. Garder les illustrations lisibles.',tasks:'Vérifier les patrons et les photos.',github:{owner:'webfourmi',repo:'le-fil-des-52-semaines'}},
      {id:'jdr',name:'MK-Pharmakos',description:'Préparation de campagne et aides de jeu.',context:'Campagne de jeu de rôle se déroulant notamment au Vietnam en 1967.',decisions:'Préserver la continuité des personnages et des séances.',tasks:'Préparer les prochaines aides de jeu.'}
    ],prompts:[{id:'audit',title:'Audit de code',text:'Examine le code ou le diff. Identifie les erreurs et risques de régression, classe-les par gravité et cite les fichiers concernés.'},{id:'review',title:'Relecture critique',text:'Relis ce contenu. Signale les affirmations incertaines, contradictions et passages à clarifier. Vérifie les sources sans en inventer.'},{id:'handoff',title:'Transmission entre IA',text:'Reprends les décisions établies, la tâche actuelle, les contraintes et les points à vérifier. Sépare les faits et les propositions.'}],comparisons:[]});
  }
  function slug(s) {return text(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^[-.]+|[-.]+$/g,'').slice(0,90)||'projet';}
  function safeFilename(s) { return text(s).replace(/[\x00-\x1f<>:"/\\|?*]/g,'_').replace(/^\.+/,'').slice(0,150)||'fichier'; }
  function parseRepo(value) {
    let v=text(value).trim().replace(/\/$/,'');
    if(/^https?:\/\//i.test(v)) {const u=new URL(v);if(u.protocol!=='https:'||u.hostname!=='github.com')throw Error('Utilise une adresse https://github.com/propriétaire/dépôt.');v=u.pathname.replace(/^\//,'');}
    v=v.replace(/\.git$/,''); const a=v.split('/');
    if(a.length!==2||!a.every(s=>/^[a-zA-Z0-9_.-]+$/.test(s))||a.some(s=>s==='.'||s==='..'))throw Error('Indique propriétaire/dépôt, ou l’adresse du dépôt GitHub.');
    return {owner:a[0],repo:a[1]};
  }
  function safePath(value) {const v=text(value).trim();if(!v||v.startsWith('/')||v.includes('\\')||v.split('/').some(x=>!x||x==='.'||x==='..')||/[\x00-\x1f?#]/.test(v))throw Error('Le chemin du fichier GitHub est invalide.');return v;}
  function completedTasks(p) {
    return p.workItems.filter(t=>isValidated(t)&&!t.blocked&&!dependencyIssues(p,t).length).map(t=>({
      id:t.id,title:t.title,role:t.role,owner:t.owner,objective:t.objective,
      deliverable:t.deliverable,result:text(t.result),resultFiles:text(t.resultFiles),resultLimits:text(t.resultLimits),criteria:t.criteria,evidence:t.evidence,
      dependsOn:[...(t.dependsOn||[])],suggestionKey:text(t.suggestionKey),workBranch:text(t.workBranch),pullRequest:text(t.pullRequest),validationVersion:3,completedAt:t.completedAt||t.updatedAt||'',
      files:(t.assetIds||[]).map(id=>p.assets.find(a=>a.id===id)).filter(Boolean).map(a=>({id:a.id,name:a.name,status:a.status,note:a.note}))
    }));
  }
  function sharedPayload(p) {
    return {format:'mon-atelier-ia-dossier',version:2,project:{id:p.id,name:p.name,description:p.description,context:p.context,decisions:p.decisions,legacyTasks:p.tasks,activeVersion:p.activeVersion},documents:clone(p.documents),decisions:clone(p.decisionLog),completedTasks:completedTasks(p),assets:p.assets.map(a=>({name:a.name,size:a.size,type:a.type,status:a.status,note:a.note})),attachmentNotice:'Les fichiers joints ne sont pas inclus : utiliser le dossier ZIP pour transmettre leurs originaux.'};
  }
  function applyShared(p, raw) {
    if(!raw||raw.format!=='mon-atelier-ia-dossier'||raw.version!==2||!raw.project||!Array.isArray(raw.documents)||!Array.isArray(raw.decisions))throw Error('Ce fichier n’est pas un dossier commun compatible.');
    const existing=new Set(p.workItems.map(t=>t.id));
    const received=Array.isArray(raw.completedTasks)?raw.completedTasks.filter(t=>t&&typeof t==='object'&&text(t.id)&&text(t.title)&&!existing.has(t.id)).map(t=>({
      dependsOn:Array.isArray(t.dependsOn)?t.dependsOn.map(text):[],suggestionKey:text(t.suggestionKey),workBranch:text(t.workBranch),pullRequest:text(t.pullRequest),id:t.id,title:t.title,role:t.role,status:'done',validationVersion:t.validationVersion===3?3:0,owner:t.owner,
      objective:t.objective,deliverable:t.deliverable,result:text(t.result),resultFiles:text(t.resultFiles),resultLimits:text(t.resultLimits),criteria:t.criteria,evidence:t.evidence,
      completedAt:t.completedAt,updatedAt:t.completedAt,assetIds:[]
    })):[];
    const next=normalizeProject({...p,context:text(raw.project.context),decisions:text(raw.project.decisions),documents:raw.documents,decisionLog:raw.decisions,workItems:[...p.workItems,...received]});
    return {...p,context:next.context,decisions:next.decisions,documents:next.documents,decisionLog:next.decisionLog,workItems:next.workItems};
  }
  function markdown(p) {
    const sections=[`# ${p.name}`,p.description,`## Objectif et contexte\n${p.context||'À préciser.'}`,`## Contraintes et décisions conservées\n${p.decisions||'À préciser.'}`];
    for(const d of p.documents)sections.push(`## ${d.title}\n${d.content||'À compléter.'}`);
    sections.push('## Journal des décisions\n'+(p.decisionLog.map(d=>`- [${d.status}] ${d.text}${d.reason?' — '+d.reason:''}`).join('\n')||'Aucune décision ajoutée.'));
    sections.push('## Travail en cours\n'+(p.workItems.map(t=>`- [${t.legacyCompleted?'Ancienne tâche terminée · à revérifier':STATUSES.find(s=>s.id===t.status)?.name}] ${t.title} — ${role(t.role).name} / ${t.owner}${t.blocked?' — Blocage : '+t.blocked:''}\n  Résultat attendu : ${t.deliverable||'À préciser.'}\n  Vérification : ${t.criteria||'À préciser.'}${t.evidence?'\n  Résultat observé : '+t.evidence:''}`).join('\n')||'Aucune tâche.'));
    sections.push('## Livrables validés\n'+(completedTasks(p).map(t=>`### ${t.title}\nPoste : ${role(t.role).name} | Réalisé par : ${t.owner} | Date : ${t.completedAt||'Non renseignée'}\nObjectif : ${t.objective||'Non renseigné'}\nLivrable attendu : ${t.deliverable||'Non renseigné'}\nRésultat validé : ${t.result||'Non renseigné'}\nRéférences de livraison : ${t.resultFiles||'Non renseignées'}\nLimites : ${t.resultLimits||'Non renseignées'}\nCritères : ${t.criteria||'Non renseignés'}\nVérifications : ${t.evidence||'Non renseignées'}\nFichiers liés : ${t.files.map(f=>f.name).join(', ')||'Aucun'}`).join('\n\n')||'Aucun livrable terminé.'));
    sections.push('## Fichiers et médias\n'+(p.assets.map(a=>`- ${a.name} — ${ASSET_STATUSES.find(s=>s.id===a.status)?.name}${a.note?' — '+a.note:''}`).join('\n')||'Aucun fichier.'));
    sections.push(`## Version et dépôt\nVersion : ${p.activeVersion||'Non renseignée'}\nDépôt : ${p.github.owner&&p.github.repo?'https://github.com/'+p.github.owner+'/'+p.github.repo:'Non associé'}`);
    return sections.join('\n\n')+'\n';
  }
  function context(p, level='standard', roleId='pilotage',taskId='',request='') {
    const r=role(roleId),t=p.workItems.find(x=>x.id===taskId);
    const head=`# ${p.name}\n${p.description}\n\n## Poste : ${r.name}\n${r.prompt}\n\n## Objectif et contexte\n${p.context}\n\n## Règles établies\n${p.decisions}\n`;
    const decisions=p.decisionLog.filter(d=>d.status==='validated').map(d=>'- '+d.text).join('\n');
    const task=t?`\n## Tâche confiée\n${t.title}\nObjectif : ${t.objective}\nÉléments à consulter : ${t.inputs}\nRésultat attendu : ${t.deliverable}\nCritères de vérification : ${t.criteria}\nRésultat observé : ${t.evidence}\nBlocage : ${t.blocked||'Aucun déclaré'}\n`:'';
    const docs=p.documents.filter(d=>d.content.trim());
    let extra='';
    if(level!=='court')extra='\n## Décisions validées\n'+decisions+'\n'+docs.map(d=>`\n## ${d.title}\n${d.content}`).join('\n')+'\n## Livrables déjà validés\n'+completedTasks(p).map(t=>'- '+t.title+' ('+t.owner+') : '+(t.result||'résultat non précisé')).join('\n');
    if(level==='complet')extra+='\n## Suivi de toutes les tâches\n'+p.workItems.map(t=>`${t.title} | ${role(t.role).name} | ${t.status} | ${t.blocked||''}`).join('\n')+'\n\n## Catalogue des fichiers\n'+p.assets.map(a=>`${a.name} (${a.status}) : ${a.note}`).join('\n');
    const limit=level==='court'?2000:level==='standard'?10000:50000;
    let body=head+extra;
    if(body.length>limit)body=body.slice(0,limit)+'\n[Contexte abrégé ; consulter le dossier commun pour la suite.]\n';
    return body+task+(request?'\n## Demande actuelle\n'+request+'\n':'')+'\n## Transmission attendue\nIndique le résultat produit, les fichiers concernés, les vérifications réellement faites et ce que le prochain poste doit reprendre. Ne présente pas une proposition comme une décision validée.\n';
  }

  function proposeTask(idea, roleId='', ai='') {
    const objective=text(idea).trim();if(!objective)throw Error('Décris ton idée.');
    const rules=[['tests',/test|vérifi|anomal|régression/i],['medias',/illustr|image|photo|aquarelle|audio/i],['contenus',/cours|texte|dialogue|rédig|pédagog/i],['design',/couleur|charte|typograph|maquette/i],['usages',/parcours|navigation|ergonom/i],['livraison',/publier|livraison|version/i],['recherche',/source|recherche|documentation/i],['programmation',/code|fonction|ajout|corrig|amélior|application/i]];
    const r=role(roleId||rules.find(([,re])=>re.test(objective))?.[0]||'pilotage');
    return {id:uid(),title:objective.slice(0,100),objective,role:r.id,owner:ai||r.primaryAI,status:'ready',priority:'normal',inputs:'Consulter le contexte sélectionné et les fichiers joints.',deliverable:r.output,criteria:'Le résultat répond à la demande.\nLes données et fonctions existantes sont conservées.\nLes vérifications effectuées et les limites sont décrites.',evidence:'',blocked:'',dependsOn:[],assetIds:[],updatedAt:new Date().toISOString(),validationVersion:3};
  }
  function contextChoices(p,roleId) {
    const kinds={programmation:['technical','rules'],design:['design','rules'],medias:['design','sources'],recherche:['sources','rules'],contenus:['brief','sources','rules'],tests:['technical','rules'],usages:['brief','design']};
    return p.documents.filter(d=>d.content.trim()).map(d=>({...d,selected:(kinds[roleId]||['brief','rules']).includes(d.kind)}));
  }
  function missionPrompt(p,level,roleId,taskId,request,selection,ai='ChatGPT',includeContext=false) {
    const t=p.workItems.find(t=>t.id===taskId),r=role(t?.role||roleId);
    const parts=['Mission pour '+ai,r.prompt];
    if(t){parts.push('## Tâche\n'+t.title);for(const [label,value] of [['Objectif',t.objective],['Éléments utiles à cette tâche',t.inputs],['Résultat attendu',t.deliverable],['Critères de réussite',t.criteria]])if(text(value).trim())parts.push('## '+label+'\n'+value);if(text(t.workBranch).trim())parts.push('Branche de travail : '+t.workBranch);if(text(t.pullRequest).trim())parts.push('Demande de fusion : '+t.pullRequest);}
    if(text(request).trim())parts.push('## Demande complémentaire\n'+request);
    if(!t&&!text(request).trim())parts.push('Décris la mission à réaliser.');
    if(!includeContext)return parts.join('\n\n')+'\n';
    const ids=Array.isArray(selection)?selection:contextChoices(p,roleId).filter(d=>d.selected).map(d=>d.id);
    const selected={...p,documents:p.documents.filter(d=>ids.includes(d.id))};
    return 'Mission pour '+ai+' · préparation locale, sans API IA payante\n'+(ai==='Claude'?'Présente une réponse structurée et des livrables directement réutilisables.':'Avance par étapes concrètes et fournis les livrables ainsi que leurs vérifications.')+'\n'+context(selected,level,roleId,taskId,request)+taskGithub(p,p.workItems.find(t=>t.id===taskId));
  }
  function validateTask(p,previous,next) {
    if(next.status==='doing'&&(next.blocked||dependencyIssues(p,next).length))throw Error('Résous les prérequis et blocages avant de commencer.');
    if(next.status==='review'&& !['returned','review','done'].includes(previous.status))throw Error('Enregistre d’abord le retour de mission dans « Travail rendu ».');
    if(next.status==='done') {
      if(previous.status!=='review'&&(previous.status!=='done'||previous.validationVersion!==3))throw Error('Passe par « À vérifier » avant de valider.');
      if(!text(next.result).trim()||!text(next.evidence).trim()||!text(next.criteria).trim())throw Error('Renseigne le résultat, les critères et les vérifications avant validation.');
      if(next.blocked||unresolved(p,next).length)throw Error('Résous les blocages et prérequis avant validation.');
      if(previous.status==='done'&&['title','result','resultFiles','resultLimits','evidence','criteria','objective','deliverable','role','owner','inputs','blocked','workBranch','pullRequest','assetIds','dependsOn'].some(k=>JSON.stringify(previous[k])!==JSON.stringify(next[k]))) {
        next.status='review';next.completedAt='';
      } else {next.validationVersion=3;next.legacyCompleted=false;next.invalidatedReason='';}
    }
    return next;
  }
  function isValidated(t) {return !!t&&t.status==='done'&&t.validationVersion===3&&!t.legacyCompleted;}
  function dependencyIssues(p,t) {
    const issues=new Map(),path=new Set([t.id]),expanded=new Set();
    function visit(id) {
      const item=p.workItems.find(x=>x.id===id);
      if(path.has(id)){issues.set('cycle:'+id,{id,title:item?.title||id,reason:'Dépendance circulaire'});return;}
      if(!item){issues.set('missing:'+id,{id,title:'Tâche absente : '+id,reason:'Prérequis introuvable'});return;}
      if(!isValidated(item)||item.blocked)issues.set(id,{...item,reason:item.blocked?'Prérequis bloqué : '+item.blocked:'Prérequis non validé'});
      if(expanded.has(id))return;expanded.add(id);path.add(id);for(const dep of item.dependsOn||[])visit(dep);path.delete(id);
    }
    for(const id of t.dependsOn||[])visit(id);
    return [...issues.values()];
  }
  function unresolved(p,t) {return dependencyIssues(p,t);}
  function reconcileDependencies(p) {
    let changed=false;
    for(const t of p.workItems)if(isValidated(t)&&dependencyIssues(p,t).length){
      t.status='review';t.completedAt='';t.invalidatedReason='Un prérequis a changé : revérifier ce résultat.';changed=true;
    }
    return changed;
  }
  function nextSuggestions(p) {
    const list=[];
    for(const t of p.workItems) {
      if(!isValidated(t)||t.blocked||dependencyIssues(p,t).length)continue;
      const nextRole=['design','contenus','medias','usages'].includes(t.role)?'programmation':t.role==='programmation'?'tests':t.role==='tests'?'livraison':'';
      if(!nextRole)continue;
      const key=t.id+':'+nextRole;
      if(p.workItems.some(x=>x.suggestionKey===key||x.role===nextRole&&(x.dependsOn||[]).includes(t.id)))continue;
      const verb=nextRole==='tests'?'Vérifier':nextRole==='livraison'?'Préparer la livraison de':'Intégrer';
      list.push({key,sourceId:t.id,role:nextRole,title:verb+' : '+t.title,reason:'Le résultat « '+t.title+' » est validé. Le poste '+role(nextRole).name+' peut prendre la suite.'});
    }
    return list;
  }
  function suggestedTask(p,key) {
    const suggestion=nextSuggestions(p).find(x=>x.key===key);if(!suggestion)throw Error('Cette suggestion est déjà traitée ou n’est plus disponible.');
    const source=p.workItems.find(x=>x.id===suggestion.sourceId),t=proposeTask(suggestion.title,suggestion.role);
    return {...t,workBranch:text(source.workBranch),pullRequest:text(source.pullRequest),suggestionKey:key,dependsOn:[source.id],objective:suggestion.title,inputs:'Résultat validé à reprendre : '+source.result+'\nRéférences : '+(source.resultFiles||'À préciser'),criteria:suggestion.role==='tests'?'Contrôler le résultat attendu, les sauvegardes et les régressions. Décrire les tests réellement effectués et les limites.':t.criteria};
  }
  const RELEASE_CHECKS=[['backup','Sauvegarde complète conservée'],['scope','Version et fichiers à livrer identifiés'],['tests','Tests de la version exécutés et preuves relues'],['rollback','Procédure de retour arrière préparée']];
  function releaseSignature(p) {
    return String(crc32(new TextEncoder().encode(JSON.stringify(p.workItems.map(t=>({id:t.id,title:t.title,status:t.status,validationVersion:t.validationVersion,role:t.role,result:text(t.result),evidence:text(t.evidence),criteria:text(t.criteria),blocked:text(t.blocked),dependsOn:t.dependsOn||[],resultFiles:text(t.resultFiles),resultLimits:text(t.resultLimits),workBranch:text(t.workBranch),pullRequest:text(t.pullRequest),regressionChecks:t.regressionChecks||[],regressionSignature:text(t.regressionSignature),affectedFeatureIds:t.affectedFeatureIds||[]}))))));
  }
  function githubHealth(o) {
    const checks=o?.checks?.check_runs||[],statuses=o?.status?.statuses||[];
    const failed=checks.some(c=>['failure','cancelled','timed_out','action_required','startup_failure','stale'].includes(c.conclusion))||statuses.some(c=>['failure','error'].includes(c.state));
    const pending=checks.some(c=>c.status!=='completed')||statuses.some(c=>c.state==='pending');
    const mismatch=checks.some(c=>c.head_sha&&o?.status?.sha&&c.head_sha!==o.status.sha);
    const clear=checks.length+statuses.length>0&&!failed&&!pending&&!mismatch&&!o?.errors?.checks&&!o?.errors?.status&&checks.every(c=>['success','neutral','skipped'].includes(c.conclusion));
    return {failed,pending,clear,label:failed?'Échec signalé par GitHub':pending?'Contrôles en cours':clear?'Contrôles consultés sans échec':'Contrôles non confirmés'};
  }
  function taskGithub(p,t) {
    if(!p.github.owner||!p.github.repo)return '';
    return '\n## Repères GitHub de la mission\nDépôt : https://github.com/'+p.github.owner+'/'+p.github.repo+'\nBranche de travail : '+(text(t?.workBranch)||'À créer ou confirmer sur GitHub')+'\nDemande de fusion : '+(text(t?.pullRequest)||'À préparer après les tests')+'\nConsulte le code existant et travaille sur une branche dédiée. Rapporte les commits, fichiers, tests et limites. Prépare la livraison après validation, puis vérifie la fusion et le déploiement séparément.\n';
  }
  function releaseReadiness(p) {
    const items=p.workItems,issues=items.filter(t=>!isValidated(t)||t.blocked||dependencyIssues(p,t).length);
    const missing=RELEASE_CHECKS.filter(([id])=>p.releasePlan?.checks?.[id]!==true).map(([,label])=>label);
    if(!text(p.releasePlan?.version).trim())missing.unshift('Version cible à renseigner');
    if(!text(p.releasePlan?.rollback).trim())missing.push('Retour arrière à décrire');
    if(!items.some(t=>t.role==='tests'&&isValidated(t)&&!dependencyIssues(p,t).length))missing.push('Une mission Tests & qualité validée est nécessaire');
    if(!items.length)missing.push('Aucune tâche dans le projet');
    if(p.releasePlan?.reviewSignature&&p.releasePlan.reviewSignature!==releaseSignature(p))missing.push('Les tâches ont changé depuis la préparation : relire et confirmer de nouveau la fiche.');
    return {ready:issues.length===0&&missing.length===0,issues,missing};
  }
  function releaseNotes(p) {
    const r=releaseReadiness(p),plan=p.releasePlan||{};
    return '# Préparation de livraison · '+p.name+'\nVersion cible : '+(text(plan.version)||'À préciser')+'\nÉtat local : '+(r.ready?'Dossier prêt pour une revue de livraison':'Préparation incomplète')+'\n\n## Résultats validés\n'+completedTasks(p).map(t=>'- '+t.title+' : '+t.result+'\n  Vérifications : '+t.evidence+'\n  Références : '+t.resultFiles+'\n  Branche : '+t.workBranch+'\n  Demande de fusion : '+t.pullRequest+'\n  Limites : '+t.resultLimits).join('\n')+'\n\n## À résoudre\n'+[...r.issues.map(t=>t.title),...r.missing].map(x=>'- '+x).join('\n')+'\n\n## Notes\n'+text(plan.notes)+'\n\n## Retour arrière\n'+text(plan.rollback)+'\n\nPréparation locale. La fusion GitHub et la publication doivent être vérifiées séparément.\n';
  }
  function utf8Base64(s) {const b=new TextEncoder().encode(s);let binary='';for(let i=0;i<b.length;i+=8192)binary+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(binary);}
  function fromBase64(s) {const str=atob(s.replace(/\s/g,''));return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(str,c=>c.charCodeAt(0)));}
  const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  function crc32(b){let c=0xffffffff;for(const v of b)c=crcTable[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  async function makeZip(files) {
    const chunks=[],central=[];let offset=0;
    for(const file of files){const name=new TextEncoder().encode(file.name),bytes=new Uint8Array(await file.blob.arrayBuffer()),crc=crc32(bytes),header=new Uint8Array(30+name.length),v=new DataView(header.buffer);
      v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);header.set(name,30);
      const cd=new Uint8Array(46+name.length),d=new DataView(cd.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,bytes.length,true);d.setUint32(24,bytes.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);cd.set(name,46);chunks.push(header,bytes);central.push(cd);offset+=header.length+bytes.length;
    }
    const size=central.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);return new Blob([...chunks,...central,end],{type:'application/zip'});
  }
  function missionEvaluated(h) {
    return Number.isFinite(Date.parse(text(h.evaluatedAt)))&&['done','partial','failed'].includes(h.outcome)&&!!text(h.result).trim();
  }
  function filteredMissions(p,roleId='',ai='') {
    return p.handoffs.filter(h=>['ChatGPT','Claude'].includes(h.to)&&(!roleId||(roleId==='unassigned'?!h.role:h.role===roleId))&&(!ai||h.to===ai));
  }
  function missionStats(p,roleId='',ai='') {
    const entries=filteredMissions(p,roleId,ai);
    return (ai?[ai]:['ChatGPT','Claude']).map(name=>{
      const own=entries.filter(h=>h.to===name),evaluated=own.filter(missionEvaluated),rated=evaluated.filter(h=>[1,2,3,4,5].includes(h.rating));
      const count=status=>evaluated.filter(h=>h.outcome===status).length;
      return {ai:name,total:own.length,evaluated:evaluated.length,excluded:own.length-evaluated.length,rated:rated.length,average:rated.length?rated.reduce((sum,h)=>sum+h.rating,0)/rated.length:null,done:count('done'),partial:count('partial'),failed:count('failed'),successRate:evaluated.length?100*count('done')/evaluated.length:null};
    });
  }
  function missionReport(p,roleId='',ai='') {
    const missions=filteredMissions(p,roleId,ai).filter(missionEvaluated);
    return '# Bilan des missions évaluées · '+p.name+'\nPoste : '+(roleId==='unassigned'?'Non renseigné':roleId?role(roleId).name:'Tous')+' · IA : '+(ai||'Toutes')+'\n\n'+missionStats(p,roleId,ai).map(s=>s.ai+' : '+s.evaluated+' évaluée(s) / '+s.total+' archivée(s), '+s.done+' réussie(s), '+s.partial+' partielle(s), '+s.failed+' non satisfaisante(s). Note : '+(s.average===null?'Non notée':s.average.toFixed(1)+'/5 sur '+s.rated+' avis personnels.')).join('\n')+'\n\n'+missions.map(h=>'## '+h.title+' ['+h.id+']\nIA : '+h.to+' · Poste : '+(h.role?role(h.role).name:'Non renseigné')+'\nÉvaluée le : '+h.evaluatedAt+'\nRésultat déclaré : '+h.outcome+' · Note : '+(h.rating||'Non notée')+'\nLivrable : '+h.result+'\nLimites et corrections : '+h.notes).join('\n\n')+'\n\nAppréciations personnelles sur les missions ci-dessus. Aucune mesure objective ni classement général des IA. Les missions sans évaluation complète sont exclues.\n';
  }
  const api={missionEvaluated,filteredMissions,missionStats,missionReport,releaseSignature,githubHealth,taskGithub,isValidated,dependencyIssues,reconcileDependencies,nextSuggestions,suggestedTask,RELEASE_CHECKS,releaseReadiness,releaseNotes,proposeTask,contextChoices,missionPrompt,validateTask,VERSION,KEY,ROLES,completedTasks,STATUSES,ASSET_STATUSES,DEFAULT_DOCS,uid,text,clone,role,normalizeProject,normalizeState,starter,slug,safeFilename,parseRepo,safePath,sharedPayload,applyShared,markdown,context,unresolved,utf8Base64,fromBase64,makeZip};
  root.AtelierCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
