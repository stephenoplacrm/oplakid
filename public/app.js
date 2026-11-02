
(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ================= Keyboard model ================= */
const LETTERS='abcdefghijklmnopqrstuvwxyz',ALL=LETTERS;
const SHIFT_OF={'`':'~','1':'!','2':'@','3':'#','4':'$','5':'%','6':'^','7':'&','8':'*','9':'(','0':')','-':'_','=':'+','[':'{',']':'}','\\':'|',';':':',"'":'"',',':'<','.':'>','/':'?'};
const BASE_OF={};Object.entries(SHIFT_OF).forEach(([b,s])=>BASE_OF[s]=b);LETTERS.split('').forEach(c=>BASE_OF[c.toUpperCase()]=c);
const baseOf=ch=>BASE_OF[ch]!==undefined?BASE_OF[ch]:ch;
const needsShift=ch=>BASE_OF[ch]!==undefined;
const FINGER={q:'L5',a:'L5',z:'L5',w:'L4',s:'L4',x:'L4',e:'L3',d:'L3',c:'L3',r:'L2',f:'L2',v:'L2',t:'L2',g:'L2',b:'L2',
  y:'R2',h:'R2',n:'R2',u:'R2',j:'R2',m:'R2',i:'R3',k:'R3',',':'R3',o:'R4',l:'R4','.':'R4',p:'R5',';':'R5','/':'R5',' ':'R1',
  '`':'L5','1':'L5','2':'L4','3':'L3','4':'L2','5':'L2','6':'L2','7':'R2','8':'R3','9':'R4','0':'R5','-':'R5','=':'R5',
  '[':'R5',']':'R5','\\':'R5',"'":'R5',Tab:'L5',Caps:'L5',ShiftL:'L5',ShiftR:'R5',Enter:'R5',Backspace:'R5'};
const FTYPE={L5:'pinky',L4:'ring',L3:'middle',L2:'index',L1:'thumb',R1:'thumb',R2:'index',R3:'middle',R4:'ring',R5:'pinky'};
const FNAME={pinky:'Ngón út',ring:'Ngón áp út',middle:'Ngón giữa',index:'Ngón trỏ',thumb:'Ngón cái'};
const ROWKEY={};
'`1234567890-='.split('').concat(['Backspace']).forEach(k=>ROWKEY[k]='n');
'qwertyuiop[]\\'.split('').concat(['Tab']).forEach(k=>ROWKEY[k]=0);
"asdfghjkl;'".split('').concat(['Caps','Enter']).forEach(k=>ROWKEY[k]=1);
'zxcvbnm,./'.split('').concat(['ShiftL','ShiftR']).forEach(k=>ROWKEY[k]=2);
ROWKEY[' ']=3;
const WIDE={Backspace:2,Tab:1.5,'\\':1.5,Caps:1.8,Enter:2.2,ShiftL:2.3,ShiftR:2.7};
const MODL={Backspace:'⌫',Tab:'Tab',Caps:'Caps',Enter:'Enter',ShiftL:'Shift',ShiftR:'Shift'};
const SIMPLE_SET=new Set('abcdefghijklmnopqrstuvwxyz;,./ '.split(''));
function layout(full){
  if(!full)return [[0,'qwertyuiop'.split('')],[.3,'asdfghjkl;'.split('')],[.75,'zxcvbnm,./'.split('')],[2.4,[' ']]];
  return [[0,'`1234567890-='.split('').concat(['Backspace'])],[0,['Tab'].concat('qwertyuiop[]\\'.split(''))],
    [0,['Caps'].concat("asdfghjkl;'".split(''),['Enter'])],[0,['ShiftL'].concat('zxcvbnm,./'.split(''),['ShiftR'])],[4.5,[' ']]];
}
function keyName(k){
  if(MODL[k])return k.startsWith('Shift')?'Shift':MODL[k];
  if(k===' ')return 'phím cách';
  return LETTERS.includes(k)?k.toUpperCase():k;
}
const W=w=>'calc(var(--u)*'+w+' + var(--u)*.13*'+(w-1)+')';
function buildKB(el,full,mini){
  el.innerHTML='';el.classList.toggle('full',!!full);const map={};
  layout(full).forEach(([off,keys])=>{
    const r=document.createElement('div');r.className='row';if(off)r.style.paddingLeft='calc(var(--u)*'+off+' + var(--u)*.13*'+off+')';
    keys.forEach(k=>{
      const b=document.createElement(mini?'span':'button');let cls='key';
      const w=k===' '?(full?6:5.8):(WIDE[k]||1);if(w!==1)b.style.width=W(w);
      b.style.setProperty('--fc','var(--c-'+FTYPE[FINGER[k]]+')');
      if(MODL[k]){cls+=' mod';b.textContent=MODL[k];}
      else if(k===' ')cls+=' space';
      else if(full&&SHIFT_OF[k]){cls+=' two';b.innerHTML='<span class="sym">'+esc(SHIFT_OF[k])+'</span><span class="base">'+esc(k)+'</span>';}
      else b.textContent=k.toUpperCase();
      if(k==='f'||k==='j')cls+=' bump';
      b.className=cls;b.dataset.k=k;
      if(!mini){b.type='button';b.tabIndex=-1;b.setAttribute('aria-label',keyName(k));
        b.addEventListener('pointerdown',ev=>{ev.preventDefault();pressVirtual(k);});}
      map[k]=b;r.appendChild(b);
    });
    el.appendChild(r);
  });
  return map;
}
let KEYS={},kbFullNow=null,lastNext=null;
function ensureKB(full){
  if(kbFullNow===full)return;kbFullNow=full;KEYS=buildKB($('#kb'),full,false);showNext(lastNext);
}

/* ================= Hands ================= */
function handSVG(side){
  const F=[['5',20,78,32,82],['4',58,44,34,116],['3',98,30,34,130],['2',138,48,34,112]];
  const fingers=F.map(([n,x,y,w,h])=>'<g class="finger" data-f="'+side+n+'" style="--fc:var(--c-'+FTYPE[side+n]+')"><rect class="fbody" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(w/2)+'"/><circle class="nail" cx="'+(x+w/2)+'" cy="'+(y+17)+'" r="10"/></g>').join('');
  const thumb='<g class="finger" data-f="'+side+'1" style="--fc:var(--c-thumb)"><g transform="rotate(35 192 196)"><rect class="fbody" x="176" y="118" width="32" height="78" rx="16"/><circle class="nail" cx="192" cy="135" r="10"/></g></g>';
  const palm='<rect class="palm" x="16" y="120" width="170" height="86" rx="40"/>';
  const inner=fingers+thumb+palm;
  return '<svg class="hand" viewBox="0 0 240 214" aria-hidden="true">'+(side==='R'?'<g transform="translate(240,0) scale(-1,1)">'+inner+'</g>':inner)+'</svg>';
}
$('#hands').innerHTML=handSVG('L')+handSVG('R');
const flabel=$('#flabel');
function plan(ch){
  const b=baseOf(ch),f=FINGER[b];
  if(!f)return {keys:[],fingers:[],label:''};
  if(b===' ')return {keys:[' '],fingers:[['L1',3],['R1',3]],label:'Ngón cái bấm phím cách'};
  const side=s=>s[0]==='L'?'trái':'phải',row=ROWKEY[b];
  const move=row==='n'?', vươn lên hàng số':row===0?', vươn lên hàng trên':row===2?', đưa xuống hàng dưới':'';
  if(!needsShift(ch))return {keys:[b],fingers:[[f,row]],label:FNAME[FTYPE[f]]+' tay '+side(f)+move};
  const sk=f[0]==='L'?'ShiftR':'ShiftL',sf=FINGER[sk];
  return {keys:[b,sk],fingers:[[f,row],[sf,2]],label:'Ngón út tay '+side(sf)+' giữ Shift, '+FNAME[FTYPE[f]].toLowerCase()+' tay '+side(f)+' gõ '+keyName(b)};
}
function showNext(ch){
  lastNext=ch==null?null:ch;
  Object.values(KEYS).forEach(k=>k.classList.remove('next'));
  $$('.finger.on').forEach(g=>g.classList.remove('on','r-0','r-1','r-2','r-3','r-n'));
  if(ch==null){flabel.textContent='';return;}
  const p=plan(ch);
  p.keys.forEach(k=>{if(KEYS[k])KEYS[k].classList.add('next');});
  p.fingers.forEach(([f,row])=>{const g=document.querySelector('.finger[data-f="'+f+'"]');if(g)g.classList.add('on','r-'+row);});
  flabel.textContent=p.label;
}
function flashKey(k,ok=true){const el=KEYS[k];if(!el)return;const c=ok?'hit':'bad';el.classList.add(c);setTimeout(()=>el.classList.remove(c),ok?130:280);}
function flash(ch,ok){flashKey(baseOf(ch),ok);}

/* ================= Content ================= */
const TOPICS={
  animals:{name:'Con vật',words:[['cat','🐱','con mèo'],['dog','🐶','con chó'],['pig','🐷','con heo'],['fox','🦊','con cáo'],['ant','🐜','con kiến'],['cow','🐄','con bò'],['hen','🐔','con gà mái'],['bee','🐝','con ong'],['owl','🦉','con cú'],['bat','🦇','con dơi'],['duck','🦆','con vịt'],['fish','🐟','con cá'],['frog','🐸','con ếch'],['bird','🐦','con chim'],['lion','🦁','sư tử'],['bear','🐻','con gấu'],['goat','🐐','con dê'],['horse','🐴','con ngựa'],['mouse','🐭','con chuột'],['snake','🐍','con rắn'],['tiger','🐯','con hổ'],['zebra','🦓','ngựa vằn'],['monkey','🐵','con khỉ'],['rabbit','🐰','con thỏ']]},
  house:{name:'Đồ vật trong nhà',words:[['bed','🛏️','cái giường'],['cup','☕','cái ly'],['box','📦','cái hộp'],['key','🔑','chìa khoá'],['door','🚪','cái cửa'],['lamp','💡','bóng đèn'],['bowl','🥣','cái chén'],['fork','🍴','cái nĩa'],['sofa','🛋️','ghế sofa'],['bath','🛁','bồn tắm'],['clock','⏰','đồng hồ'],['chair','🪑','cái ghế'],['phone','📱','điện thoại'],['spoon','🥄','cái muỗng']]},
  colors:{name:'Màu sắc',words:[['red','🔴','màu đỏ'],['blue','🔵','màu xanh dương'],['pink','🩷','màu hồng'],['green','🟢','màu xanh lá'],['black','⚫','màu đen'],['white','⚪','màu trắng'],['brown','🟤','màu nâu'],['yellow','🟡','màu vàng'],['orange','🟠','màu cam'],['purple','🟣','màu tím']]},
  numbers:{name:'Số đếm',words:[['one','1️⃣','số một'],['two','2️⃣','số hai'],['six','6️⃣','số sáu'],['ten','🔟','số mười'],['four','4️⃣','số bốn'],['five','5️⃣','số năm'],['nine','9️⃣','số chín'],['three','3️⃣','số ba'],['seven','7️⃣','số bảy'],['eight','8️⃣','số tám']]},
  body:{name:'Cơ thể',words:[['eye','👁️','con mắt'],['ear','👂','cái tai'],['arm','💪','cánh tay'],['leg','🦵','cái chân'],['hand','✋','bàn tay'],['foot','🦶','bàn chân'],['nose','👃','cái mũi'],['bone','🦴','khúc xương'],['mouth','👄','cái miệng'],['tooth','🦷','cái răng'],['brain','🧠','bộ não'],['heart','❤️','trái tim']]},
  food:{name:'Đồ ăn',words:[['egg','🥚','trứng'],['tea','🍵','trà'],['nut','🥜','hạt đậu'],['pie','🥧','bánh nướng'],['milk','🥛','sữa'],['cake','🍰','bánh ngọt'],['rice','🍚','cơm'],['corn','🌽','bắp'],['soup','🍲','món canh'],['bread','🍞','bánh mì'],['candy','🍬','kẹo'],['pizza','🍕','bánh pizza'],['honey','🍯','mật ong'],['cheese','🧀','phô mai'],['cookie','🍪','bánh quy']]},
  fruit:{name:'Trái cây',words:[['kiwi','🥝','trái kiwi'],['pear','🍐','trái lê'],['apple','🍎','trái táo'],['grape','🍇','trái nho'],['lemon','🍋','trái chanh'],['peach','🍑','trái đào'],['mango','🥭','trái xoài'],['melon','🍈','trái dưa'],['olive','🫒','trái ô liu'],['banana','🍌','trái chuối'],['cherry','🍒','trái anh đào'],['coconut','🥥','trái dừa']]},
  nature:{name:'Thiên nhiên',words:[['sun','☀️','mặt trời'],['sea','🌊','biển'],['moon','🌙','mặt trăng'],['star','⭐','ngôi sao'],['rain','🌧️','mưa'],['tree','🌳','cái cây'],['snow','❄️','tuyết'],['leaf','🍃','chiếc lá'],['rock','🪨','hòn đá'],['fire','🔥','lửa'],['hill','⛰️','ngọn đồi'],['wind','🌬️','gió'],['cloud','☁️','đám mây'],['flower','🌸','bông hoa']]},
  family:{name:'Gia đình',words:[['mom','👩','mẹ'],['dad','👨','ba'],['boy','👦','bé trai'],['baby','👶','em bé'],['girl','👧','bé gái'],['friend','🤝','bạn bè'],['family','👪','gia đình'],['grandma','👵','bà'],['grandpa','👴','ông'],['teacher','🧑‍🏫','giáo viên']]},
  clothes:{name:'Quần áo',words:[['hat','🎩','cái nón'],['cap','🧢','nón lưỡi trai'],['sock','🧦','chiếc vớ'],['shoe','👟','giày'],['boot','👢','ủng'],['coat','🧥','áo khoác'],['dress','👗','váy'],['shirt','👕','áo thun'],['jeans','👖','quần jeans'],['scarf','🧣','khăn quàng'],['glove','🧤','bao tay']]},
  school:{name:'Trường học',words:[['pen','🖊️','cây viết'],['bag','🎒','cái cặp'],['book','📕','quyển sách'],['bell','🔔','cái chuông'],['ruler','📏','thước kẻ'],['paper','📄','tờ giấy'],['globe','🌍','trái địa cầu'],['crayon','🖍️','viết sáp'],['pencil','✏️','viết chì'],['school','🏫','trường học'],['scissors','✂️','cái kéo'],['notebook','📓','quyển tập']]},
  toys:{name:'Đồ chơi',words:[['ball','⚽','trái banh'],['doll','🪆','búp bê'],['kite','🪁','con diều'],['drum','🥁','cái trống'],['dice','🎲','xúc xắc'],['yoyo','🪀','con yoyo'],['game','🎮','trò chơi điện tử'],['robot','🤖','người máy'],['teddy','🧸','gấu bông'],['blocks','🧱','khối xếp hình'],['puzzle','🧩','tranh ghép'],['balloon','🎈','bóng bay']]},
  transport:{name:'Xe cộ',words:[['bus','🚌','xe buýt'],['car','🚗','xe hơi'],['van','🚐','xe tải nhỏ'],['bike','🚲','xe đạp'],['taxi','🚕','xe taxi'],['ship','🚢','tàu thuỷ'],['boat','⛵','thuyền buồm'],['train','🚂','tàu lửa'],['plane','✈️','máy bay'],['truck','🚚','xe tải'],['rocket','🚀','tên lửa'],['scooter','🛵','xe máy']]}
};
const PICS=(()=>{const seen=new Set(),out=[];Object.values(TOPICS).forEach(t=>t.words.forEach(w=>{if(!seen.has(w[0])){seen.add(w[0]);out.push(w);}}));return out;})();
const HOME_W='as ad add all ask dad sad lad had has gas hall fall glad flag dash flash salad shall half ash'.split(' ');
const TOP_W1='the she he we it is to go so up us red sea see tea pie egg dog pig fish hat owl top toy rat jet kite leg ear eye toe rope hug'.split(' ');
const TOP_W2='tree frog goat horse tiger apple grape pear sheep sleep house water paper flower yellow purple little great sister happy pretty quiet giraffe jelly kitty puppy potato'.split(' ');
const BOT_W1='cat can man van bus box zoo cow bag bed nut sun run mom mix six ten cup map web zip jam hen pen fan bin'.split(' ');
const BOT_W2='zebra monkey banana candy music camera lemon cookie button dance brown black mango clock snack number seven kitchen'.split(' ');
const DICT=[...new Set(PICS.map(w=>w[0]).concat(HOME_W,TOP_W1,TOP_W2,BOT_W1,BOT_W2))];
const BIGRAMS={th:['the','this','that','bath'],sh:['she','ship','fish','wish'],ch:['chip','chin','much','lunch'],ck:['duck','sock','back','kick'],ng:['sing','ring','long','king'],qu:['quiz','queen','quick'],wh:['when','what','white'],ee:['see','tree','bee','green'],oo:['moon','book','zoo','food'],ll:['ball','bell','doll','hill']};
const PHR2='red hat|big dog|hot sun|wet frog|fat hen|my bag|toy car|pink cup|blue sky|green leaf|little duck|black cat|tall tree|sweet cake|cold milk|fast bus|soft bed|happy boy|small ant|yellow moon'.split('|');
const PHR3='a red hat|a big dog|ten red pens|my blue bag|the big tree|a red kite|my green pen|a toy car|two black cats|three brown bears|nine little ants|rain and snow|my red bike|fish and rice|a sunny day|a happy girl|my best friend|a cup of tea|the old owl|five pink pigs'.split('|');
const PHR4='a fox in a box|a pig on a bus|a cat on a bed|a cup of milk|a cake for mom|the moon and stars|a lion and a bear|a bird in a tree|a box of apples|a bee on a leaf|a ball and a bat|a goat on a hill|fish in the sea|five little ducks swim|a frog on a log'.split('|');
const SENT_S='we can hop|the dog is big|the sun is hot|my cat can run|the fox is red|we like cake|the moon is up|we go to school|my bike is green|the bear likes milk|birds can fly|fish can swim|the cow says moo|it is a cat|we can sing'.split('|');
const SENT_M='a hen has an egg|the bus is yellow|the frog can jump high|my mom has a red bag|the bird can sing a song|dad has a blue car|look at the big tree|the duck is in the pond|my dog likes to play|she has a pink hat|he can kick the ball|it is a sunny day|we eat rice and fish|the pig is in the mud|the owl can see at night'.split('|');
const SENT_L='we like to play ball in the park|the little cat sleeps on my soft bed|my dad reads a book to me at night|the big brown bear likes to eat honey|we put on our hats when it is sunny|the yellow bus takes us to school every day|my grandma makes a cake for my birthday|the green frog jumps into the cold pond|we wash our hands before we eat lunch|the bright moon and stars shine at night|there are five red apples in the box|the children sing a song in the classroom'.split('|');
const SENT_MATH='two plus three is five|one plus one is two|ten minus four is six|five plus five is ten|three plus four is seven|nine minus two is seven|six plus two is eight|four minus one is three|a square has four sides|a triangle has three sides|a circle is round|eight is more than six|two is less than five'.split('|');
const SENT_SCI='plants need water and sun|the sun is a star|fish live in water|birds have wings|ice is cold water|we breathe air|a seed grows into a plant|the earth is round|the moon goes around the earth|bees make honey|frogs lay eggs in water|we see with our eyes|we hear with our ears'.split('|');
const NAMES='Nam|Mai|Lan|Minh|Hoa|An|Linh|Long|Tom|Anna|Ben|Lily|Sam|Mia|Leo|Emma'.split('|');
const I_SENT='I am six|I can run|I like cats|I see a bird|I have a dog|I can swim|I love my mom|I go to school'.split('|');
const DAYS='Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday'.split('|');
const MONTHS='January|February|March|April|May|June|July|August|September|October|November|December'.split('|');
const CITIES='Ha Noi|Da Nang|Hue|Can Tho|Hai Phong|Nha Trang|Ha Long|Sai Gon|London|Paris|Tokyo|Seoul'.split('|');
const COMMA='red, blue, green|one, two, three|cats, dogs, birds|apples, pears, grapes|a pen, a book, a bag|Yes, I can.|No, thank you.|Hello, Mai.|Yes, it is.|Mom, Dad and me'.split('|');
const QUEST='What is this?|Who is she?|Where is my bag?|Can you swim?|Is it a cat?|How old are you?|Do you like milk?|What color is it?'.split('|');
const EXCL='Wow!|Look!|Yes!|Help me!|Look at the bird!|I win!|Happy birthday!|Good job!|Run, run, run!'.split('|');
const APOS="I'm six.|It's a cat.|Don't run!|Let's go!|I can't see.|She's my mom.|That's my bag.|We're happy.".split('|');
const QA='What is it? It is a dog.|Is it red? Yes, it is.|Can you fly? No, I can\'t.|Who is he? He is my dad.|Where is Mai? She is at home.'.split('|');
const NUMW='3 cats|5 dogs|2 red apples|10 fingers|4 legs|7 days|1 sun|6 eggs|8 birds|9 pens|12 months'.split('|');
const PARAS={
  animals:['I have a cat. Her name is Mimi.','The dog runs in the park. It likes to play.','Look at the bird! It can fly high.'],
  family:['This is my mom. She is kind.','My dad likes to cook. We eat rice and fish.','I have a little sister. Her name is Lan.'],
  school:['I go to school by bus. My school is big.','My teacher is nice. She reads us a story.','We have English on Monday. I like it!'],
  weather:["It is sunny today. Let's go out!",'It is raining. Where is my coat?',"The wind is cold. I'm wearing a hat."],
  science:['Plants need water. They also need the sun.','Fish live in water. They can swim fast.','The Earth is round. The Moon goes around it.'],
  math:['I have 3 apples. Mom gives me 2 more.','2 + 3 = 5. 5 - 1 = 4.','A square has 4 sides. A triangle has 3.'],
  body:['I see with my eyes. I hear with my ears.','Wash your hands! They must be clean.','I have 10 fingers and 10 toes.']
};
const ALLPARAS=Object.values(PARAS).flat();
const cap1=s=>s.charAt(0).toUpperCase()+s.slice(1);

/* ================= Generators ================= */
const rand=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const it=(t,x)=>Object.assign({t},x||{});
function letters(keys,focus,n,long){
  const out=[];for(let i=0;i<n;i++){const len=long?(3+(i%2)):(i<2?1:(i%3===2?3:2));let s='';
    for(let j=0;j<len;j++)s+=rand((Math.random()<.6?focus:keys).split(''));out.push(it(s));}return out;
}
const pick=(list,n)=>shuffle(list).slice(0,Math.min(n,list.length)).map(t=>it(t));
const pics=(list,n)=>shuffle(list).slice(0,Math.min(n,list.length)).map(w=>it(w[0],{pic:w[1],vi:w[2],say:true}));
const byLen=(list,a,b)=>list.filter(w=>w.length>=a&&w.length<=b);
function capsGen(caps,lower){return ()=>Array.from({length:10},(_,i)=>{let s=rand(caps.split(''));if(i>=4){const n=1+(i%2);for(let j=0;j<n;j++)s+=rand(lower.split(''));}return it(s);});}
function bigramGen(){const ks=Object.keys(BIGRAMS);return Array.from({length:10},(_,i)=>{const k=rand(ks);return it(i%2?rand(BIGRAMS[k]):k+' '+k);});}
function mathGen(){return Array.from({length:6},()=>{if(Math.random()<.5){const a=1+Math.floor(Math.random()*5),b=1+Math.floor(Math.random()*5);return it(a+' + '+b+' = '+(a+b));}const a=3+Math.floor(Math.random()*7),b=1+Math.floor(Math.random()*(a-1));return it(a+' - '+b+' = '+(a-b));});}
function timeGen(){return Array.from({length:6},()=>it((1+Math.floor(Math.random()*12))+':'+rand(['00','15','30','45'])));}
function twoDigit(){return Array.from({length:10},()=>it(String(10+Math.floor(Math.random()*90))));}
function topicParts(id){
  const ws=TOPICS[id].words.slice().sort((a,b)=>a[0].length-b[0].length);const mid=Math.ceil(ws.length/2);
  return [ws.slice(0,mid),ws.slice(mid)];
}

const UNITS=[
  {id:'home',title:'Hàng phím giữa',desc:'Chỗ đặt tay của các ngón: hàng có F và J.',steps:[
    {id:'fj',name:'F J',gen:()=>letters('fj','fj',10)},{id:'dk',name:'D K',gen:()=>letters('dkfj','dk',10)},
    {id:'sl',name:'S L',gen:()=>letters('sldkfj','sl',10)},{id:'a',name:'A',gen:()=>letters('asdfjkl','a',10)},
    {id:'gh',name:'G H',gen:()=>letters('ghfj','gh',10)},{id:'all',name:'Cả hàng',gen:()=>letters('asdfghjkl','asdfghjkl',10)},
    {id:'w',name:'Từ hàng giữa',gen:()=>pick(HOME_W,10)},{id:'rv',name:'Ôn hàng giữa',gen:()=>letters('asdfghjkl','asdfghjkl',8,true)}]},
  {id:'top',title:'Hàng phím trên',desc:'Ngón tay vươn lên rồi quay về hàng giữa.',steps:[
    {id:'ei',name:'E I',gen:()=>letters('eidkfj','ei',10)},{id:'ru',name:'R U',gen:()=>letters('rueifj','ru',10)},
    {id:'ty',name:'T Y',gen:()=>letters('tyrufj','ty',10)},{id:'wo',name:'W O',gen:()=>letters('woeisl','wo',10)},
    {id:'qp',name:'Q P',gen:()=>letters('qpwoal','qp',10)},{id:'all',name:'Cả hàng trên',gen:()=>letters('qwertyuiop','qwertyuiop',10)},
    {id:'mx',name:'Trộn trên và giữa',gen:()=>letters('qwertyuiopasdfghjkl','qwertyuiop',10)},
    {id:'w1',name:'Từ ngắn',gen:()=>pick(TOP_W1,10)},{id:'w2',name:'Từ dài hơn',gen:()=>pick(TOP_W2,8)},
    {id:'rv',name:'Ôn hàng trên',gen:()=>letters('qwertyuiop','qwertyuiop',8,true)}]},
  {id:'bottom',title:'Hàng phím dưới',desc:'Ngón tay đưa xuống rồi quay về hàng giữa.',steps:[
    {id:'vm',name:'V M',gen:()=>letters('vmfj','vm',10)},{id:'bn',name:'B N',gen:()=>letters('bnvm','bn',10)},
    {id:'cx',name:'C X',gen:()=>letters('cxdsvm','cx',10)},{id:'z',name:'Z',gen:()=>letters('zxca','z',10)},
    {id:'all',name:'Cả hàng dưới',gen:()=>letters('zxcvbnm','zxcvbnm',10)},
    {id:'mx',name:'Trộn dưới và giữa',gen:()=>letters('zxcvbnmasdfghjkl','zxcvbnm',10)},
    {id:'w1',name:'Từ ngắn',gen:()=>pick(BOT_W1,10)},{id:'w2',name:'Từ dài hơn',gen:()=>pick(BOT_W2,8)},
    {id:'rv',name:'Ôn hàng dưới',gen:()=>letters('zxcvbnm','zxcvbnm',8,true)}]},
  {id:'mix',title:'Cả bàn phím',desc:'Chữ ở cả ba hàng trộn lẫn, rồi các cặp chữ hay gặp.',steps:[
    {id:'m2',name:'Trộn 3 hàng',gen:()=>letters(ALL,ALL,10)},{id:'m4',name:'Chuỗi dài',gen:()=>letters(ALL,ALL,8,true)},
    {id:'bg',name:'Cặp chữ hay gặp',gen:bigramGen},{id:'w3',name:'Từ 3 chữ',gen:()=>pick(byLen(DICT,3,3),10)},
    {id:'w45',name:'Từ 4–5 chữ',gen:()=>pick(byLen(DICT,4,5),8)},{id:'w6',name:'Từ dài',gen:()=>pick(byLen(DICT,6,12),6)},
    {id:'rv',name:'Ôn cả bàn phím',gen:()=>pick(DICT,10)}]},
  {id:'words',title:'Từ tiếng Anh có hình',desc:'Nghe từ, nhìn hình, rồi gõ. Mỗi chủ đề có 2 bài: từ ngắn trước, từ dài sau.',steps:
    Object.keys(TOPICS).flatMap(id=>{const [a,b]=topicParts(id);return [{id:id+'1',name:TOPICS[id].name+' 1',gen:()=>pics(a,8)},{id:id+'2',name:TOPICS[id].name+' 2',gen:()=>pics(b,8)}];})
      .concat([{id:'mixs',name:'Trộn từ ngắn',gen:()=>pics(PICS.filter(w=>w[0].length<=4),10)},{id:'mixl',name:'Trộn từ dài',gen:()=>pics(PICS.filter(w=>w[0].length>=5),8)}])},
  {id:'phr',title:'Cụm từ và câu',desc:'Gõ cả cụm, nhớ dùng ngón cái để bấm phím cách.',steps:[
    {id:'p2',name:'Cụm 2 từ',gen:()=>pick(PHR2,8)},{id:'p3',name:'Cụm 3 từ',gen:()=>pick(PHR3,6)},{id:'p4',name:'Cụm 4 từ',gen:()=>pick(PHR4,6)},
    {id:'s1',name:'Câu ngắn',gen:()=>pick(SENT_S,6)},{id:'s2',name:'Câu vừa',gen:()=>pick(SENT_M,5)},{id:'s3',name:'Câu dài',gen:()=>pick(SENT_L,3)},
    {id:'math',name:'Câu về Toán',gen:()=>pick(SENT_MATH,5)},{id:'sci',name:'Câu về Khoa học',gen:()=>pick(SENT_SCI,5)}]},
  {id:'caps',adv:true,title:'Chữ hoa với phím Shift',desc:'Giữ Shift bằng ngón út tay bên kia, rồi gõ chữ.',steps:[
    {id:'sl',name:'Shift trái',gen:capsGen('HJKLUIOPNMY','asdf')},{id:'sr',name:'Shift phải',gen:capsGen('ASDFGQWERTZXCVB','jkl')},
    {id:'cw',name:'Từ viết hoa',gen:()=>pick(byLen(DICT,3,6).map(cap1),8)},{id:'nm',name:'Tên bạn bè',gen:()=>pick(NAMES,8)},
    {id:'i',name:'Chữ I',gen:()=>pick(I_SENT,6)},{id:'cs',name:'Câu viết hoa',gen:()=>pick(SENT_S.map(cap1),6)},
    {id:'day',name:'Thứ trong tuần',gen:()=>pick(DAYS,7)},{id:'mon',name:'Tháng trong năm',gen:()=>pick(MONTHS,8)},
    {id:'city',name:'Tên thành phố',gen:()=>pick(CITIES,8)}]},
  {id:'punct',adv:true,title:'Dấu câu',desc:'Dấu chấm, phẩy, hỏi, chấm than và dấu nháy.',steps:[
    {id:'dot',name:'Dấu chấm',gen:()=>pick(SENT_S.concat(SENT_M).map(s=>cap1(s)+'.'),5)},{id:'comma',name:'Dấu phẩy',gen:()=>pick(COMMA,6)},
    {id:'q',name:'Dấu hỏi',gen:()=>pick(QUEST,6)},{id:'ex',name:'Dấu chấm than',gen:()=>pick(EXCL,7)},
    {id:'ap',name:'Dấu nháy',gen:()=>pick(APOS,6)},{id:'qa',name:'Hỏi và trả lời',gen:()=>pick(QA,4)},
    {id:'rv',name:'Ôn dấu câu',gen:()=>pick(COMMA.concat(QUEST,EXCL,APOS),8)}]},
  {id:'num',adv:true,title:'Số và phép tính',desc:'Hàng số ở trên cùng. Dấu + và : cần giữ Shift.',steps:[
    {id:'n15',name:'Số 1 đến 5',gen:()=>letters('12345','12345',10)},{id:'n60',name:'Số 6 đến 0',gen:()=>letters('67890','67890',10)},
    {id:'n2',name:'Số hai chữ số',gen:twoDigit},{id:'nw',name:'Số và từ',gen:()=>pick(NUMW,8)},
    {id:'math',name:'Cộng và trừ',gen:mathGen},{id:'time',name:'Xem giờ',gen:timeGen},
    {id:'rv',name:'Ôn số',gen:()=>shuffle(mathGen().slice(0,3).concat(pick(NUMW,3),timeGen().slice(0,2)))}]},
  {id:'para',adv:true,title:'Đoạn văn ngắn',desc:'Hai câu liền nhau, có chữ hoa và dấu câu.',steps:
    [['animals','Con vật'],['family','Gia đình'],['school','Trường học'],['weather','Thời tiết'],['science','Khoa học'],['math','Toán'],['body','Cơ thể']]
      .map(([id,name])=>({id,name,gen:()=>pick(PARAS[id],3)}))}
];
const FLAT=UNITS.flatMap(u=>u.steps.map(st=>({u:u.id,s:st.id})));
const STAGES=[
  {id:'bo',name:'Bò',icon:'🐢',desc:'Làm quen từng hàng phím',units:['home','top','bottom','mix']},
  {id:'di',name:'Đi',icon:'🚶',desc:'Gõ từ, cụm từ và câu tiếng Anh',units:['words','phr']},
  {id:'chay',name:'Chạy',icon:'🏃',desc:'Chữ hoa, dấu câu, số và đoạn văn',units:['caps','punct','num','para']}
];
const stageOf=uid=>STAGES.find(S=>S.units.includes(uid));
function stageDone(S){const all=FLAT.filter(x=>S.units.includes(x.u));return [all.filter(x=>state.best[x.u+':'+x.s]).length,all.length];}
let stageSel=null;
const findStep=(u,s)=>{const U=UNITS.find(x=>x.id===u);return U?{U,st:U.steps.find(x=>x.id===s)}:null;};

function groups(lt,n,len){const out=[];for(let i=0;i<n;i++){let g='';for(let j=0;j<len;j++)g+=rand(lt.split(''));out.push(g);}return out.join(' ');}
function streamText(){let s='';while(s.length<1500)s+=(s?' ':'')+shuffle(SENT_S.concat(SENT_M,SENT_L)).join(' ');return s;}
const TRACKS={
  home:{name:'Hàng giữa',gen:()=>groups('asdfghjkl',8,3)},
  keys:{name:'Cả bàn phím',gen:()=>groups(ALL,8,3)},
  words:{name:'Từ tiếng Anh',gen:()=>shuffle(PICS).slice(0,6).map(w=>w[0]).join(' ')},
  sent:{name:'Câu ngắn',gen:()=>rand(SENT_S.concat(SENT_M))},
  long:{name:'Câu dài',gen:()=>shuffle(SENT_L).slice(0,3).join(' ')},
  adv:{name:'Chữ hoa và dấu câu',adv:true,gen:()=>shuffle(ALLPARAS).slice(0,2).join(' ')},
  t1:{name:'Đường dài 1 phút',timed:60},t2:{name:'Đường dài 2 phút',timed:120},t3:{name:'Đường dài 3 phút',timed:180}
};
const AVATARS=['🐯','🐰','🐼','🦊','🐸'];
const GAMES={
  bubble:{icon:'🫧',name:'Bong bóng chữ',desc:'Bong bóng bay lên, gõ đúng chữ để làm vỡ trước khi bóng bay mất. Có 60 giây và 5 trái tim.',
    levels:{mid:{name:'Hàng giữa',keys:'asdfghjkl'},top:{name:'Hàng trên và giữa',keys:'qwertyuiopasdfghjkl'},all:{name:'Cả bàn phím',keys:ALL}}},
  frog:{icon:'🐸',name:'Ếch qua sông',desc:'Gõ chữ trên lá sen để ếch nhảy sang. Qua 10 lá là tới bờ bên kia.',
    levels:{let:{name:'Chữ cái'},w3:{name:'Từ ngắn'},w45:{name:'Từ dài hơn'}}},
  quiz:{icon:'🖼️',name:'Nhìn hình đoán từ',desc:'Nhìn hình, gõ từ tiếng Anh. Gõ sai thì máy gợi ý chữ cái đó. Bấm loa để nghe từ.',
    levels:{w3:{name:'Từ 3 chữ'},w45:{name:'Từ 4–5 chữ'},all:{name:'Trộn tất cả'}}}
};

/* ================= Storage ================= */
const DEFAULTS={avatar:'🐯',nick:'',sound:true,speak:true,limit:15,kbFull:false,unlockAll:false,updatedAt:0,sessions:[],miss:{},ghosts:{},best:{},bestWpm:{},gbest:{}};
const clone=o=>JSON.parse(JSON.stringify(o));
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function readJSON(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}}
function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
/* Bộ nhớ đệm trên máy, tách riêng theo từng tài khoản phụ huynh */
let uid=null,me=null;
const K=n=>'bgp:'+uid+':'+n;
let profiles={list:[],cur:null,updatedAt:0},curPid=null;
let state=clone(DEFAULTS);
function loadProfilesLocal(){const p=readJSON(K('profiles'));profiles=p&&Array.isArray(p.list)?p:{list:[],cur:null,updatedAt:0};}
function loadState(pid){return Object.assign(clone(DEFAULTS),readJSON(K('p:'+pid))||{});}
function saveProfiles(){if(!uid)return;profiles.updatedAt=Date.now();writeJSON(K('profiles'),profiles);cloudSaveProfiles();}
function save(){
  if(!curPid||!uid)return;
  state.updatedAt=Date.now();if(state.sessions.length>300)state.sessions=state.sessions.slice(-300);
  writeJSON(K('p:'+curPid),state);
  const pe=profiles.list.find(x=>x.id===curPid);
  if(pe&&(pe.nick!==(state.nick||pe.nick)||pe.av!==state.avatar)){pe.nick=(state.nick||pe.nick).slice(0,12);pe.av=state.avatar;saveProfiles();}
  cloudSaveState();
}

/* ---- Máy chủ: tài khoản ba mẹ và dữ liệu học của các bé ---- */
async function api(method,url,body){
  const r=await fetch(url,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  let data=null;try{data=await r.json();}catch(e){}
  if(!r.ok){const err=new Error((data&&data.error)||'Có lỗi xảy ra, bạn thử lại nhé.');err.status=r.status;throw err;}
  return data;
}
const docRef=name=>({
  get:async()=>{const r=await api('GET','/api/docs/'+name);return {exists:!!r.exists,data:()=>r.data};},
  set:d=>api('PUT','/api/docs/'+name,d),
  delete:()=>api('DELETE','/api/docs/'+name)
});
let db=null,syncMsg='';
const pDoc=()=>docRef('profiles');
const sDoc=pid=>docRef('p-'+pid);
function setSync(m){syncMsg=m;const el=$('#l-sync');if(el)el.textContent=m;const ps=$('#p-sync');if(ps)ps.textContent=m;}
setSync('');
const writers={};
function queueWrite(key,ref,getData){
  const w=writers[key]||(writers[key]={t:null,busy:false,again:false});
  clearTimeout(w.t);w.t=setTimeout(async function run(){
    if(w.busy){w.again=true;return;}
    w.busy=true;
    try{await ref().set(getData());setSync('Đã đồng bộ với tài khoản của ba mẹ. Học trên máy khác vẫn giữ tiến độ.');}
    catch(e){setSync('Chưa đồng bộ được lên tài khoản, tiến độ vẫn lưu trên máy này.');}
    w.busy=false;if(w.again){w.again=false;run();}
  },2000);
}
function cloudSaveProfiles(){if(db)queueWrite('profiles',pDoc,()=>({json:JSON.stringify(profiles),updatedAt:profiles.updatedAt}));}
function cloudSaveState(){if(db&&curPid){const pid=curPid,snap=JSON.stringify(state),u=state.updatedAt;queueWrite('p-'+pid,()=>sDoc(pid),()=>({json:snap,updatedAt:u}));}}
async function cloudPullProfiles(){
  try{
    const s=await pDoc().get();
    if(s.exists){const c=JSON.parse(s.data().json||'{}');
      if(c&&Array.isArray(c.list)){
        const ids=new Set(profiles.list.map(x=>x.id));
        if((c.updatedAt||0)>(profiles.updatedAt||0)){profiles={list:c.list,cur:c.list.some(x=>x.id===profiles.cur)?profiles.cur:(c.cur||null),updatedAt:c.updatedAt};writeJSON(K('profiles'),profiles);}
        else{c.list.forEach(x=>{if(!ids.has(x.id))profiles.list.push(x);});writeJSON(K('profiles'),profiles);cloudSaveProfiles();}
      }
    }else if(profiles.list.length)cloudSaveProfiles();
    setSync('Đã đồng bộ với tài khoản của ba mẹ. Học trên máy khác vẫn giữ tiến độ.');
    await Promise.all(profiles.list.map(async pr=>{
      try{const d=await sDoc(pr.id).get();if(!d.exists)return;const c=JSON.parse(d.data().json||'{}');
        const local=readJSON(K('p:'+pr.id));if(!local||(c.updatedAt||0)>(local.updatedAt||0))writeJSON(K('p:'+pr.id),c);}catch(e){}
    }));
    if(screen==='login')renderLogin();
  }catch(e){setSync('Chưa đồng bộ được lên tài khoản, tiến độ vẫn lưu trên máy này.');}
}
async function cloudPullState(pid){
  if(!db)return;
  try{
    const s=await sDoc(pid).get();
    if(s.exists){const c=JSON.parse(s.data().json||'{}');
      if(curPid===pid&&(c.updatedAt||0)>(state.updatedAt||0)){state=Object.assign(clone(DEFAULTS),c);writeJSON(K('p:'+pid),state);syncToggles();if(screen==='home'){stageSel=null;renderHome();}updateLobbyPresence();}
      else if(curPid===pid&&(state.updatedAt||0)>(c.updatedAt||0))cloudSaveState();
    }else if(curPid===pid&&state.updatedAt)cloudSaveState();
  }catch(e){}
}


/* ================= Audio ================= */
let actx=null;
function beep(f,d=.07,type='sine',vol=.07){
  if(!state.sound)return;
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    const o=actx.createOscillator(),g=actx.createGain();o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(vol,actx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+d);
    o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+d+.02);}catch(e){}
}
function say(t){
  if(!state.speak||!('speechSynthesis' in window))return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.8;speechSynthesis.speak(u);}catch(e){}
}

