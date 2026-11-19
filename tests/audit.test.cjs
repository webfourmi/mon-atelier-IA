const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../planning.js');
const A = require('../audit.js');

const doc = {id:'pdf-A',name:'audit.pdf'};
const project = () => C.normalizeProject({id:'recette',name:'Recette',workItems:[]});

function line(y, problem, solution, problemWidth) {
  const cells = [];
  if (problem) cells.push({x:50,end:50+(problemWidth ?? problem.length*5),text:problem});
  if (solution) cells.push({x:200,end:200+solution.length*5,text:solution});
  return {y,size:10,cells,text:cells.map(c=>c.text).join(' ')};
}
const header = y => line(y,'Problème','Solution proposée');
const rule = y => ({y,left:45,right:450});
const pairs = rows => rows.map(row=>[row.problem,row.solution]);

test('PDF.js drawing coordinates yield full-width rules from separate cell edges', async () => {
  const {Window} = await import('./node_modules/happy-dom/lib/index.js');
  const browser = new Window({url:'https://atelier.test/',settings:{enableJavaScriptEvaluation:true,suppressInsecureJavaScriptEnvironmentWarning:true}});
  try {
    browser.eval(require('node:fs').readFileSync(require.resolve('../vendor/pdfjs/pdf.min.js'),'utf8'));
    const pdf = browser.pdfjsLib, op = pdf.OPS;
    // The worker emits packed drawing commands (0 = move, 1 = line).
    const leftCell = [op.stroke,[[0,150,20,1,0,20]],[0,20,150,20]];
    const rightCell = [op.stroke,[[0,150,20,1,400,20]],[150,20,400,20]];
    const vertical = [op.stroke,[[0,150,0,1,150,40]],[150,0,150,40]];
    const band = [op.fill,[null],[50,610,450,611]];
    const operators = {
      fnArray:[op.save,op.transform,op.constructPath,op.constructPath,op.constructPath,op.restore,op.constructPath],
      argsArray:[null,[1,0,0,1,50,600],leftCell,rightCell,vertical,null,band]
    };
    const rules = A.horizontalRules(operators,{transform:[1,0,0,-1,0,800]},pdf);
    assert.deepEqual(rules,[{y:180,left:50,right:450},{y:189,left:50,right:450}]);
  } finally {
    await browser.happyDOM.close();
  }
});

test('ruled compact tables keep manual line breaks and separate even lowercase or incomplete rows', () => {
  const pages = [{number:1,rules:[rule(123),rule(134)],lines:[
    header(90), line(102,'Menu illisible','Augmenter le contraste'),
    line(114,'Sur mobile','Vérifier le thème sombre'),
    line(128,'recherche lente','indexer les titres'), line(140,'son muet','')
  ]}];
  assert.deepEqual(pairs(A.parse(pages)),[
    ['Menu illisible Sur mobile','Augmenter le contraste Vérifier le thème sombre'],
    ['recherche lente','indexer les titres'], ['son muet','']
  ]);
});

test('an unruled table separates short aligned entries but retains a full-width wrapped cell', () => {
  const rows = A.parse([{number:1,lines:[
    header(90), line(104,'Le bouton du formulaire ne','Corriger le bouton',146),
    line(116,'Fonctionne jamais','Sur la page de paiement'),
    line(130,'Le menu est illisible','Augmenter le contraste'),
    line(144,'Le son est muet','Réparer la lecture')
  ]}]);
  assert.deepEqual(pairs(rows),[
    ['Le bouton du formulaire ne Fonctionne jamais','Corriger le bouton Sur la page de paiement'],
    ['Le menu est illisible','Augmenter le contraste'], ['Le son est muet','Réparer la lecture']
  ]);
});

test('a continued row after a repeated header stays attached to its starting page', () => {
  const rows = A.parse([
    {number:1,lines:[header(90),line(700,'La fiche disparaît','Conserver le brouillon')]},
    {number:2,rules:[rule(116)],lines:[
      header(80),line(100,'','pendant la navigation.'),line(126,'Le son est muet','Réparer le bouton audio.')
    ]}
  ]);
  assert.deepEqual(rows.map(r=>[r.page,r.problem,r.solution]),[
    [1,'La fiche disparaît','Conserver le brouillon pendant la navigation.'], [2,'Le son est muet','Réparer le bouton audio.']
  ]);
});

