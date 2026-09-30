/* ---------- figures ---------- */
const G_SHAPES=['circle','square','triangle','diamond','cross','hex'];
const G_FILLS=['none','gray','solid'];
const G_COUNTS=[1,2,3,4];
const POS={1:[[50,50,27]],2:[[31,50,16],[69,50,16]],3:[[50,30,14.5],[29,69,14.5],[71,69,14.5]],4:[[31,31,14],[69,31,14],[31,69,14],[69,69,14]]};
const SEGS=[[22,22,78,22],[78,22,78,78],[22,78,78,78],[22,22,22,78],[22,22,78,78],[78,22,22,78],[50,22,50,78],[22,50,78,50]];
const f1=n=>Math.round(n*10)/10;
function poly(cls,pts){return `<polygon class="${cls}" points="${pts.map(p=>f1(p[0])+','+f1(p[1])).join(' ')}"/>`;}
function shapeSvg(shape,cx,cy,r,fill){
  const cls='shp f-'+fill;
  switch(shape){
    case 'circle':return `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${f1(r*.92)}"/>`;
    case 'square':{const s=r*.84;return `<rect class="${cls}" x="${f1(cx-s)}" y="${f1(cy-s)}" width="${f1(2*s)}" height="${f1(2*s)}"/>`;}
    case 'triangle':return poly(cls,[[cx,cy-r],[cx+r*.98,cy+r*.78],[cx-r*.98,cy+r*.78]]);
    case 'diamond':return poly(cls,[[cx,cy-r*1.05],[cx+r*.82,cy],[cx,cy+r*1.05],[cx-r*.82,cy]]);
    case 'cross':{const a=r*.34,b=r*.98;return poly(cls,[[-a,-b],[a,-b],[a,-a],[b,-a],[b,a],[a,a],[a,b],[-a,b],[-a,a],[-b,a],[-b,-a],[-a,-a]].map(p=>[cx+p[0],cy+p[1]]));}
    case 'hex':return poly(cls,[0,1,2,3,4,5].map(k=>[cx+Math.cos(k*Math.PI/3)*r,cy+Math.sin(k*Math.PI/3)*r]));
  }
  return '';
}
function cellSvg(c){
  let inner='';
  if(c.t==='a'){
    if(c.inner){inner=shapeSvg(c.shape,50,50,36,'none')+shapeSvg(c.inner.shape,50,50,13,c.inner.fill);}
    else{inner=POS[c.count].map(p=>shapeSvg(c.shape,p[0],p[1],p[2],c.fill)).join('');}
  }else if(c.t==='r'){
    inner=`<g transform="rotate(${c.rot} 50 50)"><line class="ln" x1="50" y1="80" x2="50" y2="36"/><polygon class="shp f-solid" points="50,16 37,39 63,39"/></g>`;
  }else if(c.t==='s'){
    inner=SEGS.map((s,i)=>(c.segs>>i)&1?`<line class="ln" x1="${s[0]}" y1="${s[1]}" x2="${s[2]}" y2="${s[3]}"/>`:'').join('');
  }
  return `<svg class="cell-svg" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;
}
const A=(shape,count,fill)=>({t:'a',shape,count,fill});
const AI=(shape,ishape,ifill)=>({t:'a',shape,count:1,fill:'none',inner:{shape:ishape,fill:ifill}});
const R=rot=>({t:'r',rot});
const SG=segs=>({t:'s',segs});
function grid(fn){const out=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++)out.push(fn(i,j));return out;}
function shuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const key=c=>JSON.stringify(c);

/* distractors differ from the answer in one attribute first, two only when needed */
function setAttr(c,attr,v){
  const n=JSON.parse(JSON.stringify(c));
  if(attr==='ishape')n.inner.shape=v;else if(attr==='ifill')n.inner.fill=v;else n[attr]=v;
  return n;
}
function getAttr(c,attr){return attr==='ishape'?c.inner.shape:attr==='ifill'?c.inner.fill:c[attr];}
function attrDistractors(cells){
  const ans=cells[8];
  const attrs=ans.inner?['shape','ishape','ifill']:['shape','count','fill'];
  const pool={},glob={shape:G_SHAPES,ishape:G_SHAPES,count:G_COUNTS,fill:G_FILLS,ifill:G_FILLS};
  attrs.forEach(a=>pool[a]=[...new Set(cells.map(c=>getAttr(c,a)))]);
  const singles=[],doubles=[],extra=[];
  attrs.forEach(a=>pool[a].forEach(v=>{if(v!==getAttr(ans,a))singles.push(setAttr(ans,a,v));}));
  for(let x=0;x<attrs.length;x++)for(let y=x+1;y<attrs.length;y++)
    pool[attrs[x]].forEach(v=>pool[attrs[y]].forEach(w=>{
      if(v!==getAttr(ans,attrs[x])&&w!==getAttr(ans,attrs[y]))doubles.push(setAttr(setAttr(ans,attrs[x],v),attrs[y],w));}));
  attrs.forEach(a=>glob[a].forEach(v=>{if(!pool[a].includes(v))extra.push(setAttr(ans,a,v));}));
  return pick([...shuffle(singles),...shuffle(doubles),...shuffle(extra)],ans);
}
function segDistractors(cells){
  const ans=cells[8],a=cells[6].segs,b=cells[7].segs;
  const ruleBased=[a|b,a&b,a,b].map(SG);
  const flips=shuffle([0,1,2,3,4,5,6,7].map(i=>SG(ans.segs^(1<<i))));
  return pick([...pick(ruleBased,ans,3),...flips],ans);
}
function rotDistractors(cells){
  const ans=cells[8];
  const near=[R((ans.rot+315)%360),R((ans.rot+45)%360)];
  const rest=shuffle([90,135,180,225].map(d=>R((ans.rot+d)%360)));
  return pick([...near,...rest],ans);
}
function pick(cands,ans,n=5){
  const seen=new Set([key(ans)]),out=[];
  for(const c of cands){
    if(out.length>=n)break;
    if(c.t==='s'&&c.segs===0)continue;
    const k=key(c);if(seen.has(k))continue;seen.add(k);out.push(c);
  }
  return out;
}
const L3=(arr,k)=>arr[((k%3)+3)%3];
const M_DEF=[
  {b:-2.0,rule:'行ごとに形が同じ。右へ進むと個数が1→2→3と増える。',
   cells:grid((i,j)=>A(['circle','square','triangle'][i],j+1,'none'))},
  {b:-1.6,rule:'どの行・列にも3種類の形が1回ずつ入る。',
   cells:grid((i,j)=>A(L3(['circle','square','diamond'],i+j),1,'solid'))},
  {b:-1.3,rule:'行ごとに形が同じ。右へ進むと塗りが白→灰→黒と濃くなる。',
   cells:grid((i,j)=>A(['square','hex','diamond'][i],2,G_FILLS[j]))},
  {b:-1.0,rule:'矢印が1マスごとに45°ずつ時計回りに回る（行をまたいでも続く）。',
   cells:grid((i,j)=>R((i*90+j*45)%360))},
  {b:-0.3,rule:'形は各行・列に1回ずつ。個数は右へ進むと1→2→3と増える。',
   cells:grid((i,j)=>A(L3(['triangle','circle','square'],i+j),j+1,'solid'))},
  {b:0.2,rule:'形は行ごとに同じ、個数は右へ1→2→3、塗りは各行・列に1回ずつ。',
   cells:grid((i,j)=>A(['diamond','circle','cross'][i],j+1,L3(G_FILLS,i+j)))},
  {b:0.4,rule:'左と中央の線を重ね合わせたものが右に入る。',
   cells:[SG(9),SG(6),SG(15),SG(64),SG(128),SG(192),SG(24),SG(34),SG(58)]},
  {b:1.1,rule:'左と中央を重ね、両方にある線は消える（排他的論理和）。',
   cells:[SG(15),SG(5),SG(10),SG(112),SG(192),SG(176),SG(153),SG(92),SG(197)]},
  {b:1.3,rule:'形と塗りはそれぞれ各行・列に1回ずつ（ずれる向きが逆）。個数は右へ1→2→3。',
   cells:grid((i,j)=>A(L3(['hex','triangle','square'],i+j),j+1,L3(G_FILLS,j-i)))},
  {b:1.8,rule:'外枠の形と中の形はそれぞれ各行・列に1回ずつ（ずれる向きが逆）。中の塗りは列ごとに白→灰→黒。',
   cells:grid((i,j)=>AI(L3(['circle','square','hex'],i+j),L3(['triangle','circle','cross'],j-i),G_FILLS[j]))}
];
const M=M_DEF.map(d=>{
  const ans=d.cells[8];
  const ds=ans.t==='s'?segDistractors(d.cells):ans.t==='r'?rotDistractors(d.cells):attrDistractors(d.cells);
  return {...d,options:shuffle([ans,...ds]),ansKey:key(ans)};
});
const S=[
  {b:-2.3,seq:[3,6,9,12],ans:15,rule:'3ずつ増える。'},
  {b:-1.9,seq:[2,4,8,16],ans:32,rule:'2倍になる。'},
  {b:-0.9,seq:[2,3,5,8,12],ans:17,rule:'増える幅が+1, +2, +3, +4と大きくなる。次は+5。'},
  {b:-0.3,seq:[5,8,6,9,7,10],ans:8,rule:'+3と−2を交互にくり返す。'},
  {b:0.0,seq:[2,2,4,6,10,16],ans:26,rule:'直前の2つの数を足す。'},
  {b:0.4,seq:[3,4,6,10,18],ans:34,rule:'増える幅が1, 2, 4, 8と倍になる。次は+16。'},
  {b:0.6,seq:[1,10,3,8,5,6,7],ans:4,rule:'2つの列が交互に並ぶ。1, 3, 5, 7 と 10, 8, 6。'},
  {b:0.9,seq:[2,5,11,23,47],ans:95,rule:'2倍して1を足す。'},
  {b:1.6,seq:[1,2,5,12,27,58],ans:121,rule:'増える幅が1, 3, 7, 15, 31と「2倍して1を足す」で大きくなる。次は+63。'},
  {b:2.1,seq:[0,1,4,15,64],ans:325,rule:'1を足してから 1, 2, 3, 4… を順に掛ける。次は (64+1)×5。'}
];
const T_MATRIX=60,T_SERIES=45,SPAN_MIN=3,SPAN_MAX=8;

/* ---------- scoring: 3PL items, EAP estimate with N(0,1) prior ---------- */
function eap(items){
  let sw=0,sm=0,sv=0;
  for(let t=-4;t<=4.0001;t+=0.05){
    let L=Math.exp(-0.5*t*t);
    for(const it of items){const p=it.c+(1-it.c)/(1+Math.exp(-it.a*(t-it.b)));L*=it.u?p:1-p;}
    sw+=L;sm+=L*t;sv+=L*t*t;
  }
  const mean=sm/sw;
  return {mean,sd:Math.sqrt(Math.max(sv/sw-mean*mean,1e-6))};
}
function buildItems(resp){
  const items=[];
  M.forEach((it,i)=>items.push({a:1.3,b:it.b,c:1/6,u:resp.m[i]?1:0}));
  S.forEach((it,i)=>items.push({a:1.4,b:it.b,c:0,u:resp.s[i]?1:0}));
  resp.w.forEach(r=>items.push({a:1.5,b:(r.len-5.5)/1.2,c:0,u:r.u?1:0}));
  return items;
}
function normCdf(z){
  const t=1/(1+0.2316419*Math.abs(z));
  const d=0.3989423*Math.exp(-z*z/2);
  const p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
  return z>0?1-p:p;
}

/* ---------- state ---------- */
let state={screen:'intro',mi:0,si:0,resp:{m:[],s:[],w:[]},w:{len:SPAN_MIN,trial:0,fails:0},saved:false};
const stage=document.getElementById('stage'),prog=document.getElementById('prog');
let runToken=0,timerId=null,keyHandler=null;
const STORE='iq-booklet.results';
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let installEvent=null,wake=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;if(state.screen==='intro')render();});
window.addEventListener('appinstalled',()=>{installEvent=null;if(state.screen==='intro')render();});
/* keep the screen on while a test is running; rejection is fine */
async function keepAwake(on){
  try{
    if(on){if(!wake&&navigator.wakeLock)wake=await navigator.wakeLock.request('screen');}
    else if(wake){const w=wake;wake=null;await w.release();}
  }catch(e){wake=null;}
}
const testing=()=>state.screen!=='intro'&&state.screen!=='result';
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&testing()){wake=null;keepAwake(true);}});

/* on-screen number pad: the same on every phone, no OS keyboard covering the question */
const padHtml=ok=>`<div class="pad" role="group" aria-label="数字キー">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="key" type="button" data-k="${n}">${n}</button>`).join('')}<button class="key" type="button" data-k="del" aria-label="1文字消す">⌫</button><button class="key" type="button" data-k="0">0</button><button class="key ok" type="button" data-k="ok" id="pad-ok">${ok}</button></div>`;
function bindPad(max,onSubmit){
  let val='';const out=document.getElementById('readout');
  const press=k=>{
    if(k==='ok'){onSubmit(val);return;}
    if(k==='del')val=val.slice(0,-1);else if(val.length<max)val+=k;
    out.textContent=val;
  };
  stage.querySelectorAll('.key').forEach(b=>b.onclick=()=>press(b.dataset.k));
  keyHandler=e=>{
    if(/^[0-9]$/.test(e.key)){press(e.key);e.preventDefault();}
    else if(e.key==='Backspace'){press('del');e.preventDefault();}
    else if(e.key==='Enter'&&!(document.activeElement&&document.activeElement.classList.contains('key'))){press('ok');e.preventDefault();}
  };
  return ()=>val;
}
function loadPast(){try{return JSON.parse(localStorage.getItem(STORE)||'[]')||[];}catch(e){return [];}}
function savePast(list){try{localStorage.setItem(STORE,JSON.stringify(list.slice(-8)));}catch(e){}}

function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
function startTimer(sec,onTimeout){
  stopTimer();
  const end=Date.now()+sec*1000,box=document.getElementById('timer'),bar=document.getElementById('timer-bar'),num=document.getElementById('timer-num');
  const tick=()=>{
    const left=Math.max(0,end-Date.now());
    num.textContent='残り '+Math.ceil(left/1000)+'秒';
    bar.style.width=(left/(sec*10))+'%';
    box.classList.toggle('low',left<=10000);
    if(left<=0){stopTimer();onTimeout();}
  };
  tick();timerId=setInterval(tick,200);
}
const timerHtml=()=>`<div class="timer" id="timer"><span class="tbar"><i id="timer-bar"></i></span><span id="timer-num"></span></div>`;

function renderProgress(){
  const s=state.screen;
  const part=s==='intro'?0:(s==='brief-m'||s==='m')?1:(s==='brief-s'||s==='s')?2:s==='result'?4:3;
  const wDone=part===4?new Set(state.resp.w.map(r=>r.len)).size:Math.max(0,state.w.len-SPAN_MIN);
  const ticks=(n,done)=>`<span class="ticks" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i class="${i<done?'done':''}"></i>`).join('')}</span>`;
  const row=(n,label,total,done)=>`<li class="pg${part===n?' cur':''}"><span class="pg-label">第${n}部 ${label}</span>${ticks(total,done)}</li>`;
  prog.innerHTML=row(1,'図形推理',M.length,state.mi)+row(2,'数列推理',S.length,state.si)+row(3,'数字の逆唱',SPAN_MAX-SPAN_MIN+1,wDone);
}
function go(screen){state.screen=screen;render();}
function render(){
  runToken++;stopTimer();keyHandler=null;renderProgress();keepAwake(testing());window.scrollTo(0,0);
  ({intro:renderIntro,'brief-m':renderBriefM,m:renderMatrix,'brief-s':renderBriefS,s:renderSeries,'brief-w':renderBriefW,'w-practice':()=>runSpan(true),w:()=>runSpan(false),result:renderResult})[state.screen]();
}
document.addEventListener('keydown',e=>{if(keyHandler)keyHandler(e);});

/* ---------- screens ---------- */
function matrixHtml(cells,showAnswer){
  return cells.map((c,i)=>i===8&&!showAnswer?'<div class="mcell q">?</div>':`<div class="mcell${i===8?' ans':''}">${cellSvg(c)}</div>`).join('');
}
function renderIntro(){
  const past=loadPast(),last=past[past.length-1];
  const ex=grid((i,j)=>A(['square','triangle','circle'][j],i+1,'solid'));
  stage.innerHTML=`
  <div class="stack">
    <p class="eyebrow">所要時間 10〜12分・全3部</p>
    <h1>いまの推理力を、誤差の幅ごと測る。</h1>
    <p class="lead">図形と数列の規則を見抜く問題と、数字を逆順に覚える課題から、IQを推定します。結果は1つの数字ではなく、95%区間つきで表示します。</p>
  </div>
  <table class="parts">
    <tr><th>第1部 図形推理</th><td>3×3に並んだ図形の規則を見抜き、空欄を6択で埋める</td><td class="n">10問・各60秒</td></tr>
    <tr><th>第2部 数列推理</th><td>数の並びの規則を見抜き、次の数を入力する</td><td class="n">10問・各45秒</td></tr>
    <tr><th>第3部 数字の逆唱</th><td>1つずつ表示される数字を、逆の順番で入力する</td><td class="n">3〜8桁</td></tr>
  </table>
  <div class="stack">
    <h3>第1部の例題</h3>
    <div class="example">
      <div class="matrix" role="img" aria-label="例題の図形マトリクス">${matrixHtml(ex,true)}</div>
      <p class="small">列ごとに形が同じで、下へ進むと個数が1→2→3と増えます。<br>右下には「丸が3つ」が入ります。</p>
    </div>
  </div>
  <div class="stack">
    <h3>受ける前に</h3>
    <ul class="rules small">
      <li>紙・メモ・電卓は使わず、頭の中だけで解きます。</li>
      <li>途中で止められません。通知を切り、静かな場所で始めてください。</li>
      <li>正誤は最後にまとめて表示します。わからない問題は飛ばせます。</li>
    </ul>
    <p class="small muted note">標準化された心理検査ではありません。難易度は設計値にもとづくため、結果は目安としてお使いください。</p>
  </div>
  <div class="actions"><button class="btn" id="start-btn">はじめる</button>${installEvent&&!isStandalone()?'<button class="btn ghost" id="install-btn">ホーム画面に追加</button>':''}${last?`<span class="small muted">前回の結果：推定 ${last.iq}（${last.lo}–${last.hi}）</span>`:''}</div>
  ${!isStandalone()&&!installEvent&&/iphone|ipad|ipod/i.test(navigator.userAgent)?'<p class="small muted">Safariの共有メニューから「ホーム画面に追加」を選ぶと、アプリとして起動できます。</p>':''}`;
  document.getElementById('start-btn').onclick=()=>go('brief-m');
  const ib=document.getElementById('install-btn');
  if(ib)ib.onclick=async()=>{const ev=installEvent;installEvent=null;try{await ev.prompt();}catch(e){}render();};
}
function brief(eyebrow,title,body,next){
  stage.innerHTML=`<div class="stack"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2>${body}</div><div class="actions"><button class="btn" id="go-btn">開始する</button></div>`;
  const b=document.getElementById('go-btn');b.onclick=()=>go(next);b.focus();
}
function renderBriefM(){brief('第1部','図形推理','<p>3×3のマスに図形が並んでいます。横と縦の規則を見抜いて、右下の空欄に入る図形を6つの中から選んでください。</p><p class="small muted">1問60秒。後半ほど規則が増えます。</p>','m');}
function renderBriefS(){brief('第2部','数列推理','<p>数が規則に沿って並んでいます。「?」に入る数を、画面の数字キーで入力してください。</p><p class="small muted">1問45秒。わからないときは空欄のまま「次へ」を押してください。</p>','s');}
function renderBriefW(){brief('第3部','数字の逆唱','<p>数字が1つずつ表示されます。すべて消えたあと、<b>逆の順番</b>で入力してください。</p><p>例：3 → 8 → 1 と出たら、答えは 183 です。</p><p class="small muted">3桁から始まり、桁数が増えていきます。同じ桁数で2回とも間違えると終了します。まず2桁で1回練習します。</p>','w-practice');}

function renderMatrix(){
  const it=M[state.mi];let sel=null;
  stage.innerHTML=`
  <div class="qhead"><p class="qno">図形推理 <b>${state.mi+1}</b> / ${M.length}</p>${timerHtml()}</div>
  <p class="qtext">右下の空欄に入る図形を選んでください。</p>
  <div class="mwrap">
    <div class="matrix" role="img" aria-label="3×3の図形マトリクス。右下が空欄">${matrixHtml(it.cells,false)}</div>
    <div class="opts" role="radiogroup" aria-label="選択肢">${it.options.map((o,i)=>`<button class="opt" type="button" role="radio" aria-checked="false" aria-label="選択肢${i+1}" id="opt-${i}">${cellSvg(o)}<span class="oval">${i+1}</span></button>`).join('')}</div>
  </div>
  <div class="actions dock"><button class="btn" id="next-btn" disabled>次へ</button><button class="btn ghost" id="skip-btn">わからない</button></div>`;
  const nextBtn=document.getElementById('next-btn');
  const choose=i=>{sel=i;it.options.forEach((_,k)=>document.getElementById('opt-'+k).setAttribute('aria-checked',k===i?'true':'false'));nextBtn.disabled=false;};
  const submit=()=>{state.resp.m[state.mi]=(sel!==null&&key(it.options[sel])===it.ansKey)?1:0;state.mi++;go(state.mi>=M.length?'brief-s':'m');};
  it.options.forEach((_,i)=>document.getElementById('opt-'+i).onclick=()=>choose(i));
  nextBtn.onclick=submit;
  document.getElementById('skip-btn').onclick=()=>{sel=null;submit();};
  keyHandler=e=>{
    if(/^[1-6]$/.test(e.key)){choose(+e.key-1);e.preventDefault();}
    else if(e.key==='Enter'&&sel!==null&&!(document.activeElement&&document.activeElement.classList.contains('opt'))){submit();e.preventDefault();}
  };
  startTimer(T_MATRIX,submit);
}
function renderSeries(){
  const it=S[state.si];
  stage.innerHTML=`
  <div class="qhead"><p class="qno">数列推理 <b>${state.si+1}</b> / ${S.length}</p>${timerHtml()}</div>
  <p>「?」に入る数を入力してください。</p>
  <div class="seq" aria-label="数列">${it.seq.map(n=>`<span>${n}</span>`).join('')}<span class="q">?</span></div>
  <div class="field"><span class="small muted" id="ans-label">答え</span><output class="readout" id="readout" aria-labelledby="ans-label" aria-live="polite"></output></div>
  ${padHtml('次へ')}`;
  const submit=v=>{state.resp.s[state.si]=(v!==''&&Number(v)===it.ans)?1:0;state.si++;go(state.si>=S.length?'brief-w':'s');};
  const current=bindPad(6,submit);
  startTimer(T_SERIES,()=>submit(current()));
}
function genSeq(len){
  for(;;){
    const s=shuffle([1,2,3,4,5,6,7,8,9]).slice(0,len);let run=false;
    for(let i=2;i<s.length;i++){const d1=s[i-1]-s[i-2],d2=s[i]-s[i-1];if(d1===d2&&Math.abs(d1)===1)run=true;}
    if(!run)return s;
  }
}
function runSpan(practice){
  const my=runToken,len=practice?2:state.w.len,seq=genSeq(len);
  const head=practice?`<p class="qno">数字の逆唱　練習 <b>2</b>桁</p>`:`<p class="qno">数字の逆唱 <b>${len}</b>桁　${state.w.trial+1}回目 / 2</p>`;
  stage.innerHTML=`<div class="qhead">${head}</div><div class="digit-stage"><span class="digit" id="digit" aria-live="assertive"></span></div><p class="small muted">数字を覚えてください。入力はすべて消えてからです。</p>`;
  const el=document.getElementById('digit');let k=0;
  const step=()=>{
    if(my!==runToken)return;
    if(k>=seq.length){ask();return;}
    el.textContent=seq[k];
    setTimeout(()=>{if(my!==runToken)return;el.textContent='';k++;setTimeout(step,250);},850);
  };
  setTimeout(step,900);
  function ask(){
    stage.innerHTML=`<div class="qhead">${head}</div>
    <p>表示された数字を、<b>逆の順番</b>で入力してください。</p>
    <div class="field"><span class="small muted" id="ans-label">答え</span><output class="readout" id="readout" aria-labelledby="ans-label" aria-live="polite"></output></div>
    ${padHtml('確定')}`;
    bindPad(9,v=>after(v===seq.slice().reverse().join('')));
  }
  function after(ok){
    if(practice){
      stage.innerHTML=`<div class="stack"><p class="eyebrow">練習</p><h2>${ok?'正解です':'不正解です'}</h2><p>表示は ${seq.join(' → ')}、逆順の答えは <b>${seq.slice().reverse().join('')}</b> でした。</p><p class="small muted">本番では正誤を表示しません。</p></div>
      <div class="actions"><button class="btn" id="go-btn">本番を始める</button><button class="btn ghost" id="again-btn">もう一度練習</button></div>`;
      document.getElementById('go-btn').onclick=()=>go('w');
      document.getElementById('again-btn').onclick=()=>go('w-practice');
      document.getElementById('go-btn').focus();
      return;
    }
    const w=state.w;state.resp.w.push({len:w.len,u:ok?1:0});
    if(!ok)w.fails++;w.trial++;
    if(w.trial>=2){
      if(w.fails>=2||w.len>=SPAN_MAX){go('result');return;}
      w.len++;w.trial=0;w.fails=0;
    }
    renderProgress();
    stage.innerHTML=`<div class="stack"><p class="eyebrow">第3部</p><h2>記録しました</h2><p>次は <b>${w.len}桁</b>（${w.trial+1}回目）です。</p></div><div class="actions"><button class="btn" id="go-btn">準備できた</button></div>`;
    const b=document.getElementById('go-btn');b.onclick=()=>render();b.focus();
  }
}

/* ---------- result ---------- */
function bellSvg(iq,lo,hi){
  const x0=30,x1=570,yb=180,top=34,cl=v=>Math.min(145,Math.max(55,v));
  const X=v=>f1(x0+(v-55)/90*(x1-x0)),Y=v=>f1(yb-Math.exp(-0.5*((v-100)/15)**2)*(yb-top));
  let curve='',band=`M${X(cl(lo))},${yb}`;
  for(let v=55;v<=145;v++)curve+=(v===55?'M':'L')+X(v)+','+Y(v);
  for(let v=cl(lo);v<=cl(hi);v+=0.5)band+=`L${X(v)},${Y(v)}`;
  band+=`L${X(cl(hi))},${yb}Z`;
  const ticks=[55,70,85,100,115,130,145].map(v=>`<line class="c-axis" x1="${X(v)}" y1="${yb}" x2="${X(v)}" y2="${yb+6}"/><text class="c-t" x="${X(v)}" y="${yb+22}" text-anchor="middle">${v}</text>`).join('');
  const ex=X(cl(iq)),lx=Math.min(520,Math.max(80,ex));
  return `<svg viewBox="0 0 600 232" role="img" aria-label="IQの正規分布上での推定位置。推定${iq}、95%区間${lo}から${hi}">
    <path class="c-band" d="${band}"/><path class="c-curve" d="${curve}"/>
    <line class="c-axis" x1="${x0}" y1="${yb}" x2="${x1}" y2="${yb}"/>${ticks}
    <line class="c-est" x1="${ex}" y1="26" x2="${ex}" y2="${yb}"/>
    <text class="c-tl" x="${lx}" y="18" text-anchor="middle">推定 ${iq}</text>
    <text class="c-t" x="300" y="${yb+44}" text-anchor="middle">IQ（平均100・標準偏差15）　塗りは95%区間</text></svg>`;
}
function renderResult(){
  const r=state.resp,est=eap(buildItems(r));
  est.sd=Math.sqrt(est.sd*est.sd+0.09); /* add ±0.3 SD for uncalibrated item difficulties */
  const iq=Math.round(100+15*est.mean),lo=Math.round(100+15*(est.mean-1.96*est.sd)),hi=Math.round(100+15*(est.mean+1.96*est.sd));
  const pct=Math.min(99,Math.max(1,Math.round(normCdf(est.mean)*100)));
  const mC=r.m.reduce((a,b)=>a+(b?1:0),0),sC=r.s.reduce((a,b)=>a+(b?1:0),0);
  const span=r.w.filter(x=>x.u).reduce((a,x)=>Math.max(a,x.len),0);
  let past=loadPast();
  if(!state.saved){past.push({t:Date.now(),iq,lo,hi});savePast(past);state.saved=true;}
  const fmt=t=>{try{return new Date(t).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})+' '+new Date(t).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});}catch(e){return '';}};
  const mark=u=>u?'<span class="ok">正解</span>':'<span class="ng">不正解</span>';
  stage.innerHTML=`
  <div class="stack">
    <p class="eyebrow">結果</p>
    <div class="score">
      <div><p class="small muted">推定IQ</p><p class="iq">${iq}</p></div>
      <dl class="facts"><dt>95%区間</dt><dd>${lo}–${hi}</dd><dt>パーセンタイル</dt><dd>${pct}</dd></dl>
    </div>
    <p>同年代100人の中で、下から${pct}番目あたりの位置です。今回の問題数では区間に幅が出るため、数点の差に意味はありません。</p>
  </div>
  <div class="chart">${bellSvg(iq,lo,hi)}</div>
  <div class="stack">
    <h3>パート別の成績</h3>
    <div class="prof">
      <span>図形推理</span><span class="bar"><i style="width:${mC/M.length*100}%"></i></span><span class="v">${mC} / ${M.length}問</span>
      <span>数列推理</span><span class="bar"><i style="width:${sC/S.length*100}%"></i></span><span class="v">${sC} / ${S.length}問</span>
      <span>数字の逆唱</span><span class="bar"><i style="width:${span/SPAN_MAX*100}%"></i></span><span class="v">${span?span+'桁':'3桁未満'}</span>
    </div>
    <p class="small muted">成人の逆唱は平均5桁前後です。パート別は問題数が少ないので、得意・不得意の手がかり程度に見てください。</p>
  </div>
  <details>
    <summary>答えと規則を見る</summary>
    <p class="small muted">読んだあとに受け直すと、結果は高めに出ます。</p>
    <h3>図形推理</h3>
    <ol class="rev">${M.map((it,i)=>`<li>${mark(r.m[i])}　${it.rule}</li>`).join('')}</ol>
    <h3>数列推理</h3>
    <ol class="rev">${S.map((it,i)=>`<li>${mark(r.s[i])}　<code>${it.seq.join(', ')}, <b>${it.ans}</b></code>　${it.rule}</li>`).join('')}</ol>
  </details>
  <details>
    <summary>測っているものと、推定の方法</summary>
    <p class="small">3つのパートは、CHC理論でいう流動性推理（Gf：初めて見る規則を見抜く力）と、ワーキングメモリ（Gwm：情報を保持しながら操作する力）に対応します。語彙や知識（結晶性知能）、処理速度は含みません。正式な知能検査（WAIS-IVなど）の全検査IQとは範囲が違います。</p>
    <p class="small">採点は項目反応理論の3パラメータ・ロジスティックモデルで行い、平均100・標準偏差15の事前分布を置いたEAP推定で能力値と誤差を求めています。6択の図形問題には当て推量の確率（1/6）を織り込んでいます。</p>
    <p class="small">各問題の難易度は、規則の数と種類が難しさを決めるという知見と、数唱の一般的な成績水準から置いた設計値です。実際の受検者データで較正していないため、その不確かさ（能力値で±0.3標準偏差ぶん）を95%区間に上乗せしています。測れる範囲はおよそ60〜140です。進学・採用・診断などの判断には使えません。</p>
    <ul class="refs">
      <li>Carpenter, P. A., Just, M. A., &amp; Shell, P. (1990). What one intelligence test measures: A theoretical account of the processing in the Raven Progressive Matrices Test. <i>Psychological Review, 97</i>(3), 404–431.</li>
      <li>Condon, D. M., &amp; Revelle, W. (2014). The International Cognitive Ability Resource: Development and initial validation of a public-domain measure. <i>Intelligence, 43</i>, 52–64.</li>
      <li>Schneider, W. J., &amp; McGrew, K. S. (2018). The Cattell–Horn–Carroll theory of cognitive abilities. In <i>Contemporary Intellectual Assessment</i> (4th ed.). Guilford Press.</li>
      <li>Bock, R. D., &amp; Mislevy, R. J. (1982). Adaptive EAP estimation of ability in a microcomputer environment. <i>Applied Psychological Measurement, 6</i>(4), 431–444.</li>
      <li>Hausknecht, J. P., et al. (2007). Retesting in selection: A meta-analysis of coaching and practice effects for tests of cognitive ability. <i>Journal of Applied Psychology, 92</i>(2), 373–385.</li>
    </ul>
  </details>
  ${past.length>1?`<div class="stack"><h3>この端末での記録</h3><table class="past"><tr><th>日時</th><th>推定IQ</th><th>95%区間</th></tr>${past.slice().reverse().map(p=>`<tr><td>${fmt(p.t)}</td><td>${p.iq}</td><td>${p.lo}–${p.hi}</td></tr>`).join('')}</table></div>`:''}
  <div class="actions"><button class="btn ghost" id="retry-btn">最初からやり直す</button></div>`;
  document.getElementById('retry-btn').onclick=()=>{state={screen:'intro',mi:0,si:0,resp:{m:[],s:[],w:[]},w:{len:SPAN_MIN,trial:0,fails:0},saved:false};render();};
}

/* ---------- boot ---------- */
render();
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{});});
}
