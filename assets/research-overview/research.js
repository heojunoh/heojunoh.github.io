'use strict';
(() => {
  const root=document.getElementById('research-overview'); if(!root) return;
  const byId=id=>root.querySelector('#'+id);
  const ns = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs, text) => { const e = document.createElementNS(ns, tag); for (const [k,v] of Object.entries(attrs || {})) e.setAttribute(k,v); if (text !== undefined) e.textContent = text; return e; };
  const path = (points) => points.map((p,i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const response = x => 0.75 * Math.sin(6.8*x) + 0.25 * Math.cos(15*x) + 0.32*x;
  const kernel = (a,b) => 0.7 * Math.exp(-0.5 * ((a-b)/0.17)**2);
  const forward = (L,b) => b.map((_,i) => { let v = b[i]; for(let j=0;j<i;j++) v -= L[i][j]*b[j]; b[i] = v/L[i][i]; return b[i]; });
  function posterior(xs) {
    const n = xs.length, L = Array.from({length:n}, () => Array(n).fill(0));
    for(let i=0;i<n;i++) for(let j=0;j<=i;j++) { let s = kernel(xs[i],xs[j]) + (i===j ? 1e-9 : 0); for(let k=0;k<j;k++) s -= L[i][k]*L[j][k]; L[i][j] = i===j ? Math.sqrt(Math.max(s,1e-14)) : s/L[j][j]; }
    const b = forward(L, xs.map(response)), alpha = Array(n).fill(0);
    for(let i=n-1;i>=0;i--) { let v=b[i]; for(let j=i+1;j<n;j++) v -= L[j][i]*alpha[j]; alpha[i]=v/L[i][i]; }
    return x => { const k=xs.map(a => kernel(a,x)), v=forward(L,[...k]); return {mean:k.reduce((s,a,i)=>s+a*alpha[i],0), variance:Math.max(0,kernel(x,x)-v.reduce((s,a)=>s+a*a,0))}; };
  }
  const initial = {3:[0.08,0.48,0.91]};
  let xs=[...initial[3]];
  const group = byId('gp-content'), reference = byId('show-reference'), add = byId('next-run');
  function draw() {
    group.replaceChildren();
    const predict=posterior(xs), px=x=>48+x*458, py=y=>155-y*72;
    const defs=node('defs'), clip=node('clipPath',{id:'plot-clip'});clip.append(node('rect',{x:48,y:18,width:458,height:267}));defs.append(clip);group.append(defs);
    [0,0.25,0.5,0.75,1].forEach(x=>{group.append(node('line',{x1:px(x),x2:px(x),y1:18,y2:285,stroke:'#dfe3e4','stroke-width':0.65,opacity:0.65}));group.append(node('text',{x:px(x),y:304,fill:'#6f777d','font-size':11,'font-family':'inherit','text-anchor':'middle'},x.toFixed(2)));});
    [-1.5,-0.75,0,0.75,1.5].forEach(y=>{group.append(node('line',{x1:48,x2:506,y1:py(y),y2:py(y),stroke:'#dfe3e4','stroke-width':0.65,opacity:0.65}));group.append(node('text',{x:38,y:py(y)+3,fill:'#6f777d','font-size':11,'font-family':'inherit','text-anchor':'end'},y.toFixed(2)));});
    group.append(node('text',{x:279,y:328,fill:'#6f777d','font-size':11,'font-family':'inherit','text-anchor':'middle'},'Simulation input'));
    const plot=node('g',{'clip-path':'url(#plot-clip)'}), data=Array.from({length:201},(_,i)=>{const x=i/200,p=predict(x);return {x,...p,sd:Math.sqrt(p.variance)};});
    const upper=data.map(d=>[px(d.x),py(d.mean+2*d.sd)]),lower=[...data].reverse().map(d=>[px(d.x),py(d.mean-2*d.sd)]);
    plot.append(node('path',{d:path([...upper,...lower])+' Z',fill:'#84b6c7','fill-opacity':0.28}));
    if(reference.checked) plot.append(node('path',{d:path(data.map(d=>[px(d.x),py(response(d.x))])),stroke:'#6f777d','stroke-width':1.6,'stroke-dasharray':'5 5',fill:'none'}));
    plot.append(node('path',{d:path(data.map(d=>[px(d.x),py(d.mean)])),stroke:'#2f7d90','stroke-width':2.5,fill:'none'}));
    xs.forEach(x=>plot.append(node('circle',{cx:px(x),cy:py(response(x)),r:4.3,fill:'#2f7d90',stroke:'#ffffff','stroke-width':1.6})));
    group.append(plot);
    byId('reference-legend').hidden=!reference.checked;
    byId('run-count').textContent=`${xs.length} simulation runs`;
    root.querySelectorAll('[data-runs]').forEach(b=>b.setAttribute('aria-pressed',String(xs.length===Number(b.dataset.runs)&&xs.every((v,i)=>v===initial[b.dataset.runs][i]))));
    add.disabled=xs.length>=15;
    if(add.disabled) byId('design-note').textContent='Click 3 runs to start again.';
    return predict;
  }
  root.querySelectorAll('[data-runs]').forEach(b=>b.addEventListener('click',()=>{xs=[...initial[b.dataset.runs]];byId('design-note').textContent='Start with 3 runs, then add one at a time.';draw();}));
  reference.addEventListener('change',draw);
  add.addEventListener('click',()=>{const p=posterior(xs);let chosen=0,max=-1;for(let i=0;i<=500;i++){const x=i/500,v=p(x).variance;if(v>max){max=v;chosen=x;}}xs.push(chosen);byId('design-note').textContent=`Added a run at input ${chosen.toFixed(2)} to reduce uncertainty.`;draw();});
  draw();
  const mesh=byId('mesh-content');
  [4,8,14].forEach((n,index)=>{const cx=80+160*index,cy=112,size=95,color=['#85a1a4','#5f858c','#235866'][index];const project=(u,v)=>[cx+(u-v)*size*.54,cy+(u+v)*size*.2+(u*u-v*v)*8];const g=node('g',{stroke:color,'stroke-width':index===2?0.6:1,fill:'none'});for(let k=0;k<=n;k++){let a=[],b=[];for(let m=0;m<=30;m++){a.push(project(k/n,m/30));b.push(project(m/30,k/n));}g.append(node('path',{d:path(a)}),node('path',{d:path(b)}));}mesh.append(g);mesh.append(node('text',{x:cx,y:203,'text-anchor':'middle',fill:'#2b5059','font-size':14,'font-family':'inherit'},['Coarse','Intermediate','Fine'][index]));mesh.append(node('text',{x:cx,y:225,'text-anchor':'middle',fill:'#62767a','font-size':11,'font-family':'inherit'},['Lower cost','More detail','Higher cost'][index]));});
  mesh.append(node('line',{x1:46,y1:260,x2:434,y2:260,stroke:'#9aaeb0','stroke-width':1}),node('path',{d:'M428 256L434 260L428 264',fill:'none',stroke:'#9aaeb0','stroke-width':1}));
  const dg=byId('dynamics-content'),dx=x=>39+418*x,dy=y=>135-63*y,trajectory=x=>.8*Math.sin(x*12)*Math.exp(-.28*x);
  [0,.25,.5,.75,1].forEach(t=>dg.append(node('line',{x1:dx(t),x2:dx(t),y1:30,y2:220,stroke:'#d6d6cc','stroke-width':.7})));
  [-1,0,1].forEach(y=>dg.append(node('line',{x1:39,x2:457,y1:dy(y),y2:dy(y),stroke:'#d6d6cc','stroke-width':.7})));
  const time=Array.from({length:151},(_,i)=>i/150),unc=t=>.025+.35*t,band=[...time.map(t=>[dx(t),dy(trajectory(t)+unc(t))]),...time.slice().reverse().map(t=>[dx(t),dy(trajectory(t)-unc(t))])];
  dg.append(node('path',{d:path(band)+' Z',fill:'#8da7a7','fill-opacity':.35}),node('path',{d:path(time.map(t=>[dx(t),dy(trajectory(t))])),fill:'none',stroke:'#245c67','stroke-width':2.2}));
  [0,.2,.4,.6,.8,1].forEach(t=>dg.append(node('circle',{cx:dx(t),cy:dy(trajectory(t)),r:3.5,fill:'#d0a66b',stroke:'#f1eee6','stroke-width':1.5})));
  dg.append(node('text',{x:39,y:243,fill:'#627378','font-size':11,'font-family':'inherit'},'Current state'),node('text',{x:457,y:243,fill:'#627378','font-size':11,'font-family':'inherit','text-anchor':'end'},'Future time'));
})();