/* ================= Screens ================= */
let screen='home',game=null,ag=null,bypass=false,pending=null,demoT=null,wpmTimer=null;
function needFull(){
  if(screen==='play'&&game&&game.adv)return true;
  return state.kbFull;
}
function show(name){
  screen=name;
  ['home','play','game','results','parent','online','login','world','auth'].forEach(s=>$('#s-'+s).hidden=s!==name);
  $('#deck').hidden=!(name==='home'||name==='play'||name==='game');
  $('#home-bottom').hidden=name!=='home';
  ensureKB(needFull());
  if(name==='home')renderHome();
  if(name==='parent')renderParent();
  if(name==='login')renderLogin();
  $('#who').disabled=name==='login';$('#to-parent').hidden=!uid;$('#kbt').hidden=!uid;
  if(name!=='play'&&name!=='game')window.scrollTo(0,0);
  updateLobbyPresence();
}
function syncToggles(){
  $$('.tg-sound').forEach(b=>b.setAttribute('aria-pressed',String(state.sound)));
  $$('.tg-speak').forEach(b=>b.setAttribute('aria-pressed',String(state.speak)));
  $('#kbt').setAttribute('aria-pressed',String(state.kbFull));
}

/* ================= Helpers ================= */
const starsOf=acc=>acc>=.95?3:acc>=.85?2:1;
const starStr=n=>'⭐'.repeat(n);
const wpmOf=(chars,secs)=>secs>0?Math.round(chars/5/(secs/60)):0;
function fmtTime(s){s=Math.round(s);const m=Math.floor(s/60),r=s%60;return m?m+' phút '+r+' giây':r+' giây';}
function fmtClock(s){s=Math.ceil(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function todayMin(){const d=new Date().toDateString();return state.sessions.filter(s=>new Date(s.t).toDateString()===d).reduce((a,s)=>a+s.secs/60,0);}
function modeName(s){
  if(s.unit==='race'&&s.step==='online')return 'Đua với bạn';
  if(s.unit==='race')return 'Đua: '+(TRACKS[s.step]?TRACKS[s.step].name:'');
  if(s.unit==='game'){const [g,l]=String(s.step).split(':');return GAMES[g]?GAMES[g].name+': '+GAMES[g].levels[l].name:'Trò chơi';}
  const f=findStep(s.unit,s.step);return f&&f.st?f.U.title+': '+f.st.name:'';
}
function record(s){s.t=Date.now();state.sessions.push(s);if(state.sessions.length>600)state.sessions.shift();save();}
function guardStart(fn){
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  if(!bypass&&todayMin()>=state.limit){pending=fn;$('#rest-min').textContent=Math.round(todayMin());$('#rest').hidden=false;return;}
  fn();
}
function stopAll(){
  if(game){clearInterval(game.cdTimer);cancelAnimationFrame(game.raf);}
  if(ag&&ag.stop)ag.stop();
  clearInterval(wpmTimer);$('#countdown').hidden=true;try{speechSynthesis.cancel();}catch(e){}
  game=null;ag=null;showNext(null);
}

/* ================= Home ================= */
let tab='lessons';
function setTab(t){tab=t;$$('.tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));['lessons','games','race'].forEach(x=>$('#tab-'+x).hidden=x!==t);}
$$('.tab').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
function renderHome(){
  if(!stageSel)stageSel=curStage().id;
  renderPublicRaces();if(room)renderOnlineStrip(onlinePeople());
  const nl=nextLesson();$('#cont').hidden=!nl;
  if(nl){const f=findStep(nl.u,nl.s);$('#cont').innerHTML='Học tiếp: '+esc(f.U.title)+', '+esc(f.st.name)+' <kbd>Enter</kbd>';}
  const sb=$('#stages');sb.innerHTML='';
  STAGES.forEach(S=>{const [d,n]=stageDone(S);const b=document.createElement('button');b.type='button';b.className='stagebtn';
    b.setAttribute('aria-pressed',String(S.id===stageSel));const lk=!stageUnlocked(S);if(lk)b.classList.add('locked');
    b.innerHTML='<span class="ico" aria-hidden="true">'+S.icon+'</span><span class="nm">'+(lk?'🔒 ':'')+S.name+'</span><span class="ds">'+esc(S.desc)+'</span><span class="bar"><i style="width:'+Math.round(d/n*100)+'%"></i></span><span class="cnt">'+d+'/'+n+' bài'+(d===n?' ⭐':'')+'</span>';
    b.addEventListener('click',()=>{stageSel=S.id;renderHome();updateLobbyPresence();});sb.appendChild(b);});
  const SS=STAGES.find(x=>x.id===stageSel),[sd,sn]=stageDone(SS);
  const SSlk=!stageUnlocked(SS),prevS=STAGES[STAGES.indexOf(SS)-1];
  if(SSlk){const [pd,pn]=stageDone(prevS);$('#progress').textContent='Chặng '+SS.name+' đang khoá. Em cần xong hết '+pn+' bài của chặng '+prevS.name+' (còn '+(pn-pd)+' bài) thì chặng này mới mở.';}
  else $('#progress').textContent='Chặng '+SS.name+': em đã xong '+sd+' trên '+sn+' bài.'+(SS.id==='chay'?' Chặng này dùng bàn phím đầy đủ với phím Shift.':'')+' Mỗi lần chơi là một đề mới.';
  const ul=$('#units');ul.innerHTML='';
  SS.units.map(id=>UNITS.find(U=>U.id===id)).forEach((U,ui)=>{
    const li=document.createElement('li');li.className='lesson';
    li.innerHTML='<span class="num">'+(ui+1)+'</span><h2>'+esc(U.title)+'</h2><p>'+esc(U.desc)+'</p><div class="acts"></div>';
    const acts=li.querySelector('.acts');
    U.steps.forEach(st=>{const b=document.createElement('button');b.type='button';b.className='chip';
      const best=state.best[U.id+':'+st.id]||0;b.innerHTML=esc(st.name)+(best?'<span class="st">'+starStr(best)+'</span>':'');
      if(SSlk){b.classList.add('lockedc');b.disabled=true;}
      b.addEventListener('click',()=>startLesson(U.id,st.id));acts.appendChild(b);});
    ul.appendChild(li);
  });
  const gl=$('#games');gl.innerHTML='';
  Object.entries(GAMES).forEach(([gid,G])=>{
    const li=document.createElement('li');li.className='lesson';
    li.innerHTML='<span class="num game-ico" aria-hidden="true">'+G.icon+'</span><h2>'+esc(G.name)+'</h2><p>'+esc(G.desc)+'</p><div class="acts"></div>';
    const acts=li.querySelector('.acts');
    Object.entries(G.levels).forEach(([lid,L])=>{const b=document.createElement('button');b.type='button';b.className='chip';
      const best=state.gbest[gid+':'+lid];
      const tag=best==null?'':gid==='bubble'?best+' bóng':gid==='frog'?best+' giây':best+'/10';
      b.innerHTML=esc(L.name)+(tag?'<span class="st" style="color:var(--muted);letter-spacing:0">'+tag+'</span>':'');
      b.addEventListener('click',()=>startGame(gid,lid));acts.appendChild(b);});
    gl.appendChild(li);
  });
  const av=$('#avatars');av.querySelectorAll('.av').forEach(x=>x.remove());
  AVATARS.forEach(a=>{const b=document.createElement('button');b.type='button';b.className='av';b.textContent=a;b.setAttribute('aria-pressed',String(a===state.avatar));
    b.setAttribute('aria-label','Chọn '+a);b.addEventListener('click',()=>{state.avatar=a;save();renderHome();});av.appendChild(b);});
  const tr=$('#tracks');tr.innerHTML='';
  Object.entries(TRACKS).forEach(([id,t])=>{const b=document.createElement('button');b.type='button';b.className='chip';
    const g=state.ghosts[id];
    b.innerHTML=esc(t.name)+(g&&g.wpm?'<span class="st" style="color:var(--muted);letter-spacing:0">'+g.wpm+' WPM</span>':'');
    if(t.adv&&!stageUnlocked(STAGES[2])){b.disabled=true;b.classList.add('lockedc');b.innerHTML='🔒 '+b.innerHTML;b.title='Mở khi em tới chặng Chạy';}
    b.addEventListener('click',()=>startRace(id));tr.appendChild(b);});
}

/* ================= Lesson engine ================= */
function startWpm(){clearInterval(wpmTimer);$('#wpm').textContent='0';wpmTimer=setInterval(updateWpm,400);}
function updateWpm(){if(!game||!game.start)return;if(game.timed&&game.done)return;$('#wpm').textContent=wpmOf(game.chars,(performance.now()-game.start)/1000);}
function startLesson(uid,sid){guardStart(()=>{
  const f=findStep(uid,sid);if(!f)return;
  const stg=stageOf(uid);if(stg&&!stageUnlocked(stg))return;if(stg)stageSel=stg.id;
  stopAll();
  const items=f.st.gen();
  const adv=!!f.U.adv||items.some(x=>[...x.t].some(c=>!SIMPLE_SET.has(c)));
  game={kind:'lesson',unit:uid,step:sid,adv,items,i:0,pos:0,errs:0,chars:0,start:0,missLocal:{},locked:false};
  show('play');syncToggles();$('#race').hidden=true;
  startWpm();renderItem();
});}
function curText(){return game.kind==='race'?game.text:game.items[game.i].t;}
function renderDots(){const d=$('#dots');d.innerHTML='';game.items.forEach((_,k)=>{const s=document.createElement('span');s.className='dot'+(k<game.i?' done':k===game.i?' now':'');d.appendChild(s);});}
function renderTarget(text,ticker){
  const t=$('#target');t.innerHTML='';const line=document.createElement('div');line.className='line';
  [...text].forEach(c=>{const s=document.createElement('span');s.className='ch'+(c===' '?' sp':'');s.textContent=c===' '?'\u00a0':c;line.appendChild(s);});
  t.appendChild(line);t.classList.toggle('ticker',!!ticker);t.classList.toggle('small',!ticker&&text.length>8);updateTarget();
}
function updateTarget(){
  const t=$('#target'),line=t.firstChild;if(!line)return;const spans=line.children,text=curText();
  for(let k=0;k<spans.length;k++){spans[k].classList.toggle('done',k<game.pos);spans[k].classList.toggle('cur',k===game.pos);}
  const cur=spans[game.pos];if(cur){const ch=text[game.pos];cur.style.setProperty('--fc','var(--c-'+FTYPE[FINGER[baseOf(ch)]]+')');}
  if(t.classList.contains('ticker')){const ref=cur||spans[spans.length-1];if(ref)line.style.transform='translateX('+(t.clientWidth*.3-ref.offsetLeft)+'px)';}
  else line.style.transform='';
}
function renderItem(){
  const item=game.items[game.i];game.pos=0;renderDots();
  if(item.pic){$('#pic').hidden=false;$('#pic-emoji').textContent=item.pic;$('#pic-vi').textContent=item.vi||'';}else $('#pic').hidden=true;
  if(item.say)say(item.t);
  renderTarget(item.t,item.t.length>16);showNext(item.t[0]);
}
function input(ch){
  if(screen==='home'){flash(ch,true);showNext(ch);clearTimeout(demoT);demoT=setTimeout(()=>showNext(null),1300);beep(660,.05);return;}
  if(screen==='game'&&ag){ag.onChar(ch);return;}
  if(screen!=='play'||!game||game.locked)return;
  if(game.kind==='race'&&!game.go)return;
  const text=curText(),exp=text[game.pos];
  if(!game.start)game.start=performance.now();
  if(ch===exp){
    game.chars++;game.pos++;
    if(game.kind==='race')game.times.push(performance.now()-game.goAt);
    flash(ch,true);beep(720,.05);updateTarget();updateWpm();if(game.online)onlineProgress();
    if(game.pos>=text.length){itemDone();return;}
    showNext(text[game.pos]);
  }else{
    game.errs++;state.miss[exp]=(state.miss[exp]||0)+1;game.missLocal[exp]=(game.missLocal[exp]||0)+1;
    flash(ch,false);beep(200,.12,'triangle',.05);
    const line=$('#target').firstChild,cur=line&&line.children[game.pos];
    if(cur){cur.classList.remove('shake');void cur.offsetWidth;cur.classList.add('shake','bad');setTimeout(()=>cur.classList.remove('bad'),260);}
  }
}
function itemDone(){
  showNext(null);game.locked=true;
  if(game.kind==='race'){if(game.online)finishOnline();else if(game.timed)finishTimed();else finishRace();return;}
  if(game.items[game.i].say)say(game.items[game.i].t);
  beep(880,.08);setTimeout(()=>beep(1175,.12),90);
  setTimeout(()=>{if(!game||game.kind!=='lesson')return;game.locked=false;game.i++;if(game.i>=game.items.length)finishLesson();else renderItem();},650);
}
function finishLesson(){
  clearInterval(wpmTimer);
  const secs=(performance.now()-game.start)/1000,acc=game.chars/Math.max(1,game.chars+game.errs),stars=starsOf(acc),wpm=wpmOf(game.chars,secs);
  const key=game.unit+':'+game.step;
  const firstTime=!state.best[key];
  state.best[key]=Math.max(state.best[key]||0,stars);
  const prev=state.bestWpm[key]||0,newWpm=wpm>prev&&acc>=.85;if(newWpm)state.bestWpm[key]=wpm;
  record({unit:game.unit,step:game.step,acc,chars:game.chars,errs:game.errs,secs,wpm});
  const titles={3:'Giỏi quá!',2:'Tốt lắm!',1:'Em làm xong rồi!'};
  const subs={3:'Ngón tay nào cũng làm đúng việc của mình.',2:'Còn vài chữ nhầm, chơi lại một lần nữa là thuộc.',1:'Gõ chậm lại một chút, nhìn ngón tay sáng trên màn hình để gõ cho đúng.'};
  let sub=subs[stars];if(newWpm&&prev)sub+=' Kỷ lục tốc độ mới ở bài này: '+wpm+' WPM (lần trước '+prev+').';
  const stg=stageOf(game.unit);if(firstTime&&stg){const [d,n]=stageDone(stg);if(d===n)sub+=' Em đã hoàn thành chặng '+stg.name+'!';}
  const u=game.unit,s=game.step,i=FLAT.findIndex(x=>x.u===u&&x.s===s),nx0=i>=0&&i<FLAT.length-1?FLAT[i+1]:null,nx=nx0&&stageUnlocked(stageOf(nx0.u))?nx0:null;
  showResults({stars,title:titles[stars],sub,acc,miss:game.missLocal,
    stats:[[wpm,'WPM'],[Math.round(acc*100)+'%','gõ đúng'],[game.chars,'chữ cái'],[fmtTime(secs),'thời gian']],
    again:()=>startLesson(u,s),againLabel:'Chơi lại (đề mới)',next:nx?()=>startLesson(nx.u,nx.s):null});
}

/* ================= Race ================= */
function startRace(tid){guardStart(()=>{
  stopAll();
  const tr=TRACKS[tid],g=state.ghosts[tid];
  const text=tr.timed?streamText():tr.gen();
  game={kind:'race',unit:'race',step:tid,adv:!!tr.adv,text,pos:0,errs:0,chars:0,start:0,times:[],missLocal:{},go:false,locked:false,timed:tr.timed||0};
  if(tr.timed){game.gw=g&&g.wpm?g.wpm:6;game.real=!!(g&&g.wpm);}
  else{game.gh=g&&g.len?g:{len:20,times:Array.from({length:20},(_,i)=>(i+1)*1500),total:30000,wpm:8};game.real=!!(g&&g.len);}
  show('play');syncToggles();$('#pic').hidden=true;$('#race').hidden=false;$('#dots').innerHTML='';
  $$('#race .lane.static').forEach(x=>x.hidden=false);$('#olanes').hidden=true;
  $('#race-timer').hidden=!tr.timed;if(tr.timed)$('#race-timer').textContent=fmtClock(tr.timed);
  $('#me').textContent=state.avatar;$('#gh').textContent='👻';
  $('#gh-name').textContent=game.real?'Bóng ma '+(tr.timed?game.gw:g.wpm)+' WPM (kỷ lục của em)':'Bóng ma tập sự';
  startWpm();renderTarget(text,true);showNext(null);setRunners(0,0);countdown();
});}
function setRunners(a,b){$('#me').style.left='calc('+a+' * (100% - 84px))';$('#gh').style.left='calc('+b+' * (100% - 84px))';}
function countdown(){
  let n=3;const cd=$('#countdown');cd.hidden=false;cd.textContent=n;beep(520,.1);const gm=game;
  gm.cdTimer=setInterval(()=>{
    if(game!==gm){clearInterval(gm.cdTimer);return;}
    n--;
    if(n>0){cd.textContent=n;beep(520,.1);}
    else{clearInterval(gm.cdTimer);cd.textContent='Đi!';beep(880,.15);setTimeout(()=>cd.hidden=true,500);
      gm.go=true;gm.goAt=performance.now();gm.start=gm.goAt;showNext(gm.text[0]);loop();}
  },800);
}
function ghostProgress(el){
  const g=game.gh,e=el*g.len/game.text.length,t=g.times;let i=0;while(i<t.length&&t[i]<=e)i++;
  if(i>=t.length)return 1;const prev=i?t[i-1]:0;
  return Math.min(1,(i+(e-prev)/Math.max(1,t[i]-prev))/g.len);
}
function loop(){
  if(!game||game.kind!=='race'||game.done)return;
  const el=performance.now()-game.goAt;
  if(game.timed){
    const T=game.timed*1000,cps=game.gw*5/60,goal=Math.max(cps*game.timed,20)*1.25;
    setRunners(Math.min(1,game.chars/goal),Math.min(1,cps*el/1000/goal));
    $('#race-timer').textContent=fmtClock(Math.max(0,T-el)/1000);
    if(el>=T){finishTimed();return;}
  }else if(game.online)renderOnlineLanes();
  else setRunners(game.pos/game.text.length,ghostProgress(el));
  if(game.locked)return;game.raf=requestAnimationFrame(loop);
}
function finishRace(){
  cancelAnimationFrame(game.raf);clearInterval(wpmTimer);game.done=true;
  const total=game.times[game.times.length-1],gTotal=game.gh.total*game.text.length/game.gh.len,win=total<gTotal;
  const acc=game.chars/Math.max(1,game.chars+game.errs),stars=starsOf(acc),wpm=wpmOf(game.chars,total/1000);
  const g=state.ghosts[game.step];let rec=false;
  if(!g||!g.len||total/game.text.length<g.total/g.len){state.ghosts[game.step]={times:game.times.slice(),total,len:game.text.length,wpm};rec=true;}
  setRunners(1,ghostProgress(total));$('#wpm').textContent=wpm;
  record({unit:'race',step:game.step,acc,chars:game.chars,errs:game.errs,secs:total/1000,wpm});
  if(win){beep(880,.1);setTimeout(()=>beep(1175,.1),110);setTimeout(()=>beep(1568,.18),220);}
  const tid=game.step,miss=game.missLocal,chars=game.chars;
  setTimeout(()=>showResults({stars,acc,miss,
    title:win?'Em về trước bóng ma!':'Bóng ma về trước rồi',
    sub:rec?'Kỷ lục mới: '+wpm+' WPM. Lần sau bóng ma sẽ chạy nhanh bằng em hôm nay.':'Thử lại để đuổi kịp bóng ma nhé. Lượt sau sẽ là đề khác.',
    stats:[[wpm,'WPM'],[Math.round(acc*100)+'%','gõ đúng'],[chars,'chữ cái'],[fmtTime(total/1000),'thời gian']],
    again:()=>startRace(tid),againLabel:'Đua lượt mới'}),900);
}
function finishTimed(){
  if(!game||game.done)return;game.done=true;game.locked=true;cancelAnimationFrame(game.raf);clearInterval(wpmTimer);showNext(null);
  const secs=Math.min(game.timed,(performance.now()-game.goAt)/1000),wpm=wpmOf(game.chars,secs);
  const acc=game.chars/Math.max(1,game.chars+game.errs),stars=starsOf(acc);
  const ghostChars=Math.round(game.gw*5/60*secs),win=game.chars>ghostChars;
  const g=state.ghosts[game.step];let rec=false;
  if(wpm>0&&(!g||!g.wpm||wpm>g.wpm)){state.ghosts[game.step]={wpm};rec=true;}
  $('#wpm').textContent=wpm;
  record({unit:'race',step:game.step,acc,chars:game.chars,errs:game.errs,secs,wpm});
  if(win){beep(880,.1);setTimeout(()=>beep(1175,.1),110);setTimeout(()=>beep(1568,.18),220);}
  const tid=game.step,miss=game.missLocal,chars=game.chars;
  setTimeout(()=>showResults({stars,acc,miss,
    title:win?'Em gõ nhiều hơn bóng ma!':'Bóng ma gõ nhiều hơn rồi',
    sub:'Em gõ đúng '+chars+' chữ cái, bóng ma được '+ghostChars+'.'+(rec?' Kỷ lục mới: '+wpm+' WPM.':''),
    stats:[[wpm,'WPM'],[Math.round(acc*100)+'%','gõ đúng'],[chars,'chữ cái'],[fmtTime(secs),'thời gian']],
    again:()=>startRace(tid),againLabel:'Đua lượt mới'}),700);
}

/* ================= Games ================= */
function hud(html){const h=$('#hud');if(h._last!==html){h.innerHTML=html;h._last=html;}}
const stat=(v,l)=>'<span class="stat"><b>'+v+'</b><span>'+l+'</span></span>';
function startGame(gid,lid){guardStart(()=>{
  stopAll();show('game');syncToggles();
  $('#g-title').textContent=GAMES[gid].name+': '+GAMES[gid].levels[lid].name;
  const st=$('#stage');st.className='stage';st.innerHTML='';hud('');
  ag=gid==='bubble'?makeBubble(lid):gid==='frog'?makeFrog(lid):makeQuiz(lid);
});}
function gameMiss(g,exp,ch){g.errs++;if(exp){g.missLocal[exp]=(g.missLocal[exp]||0)+1;state.miss[exp]=(state.miss[exp]||0)+1;}flash(ch,false);beep(200,.1,'triangle',.05);}
function endGame(g,r){
  g.over=true;if(g.stop)g.stop();
  record({unit:'game',step:g.gid+':'+g.level,acc:r.acc,chars:g.chars,errs:g.errs,secs:r.secs,wpm:r.wpm});
  const gid=g.gid,lid=g.level;
  setTimeout(()=>showResults(Object.assign({again:()=>startGame(gid,lid),againLabel:'Chơi lại'},r)),600);
}
function makeBubble(level){
  const L=GAMES.bubble.levels[level],stage=$('#stage');stage.classList.add('bubbles');
  const g={gid:'bubble',level,list:[],score:0,errs:0,chars:0,hearts:5,t0:performance.now(),last:performance.now(),nextSpawn:0,dur:60000,missLocal:{},target:null,over:false};
  function spawn(){
    const used=new Set(g.list.map(b=>b.ch)),pool=L.keys.split('').filter(c=>!used.has(c));if(!pool.length)return;
    const ch=rand(pool),el=document.createElement('div');el.className='bubble';el.textContent=ch;
    el.style.setProperty('--fc','var(--c-'+FTYPE[FINGER[ch]]+')');el.style.left=(10+Math.random()*80)+'%';el.style.setProperty('--y','74px');
    stage.appendChild(el);g.list.push({ch,el,y:-74});
  }
  function pop(b){g.list.splice(g.list.indexOf(b),1);b.el.classList.add('pop');setTimeout(()=>b.el.remove(),280);}
  g.onChar=ch=>{
    if(g.over)return;const b=g.list.find(x=>x.ch===ch);
    if(b){pop(b);g.score++;g.chars++;flash(ch,true);beep(780,.06);}else gameMiss(g,g.target&&g.target.ch,ch);
  };
  g.stop=()=>{g.over=true;cancelAnimationFrame(g.raf);};
  function tick(now){
    if(g.over)return;const dt=Math.min(.05,(now-g.last)/1000);g.last=now;const el=now-g.t0,k=Math.min(1,el/g.dur);
    if(now>=g.nextSpawn){spawn();g.nextSpawn=now+(1800-900*k);}
    const sp=38+45*k,h=stage.clientHeight;
    for(const b of g.list.slice()){b.y+=sp*dt;b.el.style.setProperty('--y',(-b.y)+'px');
      if(b.y>h+10){g.list.splice(g.list.indexOf(b),1);b.el.remove();g.hearts--;beep(160,.15,'triangle',.05);}}
    const top=g.list.reduce((a,b)=>!a||b.y>a.y?b:a,null);
    if(top!==g.target){if(g.target)g.target.el.classList.remove('target');g.target=top;if(top){top.el.classList.add('target');showNext(top.ch);}else showNext(null);}
    hud(stat(g.score,'bóng')+stat('❤️'.repeat(Math.max(0,g.hearts))||'0','')+stat(Math.ceil((g.dur-el)/1000),'giây'));
    if(el>=g.dur||g.hearts<=0){
      const secs=el/1000,acc=g.chars/Math.max(1,g.chars+g.errs),key='bubble:'+level,prev=state.gbest[key];
      const rec=prev==null||g.score>prev;if(rec)state.gbest[key]=g.score;
      g.list.forEach(b=>b.el.remove());showNext(null);
      endGame(g,{stars:starsOf(acc),acc,secs,wpm:wpmOf(g.chars,secs),miss:g.missLocal,
        title:'Em làm vỡ '+g.score+' bong bóng!',
        sub:(g.hearts<=0?'Bong bóng bay mất nhiều quá. Nhìn bóng có viền sáng, đó là bóng sắp bay mất.':'Hết giờ!')+(rec&&prev!=null?' Kỷ lục mới (lần trước '+prev+').':''),
        stats:[[g.score,'bong bóng'],[Math.round(acc*100)+'%','gõ đúng'],[wpmOf(g.chars,secs),'WPM']]});
      return;
    }
    g.raf=requestAnimationFrame(tick);
  }
  g.raf=requestAnimationFrame(tick);
  return g;
}
function makeFrog(level){
  const stage=$('#stage');stage.classList.add('pond');
  const texts=level==='let'?Array.from({length:10},()=>rand(ALL.split(''))):pick(level==='w3'?byLen(DICT,3,3):byLen(DICT,4,5),10).map(x=>x.t);
  const X0=190,GAP=165;const px=i=>X0+i*GAP,py=i=>i%2?36:64;
  const world=document.createElement('div');world.className='world';stage.appendChild(world);
  const b1=document.createElement('div');b1.className='bank';b1.style.left='0';b1.style.width='110px';world.appendChild(b1);
  const endX=px(texts.length)-20;const b2=document.createElement('div');b2.className='bank';b2.style.left=endX+'px';b2.style.width='600px';world.appendChild(b2);
  const pads=texts.map((t,i)=>{const p=document.createElement('div');p.className='pad';p.style.left=px(i)+'px';p.style.top=py(i)+'%';
    [...t].forEach(c=>{const s=document.createElement('span');s.className='ch';s.textContent=c;p.appendChild(s);});world.appendChild(p);return p;});
  const frog=document.createElement('div');frog.className='frog';frog.textContent='🐸';frog.style.left='60px';frog.style.top='50%';world.appendChild(frog);
  const g={gid:'frog',level,texts,idx:-1,pos:0,errs:0,chars:0,start:0,missLocal:{},over:false};
  function cam(x){world.style.transform='translateX('+Math.min(0,stage.clientWidth*.28-x)+'px)';}
  function paint(){const p=pads[g.idx+1];if(!p)return;[...p.children].forEach((s,k)=>{s.classList.toggle('done',k<g.pos);s.classList.toggle('cur',k===g.pos);
    if(k===g.pos)s.style.setProperty('--fc','var(--c-'+FTYPE[FINGER[texts[g.idx+1][k]]]+')');});}
  function activate(){pads.forEach(p=>p.classList.remove('active'));const p=pads[g.idx+1];if(p){p.classList.add('active');paint();showNext(texts[g.idx+1][0]);}}
  function hop(x,y){frog.classList.remove('hop');void frog.offsetWidth;frog.classList.add('hop');frog.style.left=x+'px';frog.style.top=y;cam(x);}
  g.onChar=ch=>{
    if(g.over||g.idx+1>=texts.length)return;if(!g.start)g.start=performance.now();
    const t=texts[g.idx+1],exp=t[g.pos];
    if(ch===exp){g.chars++;g.pos++;flash(ch,true);beep(720,.05);paint();
      if(g.pos>=t.length){g.idx++;g.pos=0;showNext(null);hop(px(g.idx),py(g.idx)+'%');beep(990,.08);
        if(g.idx>=texts.length-1){setTimeout(()=>{hop(endX+80,'50%');finish();},420);}else setTimeout(activate,250);}
      else showNext(t[g.pos]);
    }else{gameMiss(g,exp,ch);const p=pads[g.idx+1];p.classList.remove('shake');void p.offsetWidth;p.classList.add('shake');}
    hudUpd();
  };
  function hudUpd(){hud(stat(Math.max(0,g.idx+1)+'/'+texts.length,'lá sen')+stat(g.start?Math.round((performance.now()-g.start)/1000):0,'giây'));}
  g.tick=setInterval(()=>{if(!g.over)hudUpd();},500);
  g.stop=()=>{g.over=true;clearInterval(g.tick);};
  function finish(){
    const secs=(performance.now()-g.start)/1000,acc=g.chars/Math.max(1,g.chars+g.errs),key='frog:'+level,prev=state.gbest[key],t=Math.round(secs);
    const rec=prev==null||t<prev;if(rec)state.gbest[key]=t;
    beep(880,.1);setTimeout(()=>beep(1175,.1),110);setTimeout(()=>beep(1568,.18),220);
    endGame(g,{stars:starsOf(acc),acc,secs,wpm:wpmOf(g.chars,secs),miss:g.missLocal,title:'Ếch đã qua sông!',
      sub:'Em đưa ếch qua sông trong '+fmtTime(secs)+'.'+(rec&&prev!=null?' Nhanh hơn lần trước ('+prev+' giây)!':''),
      stats:[[fmtTime(secs),'thời gian'],[wpmOf(g.chars,secs),'WPM'],[Math.round(acc*100)+'%','gõ đúng']]});
  }
  cam(60);activate();hudUpd();
  return g;
}
function makeQuiz(level){
  const stage=$('#stage');stage.classList.add('quiz');
  const pool=level==='w3'?PICS.filter(w=>w[0].length===3):level==='w45'?PICS.filter(w=>w[0].length>=4&&w[0].length<=5):PICS;
  const rounds=shuffle(pool).slice(0,10);
  stage.innerHTML='<div class="qpic"></div><div class="qvi"></div><div class="slots"></div><button class="chip qsay" type="button">🔈 Nghe từ</button>';
  const g={gid:'quiz',level,rounds,r:0,pos:0,errs:0,chars:0,start:0,clean:0,roundErr:false,missLocal:{},over:false,locked:false};
  const slots=()=>[...stage.querySelectorAll('.slot')];
  stage.querySelector('.qsay').addEventListener('click',e=>{e.currentTarget.blur();const w=g.rounds[g.r];if(w){const s=state.speak;state.speak=true;say(w[0]);state.speak=s;}});
  function round(){
    const w=g.rounds[g.r];g.pos=0;g.roundErr=false;g.locked=false;
    stage.querySelector('.qpic').textContent=w[1];stage.querySelector('.qvi').textContent=w[2];
    const sl=stage.querySelector('.slots');sl.innerHTML='';[...w[0]].forEach((c,k)=>{const d=document.createElement('div');d.className='slot'+(k===0?' cur':'');sl.appendChild(d);});
    showNext(null);hudUpd();
  }
  function hudUpd(){hud(stat((g.r+1)+'/'+g.rounds.length,'từ')+stat(g.clean,'⭐ không cần gợi ý'));}
  g.onChar=ch=>{
    if(g.over||g.locked)return;if(!g.start)g.start=performance.now();
    const w=g.rounds[g.r][0],exp=w[g.pos],s=slots();
    if(ch===exp){g.chars++;flash(ch,true);beep(720,.05);const d=s[g.pos];d.textContent=exp;d.className='slot ok';g.pos++;showNext(null);
      if(g.pos>=w.length){g.locked=true;say(w);if(!g.roundErr)g.clean++;beep(880,.08);setTimeout(()=>beep(1175,.12),90);hudUpd();
        setTimeout(()=>{if(g.over)return;g.r++;if(g.r>=g.rounds.length)finish();else round();},1100);}
      else s[g.pos].classList.add('cur');
    }else{gameMiss(g,exp,ch);g.roundErr=true;const d=s[g.pos];d.textContent=exp;d.classList.add('hint');showNext(exp);}
  };
  g.stop=()=>{g.over=true;};
  function finish(){
    const secs=(performance.now()-g.start)/1000,acc=g.chars/Math.max(1,g.chars+g.errs),key='quiz:'+level,prev=state.gbest[key];
    const rec=prev==null||g.clean>prev;if(rec)state.gbest[key]=g.clean;
    const n=g.rounds.length;
    endGame(g,{stars:g.clean>=n*.9?3:g.clean>=n*.6?2:1,acc,secs,wpm:wpmOf(g.chars,secs),miss:g.missLocal,
      title:'Em đoán đúng '+g.clean+'/'+n+' từ mà không cần gợi ý',sub:g.clean===n?'Không sai chữ nào. Quá giỏi!':'Những từ cần gợi ý, lần sau em sẽ nhớ hơn.',
      stats:[[g.clean+'/'+n,'không cần gợi ý'],[Math.round(acc*100)+'%','gõ đúng'],[fmtTime(secs),'thời gian']]});
  }
  round();
  return g;
}

/* ================= Results ================= */
let resAgain=null,resNext=null;
function showResults(r){
  $('#r-stars').innerHTML=[1,2,3].map(n=>'<span class="'+(n<=r.stars?'':'off')+'">⭐</span>').join('');
  $('#r-title').textContent=r.title;$('#r-sub').textContent=r.sub||'';
  $('#r-stats').innerHTML=r.stats.map(([v,l])=>'<div><b>'+esc(v)+'</b><span>'+esc(l)+'</span></div>').join('');
  const miss=Object.entries(r.miss||{}).sort((a,b)=>b[1]-a[1]).slice(0,5);
  $('#r-miss').innerHTML=miss.length?'Chữ hay nhầm: '+miss.map(([k])=>'<span class="k">'+esc(k===' '?'cách':k)+'</span>').join(''):'';
  resAgain=r.again;resNext=r.next||null;$('#r-next').hidden=!resNext;
  $('#r-again').innerHTML=esc(r.againLabel||'Chơi lại')+' <kbd>Space</kbd>';
  $('#r-next').innerHTML='Bài tiếp theo <kbd>Enter</kbd>';
  $('#r-home').innerHTML='Về trang chính <kbd>'+(resNext?'Esc':'Enter')+'</kbd>';
  resultsAt=performance.now();
  stopAll();show('results');
}
$('#r-again').addEventListener('click',()=>{if(resAgain)resAgain();});
$('#r-next').addEventListener('click',()=>{if(resNext)resNext();});
$('#r-home').addEventListener('click',()=>show('home'));

/* ================= Parent ================= */
function renderParent(){
  const tm=todayMin();$('#p-today').textContent=Math.round(tm)+' phút';
  $('#p-limit-note').textContent='Giới hạn đang đặt: '+state.limit+' phút mỗi ngày.';
  const wk=Date.now()-7*864e5,ws=state.sessions.filter(s=>s.t>=wk);
  $('#p-week').textContent=ws.length+' buổi';
  $('#p-week-note').textContent='Tổng '+Math.round(ws.reduce((a,s)=>a+s.secs/60,0))+' phút luyện tập.';
  const groups=STAGES.map(S=>[S.units,S.icon+' Chặng '+S.name+' ('+stageDone(S).join('/')+' bài)']).concat([[['race'],'Đua với bóng ma'],[['game'],'Trò chơi']]);
  $('#p-acc').innerHTML=groups.map(([m,n])=>{const ss=state.sessions.filter(s=>m.includes(s.unit));
    const v=ss.length?Math.round(ss.reduce((a,s)=>a+s.acc,0)/ss.length*100)+'%':'chưa chơi';
    return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:4px 0"><span>'+esc(n)+'</span><b>'+v+'</b></div>';}).join('');
  const rec=state.sessions.slice(-5);
  $('#p-speed').textContent=rec.length?Math.round(rec.reduce((a,s)=>a+(s.wpm||0),0)/rec.length)+' WPM':'Chưa có dữ liệu';
  $('#p-done').textContent='Đã xong '+FLAT.filter(x=>state.best[x.u+':'+x.s]).length+' trên '+FLAT.length+' bài học.';
  $('#p-ghosts').innerHTML=Object.entries(TRACKS).map(([id,t])=>{const g=state.ghosts[id];
    return '<div class="ghost-row"><span>'+esc(t.name)+'</span><span><b>'+(g&&g.wpm?g.wpm+' WPM':'Tập sự')+'</b>'+(g?' <button type="button" data-ghost="'+id+'">Đặt lại</button>':'')+'</span></div>';}).join('');
  $$('#p-ghosts [data-ghost]').forEach(b=>b.addEventListener('click',()=>{delete state.ghosts[b.dataset.ghost];save();renderParent();}));
  const heat=buildKB($('#kb-heat'),true,true);const vals=Object.values(state.miss),mx=vals.length?Math.max(...vals):0;
  Object.entries(state.miss).forEach(([ch,c])=>{const el=heat[baseOf(ch)];if(!el||!c)return;const tot=(+el.dataset.c||0)+c;el.dataset.c=tot;
    const p=Math.round(15+70*Math.min(1,tot/mx));el.style.background='color-mix(in srgb, var(--bad) '+p+'%, var(--key))';el.style.color=p>50?'#fff':'';el.title=tot+' lần nhầm';});
  const top=Object.entries(state.miss).sort((a,b)=>b[1]-a[1]).slice(0,5);
  $('#p-miss-note').textContent=top.length?'Nhầm nhiều nhất: '+top.map(([k,c])=>(k===' '?'phím cách':k)+' ('+c+')').join(', ')+'. Phím càng đỏ, bé càng hay nhầm.':'Chưa có lần gõ nhầm nào được ghi lại.';
  const h=state.sessions.slice(-10).reverse();
  $('#p-hist').innerHTML=h.length?h.map(s=>{const d=new Date(s.t);
    return '<tr><td>'+d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})+'</td><td>'+esc(modeName(s))+'</td><td>'+Math.round(s.acc*100)+'%</td><td>'+(s.wpm||0)+'</td><td>'+fmtTime(s.secs)+'</td></tr>';}).join(''):'<tr><td colspan="5">Chưa có buổi nào.</td></tr>';
  $('#set-unlock').checked=!!state.unlockAll;setSync(syncMsg);
  $('#set-limit').value=String(state.limit);$('#set-sound').checked=state.sound;$('#set-speak').checked=state.speak;
}
function resetGhosts(){if(confirm('Đặt lại tốc độ của tất cả bóng ma về bóng ma tập sự?')){state.ghosts={};save();if(screen==='parent')renderParent();else renderHome();}}
$('#ghost-reset-all').addEventListener('click',resetGhosts);
$('#ghost-reset-home').addEventListener('click',resetGhosts);
$('#set-limit').addEventListener('change',e=>{state.limit=+e.target.value;save();renderParent();});
$('#set-sound').addEventListener('change',e=>{state.sound=e.target.checked;save();syncToggles();});
$('#set-speak').addEventListener('change',e=>{state.speak=e.target.checked;save();syncToggles();});
$('#set-unlock').addEventListener('change',e=>{state.unlockAll=e.target.checked;save();stageSel=null;});
$('#reset').addEventListener('click',()=>{if(confirm('Xoá toàn bộ lịch sử, kỷ lục và bóng ma của bé này?')){const keep={avatar:state.avatar,nick:state.nick,sound:state.sound,speak:state.speak,limit:state.limit,kbFull:state.kbFull,unlockAll:state.unlockAll};state=Object.assign(clone(DEFAULTS),keep);save();renderParent();}});

/* ================= Đua với các bạn (máy chủ điều khiển) ================= */
let room=null,online=null,publicRaces=[],pendingJoin=null,progT=0,lobbyTimer=null;
const TEAM={A:{name:'Đội Đỏ',ico:'🔴',col:'#e5484d'},B:{name:'Đội Xanh',ico:'🔵',col:'#2b7fd0'}};
const STAGE_BY_ID=id=>STAGES.find(s=>s.id===id)||STAGES[0];
const myNick=()=>(state.nick||'').trim()||'Bạn mới';
function rsend(m){if(room&&room.send&&room.connected()){room.send(m);return true;}raceNote('Đang kết nối máy chủ, em thử lại sau vài giây nhé.');return false;}
function raceNote(t){const el=$('#o-avail');if(el)el.textContent=t;const s=$('#o-status');if(screen==='online'&&s&&t)s.textContent=t;}
const me4=()=>({stage:curStage().id,nick:myNick(),av:state.avatar});
function raceQuick(mode){guardStart(()=>{if(rsend(Object.assign({t:'race.quick',mode},me4())))raceNote('Đang tìm bạn đua…');});}
let lastBotLevel=1;
function raceBot(level){lastBotLevel=level;guardStart(()=>{rsend(Object.assign({t:'race.bot',level},me4()));});}
function raceCreate(mode){guardStart(()=>{rsend(Object.assign({t:'race.create',mode},me4()));});}
function raceJoinId(id){guardStart(()=>{rsend(Object.assign({t:'race.join',id},me4()));});}
function raceJoinCode(code){guardStart(()=>{rsend(Object.assign({t:'race.join',code},me4()));});}
function setHash(h){try{if(h)location.hash=h;else history.replaceState(null,'',location.pathname+location.search);}catch(e){try{location.hash='';}catch(_){}}}
function leaveRoomSilently(){if(online&&room&&room.connected())room.send({t:'race.leave'});online=null;setHash('');clearInterval(lobbyTimer);}
function leaveRoom(){stopAll();leaveRoomSilently();show('home');setTab('race');}
function setMyPresence(){}
function clearPresence(){}
function showOnline(){show('online');renderOnline();clearInterval(lobbyTimer);lobbyTimer=setInterval(()=>{if(screen==='online')renderOnline();else clearInterval(lobbyTimer);},500);}
function onlineAvailable(){
  const ok=!!(room&&room.connected());
  ['o-create','o-join','o-join-code','o-mode'].forEach(id=>{const el=$('#'+id);if(el)el.disabled=!ok;});
  $$('[data-quick],[data-bot]').forEach(b=>b.disabled=!ok);
  if(!$('#o-avail').dataset.keep)$('#o-avail').textContent=ok?'':'Đang kết nối máy chủ… Trong lúc chờ, em vẫn đua với bóng ma được.';
}
function hashJoin(){
  const m=/^#dua-([a-z0-9]{5})$/.exec(location.hash||'');
  if(!m||!curPid)return;
  if(online&&online.code===m[1])return;
  if(room&&room.connected())raceJoinCode(m[1]);else pendingJoin=m[1];
}

function onRaceMsg(m){
  if(m.t==='races'){publicRaces=Array.isArray(m.list)?m.list:[];publicRaces.at=performance.now();if(screen==='home')renderPublicRaces();return;}
  if(m.t==='race.error'){$('#o-avail').textContent=m.text;if(screen==='online')$('#o-status').textContent=m.text;return;}
  if(m.t==='race.left'){online=null;return;}
  if(m.t!=='race'||!m.race)return;
  const r=m.race;r.at=performance.now();
  const prev=online;online=r;
  if(r.code)setHash('dua-'+r.code);else if(prev&&prev.code)setHash('');
  if((r.status==='countdown'||r.status==='racing')&&!(game&&game.online&&game.raceId===r.id)&&!(prev&&prev.id===r.id&&prev.myDone)){startOnlineRace(r);return;}
  if(prev&&prev.id===r.id)r.myDone=prev.myDone;
  if(game&&game.online&&game.raceId===r.id){
    if(r.status==='done'){stopAll();showOnline();return;}
    return;
  }
  if(screen!=='online'&&screen!=='play')showOnline();else if(screen==='online')renderOnline();
}

function startOnlineRace(r){
  stopAll();
  game={kind:'race',online:true,raceId:r.id,unit:'race',step:'online',adv:r.stage==='chay',text:r.text,pos:0,errs:0,chars:0,start:0,times:[],missLocal:{},go:false,locked:false,timed:0};
  show('play');syncToggles();$('#pic').hidden=true;$('#race').hidden=false;$('#dots').innerHTML='';$('#race-timer').hidden=true;
  $$('#race .lane.static').forEach(x=>x.hidden=true);$('#olanes').hidden=false;$('#olanes').innerHTML='';
  startWpm();renderTarget(r.text,true);showNext(null);renderOnlineLanes();
  const goAt=performance.now()+(r.status==='countdown'?r.startIn:0),cd=$('#countdown'),gm=game;let last=null;
  const tickCd=()=>{
    if(game!==gm)return;
    const left=goAt-performance.now();
    if(left>0){const n=Math.ceil(left/1000);if(n!==last){last=n;cd.hidden=false;cd.textContent=n;beep(520,.1);}gm.cdTimer=setTimeout(tickCd,50);return;}
    cd.textContent='Đi!';beep(880,.15);setTimeout(()=>{cd.hidden=true;},500);
    gm.go=true;gm.goAt=performance.now()-(r.status==='racing'?r.elapsed:0);gm.start=gm.goAt;showNext(gm.text[0]);loop();
  };
  tickCd();
}
function onlineProgress(){
  if(!game||!game.online)return;const now=performance.now();
  if(now-progT>120||game.pos>=game.text.length){progT=now;room&&room.send({t:'race.prog',pos:game.pos});}
}
function racePlayers(){
  if(!online)return [];
  return online.players.map(p=>p.me&&game&&game.online&&game.raceId===online.id?Object.assign({},p,{pos:Math.max(p.pos,game.pos)}):p);
}
function renderOnlineLanes(){
  if(!game||!game.online||!online)return;
  const box=$('#olanes'),len=game.text.length||1,seen=new Set();
  racePlayers().forEach(p=>{
    seen.add(p.id);let el=box.querySelector('[data-k="'+p.id+'"]');
    if(!el){el=document.createElement('div');el.className='lane'+(p.team?' team-'+p.team:'')+(p.me?' melane':'');el.dataset.k=p.id;
      el.innerHTML='<span class="runner"><span class="rv"></span><span class="rn"></span></span>';box.appendChild(el);}
    const ru=el.firstChild,rv=ru.firstChild,rn=ru.lastChild,av=p.av||'🙂',nm=(p.nick||'Bạn')+(p.me?' (em)':'')+(p.done&&p.rank?' #'+p.rank:'');
    if(rv.textContent!==av)rv.textContent=av;if(rn.textContent!==nm)rn.textContent=nm;
    ru.style.left='calc('+Math.min(1,(p.done?len:p.pos)/len)+' * (100% - 84px))';el.classList.toggle('gone',!!p.left);
  });
  [...box.children].forEach(el=>{if(!seen.has(el.dataset.k))el.remove();});
}
function finishOnline(){
  cancelAnimationFrame(game.raf);clearInterval(wpmTimer);game.done=true;
  const total=game.times[game.times.length-1],acc=game.chars/Math.max(1,game.chars+game.errs),wpm=wpmOf(game.chars,total/1000);
  $('#wpm').textContent=wpm;
  if(room){room.send({t:'race.prog',pos:game.pos});room.send({t:'race.finish',errs:game.errs});}
  if(online)online.myDone=true;
  record({unit:'race',step:'online',acc,chars:game.chars,errs:game.errs,secs:total/1000,wpm});
  beep(880,.1);setTimeout(()=>beep(1175,.1),110);setTimeout(()=>beep(1568,.18),220);
  const rid=game.raceId;
  setTimeout(()=>{if(online&&online.id===rid&&screen==='play'){stopAll();showOnline();}},1100);
}

function fmtSec(ms){return (ms/1000).toFixed(1).replace('.',',')+' giây';}
function playerLine(p,r){
  const len=Math.max(1,r.text.length);
  if(r.status==='waiting')return p.bot?'Máy sẵn sàng':'Sẵn sàng';
  if(r.status==='countdown')return 'Chuẩn bị…';
  if(p.done&&p.ms!=null)return 'Về đích '+fmtSec(p.ms)+', '+Math.round(len/5/(p.ms/60000))+' WPM'+(r.teams&&p.points?', +'+p.points+' điểm':'');
  if(p.left)return 'Đã rời cuộc đua';
  return r.status==='done'?'Chạy được '+Math.round(p.pos/len*100)+'% đường'+(r.teams&&p.points?', +'+p.points+' điểm':''):'Đang gõ '+Math.round(p.pos/len*100)+'%';
}
function playerRow(p,r){
  const li=document.createElement('li');li.className='oplayer'+(p.me?' me':'')+(p.team?' team-'+p.team:'');
  const medal=p.rank===1?'🥇':p.rank===2?'🥈':p.rank===3?'🥉':p.rank?String(p.rank):'';
  const a=document.createElement('span');a.className='orank';a.textContent=r.status==='done'?medal:'';
  const av=document.createElement('span');av.className='oav';av.textContent=p.av||'🙂';
  const nm=document.createElement('span');nm.className='onick';nm.textContent=p.nick||'Bạn';
  if(p.me){const t=document.createElement('em');t.textContent=' (em)';nm.appendChild(t);}
  if(p.bot){const t=document.createElement('em');t.textContent=' máy';nm.appendChild(t);}
  const st=document.createElement('span');st.className='ostat';st.textContent=playerLine(p,r);
  li.append(a,av,nm,st);return li;
}
function emptyRow(){const li=document.createElement('li');li.className='oplayer empty';li.innerHTML='<span class="orank"></span><span class="oav">⏳</span><span class="onick">Đang chờ bạn…</span><span class="ostat"></span>';return li;}
function renderOnline(){
  const r=online;if(!r)return;
  const S=STAGE_BY_ID(r.stage),since=(performance.now()-(r.at||0));
  $('#o-mode-l').textContent=r.label;$('#o-stage-l').textContent=S.icon+' Khu '+S.name;
  $('#o-title').textContent=r.mode==='bot'?'Đua với máy':(r.isPublic?'Đua '+r.label:'Phòng riêng '+r.label);
  $('#o-share').hidden=!r.code;if(r.code){$('#o-code2').textContent=r.code.toUpperCase();}
  const humans=r.players.filter(p=>!p.bot).length,missing=r.cap-r.players.length;
  let st='';
  if(r.status==='waiting'){
    const fill=r.fillIn!=null?Math.max(0,Math.ceil((r.fillIn-since)/1000)):null;
    st='Còn thiếu '+missing+' bạn.'+(fill!=null?' Nếu chưa đủ người, máy sẽ vào chơi cùng sau '+fill+' giây.':' Gửi mã phòng cho bạn để cùng đua.');
  }else if(r.status==='countdown')st='Sắp bắt đầu!';
  else if(r.status==='racing'){const mine=r.players.find(p=>p.me);st=mine&&mine.done?'Em về đích rồi! Chờ các bạn khác về nốt…':'Các bạn đang đua…';}
  else{
    if(r.teams&&r.results){const w=r.results.winner;st=(w==='draw'?'Hai đội hoà nhau!':TEAM[w].ico+' '+TEAM[w].name+' thắng!')+' '+TEAM.A.name+' '+r.results.A+' điểm, '+TEAM.B.name+' '+r.results.B+' điểm. Về đích càng sớm, đội càng được nhiều điểm.';}
    else{const mine=r.players.find(p=>p.me);st=mine&&mine.rank===1?'Em về nhất! 🎉':mine&&mine.rank?'Em về thứ '+mine.rank+'. Cố lên lượt sau nhé!':'Cuộc đua đã kết thúc.';}
  }
  $('#o-status').textContent=st;
  const box=$('#o-teams');box.innerHTML='';box.classList.toggle('two',!!r.teams);
  const sorted=list=>r.status==='done'?list.slice().sort((a,b)=>(a.rank||99)-(b.rank||99)):list;
  if(r.teams){
    ['A','B'].forEach(t=>{const col=document.createElement('div');col.className='teamcol team-'+t;
      const h=document.createElement('h2');h.textContent=TEAM[t].ico+' '+TEAM[t].name+(r.results?' – '+r.results[t]+' điểm':'');col.appendChild(h);
      const ol=document.createElement('ol');ol.className='oplayers';const ps=r.players.filter(p=>p.team===t);
      sorted(ps).forEach(p=>ol.appendChild(playerRow(p,r)));for(let i=ps.length;i<r.cap/2;i++)ol.appendChild(emptyRow());
      col.appendChild(ol);box.appendChild(col);});
  }else{
    const ol=document.createElement('ol');ol.className='oplayers';sorted(r.players).forEach(p=>ol.appendChild(playerRow(p,r)));
    for(let i=r.players.length;i<r.cap;i++)ol.appendChild(emptyRow());box.appendChild(ol);
  }
  $('#o-fill').hidden=!(r.status==='waiting'&&(r.age||0)+since>=8000);
  $('#o-again').hidden=r.status!=='done';
  $('#o-again').innerHTML=(r.mode==='bot'?'Đua với máy lần nữa':'Đua tiếp '+esc(r.label))+' <kbd>Enter</kbd>';
}
function againRace(){
  const r=online;if(!r)return;
  if(r.mode==='bot'){raceBot(lastBotLevel);return;}
  if(r.isPublic)raceQuick(r.mode);else raceCreate(r.mode);
}
function fillRace(){if(online&&online.status==='waiting')rsend({t:'race.fill'});}

function renderPublicRaces(){
  const box=$('#pub-races');if(!box)return;
  const S=curStage();$('#rz-title').textContent='Đua với các bạn khu '+S.name+' '+S.icon;
  const since=performance.now()-(publicRaces.at||0);
  const list=publicRaces.filter(r=>r.stage===S.id);box.innerHTML='';
  if(!list.length){const li=document.createElement('li');li.className='pubrace none';li.textContent='Chưa có cuộc đua nào đang chờ ở khu '+S.name+'. Bấm 1 đấu 1, 3 đấu 3 hoặc 5 đấu 5 để mở cuộc đua mới, các bạn khác sẽ thấy và vào cùng.';box.appendChild(li);return;}
  list.forEach(r=>{
    const li=document.createElement('li');li.className='pubrace';
    const mode=document.createElement('b');mode.textContent=r.label;
    const avs=document.createElement('span');avs.className='pavs';
    for(let i=0;i<r.cap;i++){const s=document.createElement('span');s.className='slot'+(i<r.avs.length?' on':'');s.textContent=i<r.avs.length?r.avs[i]:'';avs.appendChild(s);}
    const need=document.createElement('span');need.className='need';need.textContent='Còn thiếu '+(r.cap-r.n)+' người';
    const b=document.createElement('button');b.type='button';b.className='chip go';b.textContent='Vào đua';b.addEventListener('click',()=>raceJoinId(r.id));
    li.append(mode,avs,need,b);box.appendChild(li);
  });
}

$$('[data-quick]').forEach(b=>b.addEventListener('click',()=>raceQuick(b.dataset.quick)));
$$('[data-bot]').forEach(b=>b.addEventListener('click',()=>raceBot(+b.dataset.bot)));
$('#o-create').addEventListener('click',()=>raceCreate($('#o-mode').value));
$('#o-join').addEventListener('click',()=>{
  const c=$('#o-join-code').value.trim().toLowerCase().replace(/[^a-z0-9]/g,'');
  if(c.length!==5){$('#o-avail').textContent='Mã phòng có 5 ký tự, ví dụ K7M2P.';return;}
  raceJoinCode(c);
});
$('#o-join-code').addEventListener('keydown',e=>{if(e.key==='Enter')$('#o-join').click();});
$('#o-leave').addEventListener('click',leaveRoom);
$('#o-home').addEventListener('click',leaveRoom);
$('#o-fill').addEventListener('click',e=>{e.currentTarget.blur();fillRace();});
$('#o-again').addEventListener('click',e=>{e.currentTarget.blur();againRace();});
window.addEventListener('hashchange',hashJoin);

/* ---- Kết nối thời gian thực tới máy chủ (ai đang online, phòng đua) ---- */
function createRoom(){
  let ws=null,mePeer=null,snap=Object.freeze([]),conn=false,closed=false,retry=0;const mine={},peerHs=[],connHs=[],msgHs=[];
  function connect(){
    ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws');
    ws.onopen=()=>{conn=true;retry=0;connHs.forEach(h=>h(true));if(Object.keys(mine).length)ws.send(JSON.stringify({t:'presence',patch:mine}));};
    ws.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(_){return;}
      if(m.t==='hello')mePeer=m.you;
      else if(m.t==='peers'&&Array.isArray(m.peers)){
        snap=Object.freeze(m.peers.map(p=>Object.freeze({peer:p.peer,by:null,isMe:p.peer===mePeer,sameTab:p.peer===mePeer,kind:'viewer',guest:false,presence:Object.freeze(p.presence||{}),updatedAt:p.updatedAt})));
        const ch={peers:snap,joined:[],left:[],updated:[]};peerHs.forEach(h=>h(ch));
      }else msgHs.forEach(h=>h(m));};
    ws.onclose=()=>{conn=false;connHs.forEach(h=>h(false));if(!closed)setTimeout(connect,Math.min(15000,500*Math.pow(2,retry++)));};
    ws.onerror=()=>{};
  }
  connect();
  return {
    presence(patch){for(const k in patch){if(patch[k]===null)delete mine[k];else mine[k]=patch[k];}
      if(ws&&ws.readyState===1)ws.send(JSON.stringify({t:'presence',patch}));return Promise.resolve();},
    peers:()=>snap,
    onPeers(h){peerHs.push(h);setTimeout(()=>h({peers:snap,joined:snap,left:[],updated:[]}),0);return ()=>{const i=peerHs.indexOf(h);if(i>=0)peerHs.splice(i,1);};},
    connected:()=>conn,
    onConnection(h){connHs.push(h);setTimeout(()=>h(conn),0);return ()=>{const i=connHs.indexOf(h);if(i>=0)connHs.splice(i,1);};},
    send(m){if(ws&&ws.readyState===1)ws.send(JSON.stringify(m));},
    onMsg(h){msgHs.push(h);},
    close(){closed=true;if(ws)ws.close();}
  };
}
function startRealtime(){
  if(room)return;room=createRoom();onlineAvailable();
  room.onPeers(()=>updateOnlineCount());
  room.onMsg(onRaceMsg);
  updateOnlineCount();lastPresKey='';updateLobbyPresence();
  room.onConnection(c=>{onlineAvailable();
    if(c){lastPresKey='';updateLobbyPresence();if(pendingJoin&&curPid){const pj=pendingJoin;pendingJoin=null;raceJoinCode(pj);}}
    else if(online){online=null;if(screen==='online'||(game&&game.online)){stopAll();show('home');setTab('race');$('#o-avail').textContent='Mất kết nối nên em đã rời cuộc đua. Em thử lại nhé.';}}});
}
function stopRealtime(){if(room){room.close();room=null;}online=null;updateOnlineCount();onlineAvailable();}

/* ================= Login (kid profiles) ================= */
let npAv='🐯';
function profileSummary(pid){
  const st=loadState(pid);const S=curStageOf(st);const all=FLAT.filter(x=>S.units.includes(x.u));
  return S.icon+' Chặng '+S.name+': '+all.filter(x=>st.best[x.u+':'+x.s]).length+'/'+all.length;
}
function renderLogin(){
  const box=$('#profiles');box.innerHTML='';
  profiles.list.forEach((p,i)=>{
    const b=document.createElement('button');b.type='button';b.className='profile'+(p.id===profiles.cur?' last':'');
    const av=document.createElement('span');av.className='pav';av.textContent=p.av||'🙂';
    const nm=document.createElement('span');nm.className='pnm';nm.textContent=p.nick||'Bé';
    const sm=document.createElement('span');sm.className='psm';sm.textContent=profileSummary(p.id);
    b.append(av,nm,sm);
    if(i<9){const k=document.createElement('kbd');k.textContent=String(i+1);b.appendChild(k);}
    b.addEventListener('click',()=>login(p.id));box.appendChild(b);
  });
  const add=document.createElement('button');add.type='button';add.className='profile add';
  add.innerHTML='<span class="pav">➕</span><span class="pnm">Thêm bạn mới</span><span class="psm">Mỗi bạn có tiến độ riêng</span>';
  add.addEventListener('click',openNewProfile);box.appendChild(add);
  $('#newprof').hidden=!!profiles.list.length&&$('#newprof').dataset.open!=='1';
  $('#l-hint').hidden=!profiles.list.length;
  setSync(syncMsg);
  const npa=$('#np-av');npa.querySelectorAll('.av').forEach(x=>x.remove());
  AVATARS.forEach(a=>{const b=document.createElement('button');b.type='button';b.className='av';b.textContent=a;b.setAttribute('aria-pressed',String(a===npAv));
    b.addEventListener('click',()=>{npAv=a;renderLogin();});npa.appendChild(b);});
}
function openNewProfile(){$('#newprof').dataset.open='1';$('#newprof').hidden=false;renderLogin();setTimeout(()=>$('#np-nick').focus(),0);}
function createProfile(){
  const nick=$('#np-nick').value.trim().slice(0,12);
  if(!nick){$('#np-nick').focus();$('#np-err').textContent='Em nhập biệt danh trước nhé.';return;}
  const id=newId();profiles.list.push({id,nick,av:npAv});
  writeJSON(K('p:'+id),Object.assign(clone(DEFAULTS),{nick,avatar:npAv,updatedAt:Date.now()}));
  saveProfiles();$('#np-nick').value='';$('#np-err').textContent='';$('#newprof').dataset.open='0';
  login(id);
}
function login(pid){
  stopAll();if(online)leaveRoomSilently();
  curPid=pid;profiles.cur=pid;writeJSON(K('profiles'),profiles);
  state=loadState(pid);const pe=profiles.list.find(x=>x.id===pid);
  if(pe){if(!state.nick)state.nick=pe.nick;state.avatar=pe.av||state.avatar;}
  stageSel=null;kbFullNow=null;syncToggles();renderWho();show('home');
  cloudPullState(pid);hashJoin();
}
function renderWho(){const w=$('#who');if(!curPid){w.hidden=true;return;}w.hidden=false;$('#who-av').textContent=state.avatar;$('#who-nm').textContent=state.nick||'Bé';}
$('#np-ok').addEventListener('click',createProfile);
$('#np-cancel').addEventListener('click',()=>{$('#newprof').dataset.open='0';$('#np-err').textContent='';renderLogin();});
$('#np-nick').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();createProfile();}});
$('#who').addEventListener('click',()=>{stopAll();if(online)leaveRoomSilently();show('login');});
$('#del-profile').addEventListener('click',()=>{
  if(!curPid)return;const pe=profiles.list.find(x=>x.id===curPid);
  if(!confirm('Xoá hồ sơ “'+(pe?pe.nick:'')+'” cùng toàn bộ tiến độ của bé này?'))return;
  profiles.list=profiles.list.filter(x=>x.id!==curPid);try{localStorage.removeItem(K('p:'+curPid));}catch(e){}
  if(db){const pid=curPid;sDoc(pid).delete().catch(()=>{});}
  profiles.cur=profiles.list[0]?profiles.list[0].id:null;curPid=null;saveProfiles();renderWho();show('login');
});