function namesakes() {
  return A.parse(A.fromText([
    'Réf. | Amélioration | Problème | Solution | Statut',
    'A1 | Corriger la navigation | Retour inactif | Réparer le bouton | À faire',
    'A2 | Corriger la navigation | Sommaire erroné | Corriger le lien | À faire',
    'A3 | Adapter le contraste | Texte pâle | Assombrir le texte | Terminé'
  ].join('\n')));
}

test('distinct references sharing a title stay selectable and survive save, edits, and retry', () => {
  const p = project(), rows = namesakes();
  assert.deepEqual(rows.map(r=>r.ref),['A1','A2']);
  assert.deepEqual(A.reviewSelection(p,rows,doc.id),['namesake','namesake']);
  p.workItems = A.newTasks(p,rows,doc);
  assert.deepEqual(p.workItems.map(t=>[t.objective,t.deliverable,t.status]),[
    ['Retour inactif','Réparer le bouton','draft'], ['Sommaire erroné','Corriger le lien','draft']
  ]);
  Object.assign(p.workItems[0],{title:'Nouveau nom',objective:'Nouveau constat',deliverable:'Solution relue'});
  const restored = C.normalizeProject(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(A.reviewSelection(restored,rows,doc.id),['existing','existing']);
  assert.deepEqual(A.newTasks(restored,rows,doc),[]);
  assert.equal(A.newTasks(project(),rows,doc).length,2);
});

test('partial imports, exact repeats and title-only matches use the same rule in preview and save', () => {
  const p = project(), [a,b] = namesakes();
  p.workItems.push({...C.makeTask(p,'Corriger la navigation'),title:a.title,objective:'',deliverable:''});
  const repeat = {...a,anchor:'page-2'};
  assert.deepEqual(A.reviewSelection(p,[a,b,repeat],doc.id),['namesake','namesake','repeated']);
  assert.deepEqual(A.reviewSelection(p,[{...a,selected:false},b,repeat],doc.id),['namesake','namesake','namesake']);
  p.workItems.push(...A.newTasks(p,[a],doc));
  assert.deepEqual(A.reviewSelection(p,[a,b,repeat],doc.id),['existing','namesake','existing']);
  assert.deepEqual(A.newTasks(p,[a,b,repeat],doc).map(t=>t.auditSource.ref),['A2']);
  const otherRef = {...a,ref:'B1',anchor:'autre'};
  assert.deepEqual(A.reviewSelection(p,[otherRef],'autre document'),['namesake']);
  assert.deepEqual(A.reviewSelection(p,[a],'copie du document'),['existing']);
});

test('two unreferenced findings may share a title and PDF locations do not collide across documents', () => {
  const p = project(), [a,b] = namesakes().map(row=>({...row,ref:''}));
  assert.equal(A.newTasks(p,[a,b],doc).length,2);
  p.workItems = A.newTasks(p,[a],doc);
  assert.deepEqual(A.reviewSelection(p,[{...b,anchor:a.anchor}],'pdf-B'),['namesake']);
});

test('older imports with a renamed task still match their saved source entry', () => {
  const p = project(), rows = namesakes().map((r,i)=>({...r,entry:[r.ref,r.page,A.key(r.originalTitle),i].join('|')}));
  p.workItems.push({title:'Nom modifié',objective:'',deliverable:'',auditSource:{document:doc.id,ref:'A1',entry:rows[0].entry}});
  assert.deepEqual(A.reviewSelection(p,rows,doc.id),['existing','namesake']);
  assert.deepEqual(A.newTasks(p,rows,doc).map(t=>t.auditSource.ref),['A2']);
});

test('each check in a single source line can be imported independently', () => {
  const rows = A.parse(A.fromText('Vérifier sur mobile : le menu ; la recherche ; le son.'));
  assert.equal(rows.length,3);
  assert.equal(new Set(rows.map(r=>r.anchor)).size,3);
  const p = project();
  p.workItems = A.newTasks(p,[rows[1]],doc);
  assert.deepEqual(A.reviewSelection(p,rows,doc.id),['','existing','']);
});

test('slow application search, documentary research, explicit assignments and QA retain distinct roles', () => {
  const rows = A.parse(A.fromText([
    'Réf. | Amélioration | Poste',
    'A1 | La recherche est lente |',
    'A2 | Vérifier les sources |',
    'A3 | La recherche documentaire est lente |',
    'A4 | Tester la recherche lente |',
    'A5 | La recherche est lente | Programmation'
  ].join('\n')));
  assert.deepEqual(rows.map(row=>row.role),['optimisation','recherche','recherche','tests','programmation']);
});
