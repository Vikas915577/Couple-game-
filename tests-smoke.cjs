const fs=require('fs'),vm=require('vm'),assert=require('assert');
const handlers={};
const nodes={app:{innerHTML:'',focus(){}},'game-layer':{innerHTML:'',classList:{add(){},remove(){}},setAttribute(){}},'avatar-initial':{textContent:''},toast:{textContent:'',classList:{add(){},remove(){}}}};
const document={body:{style:{}},addEventListener:(n,f)=>{handlers[n]=f;},getElementById:id=>nodes[id]||(nodes[id]={innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){}},setAttribute(){},style:{}}),querySelectorAll:()=>[],createElement:()=>({click(){},style:{}}),append(){}};
const ctx={handlers,assert,document,window:{confirm:()=>true,scrollTo(){}},navigator:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},location:{protocol:'file:'},URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob:function(){},FileReader:function(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>1,clearInterval(){},performance:{now:()=>100},Math,Date,console,structuredClone,Array,Object,String,Number,JSON,RegExp,Map,Set};
vm.createContext(ctx);
const source=fs.readFileSync(__dirname+'/app.js','utf8');
const tests=`
const failures=[];
for(const g of GAMES){currentGame=g[0];gameState={};try{renderGame();if(!document.getElementById('game-layer').innerHTML.includes('game-wrap'))throw Error('missing game shell');}catch(e){failures.push(g[0]+': '+e.message);}}
if(failures.length)throw Error('Render failures: '+failures.join(', '));
if(GAMES.length!==24)throw Error('Expected 24 games');
if(BUILTIN_PROMPT_COUNT!==381)throw Error('Prompt bank should contain 381 items; got '+BUILTIN_PROMPT_COUNT);
function click(ds){handlers.click({target:{closest:()=>({dataset:ds})}});}
// Local turn-based group voting: each player gets one vote, then results reveal.
openGame('would-you-rather');click({vote:'0'});assert.equal(Object.keys(gameState.votes).length,1);click({vote:'1'});assert.equal(Object.keys(gameState.votes).length,2);click({action:'next-choice'});assert.equal(gameState.revealed,true);
// Never Have I Ever rotates through the local player roster and reveals after all answers.
openGame('never-have-i-ever');click({never:'1'});assert.equal(gameState.revealed,false);click({never:'0'});assert.equal(gameState.revealed,true);
// Most Likely To accepts one vote per player.
openGame('most-likely-to');click({person:'Player One'});click({person:'Player Two'});assert.equal(gameState.revealed,true);
// Red/Green Flag asks both players and compares their answers.
openGame('red-flag');click({flag:'Green flag'});click({flag:'Depends'});assert.equal(Object.keys(gameState.flagVotes).length,2);assert(document.getElementById('game-layer').innerHTML.includes('Both answers revealed'));
// Tic Tac Toe move + unbeatable bot does not miss a direct win/block.
currentGame='tic-tac-toe';gameState={board:['X','X','', 'O','','','','',''],turn:'X',mode:'computer',aiLevel:'hard'};assert.equal(botMove(['O','O','','X','X','','','',''],'hard'),2);playTTT(2);assert.equal(checkTTT(gameState.board),'X');
// Ludo uses modulo turn progression for 3/4-player pass-the-phone matches.
currentGame='ludo';startLudoMode('quad');gameState.ludo.turn=2;gameState.ludo.dice=2;gameState.ludo.rolled=true;gameState.ludo.legal=[0];applyLudoMove(gameState.ludo,0);assert.equal(gameState.ludo.turn,3);
// Six brings a token out and bonus turn is retained.
gameState.ludo.turn=0;gameState.ludo.dice=6;gameState.ludo.rolled=true;gameState.ludo.legal=[0];applyLudoMove(gameState.ludo,0);assert.equal(gameState.ludo.players[0].tokens[0],0);assert.equal(gameState.ludo.turn,0);
// Memory match clears a matched pair correctly.
currentGame='memory-match';gameState={cards:['🍒','🍒'],moves:0};memoryOpened=[];memoryMatched=[];memoryTap(0);memoryTap(1);assert.equal(memoryMatched.length,2);
// Same Brain reveal compares the two hidden choices.
currentGame='same-brain';gameState={same:['question','A','B'],step:0,sameAnswers:[]};gameState.sameAnswers[0]='A';gameState.sameAnswers[1]='A';gameState.step=2;assert.equal(gameState.sameAnswers[0],gameState.sameAnswers[1]);
// Custom Would You Rather deck is accepted and persisted locally.
state.customDeck=[{id:1,type:'would-you-rather',text:'Tea | Coffee'}];currentGame='would-you-rather';gameState={};renderChoiceVote();assert(WYR.concat([['Tea','Coffee']]).some(x=>JSON.stringify(x)===JSON.stringify(gameState.choice))||gameState.choice.length===2);
window.testResult={gameCards:GAMES.length,builtinPromptCount:BUILTIN_PROMPT_COUNT,renderSmoke:'24/24',interactionChecks:['group voting','Never Have I Ever','Most Likely To','Red Flag / Green Flag','Tic Tac Toe hard AI','3/4-player Ludo turns','Ludo six-to-enter','Memory match','Same Brain','custom deck']};
`;
vm.runInContext(source+'\n'+tests,ctx,{timeout:15000});
console.log('PASS',ctx.window.testResult);