/* ================= Stage locking ================= */
function stageDoneFor(st,S){const all=FLAT.filter(x=>S.units.includes(x.u));return [all.filter(x=>st.best[x.u+':'+x.s]).length,all.length];}
function stageUnlockedFor(st,S){const i=STAGES.indexOf(S);if(i<=0||st.unlockAll)return true;const [d,n]=stageDoneFor(st,STAGES[i-1]);return d>=n;}
function curStageOf(st){
  const open=STAGES.filter(S=>stageUnlockedFor(st,S));
  return open.find(S=>{const [d,n]=stageDoneFor(st,S);return d<n;})||open[open.length-1];
}
const stageUnlocked=S=>stageUnlockedFor(state,S);
const curStage=()=>curStageOf(state);
function nextLesson(){
  const S=curStage();
  const inStage=FLAT.find(x=>S.units.includes(x.u)&&!state.best[x.u+':'+x.s]);
  if(inStage)return inStage;
  return FLAT.find(x=>{const s=stageOf(x.u);return s&&stageUnlocked(s)&&!state.best[x.u+':'+x.s];})||null;
}
function continueLearning(){const n=nextLesson();if(n)startLesson(n.u,n.s);}

/* ================= Lobby presence: who is online ================= */
let lastPresKey='';
function updateLobbyPresence(){
  if(!room||!curPid)return;
  const gS=game&&game.kind==='lesson'?stageOf(game.unit):null,vS=screen==='home'&&stageSel?STAGES.find(x=>x.id===stageSel):null;
  const S=gS||(vS&&stageUnlocked(vS)?vS:curStage()),p={nick:myNick(),av:state.avatar,stage:S?S.id:'bo',where:screen};
  const k=JSON.stringify(p);if(k===lastPresKey)return;lastPresKey=k;
  room.presence(p).catch(()=>{});
}
function onlinePeople(){
  if(!room)return [];
  return room.peers().filter(p=>p.presence&&typeof p.presence.stage==='string');
}
function updateOnlineCount(){
  const pill=$('#online-pill');if(!room){pill.hidden=true;$('#onstrip').hidden=true;return;}
  pill.hidden=false;const ppl=onlinePeople(),n=ppl.length;$('#online-n').textContent=n;
  if(screen==='world')renderWorldList();
  renderOnlineStrip(ppl);
}
function renderOnlineStrip(ppl){
  const box=$('#onstrip');if(!room||!ppl.length){box.hidden=true;return;}
  box.hidden=false;$('#os-n').textContent=ppl.length;
  const c={bo:0,di:0,chay:0};ppl.forEach(p=>{c[p.presence.stage||'bo']++;});
  $('#os-zones').textContent='🐢 Bò '+c.bo+'   🚶 Đi '+c.di+'   🏃 Chạy '+c.chay;
  const avs=$('#os-avs');avs.innerHTML='';
  ppl.slice(0,16).forEach(p=>{const s=document.createElement('span');s.className='osav'+(p.isMe&&p.sameTab?' me':'');s.textContent=String(p.presence.av||'🙂').slice(0,8);avs.appendChild(s);});
  if(ppl.length>16){const s=document.createElement('span');s.className='osmore';s.textContent='+'+(ppl.length-16);avs.appendChild(s);}
}

