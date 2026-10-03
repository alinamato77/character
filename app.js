'use strict';
const $=id=>document.getElementById(id);
const room=$('room'),pet=$('pet'),canvas=$('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const idle=$('idle'),walk=$('walk'),awake=$('awake'),eat=$('eat'),sit=$('sit'),feed=$('feed'),holdLeft=$('hold-left-video'),holdRight=$('hold-right-video');
const videos=[idle,walk,awake,sit,eat,holdLeft,holdRight];let active=idle,eating=false,petting=false,drag=null,bubbleTimer,patTimer,actionTimer;
let defaultWalking=false,direction=1,lastFrame=0,sitting=false,sitTimer,sequenceTimer,holding=false,holdDirection=1,holdTarget=null;
function switchVideo(video,restart=false){videos.forEach(v=>v.pause());active=video;if(restart)video.currentTime=0;play(video)}
function resumeDefault(){holding=false;holdTarget=null;document.body.classList.remove('holding-hand');$('hold-label').textContent='Hold';$('hold-menu').hidden=true;clearTimeout(actionTimer);clearTimeout(sitTimer);clearTimeout(sequenceTimer);sitting=false;petting=false;defaultWalking=false;switchVideo(idle,true);$('state').textContent='Little hops';actionTimer=setTimeout(toggleDefault,4300);sitTimer=setTimeout(startDefaultSit,20000)}
function toggleDefault(){if(eating||petting||sitting||holding)return;defaultWalking=!defaultWalking;switchVideo(defaultWalking?walk:idle,true);$('state').textContent=defaultWalking?'Taking a stroll':'Little hops';actionTimer=setTimeout(toggleDefault,defaultWalking?6400:4300)}
function moveDefault(timestamp){const dt=lastFrame?Math.min((timestamp-lastFrame)/1000,.05):0;lastFrame=timestamp;if(holding&&!document.hidden){const start=holdDirection<0?1:1;
 if(active.currentTime>=start&&holdTarget){const maxX=Math.max(0,room.clientWidth-pet.offsetWidth),maxY=Math.max(65,room.clientHeight-pet.offsetHeight-140);if((holdTarget.x<=0&&pet.offsetLeft<=6)||(holdTarget.x>=maxX&&pet.offsetLeft>=maxX-6)||(holdTarget.y<=65&&pet.offsetTop<=71)||(holdTarget.y>=maxY&&pet.offsetTop>=maxY-6)){releaseHand();return;}const dx=holdTarget.x-pet.offsetLeft,dy=holdTarget.y-pet.offsetTop,dist=Math.hypot(dx,dy);
 if(dist>5){const nextDirection=dx<-5?-1:dx>5?1:holdDirection;if(nextDirection!==holdDirection){holdDirection=nextDirection;switchVideo(holdDirection<0?holdLeft:holdRight);active.currentTime=holdDirection<0?1:1;}
 play(active);const step=Math.min(dist,95*dt);position(pet.offsetLeft+dx/dist*step,pet.offsetTop+dy/dist*step);$('state').textContent=holdDirection<0?'Walking left together':'Walking right together';
 }else{active.pause();$('state').textContent='Holding hands, waiting for you';}}
 return;}if(defaultWalking&&!sitting&&!eating&&!petting&&!drag&&!document.hidden){const limit=room.clientWidth-pet.offsetWidth;let x=pet.offsetLeft+direction*38*dt;if(x>=limit){x=limit;direction=-1}if(x<=0){x=0;direction=1}position(x,pet.offsetTop);canvas.style.transform=direction<0?'scaleX(-1)':''}}
const W=280,H=350,seen=new Uint8Array(W*H),queue=new Int32Array(W*H);
// Remove only pale neutral pixels connected to the outer background; preserve internal highlights.
function render(timestamp){moveDefault(timestamp||0);if(active.readyState>=2){try{ctx.drawImage(active,0,0,W,H);const frame=ctx.getImageData(0,0,W,H),d=frame.data;seen.fill(0);let head=0,tail=0;
function add(p){if(seen[p])return;seen[p]=1;let i=p*4,r=d[i],g=d[i+1],b=d[i+2];if(Math.min(r,g,b)>175&&Math.max(r,g,b)-Math.min(r,g,b)<24){queue[tail++]=p;d[i+3]=0;}}
for(let x=0;x<W;x++){add(x);add((H-1)*W+x)}for(let y=0;y<H;y++){add(y*W);add(y*W+W-1)}
while(head<tail){let p=queue[head++],x=p%W;if(x>0)add(p-1);if(x<W-1)add(p+1);if(p>=W)add(p-W);if(p<W*(H-1))add(p+W)}ctx.putImageData(frame,0,0);$('loading').hidden=true;}catch(error){/* Local-file security can block pixel reads; keep raw video and interactions working. */ctx.clearRect(0,0,W,H);ctx.drawImage(active,0,0,W,H);$('loading').hidden=true;}}requestAnimationFrame(render)}
function say(text,duration=3600){clearTimeout(bubbleTimer);$('bubble').textContent=text;bubbleTimer=setTimeout(()=>{$('bubble').textContent=eating?'Munch, munch…':'I’m here. Take your time.'},duration)}
function play(video){return video.play().catch(()=>{if((video===eat||video===sit)&&eating){eating=false;active=idle;feed.disabled=false;$('feed-label').textContent='Feed';$('state').textContent='Animation paused';}say('Couldn’t play the animation. Click again or try another browser.',6000);});}
function pat(){
 if(eating||sitting||holding)return;
 clearTimeout(actionTimer);petting=true;canvas.style.transform='';switchVideo(awake,true);$('state').textContent='Looking at you';say('Hehe, one more pat?');
 pet.classList.remove('patted');void pet.offsetWidth;pet.classList.add('patted');clearTimeout(patTimer);patTimer=setTimeout(()=>pet.classList.remove('patted'),550);
 let heart=document.createElement('span');heart.className='heart';heart.textContent='♥';$('particles').append(heart);setTimeout(()=>heart.remove(),1100);
 actionTimer=setTimeout(()=>{petting=false;if(eating){switchVideo(eat);$('state').textContent='Enjoying toast'}else resumeDefault()},2600);
}
function finishEating(){eating=false;feed.disabled=false;$('feed-label').textContent='Feed';resumeDefault();say('All full. Thank you!')}
function beginSit(forFood=false){
 clearTimeout(actionTimer);clearTimeout(sitTimer);clearTimeout(sequenceTimer);petting=false;defaultWalking=false;sitting=true;canvas.style.transform='';
 $('state').textContent='Sitting down';switchVideo(sit,true);
 if(forFood)say('Let me sit down, then I’ll catch it!',12000);else say('Let’s sit and rest a little.',12000);
}
function startDefaultSit(){if(!eating&&!petting&&!holding)beginSit()}
function throwToast(){
 $('state').textContent='Catching toast';$('feed-label').textContent='Catching…';
 const toast=document.createElement('img');toast.src='assets/button-toast.png';toast.alt='';toast.className='flying-toast';$('particles').append(toast);
 sequenceTimer=setTimeout(()=>{toast.remove();sitting=false;$('state').textContent='Enjoying toast';$('feed-label').textContent='Eating…';switchVideo(eat,true);say('Got it! Time to eat.',10000)},750);
}
sit.addEventListener('ended',()=>{if(!sitting)return;if(eating)throwToast();else sequenceTimer=setTimeout(resumeDefault,2500)});
function startFeeding(){if(eating)return;if(holding)releaseHand();eating=true;feed.disabled=true;$('feed-label').textContent='Sitting first…';beginSit(true)}
feed.addEventListener('click',startFeeding);
eat.addEventListener('ended',finishEating);
for(const video of videos)video.addEventListener('error',()=>{if(video===holdLeft||video===holdRight)releaseHand();if(video===eat||video===sit){if(eating)finishEating();else resumeDefault();}say('Couldn’t load the animation. Please refresh and try again.',10000)});
function releaseHand(){if(!holding)return;resumeDefault();say('Letting go. I’ll be right here.')}
function holdHand(side){if(eating||sitting)return;if(holding){releaseHand();return;}clearTimeout(actionTimer);clearTimeout(sitTimer);clearTimeout(sequenceTimer);petting=false;defaultWalking=false;holding=true;holdDirection=side;holdTarget={x:pet.offsetLeft,y:pet.offsetTop};document.body.classList.add('holding-hand');canvas.style.transform='';$('hold-menu').hidden=true;$('hold-label').textContent='Let go';$('state').textContent=side<0?'Walking left together':'Walking right together';switchVideo(side<0?holdLeft:holdRight,true);say('Hold my hand and move your cursor to lead me.',10000)}
for(const [v,start] of [[holdLeft,1],[holdRight,1]])v.addEventListener('ended',()=>{if(holding&&active===v){v.currentTime=start;play(v)}});
$('hold').addEventListener('click',()=>{if(holding)releaseHand();else holdHand(1)});
document.addEventListener('pointermove',e=>{if(!holding)return;if(e.clientX<=1||e.clientY<=1||e.clientX>=window.innerWidth-1||e.clientY>=window.innerHeight-1){releaseHand();return;}const bounds=room.getBoundingClientRect();holdTarget={x:Math.max(0,Math.min(e.clientX-bounds.left-pet.offsetWidth/2,room.clientWidth-pet.offsetWidth)),y:Math.max(65,Math.min(e.clientY-bounds.top-pet.offsetHeight*.55,room.clientHeight-pet.offsetHeight-140))};});
document.addEventListener('pointerout',e=>{if(holding&&!e.relatedTarget)releaseHand()});
room.addEventListener('click',e=>{if(holding&&!e.target.closest('#character,.hand-zone,.controls'))releaseHand()});
$('choose-left').addEventListener('click',()=>holdHand(-1));$('choose-right').addEventListener('click',()=>holdHand(1));
$('hand-left').addEventListener('click',()=>holdHand(-1));$('hand-right').addEventListener('click',()=>holdHand(1));
$('pat').addEventListener('click',pat);
function position(x,y){pet.style.left=Math.max(0,Math.min(x,room.clientWidth-pet.offsetWidth))+'px';pet.style.top=Math.max(65,Math.min(y,room.clientHeight-pet.offsetHeight-140))+'px'}
const lines=['What made you smile today?','Take a break if you’re tired. I’m here.','Do your thing. I’ll keep you company.','Toast crusts are tasty too.'];let lineIndex=0;
$('talk').addEventListener('click',()=>{say(lines[lineIndex++%lines.length],6000);/* Dialogue keeps the current motion state. */});
const character=$('character');
// Share the same target area for hover feedback and pointer activation.
function characterAction(e){
 const rect=character.getBoundingClientRect();
 const x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;
 if(x>=.3&&x<=.7&&y>=.3&&y<=.64)return 'feed';
 if(x>=.2&&x<=.8&&y>=.07&&y<.3)return 'pet';
 return null;
}
character.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(holding){releaseHand();return;}play(active);character.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:pet.offsetLeft,top:pet.offsetTop,moved:false,action:characterAction(e)};});
character.addEventListener('pointerleave',()=>character.classList.remove('cursor-heart','cursor-toast'));
character.addEventListener('pointermove',e=>{const action=characterAction(e);character.classList.toggle('cursor-heart',!holding&&action==='pet');character.classList.toggle('cursor-toast',!holding&&action==='feed');if(!drag||e.pointerId!==drag.id)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6&&!drag.moved){drag.moved=true;pet.classList.add('lift');say('Whoa, we’re flying!')}if(drag.moved)position(drag.left+dx,drag.top+dy)});
function release(e,cancelled=false){if(!drag||drag.id!==e.pointerId)return;let moved=drag.moved,action=drag.action;drag=null;pet.classList.remove('lift');if(moved){pet.classList.add('dropped');setTimeout(()=>pet.classList.remove('dropped'),450);say('This spot is nice. I’ll stay here.')}else if(!cancelled){if(action==='feed')startFeeding();else pat()}}
character.addEventListener('pointerup',e=>release(e));character.addEventListener('pointercancel',e=>release(e,true));character.addEventListener('lostpointercapture',e=>release(e,true));
character.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pat()}const dirs={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};if(dirs[e.key]){e.preventDefault();let [x,y]=dirs[e.key];position(pet.offsetLeft+x,pet.offsetTop+y)}});
window.addEventListener('resize',()=>position(pet.offsetLeft,pet.offsetTop));
document.addEventListener('visibilitychange',()=>{if(document.hidden){videos.forEach(v=>v.pause());lastFrame=0}else play(active)});
resumeDefault();render();
