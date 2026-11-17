(function(root){
  'use strict';
  class GitHubClient {
    constructor(getToken,fetcher){this.getToken=getToken;this.fetcher=fetcher||((...args)=>fetch(...args));}
    async request(path,{method='GET',body,allow404=false}={}) {
      if(!path.startsWith('/')||path.startsWith('//'))throw Error('Chemin GitHub invalide.');
      const token=this.getToken();const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
      if(token)headers.Authorization='Bearer '+token;
      if(body)headers['Content-Type']='application/json';
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
      try{
        const res=await this.fetcher('https://api.github.com'+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'error'});
        if(allow404&&res.status===404)return null;
        if(!res.ok){const err=new Error(res.status===401?'Jeton refusé ou expiré.':res.status===403?'Accès refusé : vérifie les permissions du jeton ou la limite de requêtes.':res.status===404?'Dépôt, branche ou fichier introuvable.':res.status===409||res.status===422?'Conflit GitHub : recharge le dossier distant puis prépare à nouveau l’envoi.':'GitHub a répondu avec le code '+res.status+'.');err.status=res.status;throw err;}
        return await res.json();
      }catch(e){if(e.name==='AbortError')throw Error('GitHub ne répond pas. Réessaie dans un instant.');if(e instanceof TypeError)throw Error('Connexion GitHub impossible. Vérifie la connexion Internet et réessaie.');throw e;}finally{clearTimeout(timer);}
    }
    base(g){return '/repos/'+encodeURIComponent(g.owner)+'/'+encodeURIComponent(g.repo);}
    repo(g){return this.request(this.base(g));}
    repositories(owner){return this.getToken()?this.request('/user/repos?sort=updated&per_page=100'):this.request('/users/'+encodeURIComponent(owner)+'/repos?sort=updated&per_page=100');}
    contents(g,path=''){return this.request(this.base(g)+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(g.branch),{allow404:true});}
    issues(g){return this.request(this.base(g)+'/issues?state=open&per_page=30');}
    async overview(g) {
      const repo=await this.repo(g),branch=g.branch||repo.default_branch;
      const base=this.base(g),ref=encodeURIComponent(branch);
      const paths={branches:'/branches?per_page=30',pulls:'/pulls?state=open&per_page=30',checks:'/commits/'+ref+'/check-runs?per_page=100',status:'/commits/'+ref+'/status',release:'/releases/latest'};
      const data={repo,branch,readAt:new Date().toISOString(),errors:{}};
      await Promise.all(Object.entries(paths).map(async([key,path])=>{try{data[key]=await this.request(base+path,{allow404:key==='release'});}catch(e){data.errors[key]=e.message;}}));
      return data;
    }
    async prepare(g,content){
      const meta=await this.repo(g);const selected={...g,branch:g.branch||meta.default_branch};
      const file=await this.contents(selected,selected.path);
      if(Array.isArray(file)||file&&file.type!=='file')throw Error('Le chemin choisi correspond à un dossier.');
      return {settings:selected,repo:meta,sha:file?.sha||null,content,preparedAt:new Date().toISOString()};
    }
    async publish(prepared) {
      if(!this.getToken())throw Error('Ajoute un jeton GitHub pour cette session.');
      const current=await this.contents(prepared.settings,prepared.settings.path);
      if((current?.sha||null)!==prepared.sha)throw Error('Le dossier a changé sur GitHub depuis la préparation. Recharge-le avant d’envoyer.');
      const body={message:'docs: mise à jour du dossier commun Mon Atelier IA',branch:prepared.settings.branch,content:root.AtelierCore.utf8Base64(prepared.content)};
      if(prepared.sha)body.sha=prepared.sha;
      return this.request(this.base(prepared.settings)+'/contents/'+prepared.settings.path.split('/').map(encodeURIComponent).join('/'),{method:'PUT',body});
    }
  }
  root.AtelierGitHub=GitHubClient;
  if(typeof module!=='undefined'&&module.exports)module.exports=GitHubClient;
})(typeof window!=='undefined'?window:globalThis);