/* ================= 3D stadium ================= */
const ZONES=[{id:'bo',name:'Bò',icon:'🐢',color:0x36a653,speed:.12,a0:Math.PI*0.5},{id:'di',name:'Đi',icon:'🚶',color:0x2b7fd0,speed:.35,a0:Math.PI*0.5+Math.PI*2/3},{id:'chay',name:'Chạy',icon:'🏃',color:0xee9124,speed:.9,a0:Math.PI*0.5+Math.PI*4/3}];
const OVAL=1.35;
let W3=null,threeP=null;
function loadThree(){
  if(window.THREE)return Promise.resolve(window.THREE);
  if(threeP)return threeP;
  threeP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='/vendor/three.min.js';
    s.onload=()=>window.THREE?res(window.THREE):rej(new Error('no three'));s.onerror=rej;document.head.appendChild(s);});
  return threeP;
}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)/4294967295;}
const hex=c=>'#'+c.toString(16).padStart(6,'0');
const FONT='system-ui,"Segoe UI","Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
function canvasTex(T,w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.anisotropy=4;return t;}
function kidSprite(T,av,nick,ring,isMe,dark){
  const tex=canvasTex(T,256,300,(g,w)=>{
    g.fillStyle=isMe?'rgba(255,214,90,.97)':'rgba(255,255,255,.95)';g.beginPath();g.arc(w/2,104,92,0,Math.PI*2);g.fill();
    g.lineWidth=12;g.strokeStyle=ring;g.stroke();
    g.textAlign='center';g.textBaseline='middle';g.font='110px '+FONT;g.fillText(av,w/2,110);
    g.font='800 44px '+FONT;const tw=Math.min(w-10,g.measureText(nick).width+28);
    g.fillStyle=dark?'rgba(20,22,40,.85)':'rgba(255,255,255,.92)';const x=(w-tw)/2;
    g.beginPath();if(g.roundRect)g.roundRect(x,222,tw,58,29);else g.rect(x,222,tw,58);g.fill();
    g.fillStyle=isMe?'#b8860b':(dark?'#ece8ff':'#2a2350');g.fillText(nick,w/2,252,w-24);
  });
  const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));sp.scale.set(4.2,4.9,1);return sp;
}
function labelSprite(T,icon,text,color){
  const tex=canvasTex(T,512,256,(g,w)=>{
    g.fillStyle='rgba(255,255,255,.92)';g.beginPath();if(g.roundRect)g.roundRect(46,120,w-92,104,52);else g.rect(46,120,w-92,104);g.fill();
    g.lineWidth=10;g.strokeStyle=color;g.stroke();
    g.textAlign='center';g.textBaseline='middle';g.font='110px '+FONT;g.fillText(icon,w/2,62);
    g.font='800 64px '+FONT;g.fillStyle=color;g.fillText(text,w/2,174);
  });
  const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));sp.scale.set(6,3,1);return sp;
}
function zoneCounts(){const c={bo:0,di:0,chay:0};onlinePeople().forEach(p=>{c[p.presence.stage||'bo']=(c[p.presence.stage||'bo']||0)+1;});return c;}
function drawBoard(){
  if(!W3)return;const c=zoneCounts(),n=c.bo+c.di+c.chay,key=n+'|'+c.bo+'|'+c.di+'|'+c.chay;if(W3.boardKey===key)return;W3.boardKey=key;
  const cv=W3.boardCanvas,g=cv.getContext('2d'),w=cv.width,h=cv.height;
  const grd=g.createLinearGradient(0,0,0,h);grd.addColorStop(0,'#1b1f3b');grd.addColorStop(1,'#2d2a5c');g.fillStyle=grd;g.fillRect(0,0,w,h);
  g.textAlign='center';g.textBaseline='middle';g.fillStyle='#ffe066';g.font='800 72px '+FONT;g.fillText('🟢 '+n+' bạn đang online',w/2,78);
  g.font='700 54px '+FONT;g.fillStyle='#ffffff';
  ZONES.forEach((z,i)=>{const x=w*(i+.5)/3;g.fillText(z.icon+' '+z.name,x,170);g.fillStyle=hex(z.color);g.font='800 70px '+FONT;g.fillText(String(c[z.id]),x,240);g.fillStyle='#ffffff';g.font='700 54px '+FONT;});
  W3.boardTex.needsUpdate=true;
}
function initWorld(T){
  const host=$('#world3d');host.innerHTML='';
  const dark=matchMedia('(prefers-color-scheme: dark)').matches;
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
  host.appendChild(renderer.domElement);
  const scene=new T.Scene();
  scene.background=canvasTex(T,4,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,dark?'#0d1030':'#6ec3ff');gr.addColorStop(.55,dark?'#2a2160':'#bfe6ff');gr.addColorStop(1,dark?'#3b2a55':'#fff4d6');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  scene.fog=new T.Fog(dark?0x231b45:0xd8efff,45,95);
  const cam=new T.PerspectiveCamera(45,1,.1,300);
  scene.add(new T.HemisphereLight(dark?0x9aa6ff:0xffffff,dark?0x223322:0x7fae6f,dark?.75:.95));
  const sun=new T.DirectionalLight(0xffffff,dark?.45:.75);sun.position.set(10,25,8);scene.add(sun);

  /* Sân cỏ sọc và đường chạy */
  const grassTex=canvasTex(T,512,512,(g,w,h)=>{for(let i=0;i<16;i++){g.fillStyle=i%2?(dark?'#2f6e3a':'#79c46f'):(dark?'#357a41':'#86d07c');g.fillRect(i*w/16,0,w/16,h);}});
  const field=new T.Group();field.scale.set(OVAL,1,1);scene.add(field);
  const grass=new T.Mesh(new T.CircleGeometry(9,96),new T.MeshLambertMaterial({map:grassTex}));grass.rotation.x=-Math.PI/2;field.add(grass);
  const track=new T.Mesh(new T.RingGeometry(9,10.8,96),new T.MeshLambertMaterial({color:dark?0x96503e:0xd9735c,side:T.DoubleSide}));track.rotation.x=-Math.PI/2;track.position.y=.01;field.add(track);
  for(let r=9.36;r<10.8;r+=.36){const l=new T.Mesh(new T.RingGeometry(r,r+.035,128),new T.MeshBasicMaterial({color:0xffffff}));l.rotation.x=-Math.PI/2;l.position.y=.02;field.add(l);}
  const apron=new T.Mesh(new T.RingGeometry(10.8,11.6,96),new T.MeshLambertMaterial({color:dark?0x4a5070:0xdfe6f0,side:T.DoubleSide}));apron.rotation.x=-Math.PI/2;apron.position.y=.015;field.add(apron);
  ZONES.forEach(z=>{
    const sec=new T.Mesh(new T.CircleGeometry(8.7,64,z.a0-Math.PI/3+.05,Math.PI*2/3-.1),new T.MeshLambertMaterial({color:z.color,transparent:true,opacity:.6}));
    sec.rotation.x=-Math.PI/2;sec.position.y=.03;field.add(sec);
    const lab=labelSprite(T,z.icon,'Khu '+z.name,hex(z.color));lab.position.set(Math.cos(z.a0)*6.8*OVAL,3.4,-Math.sin(z.a0)*6.8);scene.add(lab);
  });

  /* Khán đài bậc thang */
  const TIERS=6,R0=11.8,STEP=1.05,RISE=.62;
  const standMat=new T.MeshLambertMaterial({color:dark?0x3b3f63:0xe8e4f4,side:T.DoubleSide});
  const seatCols=[0x2b7fd0,0xe4508a,0xee9124,0x36a653,0x8763d1,0xf5b700];
  const stands=new T.Group();stands.scale.set(OVAL,1,1);scene.add(stands);
  for(let i=0;i<TIERS;i++){
    const r=R0+i*STEP,y=(i+1)*RISE;
    const riser=new T.Mesh(new T.CylinderGeometry(r,r,RISE,96,1,true),standMat);riser.position.y=y-RISE/2;stands.add(riser);
    const tc=new T.Color(seatCols[i%seatCols.length]).lerp(new T.Color(dark?0x2a2d48:0xffffff),.55);const tread=new T.Mesh(new T.RingGeometry(r,r+STEP,96),new T.MeshLambertMaterial({color:tc,side:T.DoubleSide}));
    tread.rotation.x=-Math.PI/2;tread.position.y=y;stands.add(tread);
  }
  const back=new T.Mesh(new T.CylinderGeometry(R0+TIERS*STEP,R0+TIERS*STEP,TIERS*RISE+.5,96,1,true),standMat);back.position.y=(TIERS*RISE+.5)/2;stands.add(back);
  [[0,Math.PI],[Math.PI,Math.PI]].forEach(([st,len],k)=>{const roof=new T.Mesh(new T.CylinderGeometry(R0+TIERS*STEP+.2,R0+2.2,1.2,64,1,true,st+.35,len-.7),
    new T.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:dark?.35:.6,side:T.DoubleSide}));roof.position.y=TIERS*RISE+2.4;stands.add(roof);});

  /* Khán giả cổ vũ: hàng trăm người nhảy theo làn sóng */
  const shirts=[0xe5484d,0x2b7fd0,0xf5b700,0x36a653,0x8763d1,0xee9124,0xffffff,0xe4508a].map(c=>new T.Color(c));
  const skins=[0xf6d2b0,0xe8b98f,0xc98c5e,0x9b6a43].map(c=>new T.Color(c));
  const fans=[];
  for(let i=0;i<TIERS;i++){
    const r=R0+i*STEP+STEP*.5,y=(i+1)*RISE,n=Math.floor(2*Math.PI*r*OVAL/.62);
    for(let k=0;k<n;k++){if(Math.random()<.14)continue;const a=(k+Math.random()*.4)/n*Math.PI*2;fans.push({a,r,y,ph:Math.random()*6.28,amp:.6+Math.random()*.6});}
  }
  const bodyGeo=new T.CylinderGeometry(.15,.2,.55,7);bodyGeo.translate(0,.275,0);
  const headGeo=new T.SphereGeometry(.15,8,6);headGeo.translate(0,.72,0);
  const armGeo=new T.BoxGeometry(.48,.08,.08);armGeo.translate(0,.62,0);
  const bodies=new T.InstancedMesh(bodyGeo,new T.MeshLambertMaterial(),fans.length);
  const heads=new T.InstancedMesh(headGeo,new T.MeshLambertMaterial(),fans.length);
  const arms=new T.InstancedMesh(armGeo,new T.MeshLambertMaterial(),fans.length);
  fans.forEach((f,i)=>{const sc=shirts[Math.floor(Math.random()*shirts.length)];bodies.setColorAt(i,sc);arms.setColorAt(i,sc);heads.setColorAt(i,skins[Math.floor(Math.random()*skins.length)]);});
  [bodies,heads,arms].forEach(m=>{m.instanceMatrix.setUsage(T.DynamicDrawUsage);if(m.instanceColor)m.instanceColor.needsUpdate=true;scene.add(m);});

  /* Cờ, đèn sân và bảng điện tử */
  const flags=[];
  for(let k=0;k<14;k++){const a=k/14*Math.PI*2,r=R0+TIERS*STEP;const pole=new T.Mesh(new T.CylinderGeometry(.05,.05,2.2,6),new T.MeshLambertMaterial({color:0xcccccc}));
    pole.position.set(Math.cos(a)*r*OVAL,TIERS*RISE+2.7,-Math.sin(a)*r);scene.add(pole);
    const fl=new T.Mesh(new T.PlaneGeometry(1,.6,6,1),new T.MeshLambertMaterial({color:seatCols[k%seatCols.length],side:T.DoubleSide}));
    fl.geometry.translate(.5,0,0);fl.position.set(pole.position.x,pole.position.y+.75,pole.position.z);fl.rotation.y=a+Math.PI/2;scene.add(fl);flags.push({fl,base:fl.geometry.attributes.position.array.slice(),ph:k});}
  [Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4].forEach(a=>{const r=R0+TIERS*STEP+1.2;
    const tw=new T.Mesh(new T.CylinderGeometry(.18,.25,11,8),new T.MeshLambertMaterial({color:0x9aa0b4}));tw.position.set(Math.cos(a)*r*OVAL,5.5,-Math.sin(a)*r);scene.add(tw);
    const lamp=new T.Mesh(new T.BoxGeometry(2,1.1,.4),new T.MeshBasicMaterial({color:dark?0xfff6c8:0xfffbe8}));lamp.position.set(tw.position.x,11.2,tw.position.z);lamp.lookAt(0,0,0);scene.add(lamp);});
  const boardCanvas=document.createElement('canvas');boardCanvas.width=1024;boardCanvas.height=300;
  const boardTex=new T.CanvasTexture(boardCanvas);
  const board=new T.Mesh(new T.PlaneGeometry(10,2.95),new T.MeshBasicMaterial({map:boardTex}));
  const frame=new T.Mesh(new T.BoxGeometry(10.6,3.5,.4),new T.MeshLambertMaterial({color:0x22253d}));
  const bz=-(R0+TIERS*STEP+.8);frame.position.set(0,TIERS*RISE+4.4,bz);board.position.set(0,TIERS*RISE+4.4,bz+.22);scene.add(frame,board);
  const legs=new T.Mesh(new T.BoxGeometry(.4,TIERS*RISE+2.6,.4),new T.MeshLambertMaterial({color:0x22253d}));legs.position.set(0,(TIERS*RISE+2.6)/2,bz);scene.add(legs);

  /* Pháo giấy */
  const CN=420,cpos=new Float32Array(CN*3),ccol=new Float32Array(CN*3),cvel=[];
  for(let i=0;i<CN;i++){cpos[i*3]=(Math.random()-.5)*26;cpos[i*3+1]=Math.random()*14;cpos[i*3+2]=(Math.random()-.5)*20;const c=shirts[i%shirts.length];ccol.set([c.r,c.g,c.b],i*3);cvel.push(.6+Math.random()*.9);}
  const cg=new T.BufferGeometry();cg.setAttribute('position',new T.BufferAttribute(cpos,3));cg.setAttribute('color',new T.BufferAttribute(ccol,3));
  const confetti=new T.Points(cg,new T.PointsMaterial({size:.22,vertexColors:true}));scene.add(confetti);

  const kids=new T.Group();scene.add(kids);
  const shadowTex=canvasTex(T,64,64,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);gr.addColorStop(0,'rgba(0,0,0,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  W3={T,renderer,scene,cam,kids,host,sprites:new Map(),angle:.5,drag:null,raf:0,t0:performance.now(),dark,fans,bodies,heads,arms,flags,confetti,cvel,shadowTex,boardCanvas,boardTex,boardKey:'',m:new T.Matrix4(),q:new T.Quaternion(),e:new T.Euler(),v:new T.Vector3(),s:new T.Vector3(1,1,1)};
  const el=renderer.domElement;el.style.touchAction='none';
  el.addEventListener('pointerdown',e=>{W3.drag={x:e.clientX,a:W3.angle};el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointermove',e=>{if(W3.drag)W3.angle=W3.drag.a-(e.clientX-W3.drag.x)*.008;});
  el.addEventListener('pointerup',()=>{W3.drag=null;});el.addEventListener('pointercancel',()=>{W3.drag=null;});
  new ResizeObserver(sizeWorld).observe(host);sizeWorld();drawBoard();
}
function sizeWorld(){if(!W3)return;const w=W3.host.clientWidth,h=W3.host.clientHeight;W3.renderer.setSize(w,h,false);W3.renderer.domElement.style.width=w+'px';W3.renderer.domElement.style.height=h+'px';W3.cam.aspect=w/Math.max(1,h);W3.cam.updateProjectionMatrix();}
function syncKids(){
  if(!W3)return;const {T,kids,sprites}=W3;const people=onlinePeople(),seen=new Set();
  people.forEach(p=>{
    const key=p.peer;seen.add(key);const z=ZONES.find(x=>x.id===p.presence.stage)||ZONES[0];
    const nick=String(p.presence.nick||'Một bạn').slice(0,12)+(p.isMe&&p.sameTab?' (em)':''),av=String(p.presence.av||'🙂').slice(0,8);
    const sig=nick+'|'+av+'|'+z.id;let k=sprites.get(key);
    if(!k||k.sig!==sig){if(k){kids.remove(k.g);}
      const g=new T.Group();const sp=kidSprite(T,av,nick,hex(z.color),p.isMe&&p.sameTab,W3.dark);sp.position.y=2.5;g.add(sp);
      const sh=new T.Mesh(new T.PlaneGeometry(1.8,1.8),new T.MeshBasicMaterial({map:W3.shadowTex,transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.05;g.add(sh);
      kids.add(g);const h=hashStr(key);k={g,sp,sig,z,ph:h*Math.PI*2,r:2.4+h*5.4,da:(hashStr(key+'a')-.5)*1.4};sprites.set(key,k);}
  });
  [...sprites.keys()].forEach(k=>{if(!seen.has(k)){kids.remove(sprites.get(k).g);sprites.delete(k);}});
  drawBoard();
}
function worldLoop(){
  if(!W3||screen!=='world'){if(W3)W3.raf=0;return;}
  const t=(performance.now()-W3.t0)/1000,{fans,bodies,heads,arms,m,q,e,v,s}=W3;if(!W3.drag)W3.angle+=.0014;
  const R=29;W3.cam.position.set(Math.sin(W3.angle)*R,25,Math.cos(W3.angle)*R);W3.cam.lookAt(0,0,0);
  for(let i=0;i<fans.length;i++){const f=fans[i];
    const wave=Math.pow(Math.max(0,Math.sin(f.a*2-t*1.7)),6),bob=Math.max(0,Math.sin(t*5+f.ph))*.06*f.amp,jump=wave*.55+bob;
    v.set(Math.cos(f.a)*f.r*OVAL,f.y+jump,-Math.sin(f.a)*f.r);e.set(0,f.a+Math.PI/2,0);q.setFromEuler(e);m.compose(v,q,s);bodies.setMatrixAt(i,m);heads.setMatrixAt(i,m);
    e.set(0,f.a+Math.PI/2,wave>.2?0:Math.sin(t*6+f.ph)*.35);q.setFromEuler(e);v.y+=wave*.25;m.compose(v,q,s);arms.setMatrixAt(i,m);}
  bodies.instanceMatrix.needsUpdate=heads.instanceMatrix.needsUpdate=arms.instanceMatrix.needsUpdate=true;
  W3.flags.forEach(f=>{const p=f.fl.geometry.attributes.position;for(let j=0;j<p.count;j++){const x=f.base[j*3];p.array[j*3+2]=Math.sin(x*5-t*6+f.ph)*.12*x;}p.needsUpdate=true;});
  const cp=W3.confetti.geometry.attributes.position;for(let i=0;i<W3.cvel.length;i++){cp.array[i*3+1]-=W3.cvel[i]*.02;cp.array[i*3]+=Math.sin(t+i)*.01;if(cp.array[i*3+1]<0)cp.array[i*3+1]=14;}cp.needsUpdate=true;
  W3.sprites.forEach(k=>{const z=k.z,sp=z.speed;
    const a=z.a0+k.da+Math.sin(t*sp+k.ph)*.38,r=k.r+Math.sin(t*sp*1.7+k.ph)*.5;
    const bob=z.id==='bo'?Math.abs(Math.sin(t*2+k.ph))*.1:z.id==='di'?Math.abs(Math.sin(t*4+k.ph))*.22:Math.abs(Math.sin(t*9+k.ph))*.4;
    k.g.position.set(Math.cos(a)*r*OVAL,0,-Math.sin(a)*r);k.sp.position.y=2.5+bob;});
  W3.renderer.render(W3.scene,W3.cam);W3.raf=requestAnimationFrame(worldLoop);
}
function renderWorldList(){
  const people=onlinePeople();
  $('#w-total').textContent=room?(people.length+' bạn đang online'):'Chưa kết nối';
  const box=$('#w-zones');box.innerHTML='';
  ZONES.forEach(z=>{
    const ps=people.filter(p=>(p.presence.stage||'bo')===z.id);
    const d=document.createElement('div');d.className='wzone';d.style.setProperty('--zc',hex(z.color));
    const h=document.createElement('h2');h.textContent=z.icon+' Khu '+z.name+' ('+ps.length+')';d.appendChild(h);
    const ul=document.createElement('div');ul.className='wkids';
    ps.slice(0,60).forEach(p=>{const s=document.createElement('span');s.className='wkid'+(p.isMe&&p.sameTab?' me':'');s.textContent=String(p.presence.av||'🙂').slice(0,8)+' '+String(p.presence.nick||'Một bạn').slice(0,12)+(p.isMe&&p.sameTab?' (em)':'');ul.appendChild(s);});
    if(ps.length>60){const s=document.createElement('span');s.className='wnone';s.textContent='và '+(ps.length-60)+' bạn nữa';ul.appendChild(s);}
    if(!ps.length){const s=document.createElement('span');s.className='wnone';s.textContent='Chưa có ai';ul.appendChild(s);}
    d.appendChild(ul);box.appendChild(d);
  });
  syncKids();
}
function openWorld(){
  stopAll();show('world');renderWorldList();
  $('#w-note').textContent=room?'Kéo sang trái phải để xoay sân. Mỗi bạn đứng ở khu của chặng mình đang học. Em chỉ thấy biệt danh của các bạn cùng nhà.':'Đang kết nối máy chủ…';
  loadThree().then(T=>{if(!W3)initWorld(T);sizeWorld();syncKids();if(!W3.raf)worldLoop();})
    .catch(()=>{$('#world3d').innerHTML='<p class="note" style="padding:20px">Không tải được hình 3D. Danh sách các bạn vẫn ở bên dưới.</p>';});
}
$('#online-pill').addEventListener('click',openWorld);
$('#os-world').addEventListener('click',openWorld);
$('#w-back').addEventListener('click',()=>show('home'));

/* ================= Keyboard shortcuts ================= */
let resultsAt=0;
function handleShortcut(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return false;
  const ae=document.activeElement;
  if(ae&&(ae.tagName==='TEXTAREA'||ae.tagName==='SELECT'||(ae.tagName==='INPUT'&&!['checkbox','radio','button'].includes(ae.type))))return false;
  if(ae&&ae.tagName==='INPUT')ae.blur();
  if(!$('#rest').hidden){if(e.key==='Enter'){e.preventDefault();$('#rest-ok').click();}return true;}
  if(e.repeat&&screen!=='play'&&screen!=='game'&&screen!=='home')return true;
  if(screen==='results'){
    e.preventDefault();if(e.repeat||performance.now()-resultsAt<700)return true;
    if(e.code==='Space'){if(resAgain)resAgain();}
    else if(e.key==='Enter'){if(resNext)resNext();else show('home');}
    else if(e.key==='Escape')show('home');
    return true;
  }
  if(screen==='home'&&e.key==='Enter'){e.preventDefault();continueLearning();return true;}
  if(screen==='online'){
    if(e.key==='Enter'){e.preventDefault();if(!$('#o-again').hidden)againRace();else if(!$('#o-fill').hidden)fillRace();return true;}
    if(e.key==='Escape'){leaveRoom();return true;}
    return false;
  }
  if(screen==='auth')return false;
  if(screen==='login'){
    if(/^Digit[1-9]$/.test(e.code)){const p=profiles.list[+e.code.slice(5)-1];if(p){e.preventDefault();login(p.id);}return true;}
    if(e.key==='Enter'){const p=profiles.list.find(x=>x.id===profiles.cur)||profiles.list[0];if(p){e.preventDefault();login(p.id);}else openNewProfile();return true;}
    return true;
  }
  if((screen==='parent'||screen==='world')&&e.key==='Escape'){show('home');return true;}
  return false;
}

$('#cont').addEventListener('click',e=>{e.currentTarget.blur();continueLearning();});
/* ================= Tài khoản ba mẹ ================= */
let resetToken=null;
function authMode(m){
  ['login','register','forgot','reset'].forEach(x=>{$('#f-'+x).hidden=x!==m;});
  $$('[data-auth]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.auth===m)));
  $('#auth-tabs').hidden=m==='reset';
  $('#a-err').textContent='';$('#a-msg').textContent='';
  const f=$('#f-'+m);const first=f&&f.querySelector('input');if(first&&screen==='auth')setTimeout(()=>first.focus(),0);
}
$$('[data-auth]').forEach(b=>b.addEventListener('click',()=>authMode(b.dataset.auth)));
$('#to-forgot').addEventListener('click',()=>authMode('forgot'));
$('#back-login').addEventListener('click',()=>authMode('login'));
function busy(form,on){form.querySelectorAll('button,input').forEach(x=>x.disabled=on);}
async function submitAuth(form,fn){
  $('#a-err').textContent='';$('#a-msg').textContent='';busy(form,true);
  try{await fn();}catch(e){$('#a-err').textContent=e.message;}
  busy(form,false);
}
$('#f-login').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;submitAuth(f,async()=>{
  const r=await api('POST','/api/auth/login',{email:f.email.value,password:f.password.value});f.password.value='';await afterAuth(r.user);});});
$('#f-register').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;submitAuth(f,async()=>{
  if(f.password.value!==f.password2.value)throw new Error('Hai mật khẩu chưa giống nhau.');
  const r=await api('POST','/api/auth/register',{email:f.email.value,password:f.password.value,consent:f.consent.checked});
  f.password.value='';f.password2.value='';await afterAuth(r.user);});});
$('#f-forgot').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;submitAuth(f,async()=>{
  await api('POST','/api/auth/forgot',{email:f.email.value});
  $('#a-msg').textContent='Nếu email này có tài khoản, chúng tôi đã gửi link đặt lại mật khẩu. Bạn kiểm tra hộp thư (cả mục Spam) nhé.';});});
