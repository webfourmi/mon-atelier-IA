(function (root) {
  'use strict';
  const C = root.AtelierCore || (typeof require === 'function' && require('./planning.js'));
  const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const fold = value => clean(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const key = value => fold(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const join = (left, right) => clean([left, right].filter(Boolean).join(' '));
  const levels = {high:'Haute', normal:'Normale', low:'Basse'};

  function priority(value) {
    const s = key(value);
    if (/\b(haute?|elevee?|critique|urgente?|majeure?|bloquante?|prioritaires?|high|critical|p[01])\b/.test(s)) return 'high';
    if (/\b(basse?|faible|mineure?|secondaire|facultative?|low|p[34])\b/.test(s)) return 'low';
    if (/\b(normale?|moyenne?|moderee?|medium|p2)\b/.test(s)) return 'normal';
    return '';
  }

  const roles = [
    ['tests', /\b(tests?|tester|recette|qa|regressions?|verification de coherence|verifier|controler|revalider)\b/],
    ['recherche', /\b(recherche|expertise|sources?|bibliograph\w*|documenter)\b/],
    ['livraison', /\b(livraison|deploiement|deployer|publier|publication|release|mise en production)\b/],
    ['design', /\b(design|interface graphique|ui|couleurs?|contraste|lisibilite|typograph\w*|polices?|maquettes?|tailles? de (?:texte|police)|theme (?:clair|sombre)|mode (?:clair|sombre))\b/],
    ['usages', /\b(usages?|parcours|ux|navigation|ergonomie|accessibilite|menus?|onboarding)\b/],
    ['medias', /\b(medias?|illustrations?|aquarelles?|photos?|icones?|portrait\w*|sonores?|audio|vignettes?)\b/],
    ['contenus', /\b(contenus?|pedagog\w*|redig\w*|reecri\w*|reformul\w*|dialogues?|orthographe|lecons?|cours|progression reelle|surcharge|decharge|durees annoncees)\b/],
    ['optimisation', /\b(optimisation|performance|lenteurs?|optimiser|temps de chargement|memoire vive)\b/],
    ['programmation', /\b(programmation|developp\w*|dev|implementation|technique|code|fonctionn\w*|algorithme|script|bugs?|donnees|structure|sauvegard\w*|corriger|fiabiliser|calcul\w*|synchronis\w*|automatis\w*)\b/],
    ['pilotage', /\b(pilotage|prioriser|planifi\w*|strateg\w*|organisation|coordonn\w*)\b/]
  ];
  function matchRole(value) {
    const s = key(value);
    return roles.find(([, pattern]) => pattern.test(s))?.[0];
  }
  function chooseRole(item) {
    const explicit = C.ROLES.find(r => [key(r.id), key(r.name)].includes(key(item.poste)));
    if (explicit) return explicit.id;
    const given = matchRole(item.poste);
    if (given) return given;
    const title = key(item.title), section = key(item.section);
    if (/^(?:verifier|valider|recouper) (?:les |la |des )?sources/.test(title)) return 'recherche';
    if (/^(?:tests? a |recette|verifications a )/.test(section)) return 'tests';
    const specific = matchRole(title);
    if (specific) return specific;
    const bySection = matchRole(section);
    if (bySection) return bySection;
    if (/mecanique[s]? (?:rpg|de jeu)/.test(section)) return 'programmation';
    if (/programmes? d entrainement/.test(section)) return 'contenus';
    return matchRole(item.solution) || matchRole(item.problem) || 'pilotage';
  }

  // Keep the positions of text runs. PDF reading order alone interleaves wrapped table cells.
  function pageLines(items, viewport) {
    const [a,b,c,d,e,f] = viewport.transform;
    const parts = items.filter(item => clean(item.str)).map(item => {
      const [,,,,tx,ty] = item.transform;
      return {text:clean(item.str), raw:item.str, x:a*tx+c*ty+e, y:b*tx+d*ty+f,
        size:Math.abs(item.height) || Math.hypot(item.transform[2], item.transform[3]) || 10, width:item.width};
    });
    parts.sort((p,q) => p.y-q.y || p.x-q.x);
    const rows = [];
    for (const part of parts) {
      let row = rows.at(-1);
      if (!row || Math.abs(row.y-part.y) > Math.max(2, Math.min(row.size,part.size)*0.35)) {
        row = {y:part.y, size:part.size, parts:[]};
        rows.push(row);
      }
      row.parts.push(part);
    }
    return rows.map(row => {
      const cells = [];
      for (const part of row.parts.sort((p,q) => p.x-q.x)) {
        const previous = cells.at(-1), gap = previous ? part.x-previous.end : Infinity;
        if (previous && gap < Math.max(2.5, row.size*0.67)) {
          const space = gap > row.size*0.11 || /\s$/.test(previous.raw) || /^\s/.test(part.raw);
          previous.text += (space ? ' ' : '')+part.text;
          previous.end = Math.max(previous.end, part.x+part.width);
          previous.raw = part.raw;
        } else cells.push({x:part.x, end:part.x+part.width, text:part.text, raw:part.raw});
      }
      return {y:row.y, size:row.size, cells, text:cells.map(cell => cell.text).join(' ')};
    });
  }
  const columnNames = {
    ref:/^(ref(?:erence)?|id|code|n[°o]?)$/,
    title:/^(ameliorations?(?: (?:proposees?|a faire))?|titre|nom(?: de la tache)?|taches?|sujet|intitule|finding)$/,
    problem:/^(problemes?(?: (?:constates?|identifies?))?|constats?|observations?|anomalies?|faiblesses?|problem)$/,
    solution:/^(solutions?(?: (?:proposees?|recommandees?|envisagees?))?|pistes?(?: de solution)?|recommandations?|actions?(?: (?:a mener|correctives?|recommandees?|proposees?))?|correctifs?|recommendation)$/,
    priority:/^(priorites?|gravite|severite|urgence|priority)$/,
    poste:/^(poste(?: de travail)?|role|categorie|responsable|equipe)$/,
    detail:/^(details?(?: et justification)?|justifications?|description|explications?)$/,
    status:/^(etat(?: (?:connu|actuel))?|statut|status|avancement)$/,
    effort:/^(effort|charge|complexite)$/
  };
  function fieldName(s) {
    const label = key(s);
    return Object.keys(columnNames).find(k => columnNames[k].test(label));
  }
  function columnHeaders(cells) {
    const columns = cells.map(cell => ({x:cell.x, name:fieldName(cell.text), proposed:/^amelioration/.test(key(cell.text))}));
    const known = new Set(columns.map(col => col.name).filter(Boolean));
    if (known.size < 2 || !['title','problem','solution'].some(k => known.has(k))) return null;
    return columns;
  }
  function fieldsAt(line, columns) {
    const fields = {};
    for (const cell of line.cells) {
      const col = columns.findLast(h => h.x <= cell.x + Math.min(8,line.size*0.8)) || columns[0];
      if (col.name) fields[col.name] = join(fields[col.name],cell.text);
    }
    return fields;
  }
  const actionWord = /^(?:il (?:faut|faudrait) |(?:nous |on )?(?:devrait|doit) )?(?:ajout\w*|amelior\w*|corrig\w*|creer|mettr\w*|revoir|relev\w*|redig\w*|remplac\w*|propos\w*|verifi\w*|test\w*|fiabilis\w*|uniformis\w*|simplifi\w*|integr\w*|prevoir|adapter|rendre|renforcer|affich\w*|augmen\w*|redui\w*|supprim\w*|retir\w*|deplac\w*|implement\w*|permettr\w*|repar\w*|optimis\w*|document\w*|securis\w*|assur\w*|activ\w*|recalcul\w*|evit\w*|clarifi\w*|recuper\w*|respect\w*|gener\w*|compter|viser|modifier|control\w*|revalid\w*|prioris\w*|conserv\w*)\b/;
  const looksAction = text => actionWord.test(fold(text));
  const skipHeading = /^(?:synthese|resume|sommaire|introduction|contexte|methodolog\w*|points? forts?|sources?|references|points? de vigilance|ordre de mise en oeuvre|etat (?:de |actuel)|ce qui fonctionne|acquis|decisions? (?:retenues?|validees?)|(?:travaux|taches|actions|ameliorations|corrections) (?:deja )?(?:realise\w*|termine\w*|applique\w*))\b|\b(?:decision centrale|fonctionnalite (?:deja )?(?:ajoutee|livree))\b/;
  const actionHeading = /\b(?:ameliorations?|recommandations?|faiblesses?|anomalies?|problemes?|corrections?|a faire|a ameliorer|a corriger|actions? (?:a|recommandees?)|plan d.action|tests? a|points? a ameliorer|pistes? d.amelioration|backlog)\b/;
  const issueWords = /\b(?:echou\w*|plant\w*|bloqu\w*|se fige|illisible|impossible|manqu\w*|incoheren\w*|ne (?:fonctionne|permet|repond|s.affiche) (?:plus|pas))\b/;
  const completed = /^(?:fait|termine|resolu|valide|livre|corrige|implemente|realise|applique|done|clos|cloture)(?:e|es|s)?\b/;
  const metadata = /^(?:sources?|references bibliographiques|limites de l.analyse|document (?:prepare|genere)|application analysee|date de l.audit)\s*:/;
  const bullet = /^(?:[•●▪◦‣*–—-]|\[(?: |x)\]|\d+(?:\.\d+)*[.)])\s+/i;
  const labelPattern = /^(nom(?: de la t[âa]che)?|titre|probl[eè]me|constat|observation|anomalie|solution(?: (?:propos[ée]e|recommand[ée]e|envisag[ée]e))?|piste(?: de solution)?|action(?: (?:recommand[ée]e|corrective|propos[ée]e|[àa] mener))?|recommandation|priorit[ée]|gravit[ée]|poste(?: de travail)?|r[oô]le|cat[ée]gorie|[ée]tat|statut|r[ée]f(?:[ée]rence)?\.?)\s*:\s*(.*)$/i;
  function splitDetail(detail) {
    const sentences = clean(detail).split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/);
    const action = sentences.findIndex(s => looksAction(s));
    if (action < 0) return {problem:clean(detail),solution:''};
    return {problem:sentences.slice(0,action).join(' '),solution:sentences.slice(action).join(' ')};
  }
  function shortTitle(text) {
    const first = clean(text).split(/(?<=[.!?])\s/)[0].replace(/[.!;:]$/,'');
    return first.length <= 120 ? first : first.slice(0,117).replace(/\s+\S*$/,'')+'…';
  }
  function normalise(raw) {
    if (completed.test(key(raw.status))) return null;
    const detail = splitDetail(raw.detail || '');
    const sourceTitle = clean(raw.title);
    let problem = clean(raw.problem || detail.problem), solution = clean(raw.solution || detail.solution);
    // Keep ambiguous justifications available verbatim without inventing a defect or a fix.
    if (raw.table && raw.detail && !raw.problem && !detail.solution && !issueWords.test(fold(raw.detail)) &&
        !/\b(?:aujourd.hui|trop|sans|seul|varie|recul\w*|au lieu|n.est|ne sont|mais|actuel\w*|possible de|limite\w*)\b/.test(fold(raw.detail))) {
      problem = '';
    }
    if (!solution && sourceTitle && (looksAction(sourceTitle) || raw.proposed)) solution = sourceTitle;
    const title = sourceTitle || shortTitle(problem || solution);
    if (!title || !/\p{L}/u.test(title)) return null;
    const item = {...raw,title,problem,solution};
    return {title,problem,solution,role:chooseRole(item),priority:priority(raw.priority)||'normal',
      page:raw.page,section:raw.section||'',ref:clean(raw.ref),detail:clean(raw.detail),originalTitle:title};
  }

  function readTables(pages) {
    const items = [], prose = [];
    let columns, row, section = '', prevY, prevPage;
    function finishRow() { if (row && !skipHeading.test(fold(row.section))) items.push(row); row=null; }
    for (const page of pages) {
      for (const line of page.lines) {
        const numbered = line.text.match(/^\d+(?:\.\d+)*[.)]\s+(.+)/);
        const header = columnHeaders(line.cells);
        if (header) { columns=header; continue; }
        if (line.cells.length===1 && ((numbered && !looksAction(numbered[1])) ||
            (line.isHeading && (!columns || line.cells[0].x<=columns[0].x+8)))) {
          finishRow(); columns=null; section=numbered?.[1]||line.text;
        }
        if (!columns) { prose.push({...line,page:page.number}); continue; }
        const fields = fieldsAt(line,columns);
        const lead = columns.find(h => ['title','problem','solution'].includes(h.name))?.name;
        const hasRef = columns.some(h => h.name==='ref');
        const gap = prevPage===page.number ? line.y-prevY : Infinity;
        const newRow = !row || !!fields.ref || (fields[lead] && (line.delimited || fields.priority || fields.status ||
          (!hasRef && gap>line.size*1.65)));
        if (newRow) { finishRow(); row={table:true,proposed:columns.some(c=>c.proposed),section,page:page.number,size:line.size}; }
        for (const [k,v] of Object.entries(fields)) row[k]=join(row[k],v);
        prevY=line.y; prevPage=page.number;
      }
    }
    finishRow();
    return {items,prose};
  }

  function readProse(lines) {
    const items=[];
    let section='', excluded=false, groupPriority='', draft=null, activeField='', pending='';
    function finish() {
      if (draft) {
        if (draft.body) {
          const body=draft.body, split=body.match(/^(.+?)\s+(?:[→⇒]|->|=>|[–—])\s+(.+)$/);
          if (split) { draft.problem=split[1]; draft.solution=split[2]; }
          else if (looksAction(body)) draft.solution=body;
          else draft.detail=body;
        }
        items.push(draft);
      }
      draft=null; activeField='';
    }
    function begin(page) { return {page,section,priority:groupPriority}; }
    function setSection(title) {
      finish(); section=title; excluded=skipHeading.test(fold(title));
      groupPriority=priority(title); pending='';
    }
    const logicalLines=lines.flatMap(line=>line.text.split(/\s+(?=(?:probl[eè]me|constat|solution(?: (?:propos[ée]e|recommand[ée]e|envisag[ée]e))?|piste(?: de solution)?|recommandation|priorit[ée]|poste|statut)\s*:)/i)
      .map((text,index)=>({...line,text,paragraphBreak:index===0 && line.paragraphBreak})));
    for (const [index,line] of logicalLines.entries()) {
      const text=line.text, plain=fold(text), marked=bullet.test(text);
      let content=text.replace(bullet,'').trim();
      const marker=content.match(/^(?:\[((?:priorit[ée]\s*:?\s*)?(?:P[0-4]|haute?|moyenne?|normale?|basse?|critique|urgente?))\]|(P[0-4]|Haute|Moyenne|Basse)\s*[-–—:])\s*/i);
      if (marker) content=content.slice(marker[0].length);
      const low=fold(content);
      const label=content.match(labelPattern);
      const numbered=/^\d+(?:\.\d+)*[.)]\s+/.test(text);
      const namedSection=skipHeading.test(low) || actionHeading.test(low);
      const followedByFields=labelPattern.test(logicalLines[index+1]?.text.replace(bullet,'')||'');
      const isHeading=!label && !marker && !/[.!?]$/.test(content) &&
        ((namedSection && (numbered || line.isHeading || (!marked && (content.endsWith(':') || content.split(/\s+/).length<7)))) ||
         (!looksAction(content) && !followedByFields && (numbered || line.isHeading)));
      if (metadata.test(plain)) { setSection('Sources'); continue; }
      if (isHeading) { setSection(content.replace(/:$/,'')); continue; }
      if (excluded) continue;
      if (!label && followedByFields && (marked || line.isHeading || (!draft && !/[.!?:]$/.test(content))) &&
          content.length<125 && !/\baudit\b/.test(low)) {
        finish(); pending=content; continue;
      }
      if (!label && !marked && text.endsWith(':')) {
        finish(); groupPriority=priority(text)||groupPriority; continue;
      }
      if (label) {
        const field=fieldName(label[1]);
        if (!field) continue;
        if (!draft || (field==='title' && (draft.title||draft.problem||draft.solution)) ||
            (field==='problem' && draft.problem) || (field==='ref' && draft.ref)) {
          finish(); draft=begin(line.page);
          if (pending && field!=='title') draft.title=pending;
        }
        pending=''; activeField=field; draft[field]=clean(label[2]); continue;
      }
      const newParagraph=!draft || line.paragraphBreak || /[.!?]$/.test(draft[activeField]||'');
      if (marked || marker || (newParagraph && (looksAction(content) || (actionHeading.test(fold(section)) && issueWords.test(low))))) {
        finish(); pending=''; if (/^(?:[-•]\s*)?\[x\]|^☑/i.test(text) || completed.test(low)) continue;
        draft=begin(line.page);
        if (marker) draft.priority=marker[1]||marker[2];
        activeField='body'; draft.body=content; continue;
      }
      if (draft && activeField && !line.paragraphBreak) {
        draft[activeField]=join(draft[activeField],text); continue;
      }
      if (draft) finish();
      pending = (line.isHeading || (text.length<95 && !/[.!?:]$/.test(text))) ? text : '';
    }
    finish();
    return items.flatMap(item => {
      // Some reports put several independent checks in one sentence with a shared instruction.
      const list = (item.solution||'').match(/^((?:V[ée]rifier|Tester|Contr[oô]ler)[^:;]{0,65}):\s*(.+;.+)$/i);
      if (!list || item.title || item.problem) return [item];
      return list[2].split(/\s*;\s*/).filter(Boolean).map(part => ({...item,solution:list[1].trim()+' : '+part}));
    });
  }

  function parse(pages) {
    // Exclude page numbers and repeating marginal headers/footers without removing table headers.
    const edgePages = new Map();
    const margin = (page,line) => page.height && (line.y < page.height*0.075 || line.y > page.height*0.925);
    for (const page of pages) for (const line of page.lines) if (margin(page,line)) {
      const id=key(line.text.replace(/\d+/g,'#'));
      if (!edgePages.has(id)) edgePages.set(id,new Set());
      edgePages.get(id).add(page.number);
    }
    const prepared=pages.map(page => {
      let previous;
      const lines=page.lines.filter(line => !/^(?:page\s*)?\d+\s*(?:\/\s*\d+)?$/i.test(line.text) &&
        !(/\bpage\s+\d+(?:\s*\/\s*\d+)?$/i.test(line.text) && margin(page,line)) &&
        !(margin(page,line) && edgePages.get(key(line.text.replace(/\d+/g,'#')))?.size>1 && !columnHeaders(line.cells)));
      const sizes=lines.map(line=>line.size).sort((a,b)=>a-b);
      const bodySize=sizes[Math.floor(sizes.length/2)]||10;
      return {...page,lines:lines.map(line => {
        const paragraphBreak=line.paragraphBreak || (!!previous && line.y-previous.y>line.size*1.86);
        previous=line;
        return {...line,paragraphBreak,isHeading:line.isHeading || (line.size>bodySize*1.18 && line.text.length<150)};
      })};
    });
    const {items,prose}=readTables(prepared);
    return [...items,...readProse(prose)].map(normalise).filter(Boolean).sort((a,b)=>a.page-b.page);
  }
  function fromText(text) {
    return text.split('\f').map((part,i) => {
      let blank=false;
      const lines=[];
      for (const raw of part.split(/\r?\n/)) {
        if (!raw.trim()) { blank=true; continue; }
        if (/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+[\s:-]*$/.test(raw)) continue;
        const isHeading=/^\s*#{1,6}\s/.test(raw);
        const value=raw.replace(/^\s*#{1,6}\s+/,'');
        let cells;
        const delimited=/[|\t]/.test(value);
        if (delimited) {
          cells=value.trim().replace(/^\||\|$/g,'').split(/[|\t]/).map((s,i)=>({x:i*100,text:clean(s)}));
        } else {
          cells=[...value.matchAll(/\S(?:.*?\S)?(?=\s{2,}|$)/g)].map(m=>({x:m.index*7,text:clean(m[0])}));
        }
        cells=cells.filter(c=>c.text);
        if (!cells.length) cells=[{x:0,text:clean(value)}];
        lines.push({text:cells.map(c=>c.text).join(' '), cells, isHeading, delimited, y:lines.length*12,size:10,paragraphBreak:blank});
        blank=false;
      }
      return {number:i+1,lines};
    });
  }

  function sourceLabel(source) {
    return [source.name, source.page && 'p. '+source.page, source.ref, source.section].filter(Boolean).join(' · ');
  }
  function duplicate(existing, item, sourceId) {
    const sameSource = existing.auditSource?.document === sourceId &&
      existing.auditSource?.entry === item.entry;
    return sameSource || (!!key(item.title) && key(existing.title) === key(item.title));
  }
  function newTasks(project, chosen, document) {
    const tasks=[];
    for (const item of chosen) {
      if (!clean(item.title)) throw Error('Donne un nom à chaque tâche sélectionnée.');
      if ([...project.workItems,...tasks].some(t=>duplicate(t,item,document.id))) continue;
      const t=C.makeTask(project,item.title,item.role);
      const source={document:document.id,entry:item.entry,name:document.name,page:item.page,ref:item.ref,section:item.section};
      tasks.push({...t,title:clean(item.title),objective:clean(item.problem),deliverable:clean(item.solution),
        inputs:[sourceLabel(source),item.detail].filter(Boolean).join('\n\n'),priority:item.priority,status:'draft',validationVersion:0,
        result:'',evidence:'',completedAt:'',auditSource:source});
    }
    const order={high:0,normal:1,low:2};
    return tasks.sort((a,b)=>order[a.priority]-order[b.priority]);
  }
  function matchProject(projects, text) {
    const haystack=' '+key(text)+' ';
    const matches=projects.filter(p=>[p.name,p.github?.repo].some(name=>key(name).length>=3 && haystack.includes(' '+key(name)+' ')));
    return matches.length===1 ? matches[0] : null;
  }
  const api={levels,pageLines,fromText,parse,key,duplicate,sourceLabel,newTasks,matchProject};
  root.AtelierAudit=api;
  if (typeof module!=='undefined' && module.exports) module.exports=api;
})(globalThis);
