(() => {
  const N=15, canvas=document.getElementById('board'), ctx=canvas.getContext('2d');
  const $=id=>document.getElementById(id);
  const ui={difficulty:$('difficulty'),difficultyControl:$('difficultyControl'),turnStone:$('turnStone'),turnText:$('turnText'),turnCaption:$('turnCaption'),blackCount:$('blackCount'),whiteCount:$('whiteCount'),whiteName:$('whiteName'),undo:$('undo'),restart:$('restart'),result:$('result'),resultStone:$('resultStone'),resultText:$('resultText'),again:$('again')};
  let board,moves,turn,winner,winningLine,mode='ai',generation=0,thinking=false,focus={x:7,y:7};
  const dirs=[[1,0],[0,1],[1,1],[1,-1]];
  const inside=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
  const label=p=>p===1?'黑方':'白方';
  const dims=()=>{const pad=canvas.width*.055;return {pad,step:(canvas.width-pad*2)/(N-1)}};
  function reset(){
    generation++;board=Array.from({length:N},()=>Array(N).fill(0));moves=[];turn=1;winner=0;winningLine=null;thinking=false;
    if(ui.result.open)ui.result.close();update();draw();
  }
  function update(){
    const black=moves.filter(m=>m.p===1).length,white=moves.length-black;
    ui.blackCount.textContent=black+' 手';ui.whiteCount.textContent=white+' 手';
    ui.whiteName.textContent=mode==='ai'?'电脑 · '+({easy:'简单',normal:'普通',hard:'困难'}[ui.difficulty.value]):'玩家二';
    ui.difficultyControl.hidden=mode!=='ai';
    ui.turnStone.className='turn-stone '+(turn===1?'black':'white');
    ui.turnCaption.textContent=winner?'本局结果':thinking?'请稍候':'当前回合';
    ui.turnText.textContent=winner?(winner===3?'和棋':label(winner)+'获胜'):(thinking?'电脑思考中…':label(turn)+'落子');
    ui.undo.disabled=!moves.length||!!winner;
  }
  function draw(){
    const {pad,step}=dims();ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth=1.3;ctx.strokeStyle='rgba(75,46,18,.76)';
    for(let i=0;i<N;i++){const v=pad+i*step;ctx.beginPath();ctx.moveTo(pad,v);ctx.lineTo(canvas.width-pad,v);ctx.moveTo(v,pad);ctx.lineTo(v,canvas.height-pad);ctx.stroke()}
    ctx.fillStyle='#69431d';for(const x of [3,7,11])for(const y of [3,7,11]){ctx.beginPath();ctx.arc(pad+x*step,pad+y*step,step*.087,0,Math.PI*2);ctx.fill()}
    for(let i=0;i<moves.length;i++){const m=moves[i],px=pad+m.x*step,py=pad+m.y*step,r=step*.42;const g=ctx.createRadialGradient(px-r*.32,py-r*.37,r*.04,px,py,r);if(m.p===1){g.addColorStop(0,'#69746d');g.addColorStop(.35,'#263029');g.addColorStop(1,'#050906')}else{g.addColorStop(0,'#fff');g.addColorStop(.6,'#f1ebde');g.addColorStop(1,'#b7ae9f')}ctx.save();ctx.shadowColor='#25180977';ctx.shadowBlur=r*.35;ctx.shadowOffsetY=r*.18;ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.restore();if(i===moves.length-1){ctx.beginPath();ctx.arc(px,py,r*.13,0,Math.PI*2);ctx.fillStyle=m.p===1?'#dba14c':'#aa3136';ctx.fill()}}
    if(winningLine){ctx.beginPath();ctx.moveTo(pad+winningLine[0].x*step,pad+winningLine[0].y*step);ctx.lineTo(pad+winningLine[winningLine.length-1].x*step,pad+winningLine[winningLine.length-1].y*step);ctx.lineWidth=step*.09;ctx.lineCap='round';ctx.strokeStyle='#c8323c';ctx.stroke()}
    if(document.activeElement===canvas&&!winner&&!thinking){ctx.strokeStyle='#0d6c59';ctx.lineWidth=2;ctx.strokeRect(pad+focus.x*step-step*.19,pad+focus.y*step-step*.19,step*.38,step*.38)}
  }
  function lineAt(x,y,p){
    for(const [dx,dy] of dirs){const line=[{x,y}];for(const sign of [-1,1])for(let n=1;n<N;n++){const nx=x+dx*n*sign,ny=y+dy*n*sign;if(!inside(nx,ny)||board[ny][nx]!==p)break;sign<0?line.unshift({x:nx,y:ny}):line.push({x:nx,y:ny})}if(line.length>=5)return line.slice(0,5)}
    return null;
  }
  function apply(x,y,p){
    if(!inside(x,y)||board[y][x]||winner)return false;
    board[y][x]=p;moves.push({x,y,p});winningLine=lineAt(x,y,p);
    if(winningLine)winner=p;else if(moves.length===N*N)winner=3;
    turn=p===1?2:1;update();draw();
    if(winner){setTimeout(showResult,350);return true}
    if(mode==='ai'&&turn===2){thinking=true;update();const ticket=generation;setTimeout(()=>{if(ticket!==generation||winner)return;const m=chooseMove();thinking=false;apply(m.x,m.y,2)},280)}
    return true;
  }
  function showResult(){if(!winner)return;ui.resultStone.hidden=winner===3;ui.resultStone.className='result-stone '+(winner===1?'black':'white');ui.resultText.textContent=winner===3?'本局和棋':label(winner)+'获胜';ui.result.showModal()}
  function candidates(){
    if(!moves.length)return [{x:7,y:7}];
    const set=new Set();for(const m of moves)for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){const x=m.x+dx,y=m.y+dy;if(inside(x,y)&&!board[y][x])set.add(y*N+x)}
    return [...set].map(k=>({x:k%N,y:Math.floor(k/N)}));
  }
  function pattern(x,y,p,dx,dy){
    let left=0,right=0;for(let s=1;s<5;s++){const nx=x-dx*s,ny=y-dy*s;if(!inside(nx,ny)||board[ny][nx]!==p)break;left++}for(let s=1;s<5;s++){const nx=x+dx*s,ny=y+dy*s;if(!inside(nx,ny)||board[ny][nx]!==p)break;right++}
    const len=left+right+1,ax=x-dx*(left+1),ay=y-dy*(left+1),bx=x+dx*(right+1),by=y+dy*(right+1),open=Number(inside(ax,ay)&&board[ay][ax]===0)+Number(inside(bx,by)&&board[by][bx]===0);
    if(len>=5)return 1000000;if(len===4)return open===2?90000:open===1?18000:0;if(len===3)return open===2?7000:open===1?750:0;if(len===2)return open===2?400:open===1?80:0;return open===2?16:3;
  }
  function pointScore(x,y,p){if(board[y][x])return -1;let score=0;for(const [dx,dy] of dirs)score+=pattern(x,y,p,dx,dy);return score}
  function isWin(x,y,p){board[y][x]=p;const yes=!!lineAt(x,y,p);board[y][x]=0;return yes}
  function chooseMove(){
    const opts=candidates();
    const wins=opts.filter(m=>isWin(m.x,m.y,2));if(wins.length)return wins[0];
    const blocks=opts.filter(m=>isWin(m.x,m.y,1));if(blocks.length)return blocks[0];
    const ranked=opts.map(m=>({...m,attack:pointScore(m.x,m.y,2),defense:pointScore(m.x,m.y,1)})).sort((a,b)=>(b.attack+b.defense*.88)-(a.attack+a.defense*.88));
    const level=ui.difficulty.value;
    if(level==='easy'){const pool=ranked.slice(0,Math.min(10,ranked.length));return pool[Math.floor(Math.random()*pool.length)]}
    if(level==='normal')return ranked[0];
    let best=ranked[0],bestValue=-Infinity;
    for(const m of ranked.slice(0,Math.min(9,ranked.length))){
      board[m.y][m.x]=2;
      const replies=candidates().map(r=>pointScore(r.x,r.y,1)).sort((a,b)=>b-a);
      const reply=replies[0]||0;board[m.y][m.x]=0;
      const value=m.attack*1.05+m.defense*.95-reply*.92;
      if(value>bestValue){bestValue=value;best=m}
    }
    return best;
  }
  canvas.addEventListener('pointerdown',e=>{if(winner||thinking||mode==='ai'&&turn!==1)return;const rect=canvas.getBoundingClientRect(),{pad,step}=dims();const x=Math.round(((e.clientX-rect.left)*canvas.width/rect.width-pad)/step),y=Math.round(((e.clientY-rect.top)*canvas.height/rect.height-pad)/step);apply(x,y,turn)});
  canvas.tabIndex=0;canvas.addEventListener('focus',draw);canvas.addEventListener('blur',draw);
  canvas.addEventListener('keydown',e=>{const keys={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(keys[e.key]){e.preventDefault();focus.x=Math.max(0,Math.min(14,focus.x+keys[e.key][0]));focus.y=Math.max(0,Math.min(14,focus.y+keys[e.key][1]));draw()}else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!thinking)apply(focus.x,focus.y,turn)}});
  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{if(mode===btn.dataset.mode)return;mode=btn.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b===btn;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected)});reset()}));
  ui.difficulty.addEventListener('change',reset);ui.restart.addEventListener('click',reset);ui.again.addEventListener('click',reset);
  ui.undo.addEventListener('click',()=>{if(!moves.length||winner)return;generation++;const count=mode==='ai'&&!thinking&&moves.length>=2?2:1;for(let i=0;i<count;i++){const m=moves.pop();board[m.y][m.x]=0}turn=moves.length%2?2:1;thinking=false;winningLine=null;update();draw()});
  if(document.modelContext?.registerTool){
    const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{})}catch{}};
    register({name:'start_gomoku_game',title:'开始五子棋对局',description:'选择双人或人机模式与难度，并重新开始对局。',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['ai','local']},difficulty:{type:'string',enum:['easy','normal','hard']}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!['ai','local'].includes(input.mode)||input.difficulty&&!['easy','normal','hard'].includes(input.difficulty))throw Error('无效的对局设置');mode=input.mode;if(input.difficulty)ui.difficulty.value=input.difficulty;document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b.dataset.mode===mode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected)});reset();return{mode,difficulty:mode==='ai'?ui.difficulty.value:null,turn:1}}});
    register({name:'play_gomoku_move',title:'五子棋落子',description:'在棋盘指定坐标落下一枚棋子，坐标从零到十四。',inputSchema:{type:'object',properties:{x:{type:'integer',minimum:0,maximum:14},y:{type:'integer',minimum:0,maximum:14}},required:['x','y'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Number.isInteger(input.x)||!Number.isInteger(input.y)||!inside(input.x,input.y)||winner||thinking||mode==='ai'&&turn!==1||board[input.y][input.x])throw Error('该位置当前无法落子');const player=turn;apply(input.x,input.y,player);return{x:input.x,y:input.y,player,winner,moves:moves.length}}});
  }
  reset();
})();