$('#f-reset').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;submitAuth(f,async()=>{
  if(f.password.value!==f.password2.value)throw new Error('Hai mật khẩu chưa giống nhau.');
  const r=await api('POST','/api/auth/reset',{token:resetToken,password:f.password.value});resetToken=null;f.password.value='';f.password2.value='';await afterAuth(r.user);});});

async function afterAuth(user){
  me=user;uid=user.id;db=true;
  loadProfilesLocal();curPid=null;state=clone(DEFAULTS);
  $('#acct-email').textContent=user.email;
  setSync('Đang đồng bộ…');
  startRealtime();
  await cloudPullProfiles();
  renderWho();show('login');
  if(!profiles.list.length)openNewProfile();
}
function signedOut(){
  stopAll();if(online)leaveRoomSilently();stopRealtime();
  me=null;uid=null;db=null;curPid=null;profiles={list:[],cur:null,updatedAt:0};state=clone(DEFAULTS);
  syncToggles();renderWho();authMode('login');show('auth');
}
$('#logout').addEventListener('click',async()=>{try{await api('POST','/api/auth/logout');}catch(e){}signedOut();});
$('#f-chpw').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;$('#acct-msg').textContent='';busy(f,true);
  try{await api('POST','/api/auth/password',{oldPassword:f.old.value,newPassword:f.nw.value});f.old.value='';f.nw.value='';$('#acct-msg').textContent='Đã đổi mật khẩu. Các máy khác đã bị đăng xuất.';}
  catch(err){$('#acct-msg').textContent=err.message;}busy(f,false);});
