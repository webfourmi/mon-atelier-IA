(function () {
  'use strict';
  const A=window.AtelierAudit;
  const scriptBase=new URL('.',document.currentScript.src);
  const $=selector=>document.querySelector(selector);
  const reviewMessages={
    existing:'Déjà dans les tâches', repeated:'Même constat dans la sélection', namesake:'Même titre · compare les constats'
  };
  let readerPromise;
  function script(path) {
    return new Promise((resolve,reject)=>{
      const el=document.createElement('script');
      el.src=new URL(path,scriptBase).href;
      el.onload=resolve;
      el.onerror=()=>{el.remove(); reject(Error('Le lecteur PDF est indisponible. Vérifie que le dossier vendor/pdfjs accompagne l’application.'));};
      document.head.append(el);
    });
  }
  function reader() {
    if (!readerPromise) readerPromise=(async()=>{
      await script('vendor/pdfjs/pdf.min.js');
      const pdf=window.pdfjsLib;
      pdf.GlobalWorkerOptions.workerSrc=new URL('vendor/pdfjs/pdf.worker.min.js',scriptBase).href;
      // Opening index.html directly disallows module workers from another file:// URL.
      if (location.protocol==='file:') await script('vendor/pdfjs/pdf.worker.min.js');
      return pdf;
    })().catch(error=>{ readerPromise=null; throw error; });
    return readerPromise;
  }
  async function readPdf(file, progress, signal) {
    if (!file.size) throw Error('Ce fichier est vide.');
    if (!/\.pdf$/i.test(file.name) && file.type!=='application/pdf') throw Error('Choisis un document PDF.');
    const pdf=await reader();
    signal.throwIfAborted();
    const data=new Uint8Array(await file.arrayBuffer());
    signal.throwIfAborted();
    const loading=pdf.getDocument({data,isEvalSupported:false,useSystemFonts:false,disableFontFace:true,useWasm:false,useWorkerFetch:false});
    // Abort a superseded import even if the worker is waiting for a password.
    const abort=()=>{void loading.destroy().catch(()=>{});};
    signal.addEventListener('abort',abort,{once:true});
    try {
      const doc=await loading.promise;
      const pages=[], unreadable=[];
      for (let number=1; number<=doc.numPages; number++) {
        signal.throwIfAborted(); progress(number,doc.numPages);
        const page=await doc.getPage(number);
        try {
          const viewport=page.getViewport({scale:1});
          const text=await page.getTextContent();
          const lines=A.pageLines(text.items,viewport);
          if (!lines.length) unreadable.push(number);
          let rules=[];
          if (lines.some(line=>line.cells.length>1)) {
            try {
              rules=A.horizontalRules(await page.getOperatorList(),viewport,pdf);
            } catch {
              // Text remains usable when the optional drawing data cannot be decoded.
              signal.throwIfAborted();
            }
          }
          pages.push({number,height:viewport.height,lines,rules});
        } finally { page.cleanup(); }
      }
      return {pages,unreadable,id:doc.fingerprints[0],revision:doc.fingerprints[1],name:file.name};
    } catch(error) {
      if (signal.aborted) throw error;
      if (error.name==='PasswordException') throw Error('Ce PDF est protégé par un mot de passe. Choisis une copie déverrouillée ou colle son texte.');
      if (error.name==='InvalidPDFException') throw Error('Ce fichier ne contient pas un PDF lisible. Choisis une autre copie ou colle son texte.');
      throw error;
    } finally {
      signal.removeEventListener('abort',abort);
      if (!signal.aborted) await loading.destroy();
    }
  }

  // One dialog owns one draft. Closing it, or choosing a new file, cancels the pending read.
  function open({projects,activeProject,escape,roleOptions,save}) {
    const dialog=$('#auditDialog'), form=$('#auditForm'), file=$('#auditFile'), project=$('#auditProject');
    const status=$('#auditStatus'), list=$('#auditList'), count=$('#auditCount'), create=$('#auditCreate');
    const source=$('#auditSource'), paste=$('#auditPaste'), pastePanel=$('#auditPastePanel');
    const extract=$('#auditExtract'), extractText=$('#auditExtractText');
    let doc=null, rows=[], controller, projectChosen=false, filename='';
    const destination=()=>projects.find(p=>p.id===project.value);
    const attr=escape;
    const levelOptions=selected=>Object.entries(A.levels).map(([v,n])=>`<option value="${v}" ${v===selected?'selected':''}>${n}</option>`).join('');
    project.innerHTML=projects.map(p=>`<option value="${attr(p.id)}">${attr(p.name)}</option>`).join('');
    form.reset();
    project.value=activeProject.id;
    status.textContent=''; pastePanel.open=false; clearPreview();

    function controls() {
      const dest=destination();
      const reviews=A.reviewSelection(dest,rows,doc.id);
      let selected=0, existing=0;
      rows.forEach((r,i)=>{
        const card=list.children[i], toggle=card.querySelector('[data-field="selected"]');
        const review=reviews[i], already=review==='existing', blocked=already || review==='repeated';
        toggle.disabled=blocked;
        toggle.checked=r.selected && !blocked;
        if (toggle.checked) selected++;
        if (already) existing++;
        card.classList.toggle('audit-existing',blocked);
        card.querySelector('[data-duplicate]').textContent=reviewMessages[review] || '';
        card.querySelector('[data-title]').textContent=r.title || 'Tâche à nommer';
        card.querySelector('[data-classification]').textContent=window.AtelierCore.role(r.role).name+' · Priorité '+A.levels[r.priority].toLocaleLowerCase('fr');
      });
      count.textContent=rows.length ? selected+' / '+rows.length+' sélectionnée'+(selected>1?'s':'')+(existing?' · '+existing+' déjà présente'+(existing>1?'s':''):'') : '';
      create.textContent=selected>1?'Créer les '+selected+' tâches':selected===1?'Créer la tâche':'Créer les tâches';
      create.disabled=!selected; $('#auditTools').hidden=!doc;
      $('#auditSelect').disabled=!rows.length; $('#auditClear').disabled=!rows.length;
    }
    function rowCard(r,i) {
      return `<article class="audit-row" data-index="${i}">
        <label class="audit-check"><input type="checkbox" data-field="selected"><span data-title>${attr(r.title)}</span></label>
        <div class="audit-meta">${attr([r.ref,r.page && 'p. '+r.page,r.section].filter(Boolean).join(' · '))} <span data-duplicate></span></div>
        <details><summary><span data-classification></span> · Modifier</summary>
          <label>Nom de la tâche<input data-field="title" value="${attr(r.title)}"></label>
          <label>Problème<textarea data-field="problem" placeholder="Constat à préciser">${attr(r.problem)}</textarea></label>
          <label>Solution proposée<textarea data-field="solution" placeholder="Solution à préciser">${attr(r.solution)}</textarea></label>
          ${r.detail?'<p class="help audit-detail"><strong>Détail de l’audit</strong><br>'+attr(r.detail)+'</p>':''}
          <div class="field-row"><label>Poste<select data-field="role">${roleOptions(r.role)}</select></label>
          <label>Priorité<select data-field="priority">${levelOptions(r.priority)}</select></label></div>
        </details></article>`;
    }
    function show(documentData, pasted=false) {
      doc=documentData;
      const start=doc.pages[0]?.lines.slice(0,4).map(l=>l.text).join(' ')||'';
      const match=A.matchProject(projects,doc.name+' '+start);
      if (match && !projectChosen) project.value=match.id;
      rows=A.parse(doc.pages).map((r,index)=>({...r,page:pasted?null:r.page,selected:true,
        anchor:doc.revision ? doc.revision+'/'+r.anchor : r.anchor,
        entry:[r.ref,r.page,A.key(r.originalTitle),index].join('|')}));
      list.innerHTML=rows.map(rowCard).join('');
      const unread=doc.unreadable||[];
      const parts=[rows.length ? rows.length+' proposition'+(rows.length>1?'s':'')+' à relire.' : 'Aucune amélioration reconnue.'];
      if (unread.length) parts.push('Pages sans texte lisible : '+unread.join(', ')+'. Tu peux coller le texte issu d’une reconnaissance de caractères.');
      else if (!rows.length) parts.push('Relis le texte et ajoute les points à traiter.');
      if (match && !projectChosen) parts.push('Projet reconnu : '+match.name+'.');
      status.textContent=parts.join(' ');
      source.hidden=false; source.textContent=doc.name;
      extract.hidden=!doc.pages.some(p=>p.lines.length); extract.open=false;
      extractText.textContent='';
      extract.ontoggle=()=>{
        if (extract.open && !extractText.textContent) extractText.textContent=doc.pages.map(p=>
          (pasted?'':'Page '+p.number+'\n')+p.lines.map(l=>l.cells.map(c=>c.text).join('  ')).join('\n')
        ).join('\n\n');
      };
      controls();
      if (!rows.length) pastePanel.open=true;
    }
    function clearPreview() {
      rows=[]; doc=null; list.replaceChildren(); count.textContent=''; source.hidden=true;
      source.textContent=''; extract.ontoggle=null; extract.open=false; extract.hidden=true; extractText.textContent='';
      create.disabled=true; $('#auditTools').hidden=true;
    }
    file.onchange=async()=>{
      const f=file.files[0];
      if (!f) return;
      controller?.abort(); controller=new AbortController();
      const signal=controller.signal; filename=f.name; clearPreview(); status.textContent='Lecture du PDF…';
      try {
        const data=await readPdf(f,(n,total)=>{if (!signal.aborted) status.textContent='Lecture de la page '+n+' sur '+total+'…';},signal);
        if (!signal.aborted) show(data);
      } catch(error) {
        if (!signal.aborted) { status.textContent=error.message||'Lecture impossible. Tu peux coller le texte du document.'; pastePanel.open=true; }
      } finally { if (!signal.aborted) file.value=''; }
    };
    $('#auditAnalyseText').onclick=()=>{
      const value=paste.value.trim();
      if (!value) { paste.focus(); return; }
      controller?.abort();
      const name=filename||'Texte d’audit';
      let hash=2166136261;
      for (let i=0;i<value.length;i++) hash=Math.imul(hash^value.charCodeAt(i),16777619);
      // Text imported without page breaks has no reliable PDF page number.
      show({name,id:'texte:'+value.length+'-'+(hash>>>0).toString(16),pages:A.fromText(value)},true);
    };
    project.onchange=()=>{projectChosen=true; if (doc) controls();};
    list.oninput=event=>{
      const el=event.target, field=el.dataset.field;
      if (!field) return;
      const r=rows[Number(el.closest('.audit-row').dataset.index)];
      r[field]=field==='selected'?el.checked:el.value;
      controls();
    };
    $('#auditSelect').onclick=()=>{rows.forEach(r=>r.selected=true);controls();};
    $('#auditClear').onclick=()=>{rows.forEach(r=>r.selected=false);controls();};
    $('#auditAdd').onclick=()=>{
      const r={title:'',problem:'',solution:'',role:'pilotage',priority:'normal',page:null,section:'',ref:'',
        selected:true,entry:'manuel-'+window.AtelierCore.uid()};
      rows.push(r); list.insertAdjacentHTML('beforeend',rowCard(r,rows.length-1)); controls();
      const card=list.lastElementChild;
      card.querySelector('details').open=true; card.querySelector('[data-field="title"]').focus();
    };
    form.onsubmit=event=>{
      event.preventDefault();
      if (!doc || create.disabled) return;
      const chosen=rows.filter((_,i)=>list.children[i].querySelector('[data-field="selected"]').checked);
      const dest=destination();
      try {
        const tasks=A.newTasks(dest,chosen,doc);
        if (!tasks.length) { controls(); status.textContent='Ces tâches figurent déjà dans le projet.'; return; }
        save(dest,tasks);
        dialog.close();
      } catch(error) { status.textContent=error.message; }
    };
    dialog.onclose=()=>{
      controller?.abort();
      clearPreview(); file.value=''; paste.value='';
      dialog.onclose=null; form.onsubmit=null; list.oninput=null; file.onchange=null; project.onchange=null;
      $('#auditAnalyseText').onclick=null; $('#auditSelect').onclick=null; $('#auditClear').onclick=null; $('#auditAdd').onclick=null;
    };
    dialog.querySelectorAll('[data-close-audit]').forEach(el=>el.onclick=()=>dialog.close());
    dialog.showModal();
  }
  window.AtelierAuditImport={open};
})();