$('#del-acct').addEventListener('click',()=>{$('#f-del').hidden=false;$('#f-del').password.focus();});
$('#f-del').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;$('#acct-msg').textContent='';busy(f,true);
  try{await api('POST','/api/account/delete',{password:f.password.value});
    const pre='bgp:'+uid+':';Object.keys(localStorage).filter(k=>k.startsWith(pre)).forEach(k=>localStorage.removeItem(k));
    signedOut();$('#a-msg').textContent='Tài khoản và toàn bộ dữ liệu của các bé đã được xoá.';}
  catch(err){$('#acct-msg').textContent=err.message;}busy(f,false);});
$('#o-copy').addEventListener('click',async e=>{
  if(!online)return;const link=location.origin+'/#dua-'+online.code,b=e.currentTarget;
  try{await navigator.clipboard.writeText(link);b.textContent='Đã sao chép link';}catch(_){b.textContent=link;}
  setTimeout(()=>{b.textContent='Sao chép link mời bạn';},2500);
});
const AUTH_ERRS={nouser:'Gmail này chưa có tài khoản. Bấm “Đăng ký” trước nhé.',consent:'Ba mẹ hãy tick ô đồng ý trước nhé.',many:'Bạn thử quá nhiều lần. Đợi một lát rồi thử lại.',off:'Chưa dùng được Google. Bạn đăng ký bằng email nhé.',google:'Đăng nhập Google chưa được. Bạn thử lại nhé.'};
function setupGoogle(){
  const reg=document.querySelector('[data-google=register]'),cb=$('#f-register').consent;
  const sync=()=>{reg.classList.toggle('off',!cb.checked);reg.href='/auth/google/start?mode=register'+(cb.checked?'&consent=1':'');};
  cb.addEventListener('change',sync);sync();
  reg.addEventListener('click',e=>{if(!cb.checked){e.preventDefault();$('#a-err').textContent=AUTH_ERRS.consent;}});
  api('GET','/api/auth/providers').then(r=>{if(r.google)$$('[data-google]').forEach(a=>a.hidden=false);}).catch(()=>{});
}
async function bootstrap(){
  setupGoogle();
  const params=new URLSearchParams(location.search),rt=params.get('reset'),ae=params.get('auth_err');
  if(ae){try{history.replaceState(null,'',location.pathname+location.hash);}catch(e){}show('auth');authMode(ae==='nouser'?'register':'login');$('#a-err').textContent=AUTH_ERRS[ae]||AUTH_ERRS.google;return;}
  if(rt){resetToken=rt;try{history.replaceState(null,'',location.pathname+location.hash);}catch(e){}show('auth');authMode('reset');return;}
  try{const r=await api('GET','/api/auth/me');await afterAuth(r.user);}
  catch(e){show('auth');authMode('login');}
}

/* ================= Nav & input ================= */
function exitToHome(){const wasOnline=game&&game.online;stopAll();if(wasOnline){leaveRoomSilently();show('home');setTab('race');}else show('home');}
$$('.exit').forEach(b=>b.addEventListener('click',exitToHome));
$('#brand').addEventListener('click',exitToHome);
$('#to-parent').addEventListener('click',()=>{stopAll();show('parent');});
$('#p-back').addEventListener('click',()=>show('home'));
$$('.tg-sound').forEach(b=>b.addEventListener('click',()=>{state.sound=!state.sound;save();syncToggles();}));
$$('.tg-speak').forEach(b=>b.addEventListener('click',()=>{state.speak=!state.speak;save();syncToggles();}));
$('#kbt').addEventListener('click',e=>{e.currentTarget.blur();state.kbFull=!state.kbFull;save();syncToggles();if($('#deck').hidden===false)ensureKB(needFull());else kbFullNow=null;});
$('#rest-ok').addEventListener('click',()=>{$('#rest').hidden=true;pending=null;show('home');});
$('#rest-more').addEventListener('click',()=>{$('#rest').hidden=true;bypass=true;const f=pending;pending=null;if(f)f();});

let vShift=false;
function setVShift(v){vShift=v;['ShiftL','ShiftR'].forEach(k=>{if(KEYS[k])KEYS[k].classList.toggle('held',v);});}
function pressVirtual(k){
  if(k==='ShiftL'||k==='ShiftR'){setVShift(!vShift);return;}
  if(MODL[k]){flashKey(k);return;}
  let ch=k;if(vShift){ch=LETTERS.includes(k)?k.toUpperCase():(SHIFT_OF[k]||k);setVShift(false);}
  input(ch);
}
const CODE={Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Space:' '};
for(let d=0;d<10;d++)CODE['Digit'+d]=String(d);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&(screen==='play'||screen==='game')){exitToHome();return;}
  if(handleShortcut(e))return;
  if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  if(e.isComposing||e.key==='Process'||e.keyCode===229)return;
  if(!$('#rest').hidden)return;
  const tag=document.activeElement&&document.activeElement.tagName;
  if(tag==='SELECT'||tag==='INPUT')return;
  if(!['home','play','game'].includes(screen))return;
  if(e.code==='ShiftLeft'||e.code==='ShiftRight'){flashKey(e.code==='ShiftLeft'?'ShiftL':'ShiftR');return;}
  let b=null;if(/^Key[A-Z]$/.test(e.code))b=e.code.slice(3).toLowerCase();else if(e.code in CODE)b=CODE[e.code];
  if(b===null)return;e.preventDefault();
  const caps=!!(e.getModifierState&&e.getModifierState('CapsLock'));
  $('#capsnote').hidden=!(caps&&screen==='play');
  const ch=LETTERS.includes(b)?((e.shiftKey!==caps)?b.toUpperCase():b):(e.shiftKey?(SHIFT_OF[b]||b):b);
  input(ch);
});

if(window.matchMedia&&matchMedia('(pointer:coarse)').matches){
  $('#ime-tip').textContent='Trên điện thoại có thể chạm vào bàn phím trên màn hình để thử, nhưng muốn luyện ngón tay đúng thì cần máy tính có bàn phím thật.';
}
syncToggles();renderWho();bootstrap();
})();

