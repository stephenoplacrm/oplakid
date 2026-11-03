
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
Object.assign(TOPICS,{
  job:{bonus:true,name:'Nghề nghiệp',words:[['doctor','👨‍⚕️','bác sĩ'],['nurse','👩‍⚕️','y tá'],['cook','🧑‍🍳','đầu bếp'],['pilot','🧑‍✈️','phi công'],['farmer','🧑‍🌾','nông dân'],['singer','🧑‍🎤','ca sĩ'],['artist','🧑‍🎨','họa sĩ'],['police','👮','công an'],['fireman','🧑‍🚒','lính cứu hỏa'],['mechanic','🧑‍🔧','thợ máy'],['astronaut','🧑‍🚀','phi hành gia'],['king','🤴','nhà vua']]},
  sport:{bonus:true,name:'Thể thao',words:[['run','🏃','chạy'],['ski','⛷️','trượt tuyết'],['golf','⛳','đánh gôn'],['swim','🏊','bơi'],['surf','🏄','lướt sóng'],['judo','🥋','võ judo'],['skate','🛹','ván trượt'],['rugby','🏉','bóng bầu dục'],['tennis','🎾','quần vợt'],['soccer','⚽','đá banh'],['boxing','🥊','đấm bốc'],['archery','🏹','bắn cung'],['bowling','🎳','ném bowling'],['basket','🏀','bóng rổ']]},
  weather:{bonus:true,name:'Thời tiết',words:[['fog','🌫️','sương mù'],['hot','🥵','nóng'],['cold','🥶','lạnh'],['drop','💧','giọt nước'],['storm','⛈️','cơn bão'],['sunny','🌞','trời nắng'],['windy','💨','nhiều gió'],['thunder','🌩️','sấm chớp'],['rainbow','🌈','cầu vồng'],['tornado','🌪️','lốc xoáy'],['snowman','⛄','người tuyết'],['umbrella','☂️','cái dù']]},
  veg:{bonus:true,name:'Rau củ',words:[['carrot','🥕','cà rốt'],['potato','🥔','khoai tây'],['tomato','🍅','cà chua'],['onion','🧅','hành tây'],['garlic','🧄','tỏi'],['pepper','🌶️','ớt'],['cucumber','🥒','dưa leo'],['broccoli','🥦','bông cải xanh'],['mushroom','🍄','nấm'],['eggplant','🍆','cà tím'],['lettuce','🥬','xà lách']]},
  place:{bonus:true,name:'Nơi chốn',words:[['home','🏠','ngôi nhà'],['zoo','🦒','sở thú'],['farm','🚜','nông trại'],['park','🏞️','công viên'],['shop','🏪','cửa hàng'],['bank','🏦','ngân hàng'],['tent','⛺','cái lều'],['beach','🏖️','bãi biển'],['hotel','🏨','khách sạn'],['castle','🏰','lâu đài'],['bridge','🌉','cây cầu'],['market','🛒','chợ'],['hospital','🏥','bệnh viện']]},
  bug:{bonus:true,name:'Côn trùng và biển',words:[['bug','🐛','con sâu'],['crab','🦀','con cua'],['snail','🐌','ốc sên'],['shell','🐚','vỏ ốc'],['whale','🐋','cá voi'],['shark','🦈','cá mập'],['spider','🕷️','con nhện'],['turtle','🐢','con rùa'],['dolphin','🐬','cá heo'],['octopus','🐙','con bạch tuộc'],['ladybug','🐞','bọ rùa'],['butterfly','🦋','con bướm']]}
});
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
const LEFT_W='sad fast cat bed red tree seat wet great water west star card dad add area eggs cart grass vest draw care stage crab'.split(' ');
const RIGHT_W='milk pink hill look pool mom noon pop lily mill ink oil you him kill union only hum'.split(' ');
const ALT_W='the with they when did dog bus big fox six cut pen make name goal visit city body lake town turn work girl them tie'.split(' ');
const DBL_W='ball bell doll hill book moon tree green good bee see cook too door food pool fall all egg apple'.split(' ');
const SMALL_W='a I go up we me he is it on in at to do my'.split(' ');
const PHR5='the cat sat on the mat|a big red ball bounces|my dog runs in the park|we eat rice and fish|the sun is very hot|two little birds sing|she has a pink hat|he rides a blue bike|the frog jumps in water|my mom makes a cake|look at the big moon|we play with a ball|the bear likes to eat honey|a bee sits on a flower|the green bus is here'.split('|');
const SENT_HOME='my room has a bed and a lamp|we sit on the sofa to read|the door is open|i wash my hands in the bath|my mom cooks in the kitchen|the clock is on the wall|dad puts the key in the door|the cat sleeps on the chair|there is a box under my bed|i drink milk from my cup'.split('|');
const SENT_FOOD='i like rice and fish|we eat bread and cheese|the cake is sweet|my mom makes hot soup|i drink a cup of milk|he eats a red apple|she likes yellow bananas|we share a big pizza|the honey is sweet|i eat an egg for lunch'.split('|');
const SENT_TOY='i play with my robot|the kite flies high|she hugs her teddy bear|we build a tower with blocks|he rolls the dice|the ball is red and big|my doll has a pink dress|we play a game on the table|the drum goes boom boom|i ride my little bike'.split('|');
const SENT_SPORT='we run in the park|i swim like a fish|he kicks the ball far|she plays tennis with dad|we skate on the road|the team wins the game|i can jump very high|dad and i ride bikes|they play soccer on the grass|she swims in the pool'.split('|');
const SENT_WEATHER='it is hot and sunny|the rain falls on the roof|the wind blows my hat away|snow is cold and white|i see a rainbow in the sky|the storm is loud|the clouds are grey today|it is a cold day|we play in the snow|the fog is thick this morning'.split('|');
const QUOTES=['"Hello," said Mai.','"Look!" said Nam.','Tom said, "I can swim."','"Where is my bag?" asked Lan.','Mom said, "Dinner is ready."','"I like cats," said Ben.','The sign says "Stop!"',"Anna said, \"Let's play.\""];
const HYPH='ice-cream|T-shirt|x-ray|well-known|school-bus|ten-year-old|up-to-date|merry-go-round|check-in|brother-in-law'.split('|');
const PAREN=['(a cat)','(two dogs)','I have a pet (a cat).','We eat lunch (rice and fish).','My bag (the blue one) is here.','Today (Monday) is fun.','Look at (this) tree!','Mai (my sister) is six.'];
const COLON=['Time: 3:30','Name: Mai','Colors: red, blue, green','Note: bring a pen.','Class: 3A','Today: Monday','Snack: apple, milk','Page: 12','Score: 10:8'];
const MONEY=['$5','$10','$12.50','$3.75','50%','25% off','100%','$2 and $8','I have $4.','It costs $9.','Get 10% off!','Save 20%.'];
const EMAIL=['mai@example.com','nam@example.com','an.nguyen@example.com','tom_123@example.com','lily@example.com','hello@example.com','ben@example.com','my.class@example.com'];
const PARAS2={
  food:['I like fruit. An apple a day is good for me.','We cook rice for lunch. My mom adds fish and soup.','Pizza is hot! Be careful, or you may burn your tongue.'],
  sport:['I play soccer with my friends. We run and kick the ball.','Swimming is fun. I jump into the pool and splash water.','My dad rides a bike every Sunday. He wears a red helmet.'],
  travel:['We go to the beach in July. The sea is blue and warm.','I pack my bag for the trip. I take a hat, a book and a toy.','The train is fast. We see green hills from the window.'],
  garden:['Grandma has a small garden. She grows tomatoes and beans.','Bees visit the flowers. They carry pollen from one to another.','I water the plants every morning. They grow tall and strong.'],
  story:['Once upon a time, a little fox lived in a big forest.','The fox found a red ball. He played with it all day long.','At night, the moon came out. The fox went home and slept well.'],
  space:['The Sun is a big star. It gives us light and heat.','An astronaut flies in a rocket. She floats in space.','There are eight planets. The Earth is the third one.']
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
function threeDigit(){return Array.from({length:8},()=>it(String(100+Math.floor(Math.random()*900))));}
function mulGen(){return Array.from({length:6},()=>{const a=2+Math.floor(Math.random()*8),b=2+Math.floor(Math.random()*8);return it(a+' x '+b+' = '+(a*b));});}
function divGen(){return Array.from({length:6},()=>{const a=2+Math.floor(Math.random()*8),b=2+Math.floor(Math.random()*8);return it((a*b)+' / '+b+' = '+a);});}
function dateGen(){const p=n=>String(n).padStart(2,'0');return Array.from({length:6},()=>it(p(1+Math.floor(Math.random()*28))+'/'+p(1+Math.floor(Math.random()*12))+'/'+(2015+Math.floor(Math.random()*12))));}
function calcGen(){return shuffle(mathGen().slice(0,2).concat(mulGen().slice(0,2),divGen().slice(0,2)));}
function topicParts(id){
  const ws=TOPICS[id].words.slice().sort((a,b)=>a[0].length-b[0].length);const mid=Math.ceil(ws.length/2);
  return [ws.slice(0,mid),ws.slice(mid)];
}

/* ===== Bài gõ tiếng Việt (Cấp độ 6 đến 10): bé dùng bộ gõ tiếng Việt có sẵn của máy; ứng dụng chỉ so chữ bé gõ với chữ đích ===== */
const VN={"topics":{"family":["ba","mẹ","anh","chị","em","ông nội","bà ngoại","cô","chú","bác","cậu","em bé","anh trai","chị gái"],"animals":["con mèo","con chó","con gà","con vịt","con heo","con bò","con trâu","con ngựa","con thỏ","con voi","con hổ","con khỉ","con cá","con chim","con ếch","con rùa","con bướm","con ong"],"fruit":["trái cam","trái chuối","trái xoài","trái dừa","trái bưởi","trái ổi","trái mận","trái nho","dưa hấu","thanh long","trái thơm","chôm chôm","măng cụt","sầu riêng","trái mít","trái táo"],"food":["cơm","phở","bún","bánh mì","bánh bao","chè","canh chua","cá kho","thịt kho","rau muống","trứng chiên","sữa","nước cam","kẹo","bánh chưng","xôi"],"school":["trường học","lớp học","cô giáo","thầy giáo","bạn bè","sách vở","bút chì","cái cặp","thước kẻ","bảng đen","bài tập","giờ ra chơi","tập đọc","làm toán","vẽ tranh","hát"],"body":["đầu","mắt","mũi","miệng","tai","tay","chân","bụng","lưng","răng","tóc","cổ","vai","ngón tay","đầu gối"],"nature":["mặt trời","mặt trăng","ngôi sao","bầu trời","đám mây","cơn mưa","ngọn gió","dòng sông","ngọn núi","cánh đồng","bông hoa","cái cây","biển cả","con đường","khu rừng","hòn đá"],"colors":["màu đỏ","màu cam","màu vàng","màu xanh lá","màu xanh dương","màu tím","màu hồng","màu nâu","màu trắng","màu đen","màu xám"],"numbers":["một","hai","ba","bốn","năm","sáu","bảy","tám","chín","mười","mười một","hai mươi","một trăm","một nghìn"],"jobs":["bác sĩ","y tá","giáo viên","nông dân","công nhân","kỹ sư","ca sĩ","nhà báo","đầu bếp","phi công","lính cứu hỏa","tài xế","thợ may","thợ mộc","họa sĩ","công an"]},"extra":["cây","mây","ngày","đây","vâng","mận","gấu","sâu","dâu","câu","cầu","thân","bầu","xấu","ấm","lấy","nhân","chân","hầu","tấm","ếch","đêm","bến","nghề","quê","tên","đến","lên","hết","nền","xếp","kể","bế","thế","về","lê","mệt","việc","ông","bốn","cô","tô","nồi","cổ","đồng","hồ","tối","lối","rồi","đồ","đốt","sống","bồ","nổ","trống","lông","tôm","ăn","năm","răng","trăng","măng","khăn","nắng","mặt","bắp","đắng","lắm","cặp","cắt","chăn","văn","tắm","rắn","vắng","mơ","bơ","cơm","thơm","sơn","nhớ","mới","trời","đời","bờ","ơn","lớp","chợ","hơn","rơm","cờ","ớt","lợn","mời","bơi","nơi","đơn","thở","chữ","mưa","thư","sữa","đưa","cưa","trưa","sứ","thử","từ","mừng","vườn","hương","nước","người","bướm","lửa","tựa","gừng","sừng","đứng","chưa","rừng","bưởi","đi","đó","đầu","đường","đèn","đũa","đẹp","đỏ","đất","đá","đàn","đủ","điện","đọc","đếm","đỉnh","đảo","hoa","xe","nhà","sách","bàn","ghế","cửa","mèo","gà","vịt","heo","bò","cá","chim","hổ","khỉ","thỏ","voi","cua","sao","gió","sông","núi","biển","lá","cành","quả","trái","hạt","cỏ","rau","củ","bông","hỏi","ngã","nặng","sắc","huyền","quả","giờ","hòa","khỏe","thủy","múa","mía","tuần","quý","nghỉ","bảy","sáu","tám","chín","mười"],"words2":["học sinh","bạn bè","gia đình","quê hương","trường học","sân trường","thư viện","bài học","cuốn sách","chiếc bút","cái bàn","ghế đá","cây xanh","bông hoa","trái tim","niềm vui","nụ cười","ánh sáng","bầu trời","mặt trăng","đám mây","cơn gió","dòng sông","ngọn núi","cánh đồng","con đường","ngôi nhà","mái nhà","cửa sổ","giường ngủ","bàn học","tủ sách","xe đạp","xe máy","ô tô","máy bay","tàu hỏa","thuyền buồm","bến xe","nhà ga","siêu thị","bệnh viện","bưu điện","công viên","sở thú","hồ nước","cầu vồng","thiên nhiên","mùa xuân","mùa hạ","mùa thu","mùa đông","ngày mai","buổi sáng","buổi tối","trái đất","thế giới","đất nước","tổ quốc","thành phố","nông thôn","làng quê","bãi cát","hòn đảo","con tàu","ngôi sao","vũ trụ","người bạn","cuộc sống","tình yêu","sức khỏe","tiếng Việt","chữ viết","nước mắt","giấc mơ","cuộc thi","điểm mười","niềm tin","nghề nghiệp"],"phrases":{"family":["em yêu ba mẹ","ông bà kể chuyện","chị dắt em đi","anh chơi với em","mẹ nấu cơm ngon","ba đưa em đi học","cả nhà ăn cơm","bà ngoại thương em"],"school":["em đến trường","cô giáo giảng bài","bạn cùng lớp","giờ ra chơi","em làm bài tập","đọc sách mỗi ngày","viết chữ đẹp","giữ gìn sách vở"],"nature":["trời xanh mây trắng","mưa rơi tí tách","gió thổi nhẹ nhàng","hoa nở đầy vườn","chim hót líu lo","nắng vàng rực rỡ","sông chảy hiền hòa","trăng sáng vằng vặc"],"food":["bát cơm nóng hổi","canh chua cá lóc","bánh mì thịt nướng","nước dừa mát lạnh","trái cây tươi ngon","chè đậu xanh","xôi gà thơm phức","rau xanh tươi mát"],"play":["đá bóng ngoài sân","nhảy dây cùng bạn","chơi cờ vua","thả diều trên đồng","đạp xe quanh hồ","xếp hình rô bốt","vẽ tranh tặng mẹ","hát múa vui vẻ"]},"short":{"family":["Em yêu ba mẹ.","Ba mẹ rất thương em.","Bà kể chuyện cho em nghe.","Anh chị chơi với em.","Chủ nhật cả nhà đi chơi.","Mẹ nấu cơm rất ngon.","Ông đọc báo trong vườn.","Em giúp mẹ quét nhà."],"school":["Em đi học mỗi ngày.","Cô giáo dạy em đọc.","Em có nhiều bạn tốt.","Giờ ra chơi vui quá.","Em viết bài rất đẹp.","Cặp sách của em màu xanh.","Em làm bài tập về nhà.","Lớp em sạch sẽ."],"nature":["Trời hôm nay rất đẹp.","Mặt trời mọc đằng đông.","Mưa rơi trên mái nhà.","Gió thổi qua cánh đồng.","Hoa nở đỏ cả vườn.","Con sông chảy hiền hòa.","Ngọn núi cao vời vợi.","Ánh trăng sáng quá."],"food":["Em thích ăn trái cây.","Cơm trưa nay rất ngon.","Mẹ nấu canh chua cá.","Bánh mì thơm giòn.","Em uống một ly sữa.","Ba mua dưa hấu ngọt.","Phở bò nóng hổi.","Chè đậu xanh mát lạnh."],"play":["Em chơi đá bóng với bạn.","Chúng em nhảy dây ngoài sân.","Bạn Nam thả diều rất giỏi.","Em thích vẽ tranh.","Cả lớp cùng hát vang.","Em đạp xe quanh công viên.","Mình chơi cờ vua nhé.","Chiều nay em đi bơi."]},"long":{"family":["Buổi tối, cả nhà em quây quần bên mâm cơm ấm áp.","Mỗi sáng, ba chở em đến trường bằng chiếc xe máy cũ.","Bà ngoại thường kể cho em nghe những câu chuyện cổ tích.","Cuối tuần, em cùng mẹ đi chợ mua rau và trái cây.","Anh trai em học rất giỏi và luôn giúp em làm bài tập.","Ông nội trồng nhiều hoa trong khu vườn nhỏ sau nhà.","Em luôn nhớ lời ba mẹ dặn là phải ngoan và chăm học.","Sinh nhật em, cả nhà tặng em một chiếc xe đạp mới."],"school":["Sáng nào em cũng đến lớp thật sớm để chào cô giáo.","Trong giờ ra chơi, chúng em nhảy dây và đá cầu ngoài sân trường.","Cô giáo khen em viết chữ đẹp và đọc bài rõ ràng.","Em rất thích học môn Toán và môn Tiếng Việt.","Thư viện của trường có nhiều cuốn sách hay và đẹp.","Em giữ gìn sách vở sạch sẽ và gọn gàng.","Cả lớp em cùng nhau trồng cây xanh trong sân trường.","Mỗi chiều, em ôn lại bài học trước khi đi ngủ."],"nature":["Mùa xuân đến, trăm hoa đua nở khắp các nẻo đường.","Những đám mây trắng trôi lững lờ trên bầu trời xanh.","Sau cơn mưa, cầu vồng hiện lên thật rực rỡ.","Dòng sông quê em êm đềm chảy qua cánh đồng lúa.","Buổi sáng, chim hót líu lo trên những cành cây.","Biển xanh trải dài đến tận chân trời xa tít.","Trăng rằm tròn vành vạnh chiếu sáng cả khu làng.","Gió mùa đông bắc thổi lạnh buốt suốt đêm dài."],"season":["Mùa hè, ve kêu râm ran trên những tán phượng đỏ.","Mùa thu, lá vàng rơi đầy trên con đường nhỏ.","Mùa đông, em mặc áo ấm và đội mũ len.","Trời nắng chang chang, ai cũng muốn tìm bóng mát.","Cơn bão đi qua để lại nhiều cành cây gãy.","Sương sớm phủ trắng trên đồng cỏ xanh mướt.","Mưa rào ào ào rồi tạnh ngay trong chốc lát.","Tiết trời se lạnh báo hiệu mùa đông đã về."],"sport":["Hôm nay lớp em thi đấu bóng đá với lớp bên cạnh.","Em tập chạy mỗi sáng để cơ thể thêm khỏe mạnh.","Bạn Lan nhảy dây giỏi nhất trong cả lớp em.","Chúng em kéo co và cùng reo hò thật vui vẻ.","Thầy thể dục hướng dẫn em cách đá cầu đúng kỹ thuật.","Em bơi qua hồ nước mà không thấy mệt chút nào.","Đội của em giành chiến thắng nhờ tinh thần đoàn kết.","Chơi thể thao giúp em ăn ngon và ngủ ngon hơn."],"food":["Mẹ nấu một nồi canh chua cá lóc thơm lừng cả bếp.","Buổi sáng, em ăn một tô phở nóng và uống ly sữa.","Trái xoài chín vàng ươm ngọt lịm trong miệng em.","Ngày Tết, nhà em gói bánh chưng và nấu nồi thịt kho.","Bà làm món chè đậu xanh mát lạnh cho cả nhà.","Em thích ăn rau muống xào tỏi với cơm trắng.","Quán bên đường bán bánh mì giòn rụm và đậm đà.","Ăn nhiều rau và trái cây giúp em mau lớn."],"animals":["Chú mèo con nằm cuộn tròn bên cạnh bếp lửa hồng.","Đàn gà con chạy theo mẹ kiếm ăn trong sân.","Con trâu hiền lành cần mẫn kéo cày trên đồng.","Chú chim sơn ca hót vang trên cành cao.","Những chú cá nhỏ bơi lội tung tăng trong hồ.","Chú chó nhà em rất thông minh và trung thành.","Đàn ong chăm chỉ bay đi tìm mật hoa.","Con voi to lớn nhưng rất hiền và thân thiện."]},"givenNames":["Nam","Mai","Lan","Minh","Hoa","An","Linh","Long","Hùng","Dũng","Trang","Thảo","Phương","Quỳnh","Khoa","Tuấn","Bảo","Ngọc","Hạnh","Đạt","Yến","Vy","Khánh","Phúc","Thư","Huy"],"surnames":["Nguyễn","Trần","Lê","Phạm","Hoàng","Huỳnh","Phan","Vũ","Võ","Đặng","Bùi","Đỗ","Ngô","Dương","Lý"],"places":["Hà Nội","Hải Phòng","Đà Nẵng","Huế","Cần Thơ","Nha Trang","Đà Lạt","Vũng Tàu","Hạ Long","Quy Nhơn","Phú Quốc","Cà Mau","Bến Tre","Long An","Tiền Giang","Vĩnh Long","Đồng Tháp","An Giang","Kiên Giang","Bạc Liêu","Sóc Trăng","Tây Ninh","Biên Hòa","Thủ Đức"],"days":["Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy","Chủ Nhật"],"months":["Tháng Một","Tháng Hai","Tháng Ba","Tháng Tư","Tháng Năm","Tháng Sáu","Tháng Bảy","Tháng Tám","Tháng Chín","Tháng Mười","Tháng Mười Một","Tháng Mười Hai"],"punct":{"comma":["Mẹ mua cam, táo, nho và xoài.","Hôm nay, em được điểm mười.","Sáng nay, trời mưa to.","Ở nhà, em giúp mẹ nấu cơm.","Em thích đọc truyện, vẽ tranh và hát.","Chiều đến, đàn chim bay về tổ.","Cô giáo mặc áo dài, tóc búi cao.","Bạn Lan, bạn Mai và em chơi cùng nhau."],"question":["Bạn tên là gì?","Hôm nay bạn học môn gì?","Nhà bạn ở đâu?","Bạn có thích ăn xoài không?","Ai làm bài xong rồi?","Mấy giờ thì ra chơi?","Con mèo đang ở đâu?","Vì sao bầu trời màu xanh?"],"exclaim":["Chúc mừng sinh nhật!","Giỏi quá!","Cố lên nào!","Đẹp quá!","Cảm ơn bạn nhiều!","Trời ơi, mưa to quá!","Mình thắng rồi!","Chào mừng các bạn đến lớp!"],"colon":["Em có ba màu: đỏ, vàng, xanh.","Mẹ dặn: nhớ mặc áo ấm.","Lớp em có hai tổ: tổ một và tổ hai.","Bài hôm nay: tập đọc.","Thực đơn: cơm, canh, cá kho.","Đồ dùng: bút, thước, cặp sách.","Lưu ý: không chạy trong lớp.","Cô nhắc: giữ gìn sách vở."],"quote":["Mẹ nói: \"Con ngoan lắm!\"","Cô giáo khen: \"Em viết đẹp quá!\"","Bạn Nam hỏi: \"Cậu đi đâu đấy?\"","Ba dặn: \"Nhớ đội mũ bảo hiểm.\"","Bà cười: \"Cháu của bà giỏi thật!\"","Em reo lên: \"Tuyệt vời!\""],"dash":["- Con ăn cơm chưa? - Dạ, con ăn rồi.","- Bạn tên là gì? - Mình tên là Mai.","- Mấy giờ rồi ạ? - Bảy giờ rồi con.","- Cho mình mượn bút nhé? - Ừ, cậu cứ lấy.","- Con đi học nhé! - Ừ, con đi cẩn thận."]},"qa":["- Bạn tên là gì? - Mình tên là Nam.","- Bạn mấy tuổi? - Mình tám tuổi.","- Nhà bạn ở đâu? - Nhà mình ở Cần Thơ.","- Bạn thích môn nào? - Mình thích môn Toán.","- Bạn ăn sáng chưa? - Mình ăn rồi, cảm ơn bạn.","- Hôm nay trời thế nào? - Trời nắng đẹp lắm.","- Bạn có em không? - Mình có một em gái.","- Cuối tuần bạn làm gì? - Mình đi thăm bà ngoại."],"proverbs":{"study":["Có công mài sắt có ngày nên kim.","Học ăn học nói học gói học mở.","Đi một ngày đàng học một sàng khôn.","Có chí thì nên.","Học thầy không tày học bạn.","Không thầy đố mày làm nên.","Gần mực thì đen, gần đèn thì sáng.","Có học mới biết, có đi mới đến."],"family":["Công cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn chảy ra.","Anh em như thể tay chân, rách lành đùm bọc dở hay đỡ đần.","Con hiền cháu thảo.","Chim có tổ, người có tông.","Ăn quả nhớ kẻ trồng cây.","Uống nước nhớ nguồn."],"people":["Lá lành đùm lá rách.","Thương người như thể thương thân.","Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.","Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.","Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.","Một con ngựa đau cả tàu bỏ cỏ.","Nhiễu điều phủ lấy giá gương, người trong một nước phải thương nhau cùng."],"work":["Tay làm hàm nhai, tay quai miệng trễ.","Có làm thì mới có ăn.","Kiến tha lâu cũng đầy tổ.","Chuông có đánh mới kêu, đèn có khêu mới tỏ.","Nước chảy đá mòn.","Một nắng hai sương."],"weather":["Chớp đông nhay nháy, gà gáy thì mưa.","Mau sao thì nắng, vắng sao thì mưa.","Trăng quầng thì hạn, trăng tán thì mưa.","Chuồn chuồn bay thấp thì mưa, bay cao thì nắng, bay vừa thì râm.","Rét tháng ba, bà già chết cóng.","Tháng bảy kiến bò, chỉ lo lại lụt."]},"cadao":{"parents":["Công cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn chảy ra. Một lòng thờ mẹ kính cha, cho tròn chữ hiếu mới là đạo con.","Anh em nào phải người xa, cùng chung bác mẹ một nhà cùng thân. Yêu nhau như thể tay chân, anh em hòa thuận hai thân vui vầy.","Lên non mới biết non cao, nuôi con mới biết công lao mẫu từ.","Muốn sang thì bắc cầu kiều, muốn con hay chữ phải yêu lấy thầy."],"home":["Đường vô xứ Nghệ quanh quanh, non xanh nước biếc như tranh họa đồ.","Gió đưa cành trúc la đà, tiếng chuông Thiên Mụ canh gà Thọ Xương. Mịt mù khói tỏa ngàn sương, nhịp chày Yên Thái mặt gương Tây Hồ.","Trên trời có đám mây xanh, ở giữa mây trắng, xung quanh mây vàng. Ước gì anh lấy được nàng, để anh mua gạch Bát Tràng về xây."],"work":["Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.","Trâu ơi ta bảo trâu này, trâu ra ngoài ruộng trâu cày với ta. Cấy cày vốn nghiệp nông gia, ta đây trâu đấy ai mà quản công."],"animals":["Con cò mà đi ăn đêm, đậu phải cành mềm lộn cổ xuống ao. Ông ơi ông vớt tôi nao, tôi có lòng nào ông hãy xáo măng.","Bao giờ cho đến tháng ba, ếch cắn cổ rắn tha ra ngoài đồng."]},"dongdao":["Rồng rắn lên mây, có cây lúc lắc, hỏi thăm thầy thuốc, có nhà hay không?","Chi chi chành chành, cái đanh thổi lửa, con ngựa chết trương, ba vương ngũ đế, chấp chế đi tìm, ú tim ụ ù.","Thằng Bờm có cái quạt mo, phú ông xin đổi ba bò chín trâu. Bờm rằng: Bờm chẳng lấy trâu, phú ông xin đổi một xâu cá mè.","Lạy trời mưa xuống, lấy nước tôi uống, lấy ruộng tôi cày, lấy bát cơm đầy, lấy khoai tôi nướng.","Dung dăng dung dẻ, dắt trẻ đi chơi, đến cổng nhà trời, lạy cậu lạy mợ, cho cháu về quê, cho dê đi học, cho cóc ở nhà, cho gà bới bếp."],"idioms":{"similes1":["Chậm như rùa.","Nhanh như sóc.","Khỏe như voi.","Hiền như bụt.","Cao như núi.","Nhát như thỏ.","Đẹp như tiên.","Trắng như tuyết."],"similes2":["Đen như than.","Đỏ như son.","Nhẹ như lông hồng.","Nặng như chì.","Vui như hội.","Dai như đỉa.","Chăm chỉ như ong.","Tối như hũ nút.","Nhanh như gió."],"other":["Ăn cháo đá bát.","Đi đêm có ngày gặp ma.","Nói có sách, mách có chứng.","Môi hở răng lạnh.","Có thực mới vực được đạo.","Qua cầu rút ván.","Nước đổ lá khoai.","Học một biết mười."]},"paras":{"family":["Nhà em có bốn người. Ba làm kỹ sư, mẹ là cô giáo. Em và chị gái đang học tiểu học. Buổi tối, cả nhà cùng ăn cơm và kể chuyện vui.","Bà ngoại em sống ở miền quê. Mỗi dịp hè, em về thăm bà. Bà nấu cho em những món ăn ngon. Em rất yêu bà ngoại."],"school":["Trường em có sân rộng và nhiều cây xanh. Giờ ra chơi, chúng em nhảy dây, đá cầu và chơi trốn tìm. Em rất yêu ngôi trường của mình.","Cô giáo em tên là Lan. Cô dạy chúng em đọc, viết và làm toán. Cô luôn nhẹ nhàng và kiên nhẫn. Em luôn biết ơn cô giáo."],"homeland":["Quê em có con sông hiền hòa chảy qua cánh đồng lúa. Mùa gặt, cánh đồng vàng rực dưới nắng. Trẻ con chạy nhảy thả diều trên đê. Em yêu quê hương em biết bao.","Làng em nằm bên bờ biển xanh. Sáng sớm, ngư dân ra khơi đánh cá. Chiều đến, thuyền về đầy ắp tôm cá. Tiếng cười nói vang lên khắp bến."],"tet":["Tết đến, nhà nhà đều dọn dẹp và trang trí thật đẹp. Em cùng mẹ cắm hoa mai vàng. Đêm giao thừa, cả nhà ngồi xem pháo hoa. Em được ông bà lì xì và chúc năm mới.","Mùa xuân về, cây cối đâm chồi nảy lộc. Hoa đào, hoa mai nở rộ khắp nơi. Chim én bay lượn trên bầu trời trong xanh. Ai cũng thấy lòng mình vui tươi."],"friends":["Em có một người bạn thân tên là Minh. Hai đứa em ngồi cùng bàn và hay giúp nhau học bài. Có lần em quên bút, Minh cho em mượn. Em cảm ơn bạn rất nhiều.","Chúng em cùng chơi nhảy dây trong giờ ra chơi. Bạn nào ngã, cả nhóm đều chạy đến đỡ dậy. Tình bạn của chúng em thật đẹp."],"animals":["Nhà em nuôi một chú chó tên là Vàng. Vàng rất thông minh và trung thành. Mỗi sáng, Vàng chạy theo em ra cổng trường. Chiều về, Vàng đã đứng chờ em ở đó.","Đàn kiến chăm chỉ tha mồi về tổ. Chúng đi thành hàng dài không bao giờ lạc đường. Em học được từ kiến tính siêng năng."],"nature":["Buổi sáng, mặt trời nhô lên sau dãy núi. Ánh nắng vàng chiếu xuống thung lũng xanh mướt. Sương mai long lanh trên những ngọn cỏ. Không khí trong lành làm em thấy khỏe khoắn.","Cơn mưa chiều bỗng đổ xuống thật to. Đường phố vắng hẳn đi, chỉ còn tiếng mưa rơi. Một lúc sau, trời tạnh và cầu vồng xuất hiện.","Em đi biển cùng gia đình vào dịp hè. Nước biển trong xanh và sóng vỗ rì rào. Em xây lâu đài cát và nhặt vỏ sò. Em ước mùa hè này kéo dài mãi."],"habits":["Mỗi ngày em đọc sách trước khi ngủ. Những câu chuyện hay giúp em mở mang hiểu biết. Em còn học được nhiều điều từ nhân vật trong truyện.","Muốn có sức khỏe tốt, em phải ăn uống đủ chất. Mỗi sáng em tập thể dục và uống nhiều nước. Em đi ngủ sớm để mai dậy sớm đến trường.","Chúng em cùng nhau giữ gìn trường lớp sạch đẹp. Rác thải được bỏ đúng nơi quy định. Em trồng thêm cây xanh để không khí trong lành hơn."]}};
const VN_TONES={'\u0301':1,'\u0300':1,'\u0309':1,'\u0303':1,'\u0323':1};
function splitVn(ch){if(ch==='đ'||ch==='Đ')return {b:'d',mod:'-',tone:''};const d=ch.normalize('NFD');let mod='',tone='';for(let i=1;i<d.length;i++){const c=d[i];if(c==='\u0302')mod='^';else if(c==='\u0306')mod='(';else if(c==='\u031B')mod='+';else if(VN_TONES[c])tone=c;}return {b:d[0].toLowerCase(),mod,tone};}
const LT=w=>Array.from(String(w).normalize('NFC')).filter(c=>/\p{L}/u.test(c)).map(splitVn);   // chữ gốc, dấu phụ và dấu thanh của từng chữ cái
const vi=text=>it(text.normalize('NFC'),{vn:true});   // bài tiếng Việt: bé gõ bằng bộ gõ tiếng Việt của máy
const vpick=(list,n)=>shuffle(list).slice(0,Math.min(n,list.length)).map(vi);
const vflat=o=>Object.values(o).flat();
const VPOOL=[...new Set([].concat(vflat(VN.topics),VN.extra,VN.words2))];
const hasL=(w,f)=>LT(w).some(f);
const vfeat=(f,n,pool)=>{pool=pool||VPOOL;const l=pool.filter(w=>hasL(w,f));return vpick(l.length>=4?l:pool,n);};
const isA=l=>l.b==='a'&&l.mod==='^',isE=l=>l.b==='e'&&l.mod==='^',isO=l=>l.b==='o'&&l.mod==='^',isAw=l=>l.b==='a'&&l.mod==='(',isOw=l=>l.b==='o'&&l.mod==='+',isUw=l=>l.b==='u'&&l.mod==='+',isD=l=>l.mod==='-';
const isTone=t=>l=>l.tone===t,T_S='́',T_F='̀',T_R='̉',T_X='̃',T_J='̣';
const vowelPair=w=>{const a=LT(w);for(let i=0;i<a.length-1;i++){const x=a[i],y=a[i+1];if((x.b==='u'&&x.mod==='+'&&y.b==='o'&&y.mod==='+')||(x.b==='u'&&!x.mod&&y.b==='o'&&y.mod==='^')||(x.b==='i'&&y.b==='e'&&y.mod==='^')||(x.b==='y'&&y.b==='e'&&y.mod==='^'))return true;}return false;};
const VNUM=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín','mười','mười một','mười hai','mười ba','mười bốn','mười lăm','mười sáu','mười bảy','mười tám','mười chín','hai mươi'];
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const vSum=()=>Array.from({length:6},()=>{const a=ri(1,10),b=ri(0,20-a);return vi(cap1(VNUM[a]+' cộng '+VNUM[b]+' bằng '+VNUM[a+b]+'.'));});
const vSub=()=>Array.from({length:6},()=>{const a=ri(5,20),b=ri(1,a);return vi(cap1(VNUM[a]+' trừ '+VNUM[b]+' bằng '+VNUM[a-b]+'.'));});
const vDate=()=>Array.from({length:5},()=>vi('Hôm nay là ngày '+ri(1,28)+' tháng '+ri(1,12)+' năm '+ri(2024,2030)+'.'));
const vTime=()=>Array.from({length:5},()=>{const m=rand([0,15,30,45]);return vi('Bây giờ là '+ri(1,12)+' giờ'+(m?' '+m+' phút.':' đúng.'));});
const vMoney=()=>Array.from({length:5},()=>vi(rand(['Một ký cam giá ','Một ký xoài giá ','Một quyển vở giá ','Một ly sữa giá '])+ri(5,90)+'.000 đồng.'));
const vCalc=()=>Array.from({length:6},()=>{const a=ri(1,20),b=ri(1,20);return vi(rand([a+' + '+b+' = '+(a+b),(a+b)+' - '+b+' = '+a,ri(2,9)+' x '+ri(2,9)+' = ?']));});
const vFullName=()=>Array.from({length:6},()=>vi(rand(VN.surnames)+' '+rand(['Văn','Thị','Minh','Ngọc','Hữu','Thanh'])+' '+rand(VN.givenNames)));
const vParaPairs=()=>vflat(VN.paras).length?Object.values(VN.paras).filter(a=>a.length>=2).map(a=>a.slice(0,2).join(' ')):[];
const viUnits=()=>[
  {id:'v6mod',title:'Chữ có mũ và móc',desc:'Bật bộ gõ tiếng Việt của máy rồi gõ các chữ có mũ và móc: â ê ô ă ơ ư đ. Chữ em gõ hiện trong ô bên dưới.',steps:[
    {id:'aa',name:'Chữ â',gen:()=>vfeat(isA,8)},{id:'ee',name:'Chữ ê',gen:()=>vfeat(isE,8)},{id:'oo',name:'Chữ ô',gen:()=>vfeat(isO,8)},
    {id:'aw',name:'Chữ ă',gen:()=>vfeat(isAw,8)},{id:'ow',name:'Chữ ơ',gen:()=>vfeat(isOw,8)},{id:'uw',name:'Chữ ư',gen:()=>vfeat(isUw,8)},
    {id:'dd',name:'Chữ đ',gen:()=>vfeat(isD,8)},{id:'mix',name:'Ôn chữ có mũ và móc',gen:()=>vfeat(l=>isA(l)||isE(l)||isO(l)||isAw(l)||isOw(l)||isUw(l)||isD(l),10)}]},
  {id:'v6tone',title:'Năm dấu thanh',desc:'Gõ đủ năm dấu thanh: sắc, huyền, hỏi, ngã, nặng, bằng bộ gõ tiếng Việt của máy.',steps:[
    {id:'sac',name:'Dấu sắc',gen:()=>vfeat(isTone(T_S),8)},{id:'huyen',name:'Dấu huyền',gen:()=>vfeat(isTone(T_F),8)},{id:'hoi',name:'Dấu hỏi',gen:()=>vfeat(isTone(T_R),8)},
    {id:'nga',name:'Dấu ngã',gen:()=>vfeat(isTone(T_X),8)},{id:'nang',name:'Dấu nặng',gen:()=>vfeat(isTone(T_J),8)},
    {id:'ngang',name:'Không dấu',gen:()=>vpick(VPOOL.filter(w=>!hasL(w,l=>l.tone)),8)},
    {id:'tron',name:'Trộn các dấu',gen:()=>vfeat(l=>l.tone===T_S||l.tone===T_F||l.tone===T_R||l.tone===T_X||l.tone===T_J,10)},
    {id:'tong',name:'Ôn dấu thanh',gen:()=>vpick(VPOOL,10)}]},
  {id:'v6topic',title:'Từ vựng theo chủ đề',desc:'Gõ từ tiếng Việt quen thuộc, mỗi bài một chủ đề.',steps:
    [['family','Gia đình'],['animals','Con vật'],['fruit','Trái cây'],['food','Món ăn'],['school','Trường học'],['body','Cơ thể'],['nature','Thiên nhiên'],['colors','Màu sắc'],['numbers','Số đếm'],['jobs','Nghề nghiệp']]
      .map(([id,name])=>({id,name,gen:()=>vpick(VN.topics[id],8)}))},
  {id:'v7two',title:'Từ ghép hai tiếng',desc:'Từ có hai tiếng, từ dễ đến khó.',steps:[
    {id:'dg',name:'Chỉ có dấu thanh',gen:()=>vpick(VN.words2.filter(w=>!hasL(w,l=>l.mod)),8)},
    {id:'mu',name:'Có â, ê, ô',gen:()=>vfeat(l=>isA(l)||isE(l)||isO(l),8,VN.words2)},
    {id:'mo',name:'Có ă, ơ, ư, đ',gen:()=>vfeat(l=>isAw(l)||isOw(l)||isUw(l)||isD(l),8,VN.words2)},
    {id:'van',name:'Vần khó: ươ, uô, iê',gen:()=>vpick(VN.words2.filter(vowelPair),8)},
    {id:'cuoi',name:'Cuối ng, nh, ch',gen:()=>vpick(VN.words2.filter(w=>/(ng|nh|ch)(\s|$)/.test(w)),8)},
    {id:'tron',name:'Trộn từ ghép',gen:()=>vpick(VN.words2,10)}]},
  {id:'v7phr',title:'Cụm từ ba, bốn tiếng',desc:'Gõ cả cụm từ, nhớ dùng ngón cái bấm phím cách.',steps:[
    {id:'gd',name:'Gia đình',gen:()=>vpick(VN.phrases.family,6)},{id:'th',name:'Trường học',gen:()=>vpick(VN.phrases.school,6)},{id:'tn',name:'Thiên nhiên',gen:()=>vpick(VN.phrases.nature,6)},
    {id:'an',name:'Ăn uống',gen:()=>vpick(VN.phrases.food,6)},{id:'ch',name:'Vui chơi',gen:()=>vpick(VN.phrases.play,6)},{id:'tron',name:'Trộn các cụm',gen:()=>vpick(vflat(VN.phrases),8)}]},
  {id:'v7sen',title:'Câu ngắn',desc:'Câu có chữ hoa đầu câu và dấu chấm.',steps:[
    {id:'gd',name:'Gia đình',gen:()=>vpick(VN.short.family,6)},{id:'th',name:'Trường học',gen:()=>vpick(VN.short.school,6)},{id:'tn',name:'Thiên nhiên',gen:()=>vpick(VN.short.nature,6)},
    {id:'an',name:'Ăn uống',gen:()=>vpick(VN.short.food,6)},{id:'ch',name:'Vui chơi',gen:()=>vpick(VN.short.play,6)},{id:'tron',name:'Trộn các câu',gen:()=>vpick(vflat(VN.short),8)}]},
  {id:'v7name',title:'Tên riêng và chữ hoa',desc:'Chữ cái đầu viết hoa: giữ Shift rồi gõ chữ. Tên người, tên nơi chốn, thứ và tháng.',steps:[
    {id:'ten',name:'Tên các bạn',gen:()=>vpick(VN.givenNames,8)},{id:'hoten',name:'Họ và tên',gen:vFullName},{id:'tinh',name:'Tên thành phố, tỉnh',gen:()=>vpick(VN.places,8)},
    {id:'thu',name:'Thứ trong tuần',gen:()=>vpick(VN.days,7)},{id:'thang',name:'Tháng trong năm',gen:()=>vpick(VN.months,8)},
    {id:'tron',name:'Ôn tên riêng',gen:()=>vpick([].concat(VN.givenNames,VN.places,VN.days,VN.months),10)}]},
  {id:'v8long',title:'Câu dài',desc:'Câu dài hơn, nhiều tiếng, có dấu phẩy và dấu chấm.',steps:[
    {id:'gd',name:'Gia đình',gen:()=>vpick(VN.long.family,5)},{id:'th',name:'Trường học',gen:()=>vpick(VN.long.school,5)},{id:'tn',name:'Thiên nhiên',gen:()=>vpick(VN.long.nature,5)},
    {id:'mua',name:'Mùa và thời tiết',gen:()=>vpick(VN.long.season,5)},{id:'tt',name:'Thể thao',gen:()=>vpick(VN.long.sport,5)},{id:'an',name:'Ăn uống',gen:()=>vpick(VN.long.food,5)},
    {id:'dv',name:'Con vật',gen:()=>vpick(VN.long.animals,5)},{id:'tron',name:'Trộn các câu dài',gen:()=>vpick(vflat(VN.long),6)}]},
  {id:'v8punc',title:'Dấu câu tiếng Việt',desc:'Dấu phẩy, hỏi, chấm than, hai chấm, ngoặc kép và gạch đầu dòng. Dấu ? ! : " cần giữ Shift.',steps:[
    {id:'phay',name:'Dấu phẩy',gen:()=>vpick(VN.punct.comma,6)},{id:'hoi',name:'Dấu hỏi',gen:()=>vpick(VN.punct.question,6)},{id:'than',name:'Dấu chấm than',gen:()=>vpick(VN.punct.exclaim,6)},
    {id:'haicham',name:'Dấu hai chấm',gen:()=>vpick(VN.punct.colon,6)},{id:'kep',name:'Dấu ngoặc kép',gen:()=>vpick(VN.punct.quote,5)},{id:'gach',name:'Gạch đầu dòng',gen:()=>vpick(VN.punct.dash,4)},
    {id:'hoidap',name:'Hỏi và đáp',gen:()=>vpick(VN.qa,4)},{id:'tron',name:'Ôn dấu câu',gen:()=>vpick([].concat(vflat(VN.punct),VN.qa),8)}]},
  {id:'v8num',title:'Số, ngày tháng và giờ',desc:'Số viết bằng chữ, phép tính, ngày tháng, giờ và tiền.',steps:[
    {id:'cong',name:'Phép cộng bằng chữ',gen:vSum},{id:'tru',name:'Phép trừ bằng chữ',gen:vSub},{id:'ngay',name:'Ngày tháng năm',gen:vDate},
    {id:'gio',name:'Xem giờ',gen:vTime},{id:'tien',name:'Giá tiền',gen:vMoney},{id:'pt',name:'Phép tính bằng số',gen:vCalc}]},
  {id:'v9tn',title:'Tục ngữ',desc:'Những câu tục ngữ quen thuộc của ông bà.',steps:[
    {id:'study',name:'Về học tập',gen:()=>vpick(VN.proverbs.study,4)},{id:'family',name:'Về gia đình',gen:()=>vpick(VN.proverbs.family,4)},{id:'people',name:'Về tình người',gen:()=>vpick(VN.proverbs.people,4)},
    {id:'work',name:'Về lao động',gen:()=>vpick(VN.proverbs.work,4)},{id:'weather',name:'Về thời tiết',gen:()=>vpick(VN.proverbs.weather,4)},{id:'tron',name:'Trộn tục ngữ',gen:()=>vpick(vflat(VN.proverbs),5)}]},
  {id:'v9cd',title:'Ca dao',desc:'Những bài ca dao dân gian, mỗi bài hai đến bốn câu.',steps:[
    {id:'parents',name:'Cha mẹ và thầy cô',gen:()=>vpick(VN.cadao.parents,2)},{id:'home',name:'Quê hương',gen:()=>vpick(VN.cadao.home,2)},
    {id:'work',name:'Lao động, tình người',gen:()=>vpick(VN.cadao.work,2)},{id:'animals',name:'Con cò, thời tiết',gen:()=>vpick(VN.cadao.animals,2)}]},
  {id:'v9dd',title:'Đồng dao',desc:'Những bài đồng dao vui của trẻ em.',steps:[
    {id:'dd1',name:'Đồng dao 1',gen:()=>vpick(VN.dongdao,2)},{id:'dd2',name:'Đồng dao 2',gen:()=>vpick(VN.dongdao,3)},{id:'dd3',name:'Đồng dao 3',gen:()=>vpick(VN.dongdao,4)}]},
  {id:'v9id',title:'So sánh và thành ngữ',desc:'Những câu nói ngắn, dễ nhớ.',steps:[
    {id:'s1',name:'So sánh 1',gen:()=>vpick(VN.idioms.similes1,8)},{id:'s2',name:'So sánh 2',gen:()=>vpick(VN.idioms.similes2,8)},
    {id:'other',name:'Thành ngữ',gen:()=>vpick(VN.idioms.other,8)},{id:'tron',name:'Trộn các câu nói',gen:()=>vpick(vflat(VN.idioms),10)}]},
  {id:'v9mix',title:'Thử thách dân gian',desc:'Trộn tục ngữ, ca dao, đồng dao và thành ngữ.',steps:[
    {id:'a',name:'Thử thách 1',gen:()=>vpick([].concat(vflat(VN.proverbs),vflat(VN.idioms)),8)},
    {id:'b',name:'Thử thách 2',gen:()=>vpick([].concat(vflat(VN.proverbs),vflat(VN.cadao)),5)},
    {id:'c',name:'Thử thách 3',gen:()=>vpick([].concat(vflat(VN.cadao),VN.dongdao,vflat(VN.proverbs)),5)}]},
  {id:'v10para',title:'Đoạn văn ngắn',desc:'Mỗi bài là một hai đoạn văn về một chủ đề.',steps:
    [['family','Gia đình'],['school','Trường học'],['homeland','Quê hương'],['tet','Mùa xuân và Tết'],['friends','Bạn bè'],['animals','Con vật'],['nature','Thiên nhiên và biển'],['habits','Thói quen tốt']]
      .map(([id,name])=>({id,name,gen:()=>vpick(VN.paras[id],2)}))},
  {id:'v10long',title:'Đoạn văn dài',desc:'Hai đoạn văn nối nhau, gõ một mạch.',steps:[
    {id:'l1',name:'Đoạn văn dài 1',gen:()=>vpick(vParaPairs(),1)},{id:'l2',name:'Đoạn văn dài 2',gen:()=>vpick(vParaPairs(),1)},
    {id:'l3',name:'Đoạn văn dài 3',gen:()=>vpick(vParaPairs(),2)},{id:'l4',name:'Đoạn văn dài 4',gen:()=>vpick(vParaPairs(),2)}]},
  {id:'v10speed',title:'Thử thách tốc độ',desc:'Nhiều đoạn văn liền nhau. Gõ đều tay và chính xác trước, nhanh sẽ đến sau.',steps:[
    {id:'c1',name:'Thử thách 1',gen:()=>vpick(vflat(VN.paras),3)},{id:'c2',name:'Thử thách 2',gen:()=>vpick(vflat(VN.paras),3)},
    {id:'c3',name:'Thử thách 3',gen:()=>vpick(vflat(VN.paras),4)},{id:'c4',name:'Thử thách 4',gen:()=>vpick(vflat(VN.paras),4)}]},
  {id:'v10final',title:'Tổng ôn tiếng Việt',desc:'Ôn lại tất cả: từ khó, câu dài, tục ngữ và đoạn văn.',steps:[
    {id:'ton1',name:'Từ khó',gen:()=>vpick(VN.words2.concat(VPOOL).filter(w=>vowelPair(w)||hasL(w,isOw)&&hasL(w,isUw)),12)},
    {id:'ton2',name:'Câu dài',gen:()=>vpick(vflat(VN.long),6)},{id:'ton3',name:'Tục ngữ',gen:()=>vpick(vflat(VN.proverbs),5)},{id:'ton4',name:'Đoạn văn',gen:()=>vpick(vflat(VN.paras),3)}]}
];
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
  {id:'fing',bonus:true,title:'Luyện từng ngón',desc:'Mỗi bài luyện một ngón tay, từ ngón út đến ngón trỏ.',steps:[
    {id:'l5',name:'Út trái',gen:()=>letters('qazasdf','qaz',10)},{id:'l4',name:'Áp út trái',gen:()=>letters('wsxdf','wsx',10)},
    {id:'l3',name:'Giữa trái',gen:()=>letters('edcfj','edc',10)},{id:'l2',name:'Trỏ trái',gen:()=>letters('rfvtgb','rfvtgb',10)},
    {id:'r2',name:'Trỏ phải',gen:()=>letters('yhnujm','yhnujm',10)},{id:'r3',name:'Giữa phải',gen:()=>letters('ikfj','ik',10)},
    {id:'r4',name:'Áp út phải',gen:()=>letters('olfj','ol',10)},{id:'r5',name:'Út phải',gen:()=>letters('pojkl','p',10)}]},
  {id:'rhy',bonus:true,title:'Gõ đều và nhanh',desc:'Luyện nhịp tay: tay trái, tay phải, hai tay luân phiên và phím cách.',steps:[
    {id:'lh',name:'Từ tay trái',gen:()=>pick(LEFT_W,10)},{id:'rh',name:'Từ tay phải',gen:()=>pick(RIGHT_W,10)},
    {id:'alt',name:'Hai tay luân phiên',gen:()=>pick(ALT_W,10)},{id:'dbl',name:'Chữ đôi',gen:()=>pick(DBL_W,10)},
    {id:'spc',name:'Nhịp phím cách',gen:()=>Array.from({length:8},()=>it(rand(SMALL_W)+' '+rand(SMALL_W)+' '+rand(SMALL_W)))},
    {id:'fast',name:'Gõ nhanh từ ngắn',gen:()=>pick(byLen(DICT,3,4),12)}]},
  {id:'words',title:'Từ tiếng Anh có hình',desc:'Nghe từ, nhìn hình, rồi gõ. Mỗi chủ đề có 2 bài: từ ngắn trước, từ dài sau.',steps:
    (()=>{const mk=id=>{const [a,b]=topicParts(id),bn=!!TOPICS[id].bonus;return [{id:id+'1',name:TOPICS[id].name+' 1',bonus:bn,gen:()=>pics(a,8)},{id:id+'2',name:TOPICS[id].name+' 2',bonus:bn,gen:()=>pics(b,8)}];};
      const ids=Object.keys(TOPICS);
      return ids.filter(id=>!TOPICS[id].bonus).flatMap(mk)
        .concat([{id:'mixs',name:'Trộn từ ngắn',gen:()=>pics(PICS.filter(w=>w[0].length<=4),10)},{id:'mixl',name:'Trộn từ dài',gen:()=>pics(PICS.filter(w=>w[0].length>=5),8)}])
        .concat(ids.filter(id=>TOPICS[id].bonus).flatMap(mk));})()},
  {id:'phr',title:'Cụm từ và câu',desc:'Gõ cả cụm, nhớ dùng ngón cái để bấm phím cách.',steps:[
    {id:'p2',name:'Cụm 2 từ',gen:()=>pick(PHR2,8)},{id:'p3',name:'Cụm 3 từ',gen:()=>pick(PHR3,6)},{id:'p4',name:'Cụm 4 từ',gen:()=>pick(PHR4,6)},
    {id:'s1',name:'Câu ngắn',gen:()=>pick(SENT_S,6)},{id:'s2',name:'Câu vừa',gen:()=>pick(SENT_M,5)},{id:'s3',name:'Câu dài',gen:()=>pick(SENT_L,3)},
    {id:'math',name:'Câu về Toán',gen:()=>pick(SENT_MATH,5)},{id:'sci',name:'Câu về Khoa học',gen:()=>pick(SENT_SCI,5)},
    {id:'p5',name:'Cụm 5 từ',bonus:true,gen:()=>pick(PHR5,6)},{id:'sh',name:'Câu về nhà',bonus:true,gen:()=>pick(SENT_HOME,5)},
    {id:'sf',name:'Câu về đồ ăn',bonus:true,gen:()=>pick(SENT_FOOD,5)},{id:'st',name:'Câu về đồ chơi',bonus:true,gen:()=>pick(SENT_TOY,5)},
    {id:'sp',name:'Câu về thể thao',bonus:true,gen:()=>pick(SENT_SPORT,5)},{id:'sw',name:'Câu về thời tiết',bonus:true,gen:()=>pick(SENT_WEATHER,5)}]},
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
      .map(([id,name])=>({id,name,gen:()=>pick(PARAS[id],3)}))},
  {id:'sym',adv:true,bonus:true,title:'Dấu và ký hiệu',desc:'Ngoặc kép, gạch nối, ngoặc đơn, hai chấm, tiền và email.',steps:[
    {id:'qt',name:'Ngoặc kép',gen:()=>pick(QUOTES,5)},{id:'hy',name:'Gạch nối',gen:()=>pick(HYPH,7)},
    {id:'pa',name:'Ngoặc đơn',gen:()=>pick(PAREN,5)},{id:'co',name:'Dấu hai chấm',gen:()=>pick(COLON,6)},
    {id:'mo',name:'Tiền và phần trăm',gen:()=>pick(MONEY,8)},{id:'em',name:'Email',gen:()=>pick(EMAIL,5)},
    {id:'sx',name:'Trộn ký hiệu',gen:()=>pick(QUOTES.concat(HYPH,PAREN,COLON,MONEY),8)}]},
  {id:'num2',adv:true,bonus:true,title:'Số lớn và phép tính',desc:'Số ba chữ số, nhân, chia và ngày tháng.',steps:[
    {id:'n3',name:'Số ba chữ số',gen:threeDigit},{id:'mul',name:'Phép nhân',gen:mulGen},{id:'div',name:'Phép chia',gen:divGen},
    {id:'dt',name:'Ngày tháng',gen:dateGen},{id:'mx',name:'Bốn phép tính',gen:calcGen}]},
  {id:'para2',adv:true,bonus:true,title:'Đoạn văn dài hơn',desc:'Mỗi bài là các đoạn văn về một chủ đề mới.',steps:
    [['food','Đồ ăn'],['sport','Thể thao'],['travel','Du lịch'],['garden','Khu vườn'],['story','Truyện ngắn'],['space','Vũ trụ']]
      .map(([id,name])=>({id,name,gen:()=>pick(PARAS2[id],3)}))}
].concat(viUnits());
/* Mỗi bài thuộc một trong 5 cấp độ (g). Bài thêm (b) không bắt buộc để mở cấp độ sau. */
const UNIT_STAGE={home:'bo',top:'bo',bottom:'bo',mix:'di',fing:'di',rhy:'di',words:'chay',phr:'chay',caps:'l4',punct:'l4',num:'l5',para:'l5',sym:'l5',num2:'l5',para2:'l5',v6mod:'l6',v6tone:'l6',v6topic:'l6',v7two:'l7',v7phr:'l7',v7sen:'l7',v7name:'l7',v8long:'l8',v8punc:'l8',v8num:'l8',v9tn:'l9',v9cd:'l9',v9dd:'l9',v9id:'l9',v9mix:'l9',v10para:'l10',v10long:'l10',v10speed:'l10',v10final:'l10'};
const stageIdOf=(u,st)=>u==='words'?(st.bonus?'l4':/^(animals|house|colors|numbers)\d$/.test(st.id)?'di':'chay'):u==='phr'?(st.bonus?'l4':'chay'):UNIT_STAGE[u];
const FLAT=UNITS.flatMap(u=>u.steps.map(st=>({u:u.id,s:st.id,b:!!(u.bonus||st.bonus),g:stageIdOf(u.id,st)})));
const STAGES=[
  {id:'bo',name:'Cấp độ 1',icon:'🐢',desc:'Làm quen từng hàng phím'},
  {id:'di',name:'Cấp độ 2',icon:'🚶',desc:'Cả bàn phím, từng ngón tay và những từ đầu tiên'},
  {id:'chay',name:'Cấp độ 3',icon:'🏃',desc:'Từ tiếng Anh có hình, cụm từ và câu'},
  {id:'l4',name:'Cấp độ 4',icon:'🚴',adv:true,desc:'Từ mới, câu hay gặp, chữ hoa và dấu câu'},
  {id:'l5',name:'Cấp độ 5',icon:'🚀',adv:true,desc:'Số, ký hiệu và đoạn văn dài'},
  {id:'l6',name:'Cấp độ 6',icon:'🛴',desc:'Làm quen gõ tiếng Việt: chữ có mũ, móc và dấu thanh'},
  {id:'l7',name:'Cấp độ 7',icon:'🚌',adv:true,desc:'Từ ghép, cụm từ, câu ngắn và tên riêng'},
  {id:'l8',name:'Cấp độ 8',icon:'🚁',adv:true,desc:'Câu dài, dấu câu, số và ngày tháng'},
  {id:'l9',name:'Cấp độ 9',icon:'🛰️',adv:true,desc:'Tục ngữ, ca dao, đồng dao và thành ngữ'},
  {id:'l10',name:'Cấp độ 10',icon:'🌟',adv:true,desc:'Đoạn văn dài và thử thách tốc độ'}
];
const stageById=id=>STAGES.find(S=>S.id===id);
const stageOfLesson=(u,st)=>{const f=FLAT.find(x=>x.u===u&&x.s===st);return f?stageById(f.g):null;};
function stageDone(S){const all=FLAT.filter(x=>x.g===S.id);return [all.filter(x=>state.best[x.u+':'+x.s]).length,all.length];}
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
const AVATARS=['🐯','🐰','🐼','🦊','🐸','🐱','🐶','🐻','🐨','🐵','🦁','🐮','🐷','🐹','🐭','🐔','🐧','🐦','🦉','🦄','🐲','🐙','🦋','🐢','🐬','🐳','🦖','🦒','🐘','🦓','🐝','🐞','🦀','🐥','🦔'];
const GAMES={
  bubble:{icon:'🫧',name:'Bong bóng chữ',desc:'Bong bóng bay lên, gõ đúng chữ để làm vỡ trước khi bóng bay mất. Có 5 trái tim. Em chọn thời gian chơi ở bên dưới.',
    levels:{mid:{name:'Hàng giữa',keys:'asdfghjkl'},top:{name:'Hàng trên và giữa',keys:'qwertyuiopasdfghjkl'},all:{name:'Cả bàn phím',keys:ALL}}},
  frog:{icon:'🐸',name:'Ếch qua sông',desc:'Gõ chữ trên lá sen để ếch nhảy sang. Qua 10 lá là tới bờ bên kia.',
    levels:{let:{name:'Chữ cái'},w3:{name:'Từ ngắn'},w45:{name:'Từ dài hơn'}}},
  quiz:{icon:'🖼️',name:'Nhìn hình đoán từ',desc:'Nhìn hình, gõ từ tiếng Anh. Gõ sai thì máy gợi ý chữ cái đó. Bấm loa để nghe từ.',
    levels:{w3:{name:'Từ 3 chữ'},w45:{name:'Từ 4–5 chữ'},all:{name:'Trộn tất cả'}}},
  mole:{icon:'🐹',name:'Chuột chũi',desc:'Chuột chũi thò đầu lên khỏi hang, mang theo một chữ. Gõ đúng chữ để đập chuột trước khi nó chui xuống. Em chọn thời gian chơi ở bên dưới.',
    levels:{mid:{name:'Hàng giữa',keys:'asdfghjkl'},top:{name:'Hàng trên và giữa',keys:'qwertyuiopasdfghjkl'},all:{name:'Cả bàn phím',keys:ALL}}},
  rocket:{icon:'🚀',name:'Tên lửa lên trăng',desc:'Gõ thật nhiều từ để tên lửa bay lên cao. Mỗi từ gõ xong là tên lửa lên một nấc. Em chọn thời gian chơi ở bên dưới.',
    levels:{w3:{name:'Từ 3 chữ'},w45:{name:'Từ 4–5 chữ'},phr:{name:'Cụm 2 từ'}}},
  scramble:{icon:'🧩',name:'Xếp chữ',desc:'Nhìn hình, các chữ cái bị xáo trộn. Gõ các chữ theo đúng thứ tự để ghép thành từ. Gõ sai thì chữ đúng sẽ sáng lên.',
    levels:{w3:{name:'Từ 3 chữ'},w45:{name:'Từ 4–5 chữ'},all:{name:'Trộn tất cả'}}}
};
const TIMED={bubble:60,mole:60,rocket:45};                 // thời gian mặc định (giây) của các game tính giờ
const DURS=[30,45,60,90,120,180,300,0];                      // 0 = không giới hạn
const durOf=gid=>{const v=(state.gdur||{})[gid];return v===0||DURS.includes(v)?v:TIMED[gid];};
const gkey=(gid,lvl)=>gid+':'+lvl+(TIMED[gid]&&durOf(gid)!==TIMED[gid]?':'+durOf(gid):'');   // kỷ lục tách riêng theo thời gian chơi
const durLabel=d=>!d?'Không giới hạn':d>=120&&d%60===0?d/60+' phút':d+' giây';
function doneBtn(stage,fn){const b=document.createElement('button');b.type='button';b.className='chip gdone';b.textContent='Xong, xem kết quả';b.addEventListener('click',e=>{e.currentTarget.blur();fn();});stage.appendChild(b);}
const GTAG={bubble:v=>v+' bóng',frog:v=>v+' giây',quiz:v=>v+'/10',mole:v=>v+' chú chuột',rocket:v=>v+' từ',scramble:v=>v+'/8'};

/* ================= Storage ================= */
const DEFAULTS={avatar:'🐯',nick:'',sound:true,music:true,speak:true,chat:true,look:null,limit:45,certs:{},exams:{},tipHands:false,kbFull:false,unlockAll:false,updatedAt:0,sessions:[],miss:{},ghosts:{},best:{},bestWpm:{},gbest:{},gdur:{}};
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
const LIMITS=[15,30,45,60,90];   // giới hạn phút mỗi ngày; mặc định 45
const normLimit=v=>LIMITS.includes(v)?v:typeof v==='number'&&isFinite(v)?LIMITS.reduce((a,b)=>Math.abs(b-v)<Math.abs(a-v)?b:a,LIMITS[2]):LIMITS[2];
const withDefaults=c=>{const s=Object.assign(clone(DEFAULTS),c||{});s.limit=normLimit(s.limit);return s;};   // giá trị cũ (10, 20 phút) chuyển về mức gần nhất
function loadState(pid){return withDefaults(readJSON(K('p:'+pid)));}
function saveProfiles(){if(!uid)return;profiles.updatedAt=Date.now();writeJSON(K('profiles'),profiles);cloudSaveProfiles();}
function save(){
  if(!curPid||!uid)return;
  state.updatedAt=Date.now();if(state.sessions.length>300)state.sessions=state.sessions.slice(-300);
  writeJSON(K('p:'+curPid),state);
  const pe=profiles.list.find(x=>x.id===curPid);
  if(pe&&(pe.nick!==(state.nick||pe.nick)||pe.av!==state.avatar)){pe.nick=(state.nick||pe.nick).slice(0,12);pe.av=state.avatar;saveProfiles();}
  cloudSaveState();
}

/* Tiếng tán thưởng ở màn kết thúc: càng nhiều sao càng to (3 sao có cả vỗ tay). Tôn trọng nút tắt âm thanh. */
function cheer(stars){
  if(!state.sound)return;
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();
    const t0=actx.currentTime+.05;
    const note=(f,t,d,vol=.09,type='triangle')=>{const o=actx.createOscillator(),g=actx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,t0+t);g.gain.exponentialRampToValueAtTime(vol,t0+t+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+t+d);o.connect(g).connect(actx.destination);o.start(t0+t);o.stop(t0+t+d+.05);};
    (stars>=3?[523,659,784,1047,784,1047,1319]:stars===2?[523,659,784,1047]:[523,784]).forEach((f,i)=>note(f,i*.11,.28));
    if(stars>=2){
      const dur=stars>=3?2.2:1.2,n=Math.floor(actx.sampleRate*.05),buf=actx.createBuffer(1,n,actx.sampleRate),d=buf.getChannelData(0);
      for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);
      for(let i=0,c=Math.floor(dur*16);i<c;i++){
        const t=.35+Math.random()*dur,s=actx.createBufferSource(),bp=actx.createBiquadFilter(),g=actx.createGain();
        s.buffer=buf;bp.type='bandpass';bp.frequency.value=1800+Math.random()*2400;bp.Q.value=.8;g.gain.value=(.12+Math.random()*.1)*(1-t/(dur+.5)*.6);
        s.connect(bp).connect(g).connect(actx.destination);s.start(t0+t);
      }
    }
    if(stars>=3)[1047,1319,1568].forEach((f,i)=>note(f,.95+i*.08,.6,.06,'sine'));
  }catch(e){}
}

/* ================= Nhạc nền khi gõ =================
 * Tự tạo bằng WebAudio (không tải file nhạc, không cần mạng). Chỉ dùng giai điệu dân ca / nhạc thiếu nhi
 * đã thuộc phạm vi công cộng (hết thời hạn bản quyền). Mỗi chữ trong 'notes' là nốt:độ dài (đơn vị tick); R là nghỉ. */
const NOTE_IDX={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const noteHz=n=>{const m=/^([A-G])(\d)?$/.exec(n),o=m[2]===undefined?4:+m[2];return 261.63*Math.pow(2,(NOTE_IDX[m[1]]+12*(o-4))/12);};
const SONGS=[
  {name:'Twinkle Twinkle',bpm:300,beat:2,notes:'C:2 C:2 G:2 G:2 A:2 A:2 G:4 F:2 F:2 E:2 E:2 D:2 D:2 C:4 G:2 G:2 F:2 F:2 E:2 E:2 D:4 G:2 G:2 F:2 F:2 E:2 E:2 D:4 C:2 C:2 G:2 G:2 A:2 A:2 G:4 F:2 F:2 E:2 E:2 D:2 D:2 C:4'},
  {name:'Mary Had a Little Lamb',bpm:310,beat:2,notes:'E:2 D:2 C:2 D:2 E:2 E:2 E:4 D:2 D:2 D:4 E:2 G:2 G:4 E:2 D:2 C:2 D:2 E:2 E:2 E:2 E:2 D:2 D:2 E:2 D:2 C:8'},
  {name:'Old MacDonald',bpm:320,beat:2,notes:'C:2 C:2 C:2 G:2 A:2 A:2 G:4 E:2 E:2 D:2 D:2 C:4 R:4 C:2 C:2 C:2 G:2 A:2 A:2 G:4 E:2 E:2 D:2 D:2 C:8'},
  {name:'Row Row Row Your Boat',bpm:330,beat:3,notes:'C:3 C:3 C:2 D:1 E:3 E:2 D:1 E:2 F:1 G:6 C5:1 C5:1 C5:1 G:1 G:1 G:1 E:1 E:1 E:1 C:1 C:1 C:1 G:2 F:1 E:2 D:1 C:6'},
  {name:'Jingle Bells',bpm:340,beat:2,notes:'E:2 E:2 E:4 E:2 E:2 E:4 E:2 G:2 C:3 D:1 E:8 F:2 F:2 F:3 F:1 F:2 E:2 E:2 E:1 E:1 E:2 D:2 D:2 E:2 D:4 G:4'},
  {name:'London Bridge',bpm:310,beat:2,notes:'G:3 A:1 G:2 F:2 E:2 F:2 G:4 D:2 E:2 F:4 E:2 F:2 G:4 G:3 A:1 G:2 F:2 E:2 F:2 G:4 D:4 G:4 E:2 C:6'},
  {name:'Frère Jacques',bpm:320,beat:2,notes:'C:2 D:2 E:2 C:2 C:2 D:2 E:2 C:2 E:2 F:2 G:4 E:2 F:2 G:4 G:1 A:1 G:1 F:1 E:2 C:2 G:1 A:1 G:1 F:1 E:2 C:2 C:2 G3:2 C:4 C:2 G3:2 C:4'},
  {name:'Ode to Joy',bpm:310,beat:2,notes:'E:2 E:2 F:2 G:2 G:2 F:2 E:2 D:2 C:2 C:2 D:2 E:2 E:3 D:1 D:4 E:2 E:2 F:2 G:2 G:2 F:2 E:2 D:2 C:2 C:2 D:2 E:2 D:3 C:1 C:4'},
  {name:'Hot Cross Buns',bpm:330,beat:2,notes:'E:2 D:2 C:4 E:2 D:2 C:4 C:1 C:1 C:1 C:1 D:1 D:1 D:1 D:1 E:2 D:2 C:4'},
  {name:'Happy Birthday',bpm:290,beat:2,notes:'G:1 G:1 A:2 G:2 C5:2 B:4 G:1 G:1 A:2 G:2 D5:2 C5:4 G:1 G:1 G5:2 E5:2 C5:2 B:2 A:2 F5:1 F5:1 E5:2 C5:2 D5:2 C5:4'}
].map(x=>Object.assign(x,{seq:x.notes.split(' ').map(t=>{const [n,d]=t.split(':');return {f:n==='R'?0:noteHz(n),d:+d};})}));
const MU={on:false,timer:0,gain:null,list:[],si:0,ni:0,t:0,k:0,hat:null};
function musicTone(f,t,dur){
  const g=actx.createGain(),o=actx.createOscillator(),o2=actx.createOscillator(),g2=actx.createGain(),end=t+Math.min(.55,Math.max(.12,dur*1.1));
  o.type='triangle';o.frequency.value=f;o2.type='sine';o2.frequency.value=f*2;g2.gain.value=.35;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.055,t+.01);g.gain.exponentialRampToValueAtTime(.0001,end);
  o.connect(g);o2.connect(g2).connect(g);g.connect(MU.gain);o.start(t);o2.start(t);o.stop(end+.02);o2.stop(end+.02);
}
function musicHat(t){
  if(!MU.hat){const n=Math.floor(actx.sampleRate*.04),b=actx.createBuffer(1,n,actx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);MU.hat=b;}
  const s=actx.createBufferSource(),hp=actx.createBiquadFilter(),g=actx.createGain();s.buffer=MU.hat;hp.type='highpass';hp.frequency.value=6500;g.gain.value=.03;
  s.connect(hp).connect(g).connect(MU.gain);s.start(t);
}
function musicPump(){
  if(!MU.on||!actx)return;
  while(MU.t<actx.currentTime+.5){
    const song=MU.list[MU.si],n=song.seq[MU.ni],tick=60/song.bpm;
    for(let i=0;i<n.d;i++)if((MU.k+i)%song.beat===0)musicHat(MU.t+i*tick);
    if(n.f)musicTone(n.f,MU.t,n.d*tick);
    MU.t+=n.d*tick;MU.k+=n.d;MU.ni++;
    if(MU.ni>=song.seq.length){MU.ni=0;MU.k=0;MU.si++;MU.t+=tick*3;if(MU.si>=MU.list.length){MU.list=shuffle(SONGS);MU.si=0;}}
  }
}
function musicStart(){
  if(MU.on||!state.music)return;
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();
    MU.gain=actx.createGain();MU.gain.gain.value=1;MU.gain.connect(actx.destination);}catch(e){return;}
  if(!MU.list.length||MU.si>=MU.list.length){MU.list=shuffle(SONGS);MU.si=0;}
  MU.ni=0;MU.k=0;MU.t=actx.currentTime+.2;MU.on=true;MU.timer=setInterval(musicPump,120);musicPump();
}
function musicStop(){
  if(!MU.on)return;MU.on=false;clearInterval(MU.timer);
  const g=MU.gain;if(g&&actx){try{g.gain.cancelScheduledValues(actx.currentTime);g.gain.setValueAtTime(g.gain.value,actx.currentTime);g.gain.linearRampToValueAtTime(0,actx.currentTime+.2);}catch(e){}setTimeout(()=>{try{g.disconnect();}catch(e){}},400);}
  MU.si++;MU.ni=0;MU.k=0;                          // lần sau bắt đầu bằng bài khác
}
function musicSync(){(state.music&&(screen==='play'||screen==='game')&&!document.hidden)?musicStart():musicStop();}
document.addEventListener('visibilitychange',musicSync);

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
      if(curPid===pid&&(c.updatedAt||0)>(state.updatedAt||0)){state=withDefaults(c);writeJSON(K('p:'+pid),state);syncToggles();if(screen==='home'){stageSel=null;renderHome();}updateLobbyPresence();}
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
  ['home','play','game','results','parent','online','login','world','auth','cert'].forEach(s=>$('#s-'+s).hidden=s!==name);
  $('#deck').hidden=!(name==='home'||name==='play'||name==='game');
  $('#home-bottom').hidden=name!=='home';
  ensureKB(needFull());
  if(name==='home')renderHome();
  if(name==='parent')renderParent();
  if(name==='login')renderLogin();
  $('#who').disabled=name==='login';$('#to-parent').hidden=!uid;$('#logout-top').hidden=!uid;$('#kbt').hidden=!uid;
  if(name!=='play'&&name!=='game')window.scrollTo(0,0);
  updateOnlineCount();
  updateLobbyPresence();
  musicSync();
}
function syncToggles(){
  $$('.tg-sound').forEach(b=>b.setAttribute('aria-pressed',String(state.sound)));
  $$('.tg-music').forEach(b=>b.setAttribute('aria-pressed',String(state.music)));
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
  if(s.unit==='exam'){const S=stageById(s.step);return 'Kiểm tra '+(S?S.name:'');}
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
function setTab(t){tab=t;$$('.tab[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));['lessons','games','race'].forEach(x=>$('#tab-'+x).hidden=x!==t);}
$$('.tab[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
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
  if(SSlk){const [pd,pn]=stageDoneFor(state,prevS);$('#progress').textContent=SS.name+' đang khoá. Em cần xong hết '+pn+' bài của '+prevS.name+' (còn '+(pn-pd)+' bài) thì cấp độ này mới mở.';}
  else $('#progress').textContent=SS.name+': em đã xong '+sd+' trên '+sn+' bài.'+(SS.adv?' Cấp độ này có bài dùng bàn phím đầy đủ với phím Shift.':'')+' Mỗi lần chơi là một đề mới.';
  const cb=$('#cert-open'),en=$('#exam-note'),ex=state.exams[SS.id];
  if(state.certs[SS.id]){cb.hidden=false;cb.textContent='🏅 Xem chứng chỉ';cb.onclick=()=>openCert(SS.id);en.textContent='';}
  else if(stageComplete(SS)){cb.hidden=false;cb.textContent=ex&&ex.tries?'📝 Thi lại':'📝 Làm bài kiểm tra';cb.onclick=()=>startExam(SS);
    en.textContent=ex&&ex.tries?'Lần tốt nhất: '+ex.best+'%. Cần từ '+Math.round(EXAM_PASS*100)+'% để qua.':'Gõ đúng từ '+Math.round(EXAM_PASS*100)+'% là qua và nhận chứng chỉ.';}
  else{cb.hidden=true;en.textContent='';}
  const ul=$('#units');ul.innerHTML='';
  UNITS.filter(U=>U.steps.some(st=>stageIdOf(U.id,st)===SS.id)).forEach((U,ui)=>{
    const li=document.createElement('li');li.className='lesson';
    li.innerHTML='<span class="num">'+(ui+1)+'</span><h2>'+esc(U.title)+'</h2><p>'+esc(U.desc)+'</p><div class="acts"></div>';
    const acts=li.querySelector('.acts');
    U.steps.filter(st=>stageIdOf(U.id,st)===SS.id).forEach(st=>{const b=document.createElement('button');b.type='button';b.className='chip';
      const best=state.best[U.id+':'+st.id]||0;b.innerHTML=esc(st.name)+(best?'<span class="st">'+starStr(best)+'</span>':'');
      if(SSlk){b.classList.add('lockedc');b.disabled=true;}
      b.addEventListener('click',()=>startLesson(U.id,st.id));acts.appendChild(b);});
    ul.appendChild(li);
  });
  const gl=$('#games');gl.innerHTML='';
  Object.entries(GAMES).forEach(([gid,G])=>{
    const li=document.createElement('li');li.className='lesson';
    li.innerHTML='<span class="num game-ico" aria-hidden="true">'+G.icon+'</span><h2>'+esc(G.name)+'</h2><p>'+esc(G.desc)+'</p><div class="acts"></div>';
    if(TIMED[gid]){const lb=document.createElement('label');lb.className='gdur';lb.innerHTML='⏱ Thời gian chơi <select aria-label="Thời gian chơi '+esc(G.name)+'"></select>';
      const se=lb.querySelector('select');DURS.forEach(d=>{const o=document.createElement('option');o.value=String(d);o.textContent=durLabel(d)+(d===TIMED[gid]?' (mặc định)':'');if(d===durOf(gid))o.selected=true;se.appendChild(o);});
      se.addEventListener('change',()=>{state.gdur=Object.assign({},state.gdur,{[gid]:+se.value});save();renderHome();});
      li.insertBefore(lb,li.querySelector('.acts'));}
    const acts=li.querySelector('.acts');
    Object.entries(G.levels).forEach(([lid,L])=>{const b=document.createElement('button');b.type='button';b.className='chip';
      const best=state.gbest[gkey(gid,lid)];
      const tag=best==null?'':(GTAG[gid]||(v=>v))(best);
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
    if(t.adv&&!stageUnlocked(STAGES[3])){b.disabled=true;b.classList.add('lockedc');b.innerHTML='🔒 '+b.innerHTML;b.title='Mở khi em lên Cấp độ 4';}
    b.addEventListener('click',()=>startRace(id));tr.appendChild(b);});
}

/* ================= Lesson engine ================= */
function startWpm(){clearInterval(wpmTimer);$('#wpm').textContent='0';wpmTimer=setInterval(updateWpm,400);}
function updateWpm(){if(!game||!game.start)return;if(game.timed&&game.done)return;$('#wpm').textContent=wpmOf(game.chars,(performance.now()-game.start)/1000);}
const HINT_DEFAULT=document.querySelector('#s-play .hint').textContent;
function startLesson(uid,sid){guardStart(()=>{
  const f=findStep(uid,sid);if(!f)return;
  const stg=stageOfLesson(uid,sid);if(stg&&!stageUnlocked(stg))return;if(stg)stageSel=stg.id;
  stopAll();
  const items=f.st.gen();
  const adv=!!f.U.adv||items.some(x=>[...x.t].some(c=>!SIMPLE_SET.has(c)));
  game={kind:'lesson',unit:uid,step:sid,adv,items,i:0,pos:0,errs:0,chars:0,start:0,missLocal:{},locked:false};
  show('play');syncToggles();$('#race').hidden=true;
  $('#s-play .hint').textContent=HINT_DEFAULT;
  startWpm();renderItem();
  if(uid==='home'&&sid==='fj'&&!state.tipHands){state.tipHands=true;save();openHandTip();}
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
/* Bài tiếng Việt: bé bật bộ gõ tiếng Việt của máy (Unikey, EVKey, bàn phím tiếng Việt...) và gõ vào ô bên dưới.
 * Ứng dụng không tự ghép dấu; chỉ so chữ bé gõ với chữ đích. Chữ đang gõ dở (chưa đủ dấu) được so không tính dấu,
 * chữ hoàn chỉnh phải đúng cả dấu. Không sửa nội dung ô giữa chữ để khỏi làm rối bộ gõ; chỉ xoá lại khi bé bấm phím cách mà chữ sai. */
const HINT_VN='Bật bộ gõ tiếng Việt của máy (Unikey, EVKey hoặc bàn phím tiếng Việt) rồi gõ chữ có dấu như trên màn hình. Gõ xong mỗi chữ thì bấm phím cách.';
const foldVn=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');
const commonLen=(a,b)=>{let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return i;};
function renderTargetVn(item){
  const t=$('#target');t.innerHTML='';t.classList.remove('ticker');t.classList.add('vn');t.classList.toggle('small',item.t.length>8&&item.t.length<=40);t.classList.toggle('long',item.t.length>40);
  const line=document.createElement('div');line.className='line';let w=null;
  [...item.t].forEach(c=>{
    if(c===' '){w=null;const s=document.createElement('span');s.className='ch sp';s.textContent=' ';line.appendChild(s);return;}
    if(!w){w=document.createElement('span');w.className='w';line.appendChild(w);}
    const s=document.createElement('span');s.className='ch';s.textContent=c;w.appendChild(s);
  });
  t.appendChild(line);updateTargetVn();
}
function updateTargetVn(){$$('#target .line .ch').forEach((sp,j)=>{sp.classList.toggle('done',j<game.pos);sp.classList.toggle('cur',j===game.pos);});}
function vnStart(){const inp=$('#vn-input');inp.hidden=false;inp.value='';inp.classList.remove('bad');game.vnBase='';game.vnBad=false;setTimeout(()=>inp.focus(),0);}
function vnErr(expected){
  game.errs++;if(expected){state.miss[expected]=(state.miss[expected]||0)+1;game.missLocal[expected]=(game.missLocal[expected]||0)+1;}
  beep(200,.12,'triangle',.05);const inp=$('#vn-input');inp.classList.remove('bad');void inp.offsetWidth;inp.classList.add('bad');
  const cur=$('#target .line .ch.cur');if(cur){cur.classList.remove('shake');void cur.offsetWidth;cur.classList.add('shake');}
}
function vnInput(composing){
  if(screen!=='play'||!game||game.kind!=='lesson'||game.locked)return;
  const item=game.items[game.i];if(!item||!item.vn)return;
  const inp=$('#vn-input'),T=item.t.normalize('NFC'),V=inp.value.normalize('NFC');
  if(!game.start&&V)game.start=performance.now();
  if(!V.startsWith(game.vnBase)){if(!composing)inp.value=game.vnBase;return;}      // bé xoá lùi vào phần đã đúng: giữ lại phần đã đúng
  const rest=V.slice(game.vnBase.length),sp=rest.indexOf(' '),cur=sp<0?rest:rest.slice(0,sp);
  const tw=T.slice(game.vnBase.length).split(' ')[0],last=game.vnBase.length+tw.length>=T.length;
  if(composing){game.pos=game.vnBase.length+Math.min(cur.length,tw.length);updateTargetVn();return;}   // đang gõ dở, chờ bộ gõ ghép xong
  if(cur===tw&&(sp>=0||last)){                                                      // chữ đúng cả dấu
    game.vnBase+=tw+(last?'':' ');game.chars+=tw.length+(last?0:1);game.pos=game.vnBase.length;game.vnBad=false;
    inp.value=game.vnBase;inp.classList.remove('bad');beep(720,.05);updateTargetVn();updateWpm();
    if(last)itemDone();
    return;
  }
  const fc=foldVn(cur),ft=foldVn(tw);
  if(sp>=0){                                                                         // bấm cách mà chữ chưa đúng: xoá chữ đó để gõ lại
    vnErr(tw[commonLen(fc,ft)]||tw[0]);inp.value=game.vnBase;game.pos=game.vnBase.length;game.vnBad=false;updateTargetVn();return;
  }
  if(!ft.startsWith(fc)){                                                            // gõ sai chữ cái: tính một lỗi, bé tự xoá lùi sửa
    if(!game.vnBad){game.vnBad=true;vnErr(tw[commonLen(fc,ft)]||tw[0]);}
    inp.classList.add('bad');
  }else{game.vnBad=false;inp.classList.remove('bad');}
  game.pos=game.vnBase.length+Math.min(commonLen(fc,ft),cur.length);updateTargetVn();
}
function renderItem(){
  const item=game.items[game.i];game.pos=0;renderDots();
  if(item.pic){$('#pic').hidden=false;$('#pic-emoji').textContent=item.pic;$('#pic-vi').textContent=item.vi||'';}else $('#pic').hidden=true;
  if(item.say)say(item.t);
  const hint=$('#s-play .hint'),vin=$('#vn-input');vin.hidden=!item.vn;$('#deck').hidden=!!item.vn;
  if(item.vn){hint.textContent=HINT_VN;showNext(null);renderTargetVn(item);vnStart();return;}
  $('#target').classList.remove('vn','long');if(game.unit!=='exam')hint.textContent=HINT_DEFAULT;
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
  if(game.unit==='exam')return finishExam();
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
  const stg=stageOfLesson(game.unit,game.step);let exam=null;
  if(firstTime&&stg){const [d,n]=stageDone(stg);if(d===n)sub+=' Em đã hoàn thành '+stg.name+'!';
    if(stageComplete(stg)&&!state.certs[stg.id]){exam=stg.id;sub+=' Bài kiểm tra '+stg.name+' đang chờ em. Qua bài kiểm tra là nhận chứng chỉ!';}}
  const u=game.unit,s=game.step,i=FLAT.findIndex(x=>x.u===u&&x.s===s),nx0=i>=0&&i<FLAT.length-1?FLAT[i+1]:null,nx=nx0&&stageUnlocked(stageById(nx0.g))?nx0:null;
  showResults({stars,title:titles[stars],sub,acc,miss:game.missLocal,
    stats:[[wpm,'WPM'],[Math.round(acc*100)+'%','gõ đúng'],[game.chars,'chữ cái'],[fmtTime(secs),'thời gian']],
    again:()=>startLesson(u,s),againLabel:'Chơi lại (đề mới)',next:nx?()=>startLesson(nx.u,nx.s):null,exam});
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
  ag=({bubble:makeBubble,frog:makeFrog,quiz:makeQuiz,mole:makeMole,rocket:makeRocket,scramble:makeScramble}[gid])(lid);
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
  const g={gid:'bubble',level,list:[],score:0,errs:0,chars:0,hearts:5,t0:performance.now(),last:performance.now(),nextSpawn:0,dur:durOf('bubble')?durOf('bubble')*1000:Infinity,ramp:durOf('bubble')?durOf('bubble')*1000:120000,missLocal:{},target:null,over:false};
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
    if(g.over)return;const dt=Math.min(.05,(now-g.last)/1000);g.last=now;const el=now-g.t0,k=Math.min(1,el/g.ramp);
    if(now>=g.nextSpawn){spawn();g.nextSpawn=now+(1800-900*k);}
    const sp=38+45*k,h=stage.clientHeight;
    for(const b of g.list.slice()){b.y+=sp*dt;b.el.style.setProperty('--y',(-b.y)+'px');
      if(b.y>h+10){g.list.splice(g.list.indexOf(b),1);b.el.remove();g.hearts--;beep(160,.15,'triangle',.05);}}
    const top=g.list.reduce((a,b)=>!a||b.y>a.y?b:a,null);
    if(top!==g.target){if(g.target)g.target.el.classList.remove('target');g.target=top;if(top){top.el.classList.add('target');showNext(top.ch);}else showNext(null);}
    hud(stat(g.score,'bóng')+stat('❤️'.repeat(Math.max(0,g.hearts))||'0','')+stat(g.dur===Infinity?Math.floor(el/1000):Math.max(0,Math.ceil((g.dur-el)/1000)),'giây'));
    if(el>=g.dur||g.hearts<=0){
      const secs=el/1000,acc=g.chars/Math.max(1,g.chars+g.errs),key=gkey('bubble',level),prev=state.gbest[key];
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

function makeMole(level){
  const L=GAMES.mole.levels[level],stage=$('#stage');stage.classList.add('moles');
  stage.innerHTML='<div class="mgrid"></div>';const grid=stage.firstChild;
  const holes=Array.from({length:6},()=>{const el=document.createElement('div');el.className='hole';el.innerHTML='<span class="mole"><b></b></span>';grid.appendChild(el);return {el,b:el.querySelector('b'),m:el.firstChild,ch:null,born:0,until:0};});
  const g={gid:'mole',level,score:0,missed:0,errs:0,chars:0,t0:performance.now(),dur:durOf('mole')?durOf('mole')*1000:Infinity,ramp:durOf('mole')?durOf('mole')*1000:120000,next:0,missLocal:{},over:false,target:null};
  function spawn(now,k){
    const used=new Set(holes.filter(h=>h.ch).map(h=>h.ch)),free=holes.filter(h=>!h.ch),pool=L.keys.split('').filter(c=>!used.has(c));
    if(!free.length||!pool.length)return;const h=rand(free),ch=rand(pool);
    h.ch=ch;h.born=now;h.until=now+2700-1200*k;h.b.textContent=ch;h.m.style.setProperty('--fc','var(--c-'+FTYPE[FINGER[ch]]+')');h.el.classList.add('up');
  }
  function down(h,hit){h.ch=null;h.el.classList.remove('up');if(hit){h.el.classList.add('hit');setTimeout(()=>h.el.classList.remove('hit'),260);}}
  g.onChar=ch=>{
    if(g.over)return;const h=holes.find(x=>x.ch===ch);
    if(h){down(h,true);g.score++;g.chars++;flash(ch,true);beep(780,.06);}else gameMiss(g,g.target&&g.target.ch,ch);
  };
  g.stop=()=>{g.over=true;cancelAnimationFrame(g.raf);};
  function tick(now){
    if(g.over)return;const el=now-g.t0,k=Math.min(1,el/g.ramp);
    if(now>=g.next){spawn(now,k);g.next=now+(1150-550*k);}
    holes.forEach(h=>{if(h.ch&&now>=h.until){down(h,false);g.missed++;beep(160,.12,'triangle',.05);}});
    const first=holes.filter(h=>h.ch).sort((a,b)=>a.born-b.born)[0]||null;
    if(first!==g.target){if(g.target)g.target.el.classList.remove('target');g.target=first;if(first){first.el.classList.add('target');showNext(first.ch);}else showNext(null);}
    hud(stat(g.score,'chú chuột')+stat(g.missed,'trượt')+stat(g.dur===Infinity?Math.floor(el/1000):Math.max(0,Math.ceil((g.dur-el)/1000)),'giây'));
    if(el>=g.dur)finish(el);else g.raf=requestAnimationFrame(tick);
  }
  function finish(el){
    if(g.over)return;cancelAnimationFrame(g.raf);
    {
      const secs=el/1000,acc=g.chars/Math.max(1,g.chars+g.errs),key=gkey('mole',level),prev=state.gbest[key];
      const rec=prev==null||g.score>prev;if(rec)state.gbest[key]=g.score;
      holes.forEach(h=>down(h,false));showNext(null);
      endGame(g,{stars:starsOf(acc),acc,secs,wpm:wpmOf(g.chars,secs),miss:g.missLocal,
        title:'Em đập được '+g.score+' chú chuột!',
        sub:(g.dur===Infinity?'Em đã dừng chơi.':'Hết giờ!')+(g.missed?' Có '+g.missed+' chú chuột chui xuống mất. Nhìn chú chuột có viền sáng, đó là chú ở lâu nhất.':'')+(rec&&prev!=null?' Kỷ lục mới (lần trước '+prev+').':''),
        stats:[[g.score,'chú chuột'],[Math.round(acc*100)+'%','gõ đúng'],[wpmOf(g.chars,secs),'WPM']]});
    }
  }
  if(g.dur===Infinity)doneBtn(stage,()=>finish(performance.now()-g.t0));
  g.raf=requestAnimationFrame(tick);
  return g;
}
function makeRocket(level){
  const stage=$('#stage');stage.classList.add('sky');
  const pool=level==='w3'?byLen(DICT,3,3):level==='w45'?byLen(DICT,4,5):PHR2;
  stage.innerHTML='<div class="rmoon">🌙</div><div class="rk">🚀</div><div class="rword"></div>';
  const rk=stage.querySelector('.rk'),rw=stage.querySelector('.rword');
  let queue=[];const nextText=()=>{if(!queue.length)queue=shuffle(pool);return queue.pop();};
  const g={gid:'rocket',level,words:0,pos:0,cur:nextText(),errs:0,chars:0,start:0,dur:durOf('rocket')?durOf('rocket')*1000:Infinity,missLocal:{},over:false};
  function paint(){
    rw.innerHTML='';[...g.cur].forEach((c,k)=>{const sp=document.createElement('span');sp.textContent=c===' '?' ':c;sp.className=k<g.pos?'done':k===g.pos?'cur':'';rw.appendChild(sp);});
    showNext(g.cur[g.pos]);
  }
  function lift(){rk.style.bottom=(6+(g.words%14)*5.2)+'%';rk.classList.remove('boost');void rk.offsetWidth;rk.classList.add('boost');}
  g.onChar=ch=>{
    if(g.over)return;if(!g.start)g.start=performance.now();
    const exp=g.cur[g.pos];
    if(ch===exp){g.chars++;g.pos++;flash(ch,true);beep(720,.04);
      if(g.pos>=g.cur.length){g.words++;g.pos=0;g.cur=nextText();beep(990,.08);lift();}
      paint();
    }else{gameMiss(g,exp,ch);rw.classList.remove('shake');void rw.offsetWidth;rw.classList.add('shake');}
    hudUpd();
  };
  const left=()=>g.dur===Infinity?(g.start?Math.floor((performance.now()-g.start)/1000):0):g.start?Math.max(0,Math.ceil((g.dur-(performance.now()-g.start))/1000)):Math.round(g.dur/1000);
  function hudUpd(){hud(stat(g.words,'từ')+stat(left(),'giây'));}
  g.tick=setInterval(()=>{if(g.over)return;hudUpd();if(g.start&&performance.now()-g.start>=g.dur)finish();},250);
  g.stop=()=>{g.over=true;clearInterval(g.tick);};
  function finish(){
    if(g.over)return;g.over=true;clearInterval(g.tick);showNext(null);
    const secs=Math.max(1,Math.min(g.dur,g.start?performance.now()-g.start:0)/1000),acc=g.chars/Math.max(1,g.chars+g.errs),key=gkey('rocket',level),prev=state.gbest[key];
    const rec=prev==null||g.words>prev;if(rec)state.gbest[key]=g.words;
    beep(880,.1);setTimeout(()=>beep(1175,.1),110);setTimeout(()=>beep(1568,.18),220);
    endGame(g,{stars:starsOf(acc),acc,secs,wpm:wpmOf(g.chars,secs),miss:g.missLocal,
      title:'Tên lửa bay được '+g.words+' từ!',sub:(g.dur===Infinity?'Em đã dừng chơi.':'Hết giờ!')+(rec&&prev!=null?' Kỷ lục mới (lần trước '+prev+' từ).':''),
      stats:[[g.words,'từ'],[wpmOf(g.chars,secs),'WPM'],[Math.round(acc*100)+'%','gõ đúng']]});
  }
  if(g.dur===Infinity)doneBtn(stage,finish);
  lift();rk.style.bottom='6%';paint();hudUpd();
  return g;
}
function makeScramble(level){
  const stage=$('#stage');stage.classList.add('quiz','scr');
  const pool=level==='w3'?PICS.filter(w=>w[0].length===3):level==='w45'?PICS.filter(w=>w[0].length>=4&&w[0].length<=5):PICS;
  const rounds=shuffle(pool).slice(0,8);
  stage.innerHTML='<div class="qpic"></div><div class="qvi"></div><div class="slots"></div><div class="tiles"></div><button class="chip qsay" type="button">🔈 Nghe từ</button>';
  const g={gid:'scramble',level,rounds,r:0,pos:0,errs:0,chars:0,start:0,clean:0,roundErr:false,missLocal:{},over:false,locked:false};
  const slots=()=>[...stage.querySelectorAll('.slot')],tiles=()=>[...stage.querySelectorAll('.tile')];
  stage.querySelector('.qsay').addEventListener('click',e=>{e.currentTarget.blur();const w=g.rounds[g.r];if(w){const s=state.speak;state.speak=true;say(w[0]);state.speak=s;}});
  function round(){
    const w=g.rounds[g.r];g.pos=0;g.roundErr=false;g.locked=false;
    stage.querySelector('.qpic').textContent=w[1];stage.querySelector('.qvi').textContent=w[2];
    const sl=stage.querySelector('.slots');sl.innerHTML='';[...w[0]].forEach((c,k)=>{const d=document.createElement('div');d.className='slot'+(k===0?' cur':'');sl.appendChild(d);});
    let mix=[...w[0]];for(let t=0;t<8;t++){mix=shuffle(mix);if(mix.join('')!==w[0])break;}
    const tl=stage.querySelector('.tiles');tl.innerHTML='';mix.forEach(c=>{const d=document.createElement('div');d.className='tile';d.textContent=c;d.dataset.c=c;tl.appendChild(d);});
    showNext(null);hudUpd();
  }
  function hudUpd(){hud(stat((g.r+1)+'/'+g.rounds.length,'từ')+stat(g.clean,'⭐ không cần gợi ý'));}
  g.onChar=ch=>{
    if(g.over||g.locked)return;if(!g.start)g.start=performance.now();
    const w=g.rounds[g.r][0],exp=w[g.pos],s=slots();
    if(ch===exp){
      g.chars++;flash(ch,true);beep(720,.05);
      const t=tiles().find(x=>x.dataset.c===exp&&!x.classList.contains('used'));if(t){t.classList.add('used');t.classList.remove('hint');}
      tiles().forEach(x=>x.classList.remove('hint'));
      const d=s[g.pos];d.textContent=exp;d.className='slot ok';g.pos++;showNext(null);
      if(g.pos>=w.length){g.locked=true;say(w);if(!g.roundErr)g.clean++;beep(880,.08);setTimeout(()=>beep(1175,.12),90);hudUpd();
        setTimeout(()=>{if(g.over)return;g.r++;if(g.r>=g.rounds.length)finish();else round();},1100);}
      else s[g.pos].classList.add('cur');
    }else{
      gameMiss(g,exp,ch);g.roundErr=true;
      const t=tiles().find(x=>x.dataset.c===exp&&!x.classList.contains('used'));if(t)t.classList.add('hint');showNext(exp);
    }
  };
  g.stop=()=>{g.over=true;};
  function finish(){
    const secs=(performance.now()-g.start)/1000,acc=g.chars/Math.max(1,g.chars+g.errs),key='scramble:'+level,prev=state.gbest[key];
    const rec=prev==null||g.clean>prev;if(rec)state.gbest[key]=g.clean;
    const n=g.rounds.length;
    endGame(g,{stars:g.clean>=n*.9?3:g.clean>=n*.6?2:1,acc,secs,wpm:wpmOf(g.chars,secs),miss:g.missLocal,
      title:'Em xếp đúng '+g.clean+'/'+n+' từ mà không cần gợi ý',sub:g.clean===n?'Không sai chữ nào. Quá giỏi!':'Những từ cần gợi ý, lần sau em sẽ nhớ hơn.',
      stats:[[g.clean+'/'+n,'không cần gợi ý'],[Math.round(acc*100)+'%','gõ đúng'],[fmtTime(secs),'thời gian']]});
  }
  round();
  return g;
}

/* ================= Results ================= */
let resAgain=null,resNext=null,resCert=null,resExam=null;
function showResults(r){
  $('#r-stars').innerHTML=[1,2,3].map(n=>'<span class="'+(n<=r.stars?'':'off')+'">⭐</span>').join('');
  $('#r-title').textContent=r.title;$('#r-sub').textContent=r.sub||'';
  $('#r-stats').innerHTML=r.stats.map(([v,l])=>'<div><b>'+esc(v)+'</b><span>'+esc(l)+'</span></div>').join('');
  const miss=Object.entries(r.miss||{}).sort((a,b)=>b[1]-a[1]).slice(0,5);
  $('#r-miss').innerHTML=miss.length?'Chữ hay nhầm: '+miss.map(([k])=>'<span class="k">'+esc(k===' '?'cách':k)+'</span>').join(''):'';
  resAgain=r.again;resNext=r.next||null;$('#r-next').hidden=!resNext;
  resCert=r.cert||null;$('#r-cert').hidden=!resCert;resExam=r.exam||null;$('#r-exam').hidden=!resExam;cheer(r.stars);
  $('#r-again').innerHTML=esc(r.againLabel||'Chơi lại')+' <kbd>Space</kbd>';
  $('#r-next').innerHTML='Bài tiếp theo <kbd>Enter</kbd>';
  $('#r-home').innerHTML='Về trang chính <kbd>'+(resNext?'Esc':'Enter')+'</kbd>';
  resultsAt=performance.now();
  stopAll();show('results');
}
$('#r-again').addEventListener('click',()=>{if(resAgain)resAgain();});
$('#r-next').addEventListener('click',()=>{if(resNext)resNext();});
$('#r-home').addEventListener('click',()=>show('home'));
$('#r-cert').addEventListener('click',()=>{if(resCert)openCert(resCert);});
$('#r-exam').addEventListener('click',()=>{if(resExam)startExam(stageById(resExam));});

/* ================= Trò chuyện nhanh trong trường (chỉ chọn câu có sẵn, không gõ chữ) ================= */
let chatGroups=[],chatList=[],chatLines=[],chatCoolT=0;
function onChatMsg(m){
  if(m.t==='chat.init'){
    chatGroups=Array.isArray(m.groups)?m.groups.filter(g=>g&&Array.isArray(g.items)):[];chatList=chatGroups.flatMap(g=>g.items);
    chatLines=(Array.isArray(m.history)?m.history:[]).filter(x=>x&&(Number.isInteger(x.id)||(x.kind==='room'&&typeof x.rid==='string'))).slice(-30);buildChatPick();renderChat();return;
  }
  if(m.t!=='chat')return;
  if(m.kind==='room'){if(typeof m.rid!=='string')return;chatLines.push(m);if(chatLines.length>30)chatLines.shift();renderChat();return;}
  if(!Number.isInteger(m.id))return;
  chatLines.push(m);if(chatLines.length>30)chatLines.shift();
  renderChat();if(state.chat)chatBubble(m);
}
function buildChatPick(){
  const box=$('#chat-pick');box.innerHTML='';let idx=0;
  chatGroups.forEach(g=>{
    const h=document.createElement('div');h.className='chatgrp';const t=document.createElement('b');t.textContent=g.name;h.appendChild(t);
    g.items.forEach(text=>{const id=idx++,b=document.createElement('button');b.type='button';b.className='chip';b.textContent=text;
      b.addEventListener('click',e=>{e.currentTarget.blur();sendChat(id);});h.appendChild(b);});
    box.appendChild(h);
  });
}
function sendChat(id){
  if(!state.chat||!room||!room.connected()||performance.now()<chatCoolT)return;
  chatCoolT=performance.now()+1600;room.send({t:'chat',id});
  $$('#chat-pick .chip').forEach(b=>b.disabled=true);setTimeout(()=>$$('#chat-pick .chip').forEach(b=>b.disabled=false),1600);
}
function renderChat(){
  $('#chat-box').hidden=!state.chat;if(!state.chat)return;
  const log=$('#chat-log');log.innerHTML='';
  if(!chatLines.length){const n=document.createElement('span');n.className='note';n.textContent='Chưa có ai nói gì. Em chọn một câu bên dưới để chào các bạn nhé!';log.appendChild(n);return;}
  chatLines.forEach(m=>{const d=document.createElement('div');d.className='chatline';
    const w=document.createElement('b');w.textContent=String(m.av||'🙂').slice(0,8)+' '+String(m.nick||'Một bạn').slice(0,12)+(m.kind==='room'?' ':': ');
    if(m.kind==='room'){
      const S=stageById(m.stage);d.classList.add('roomline');
      d.append(w,document.createTextNode('mời bạn đấu '+String(m.mode||'1v1').slice(0,3)+(S?' ('+S.name+')':'')+' · mã phòng '));
      const mineRoom=!!(room&&m.from===room.me());
      if(m.code){
        const c=document.createElement(mineRoom?'b':'button');c.className='roomcode';c.textContent=String(m.code).slice(0,8).toUpperCase();
        if(!mineRoom){c.type='button';c.title='Bấm để vào phòng này';c.classList.add('go');c.addEventListener('click',()=>raceJoinId(m.rid));}
        d.append(c,document.createTextNode(' '));
      }
      if(mineRoom)d.append(document.createTextNode('— em đang chờ các bạn vào'));
      else{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent='🏁 Bấm để vào chơi';b.addEventListener('click',()=>raceJoinId(m.rid));d.appendChild(b);}
      log.appendChild(d);return;
    }
    d.append(w,document.createTextNode(chatList[m.id]||''));log.appendChild(d);});
  log.scrollTop=log.scrollHeight;
}
function chatBubble(m){
  if(!W3||screen!=='world')return;const k=W3.sprites.get(m.from);if(!k)return;
  const text=chatList[m.id];if(!text)return;
  if(k.bubble)k.g.remove(k.bubble.sp);
  const T=W3.T,tex=canvasTex(T,640,200,(g,w,h)=>{
    g.fillStyle='rgba(255,255,255,.97)';g.strokeStyle='#4a2a8a';g.lineWidth=8;g.beginPath();if(g.roundRect)g.roundRect(8,8,w-16,h-44,34);else g.rect(8,8,w-16,h-44);g.fill();g.stroke();
    g.beginPath();g.moveTo(w/2-18,h-36);g.lineTo(w/2,h-6);g.lineTo(w/2+18,h-36);g.closePath();g.fillStyle='rgba(255,255,255,.97)';g.fill();
    g.fillStyle='#2a2350';g.textAlign='center';g.textBaseline='middle';
    let size=44;g.font='800 '+size+'px '+FONT;const words=text.split(' ');let l1=text,l2='';
    if(g.measureText(text).width>w-60){const half=Math.ceil(words.length/2);l1=words.slice(0,half).join(' ');l2=words.slice(half).join(' ');}
    if(l2){g.fillText(l1,w/2,52,w-50);g.fillText(l2,w/2,100,w-50);}else g.fillText(l1,w/2,(h-44)/2+8,w-50);
  });
  const sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));sp.scale.set(5.4,1.7,1);sp.position.y=5.9;k.g.add(sp);
  k.bubble={sp,until:performance.now()+5500};
}

/* ================= Bài kiểm tra cấp độ ================= */
const EXAM_PASS=.9;   // gõ đúng từ 90% là qua
function examItems(S){
  const steps=shuffle(FLAT.filter(x=>x.g===S.id&&!x.b)),out=[];let chars=0;
  for(const x of steps){
    const f=findStep(x.u,x.s);if(!f)continue;
    for(const it of shuffle(f.st.gen()).slice(0,2)){out.push(it);chars+=it.t.length;}
    if((chars>=45&&out.length>=5)||chars>=260||out.length>=16)break;
  }
  return shuffle(out);
}
function startExam(S){guardStart(()=>{
  if(!S||!stageComplete(S))return;
  stopAll();
  const items=examItems(S);if(!items.length)return;
  const adv=!!S.adv||items.some(x=>[...x.t].some(c=>!SIMPLE_SET.has(c)));
  game={kind:'lesson',unit:'exam',step:S.id,adv,items,i:0,pos:0,errs:0,chars:0,start:0,missLocal:{},locked:false};
  show('play');syncToggles();$('#race').hidden=true;
  $('#s-play .hint').textContent='📝 Bài kiểm tra '+S.name+': gõ đúng từ '+Math.round(EXAM_PASS*100)+'% là qua. Chữ gõ sai vẫn tính, em gõ chậm và chắc nhé.';
  startWpm();renderItem();
});}
function finishExam(){
  clearInterval(wpmTimer);
  const S=stageById(game.step),secs=(performance.now()-game.start)/1000,acc=game.chars/Math.max(1,game.chars+game.errs),wpm=wpmOf(game.chars,secs),pass=acc>=EXAM_PASS;
  const prevEx=state.exams[S.id]||{tries:0,best:0},ex={tries:prevEx.tries+1,best:Math.max(prevEx.best,Math.round(acc*100)),passed:prevEx.passed||(pass?Date.now():0)};
  state.exams=Object.assign({},state.exams,{[S.id]:ex});
  let cert=null;if(pass&&!state.certs[S.id]){state.certs=Object.assign({},state.certs,{[S.id]:Date.now()});cert=S.id;}
  record({unit:'exam',step:S.id,acc,chars:game.chars,errs:game.errs,secs,wpm});
  const pc=Math.round(acc*100),need=Math.round(EXAM_PASS*100);
  showResults({stars:pass?3:1,acc,miss:game.missLocal,
    title:pass?'Em đã qua bài kiểm tra '+S.name+'!':'Chưa qua rồi, mình thử lại nhé',
    sub:pass?(cert?'Em nhận được chứng chỉ '+S.name+'. Giỏi lắm!':'Em đã có chứng chỉ '+S.name+' rồi.'):'Em cần gõ đúng từ '+need+'% mới qua, lần này em gõ đúng '+pc+'%. Em ôn lại các bài rồi thi lại nhé, không sao đâu.',
    stats:[[pc+'%','gõ đúng'],[wpm,'WPM'],[game.chars,'chữ cái'],[fmtTime(secs),'thời gian']],
    again:()=>startExam(S),againLabel:pass?'Thi lại':'Thi lại (đề mới)',cert});
}

/* ================= Gợi ý đặt tay ================= */
function openHandTip(){$('#ht-hands').innerHTML=handSVG('L')+handSVG('R');$('#handtip').hidden=false;$('#ht-ok').focus();}
function closeHandTip(){$('#handtip').hidden=true;$('#ht-ok').blur();}
const vnInp=$('#vn-input');
vnInp.addEventListener('input',e=>vnInput(!!e.isComposing));
vnInp.addEventListener('compositionend',()=>vnInput(false));
vnInp.addEventListener('paste',e=>e.preventDefault());vnInp.addEventListener('drop',e=>e.preventDefault());
vnInp.addEventListener('blur',()=>setTimeout(()=>{const x=game&&game.kind==='lesson'?game.items[game.i]:null;if(screen==='play'&&x&&x.vn&&!game.locked&&document.activeElement===document.body)vnInp.focus();},60));
$('#hands-help').addEventListener('click',e=>{e.currentTarget.blur();openHandTip();});
$('#ht-ok').addEventListener('click',closeHandTip);

/* ================= Chứng chỉ hoàn thành cấp độ ================= */
let certStage=null;
function certDate(id){if(!state.certs[id]){state.certs=Object.assign({},state.certs,{[id]:Date.now()});save();}return state.certs[id];}
function openCert(id){const S=stageById(id);if(!S||!state.certs[id])return;certStage=id;stopAll();show('cert');drawCert(S);}
async function drawCert(S){
  const cv=$('#cert-canvas'),g=cv.getContext('2d'),W=cv.width,H=cv.height,F='"Baloo 2","Andika",'+FONT;
  try{await Promise.race([document.fonts.load('800 80px "Baloo 2"'),new Promise(r=>setTimeout(r,1500))]);}catch(e){}
  const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#fffaf0');gr.addColorStop(1,'#ffefc2');g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.strokeStyle='#e0a800';g.lineWidth=16;g.strokeRect(30,30,W-60,H-60);g.strokeStyle='#4a2a8a';g.lineWidth=4;g.strokeRect(58,58,W-116,H-116);
  g.textAlign='center';g.textBaseline='middle';
  g.font='56px '+FONT;[[100,110],[W-100,110],[100,H-110],[W-100,H-110]].forEach(([x,y])=>g.fillText('⭐',x,y));
  g.fillStyle='#4a2a8a';g.font='800 112px '+F;g.fillText('CHỨNG NHẬN',W/2,190);
  g.fillStyle='#5a4a8a';g.font='700 40px '+F;g.fillText('Trường tiểu học OplaKid trân trọng trao cho bé',W/2,278);
  const name=(state.nick||'Bé OplaKid').slice(0,24);let sz=150;g.font='800 '+sz+'px '+F;
  while(g.measureText(name).width>W-420&&sz>50){sz-=6;g.font='800 '+sz+'px '+F;}
  g.fillStyle='#c2410c';g.fillText(name,W/2,440);const nw=Math.min(W-420,g.measureText(name).width+80);
  g.strokeStyle='#e0a800';g.lineWidth=7;g.beginPath();g.moveTo(W/2-nw/2,505);g.lineTo(W/2+nw/2,505);g.stroke();
  g.fillStyle='#3b3566';g.font='700 46px '+F;g.fillText('đã vượt qua bài kiểm tra',W/2,585);
  g.fillStyle='#4a2a8a';g.font='800 118px '+F;g.fillText(S.icon+' '+S.name.toUpperCase(),W/2,712);
  g.fillStyle='#5a4a8a';g.font='700 38px '+F;g.fillText(S.desc,W/2,792,W-360);
  g.font='58px '+FONT;g.fillStyle='#000';g.fillText('⭐⭐⭐⭐⭐',W/2,855);
  const d=new Date(certDate(S.id));g.fillStyle='#3b3566';g.font='700 36px '+F;g.fillText('Ngày '+d.getDate()+' tháng '+(d.getMonth()+1)+' năm '+d.getFullYear(),W/2,H-92);
  g.fillStyle='#e0a800';g.beginPath();g.arc(W-205,H-250,92,0,Math.PI*2);g.fill();g.strokeStyle='#fff';g.lineWidth=6;g.beginPath();g.arc(W-205,H-250,76,0,Math.PI*2);g.stroke();
  g.fillStyle='#fff';g.font='800 28px '+F;g.fillText('OplaKid',W-205,H-290);g.font='800 56px '+F;g.fillText(S.name.replace('Cấp độ ',''),W-205,H-245);g.font='700 24px '+F;g.fillText('Cấp độ',W-205,H-205);
  try{await new Promise((ok,no)=>{const im=new Image();im.onload=()=>{const h=330,w=im.width/im.height*h;g.drawImage(im,110,H-h-90,w,h);ok();};im.onerror=no;im.src='/logo.png';});}catch(e){}
}
$('#cert-back').addEventListener('click',()=>show('home'));
$('#cert-print').addEventListener('click',()=>window.print());
$('#cert-dl').addEventListener('click',()=>{
  $('#cert-canvas').toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='chung-chi-oplakid-'+certStage+'.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);},'image/png');
});

/* ================= Góp ý của ba mẹ ================= */
const FB_KIND={idea:'💡 Ý tưởng',bug:'🐞 Báo lỗi',praise:'❤️ Điều em thích',other:'💬 Khác'};
let fbRating=0;
(function(){
  const box=$('#fb-rate');
  for(let n=1;n<=5;n++){const b=document.createElement('button');b.type='button';b.textContent='⭐';b.setAttribute('aria-label',n+' sao');b.setAttribute('aria-pressed','false');
    b.addEventListener('click',()=>{fbRating=fbRating===n?0:n;paintRate();});box.appendChild(b);}
})();
function paintRate(){$$('#fb-rate button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i<fbRating)));}
$('#f-fb').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.currentTarget,msg=$('#fb-msg');msg.textContent='';msg.style.color='';busy(f,true);
  try{
    await api('POST','/api/feedback',{kind:f.kind.value,rating:fbRating,message:f.message.value,contact:f.contact.checked});
    f.message.value='';f.contact.checked=false;fbRating=0;paintRate();msg.textContent='Cảm ơn ba mẹ! OplaKid đã nhận được góp ý.';
  }catch(err){msg.textContent=err.message;msg.style.color='var(--bad)';}
  busy(f,false);
});
$('#to-feedback').addEventListener('click',()=>{if(!uid)return;stopAll();show('parent');setTimeout(()=>$('#fb-box').scrollIntoView({behavior:'smooth',block:'start'}),50);});
async function loadFeedback(){
  const list=$('#fb-list'),note=$('#fb-admin-note');
  try{
    const r=await api('GET','/api/feedback');list.innerHTML='';
    note.textContent=r.items.length?r.items.length+' góp ý gần nhất (tối đa 200). Email chỉ hiện khi ba mẹ đồng ý liên hệ.':'Chưa có góp ý nào.';
    r.items.forEach(it=>{
      const d=document.createElement('div');d.className='fbitem';
      const h=document.createElement('div');h.className='fbhead';
      h.textContent=(FB_KIND[it.kind]||FB_KIND.other)+(it.rating?'  '+'⭐'.repeat(it.rating):'')+'  ·  '+new Date(it.createdAt).toLocaleString('vi-VN')+(it.email?'  ·  '+it.email:'');
      const p=document.createElement('p');p.className='fbmsg';p.textContent=it.message;
      const x=document.createElement('button');x.type='button';x.className='chip';x.textContent='Xoá';
      x.addEventListener('click',async()=>{if(!confirm('Xoá góp ý này?'))return;try{await api('DELETE','/api/feedback/'+encodeURIComponent(it.id));loadFeedback();}catch(e){note.textContent=e.message;}});
      d.append(h,p,x);list.appendChild(d);
    });
  }catch(e){note.textContent=e.message;}
}
$('#fb-reload').addEventListener('click',loadFeedback);

/* ================= Parent ================= */
function renderParent(){
  if(me&&me.admin)loadFeedback();
  const tm=todayMin();$('#p-today').textContent=Math.round(tm)+' phút';
  $('#p-limit-note').textContent='Giới hạn đang đặt: '+state.limit+' phút mỗi ngày.';
  const wk=Date.now()-7*864e5,ws=state.sessions.filter(s=>s.t>=wk);
  $('#p-week').textContent=ws.length+' buổi';
  $('#p-week-note').textContent='Tổng '+Math.round(ws.reduce((a,s)=>a+s.secs/60,0))+' phút luyện tập.';
  const groups=STAGES.map(S=>[s=>{const f=stageOfLesson(s.unit,s.step);return !!f&&f.id===S.id;},S.icon+' '+S.name+' ('+stageDone(S).join('/')+' bài)']).concat([[s=>s.unit==='race','Đua với bóng ma'],[s=>s.unit==='game','Trò chơi']]);
  $('#p-acc').innerHTML=groups.map(([m,n])=>{const ss=state.sessions.filter(m);
    const v=ss.length?Math.round(ss.reduce((a,s)=>a+s.acc,0)/ss.length*100)+'%':'chưa chơi';
    return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:4px 0"><span>'+esc(n)+'</span><b>'+v+'</b></div>';}).join('');
  $('#p-exam').innerHTML=STAGES.map(S=>{const ex=state.exams[S.id],has=!!state.certs[S.id];
    const v=has?'✅ Đã qua'+(ex&&ex.tries?' ('+ex.tries+' lần thi, tốt nhất '+ex.best+'%)':''):stageComplete(S)?(ex&&ex.tries?'Chưa qua ('+ex.tries+' lần thi, tốt nhất '+ex.best+'%)':'Chưa thi'):'Chưa học xong';
    return '<div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid var(--line);padding:4px 0"><span>'+esc(S.icon+' '+S.name)+'</span><b style="text-align:right">'+esc(v)+'</b></div>';}).join('');
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
  $('#set-limit').value=String(state.limit);$('#set-sound').checked=state.sound;$('#set-music').checked=state.music;$('#set-chat').checked=state.chat;$('#set-speak').checked=state.speak;
}
function resetGhosts(){if(confirm('Đặt lại tốc độ của tất cả bóng ma về bóng ma tập sự?')){state.ghosts={};save();if(screen==='parent')renderParent();else renderHome();}}
$('#ghost-reset-all').addEventListener('click',resetGhosts);
$('#ghost-reset-home').addEventListener('click',resetGhosts);
$('#set-limit').addEventListener('change',e=>{state.limit=normLimit(+e.target.value);save();renderParent();});
$('#set-sound').addEventListener('change',e=>{state.sound=e.target.checked;save();syncToggles();});
$('#set-chat').addEventListener('change',e=>{state.chat=e.target.checked;save();renderChat();});
$('#set-music').addEventListener('change',e=>{state.music=e.target.checked;save();syncToggles();musicSync();});
$('#set-speak').addEventListener('change',e=>{state.speak=e.target.checked;save();syncToggles();});
$('#set-unlock').addEventListener('change',e=>{state.unlockAll=e.target.checked;save();stageSel=null;});
$('#reset').addEventListener('click',()=>{if(confirm('Xoá toàn bộ lịch sử, kỷ lục và bóng ma của bé này?')){const keep={avatar:state.avatar,nick:state.nick,sound:state.sound,music:state.music,speak:state.speak,chat:state.chat,look:state.look,limit:state.limit,kbFull:state.kbFull,unlockAll:state.unlockAll,gdur:state.gdur};state=Object.assign(clone(DEFAULTS),keep);save();renderParent();}});

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
  game={kind:'race',online:true,raceId:r.id,unit:'race',step:'online',adv:!!(stageById(r.stage)||{}).adv,text:r.text,pos:0,errs:0,chars:0,start:0,times:[],missLocal:{},go:false,locked:false,timed:0};
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
  $('#o-mode-l').textContent=r.label;$('#o-stage-l').textContent=S.icon+' '+S.name;
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
  const S=curStage();$('#rz-title').textContent='Đua với các bạn '+S.name+' '+S.icon;
  const since=performance.now()-(publicRaces.at||0);
  const list=publicRaces.filter(r=>r.stage===S.id);box.innerHTML='';
  if(!list.length){const li=document.createElement('li');li.className='pubrace none';li.textContent='Chưa có cuộc đua nào đang chờ ở '+S.name+'. Bấm 1 đấu 1, 3 đấu 3 hoặc 5 đấu 5 để mở cuộc đua mới, các bạn khác sẽ thấy và vào cùng.';box.appendChild(li);return;}
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
    peers:()=>snap,me:()=>mePeer,
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
  room.onMsg(onRaceMsg);room.onMsg(onChatMsg);
  updateOnlineCount();lastPresKey='';updateLobbyPresence();
  room.onConnection(c=>{onlineAvailable();
    if(c){lastPresKey='';updateLobbyPresence();if(pendingJoin&&curPid){const pj=pendingJoin;pendingJoin=null;raceJoinCode(pj);}}
    else if(online){online=null;if(screen==='online'||(game&&game.online)){stopAll();show('home');setTab('race');$('#o-avail').textContent='Mất kết nối nên em đã rời cuộc đua. Em thử lại nhé.';}}});
}
function stopRealtime(){if(room){room.close();room=null;}online=null;updateOnlineCount();onlineAvailable();}

/* ================= Login (kid profiles) ================= */
let npAv='🐯';
function profileSummary(pid){
  const st=loadState(pid);const S=curStageOf(st);const all=FLAT.filter(x=>x.g===S.id);
  return S.icon+' '+S.name+': '+all.filter(x=>st.best[x.u+':'+x.s]).length+'/'+all.length;
}
let editingPid=null,editBack=null;
function renderLogin(){
  const box=$('#profiles');box.innerHTML='';
  profiles.list.forEach((p,i)=>{
    const wrap=document.createElement('div');wrap.className='pwrap';
    const b=document.createElement('button');b.type='button';b.className='profile'+(p.id===profiles.cur?' last':'');
    const av=document.createElement('span');av.className='pav';av.textContent=p.av||'🙂';
    const nm=document.createElement('span');nm.className='pnm';nm.textContent=p.nick||'Bé';
    const sm=document.createElement('span');sm.className='psm';sm.textContent=profileSummary(p.id);
    b.append(av,nm,sm);
    if(i<9){const k=document.createElement('kbd');k.textContent=String(i+1);b.appendChild(k);}
    b.addEventListener('click',()=>login(p.id));wrap.appendChild(b);
    const ed=document.createElement('button');ed.type='button';ed.className='pedit';ed.textContent='✏️';ed.title='Đổi tên hoặc nhân vật';ed.setAttribute('aria-label','Đổi tên hoặc nhân vật của '+(p.nick||'bé'));
    ed.addEventListener('click',e=>{e.stopPropagation();editBack=null;openEditProfile(p.id);});wrap.appendChild(ed);box.appendChild(wrap);
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
function resetProfileForm(){editingPid=null;$('#np-title').textContent='Thêm bạn mới';$('#np-ok').textContent='Tạo và vào học';$('#np-nick').value='';$('#np-err').textContent='';}
function openNewProfile(){resetProfileForm();npLook=null;$('#newprof').dataset.open='1';$('#newprof').hidden=false;renderLogin();refreshLookUI();setTimeout(()=>$('#np-nick').focus(),0);}
function openEditProfile(pid){
  const pe=profiles.list.find(x=>x.id===pid);if(!pe)return;
  resetProfileForm();editingPid=pid;npAv=pe.av||'🐯';npLook=validLook(pe.look)?pe.look:null;
  $('#np-title').textContent='Đổi tên hoặc nhân vật';$('#np-ok').textContent='Lưu';$('#np-nick').value=pe.nick||'';
  $('#newprof').dataset.open='1';show('login');renderLogin();$('#newprof').hidden=false;refreshLookUI();setTimeout(()=>$('#np-nick').focus(),0);
}
function saveProfileEdit(){
  const nick=$('#np-nick').value.trim().slice(0,12);
  if(!nick){$('#np-nick').focus();$('#np-err').textContent='Em nhập biệt danh trước nhé.';return;}
  const pid=editingPid,pe=profiles.list.find(x=>x.id===pid);if(!pe){resetProfileForm();return;}
  pe.nick=nick;pe.av=npAv;pe.look=validLook(npLook)?npLook:null;
  const st=pid===curPid?state:loadState(pid);st.nick=nick;st.avatar=npAv;st.look=pe.look;st.updatedAt=Date.now();writeJSON(K('p:'+pid),st);
  if(db){const snap=JSON.stringify(st),u=st.updatedAt;queueWrite('p-'+pid,()=>sDoc(pid),()=>({json:snap,updatedAt:u}));}
  saveProfiles();
  if(pid===curPid){renderWho();lastPresKey='';updateLobbyPresence();}
  $('#newprof').dataset.open='0';resetProfileForm();
  if(editBack==='home'&&pid===curPid){editBack=null;show('home');}else renderLogin();
}
$('#to-rename').addEventListener('click',()=>{if(!uid||!curPid)return;stopAll();editBack='home';openEditProfile(curPid);});
function createProfile(){
  if(editingPid)return saveProfileEdit();
  const nick=$('#np-nick').value.trim().slice(0,12);
  if(!nick){$('#np-nick').focus();$('#np-err').textContent='Em nhập biệt danh trước nhé.';return;}
  const id=newId();const lk=validLook(npLook)?npLook:null;profiles.list.push({id,nick,av:npAv,look:lk});
  writeJSON(K('p:'+id),Object.assign(clone(DEFAULTS),{nick,avatar:npAv,look:lk,updatedAt:Date.now()}));
  saveProfiles();$('#np-nick').value='';$('#np-err').textContent='';$('#newprof').dataset.open='0';
  login(id);
}
function login(pid){
  stopAll();if(online)leaveRoomSilently();
  curPid=pid;profiles.cur=pid;writeJSON(K('profiles'),profiles);
  state=loadState(pid);const pe=profiles.list.find(x=>x.id===pid);
  if(pe){if(!state.nick)state.nick=pe.nick;state.avatar=pe.av||state.avatar;if(validLook(pe.look))state.look=pe.look;}
  stageSel=null;kbFullNow=null;syncToggles();renderWho();show('home');
  cloudPullState(pid);hashJoin();
}
function renderWho(){const w=$('#who');if(!curPid){w.hidden=true;return;}w.hidden=false;$('#who-av').textContent=state.avatar;$('#who-nm').textContent=state.nick||'Bé';}
$('#np-ok').addEventListener('click',createProfile);
$('#np-cancel').addEventListener('click',()=>{const back=editBack;$('#newprof').dataset.open='0';resetProfileForm();editBack=null;if(back==='home'&&curPid)show('home');else renderLogin();});
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
function stageDoneFor(st,S){const all=FLAT.filter(x=>x.g===S.id&&!x.b);return [all.filter(x=>st.best[x.u+':'+x.s]).length,all.length];}
function stageUnlockedFor(st,S){const i=STAGES.indexOf(S);if(i<=0||st.unlockAll)return true;const [d,n]=stageDoneFor(st,STAGES[i-1]);return d>=n;}
function curStageOf(st){
  const open=STAGES.filter(S=>stageUnlockedFor(st,S));
  return open.find(S=>{const [d,n]=stageDoneFor(st,S);return d<n;})||open[open.length-1];
}
const stageUnlocked=S=>stageUnlockedFor(state,S);
const stageComplete=S=>{const [d,n]=stageDoneFor(state,S);return n>0&&d>=n;};   // xong hết bài chính của cấp độ
const curStage=()=>curStageOf(state);
function nextLesson(){
  const S=curStage();
  const inStage=FLAT.find(x=>x.g===S.id&&!state.best[x.u+':'+x.s]);
  if(inStage)return inStage;
  return FLAT.find(x=>{const s=stageById(x.g);return s&&stageUnlocked(s)&&!state.best[x.u+':'+x.s];})||null;
}
function continueLearning(){const n=nextLesson();if(n)startLesson(n.u,n.s);}

/* ================= Lobby presence: who is online ================= */
let lastPresKey='';
function updateLobbyPresence(){
  if(!room||!curPid)return;
  const gS=game&&game.kind==='lesson'?stageOfLesson(game.unit,game.step):null,vS=screen==='home'&&stageSel?STAGES.find(x=>x.id===stageSel):null;
  const S=gS||(vS&&stageUnlocked(vS)?vS:curStage()),act=screen==='parent'?'parent':screen==='online'||((screen==='play'||screen==='game')&&game&&game.online)?'race':(screen==='play'||screen==='game'||screen==='results')?'learn':'yard',p={nick:myNick(),av:state.avatar,stage:S?S.id:'bo',where:screen,act,look:validLook(state.look)?state.look:null};
  const k=JSON.stringify(p);if(k===lastPresKey)return;lastPresKey=k;
  room.presence(p).catch(()=>{});
}
function onlinePeople(){
  if(!room)return [];
  return room.peers().filter(p=>p.presence&&typeof p.presence.stage==='string');
}
function updateOnlineCount(){
  const pill=$('#online-pill');if(!room||!curPid||screen==='login'){pill.hidden=true;$('#onstrip').hidden=true;return;} // chọn bé xong mới thấy ai online
  pill.hidden=false;const ppl=onlinePeople(),n=ppl.length;$('#online-n').textContent=n;
  if(screen==='world')renderWorldList();
  renderOnlineStrip(ppl);
}
function renderOnlineStrip(ppl){
  const box=$('#onstrip');if(!room||!ppl.length){box.hidden=true;return;}
  box.hidden=false;$('#os-n').textContent=ppl.length;
  const c={};STAGES.forEach(S=>{c[S.id]=0;});ppl.forEach(p=>{const k=p.presence.stage;c[k in c?k:'bo']++;});
  const zs=STAGES.filter(S=>c[S.id]>0);$('#os-zones').textContent=zs.length?zs.map(S=>S.icon+' '+S.name+': '+c[S.id]).join(' · '):'';
  const avs=$('#os-avs');avs.innerHTML='';
  ppl.slice(0,16).forEach(p=>{const s=document.createElement('span');s.className='osav'+(p.isMe&&p.sameTab?' me':'');s.textContent=String(p.presence.av||'🙂').slice(0,8);avs.appendChild(s);});
  if(ppl.length>16){const s=document.createElement('span');s.className='osmore';s.textContent='+'+(ppl.length-16);avs.appendChild(s);}
}

/* ================= 3D stadium ================= */
const ZONE_COLORS=[0x36a653,0x2b7fd0,0xee9124,0x8763d1,0xe4508a,0x14b8a6,0xf5b700,0xe5484d,0x6b4ce6,0x2d3142];
const ZONES=STAGES.map((S,i)=>({id:S.id,name:S.name,icon:S.icon,color:ZONE_COLORS[i],speed:.12+i*.2,a0:0}));
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
function drawBoard(){
  if(!W3)return;const c=actCounts(),n=c.race+c.learn+c.yard+c.parent,key=n+'|'+c.race+'|'+c.learn+'|'+c.yard+'|'+c.parent;if(W3.boardKey===key)return;W3.boardKey=key;
  const cv=W3.boardCanvas,g=cv.getContext('2d'),w=cv.width,h=cv.height;
  const grd=g.createLinearGradient(0,0,0,h);grd.addColorStop(0,'#2b2a6b');grd.addColorStop(1,'#4a3f9a');g.fillStyle=grd;g.fillRect(0,0,w,h);
  g.textAlign='center';g.textBaseline='middle';g.fillStyle='#ffe066';g.font='800 66px '+FONT;g.fillText('TRƯỜNG TIỂU HỌC OPLAKID',w/2,84);
  g.fillStyle='#ffffff';g.font='700 56px '+FONT;g.fillText('🟢 '+n+' bạn đang online',w/2,170);
  g.font='700 42px '+FONT;g.fillText('🏃 '+c.race+' đua  ⌨️ '+c.learn+' học  🌳 '+c.yard+' chơi  👪 '+c.parent+' góc PH',w/2,244);
  W3.boardTex.needsUpdate=true;
}
/* Trường lớn: 3 lớp học (84 chỗ ngồi và đứng), sân chạy rộng, Góc phụ huynh rộng (48 chỗ). Tối đa MAX_KIDS bạn được vẽ để máy không bị nặng. */
const TZ=37,TRX=2.4,TRZ=1.2,MAX_KIDS=150;   // Sân đua riêng (có hàng rào và cổng) nằm phía trước sân trường
const YARD={x0:-26,x1:24,z0:-6.5,z1:0},PARENT={x:30,z:10};   // YARD: chỗ đi dạo tự do ngay trước lớp học
const ROOMS=[0,-17.5,17.5],ROOM_W=17.5,DESK_COLS=[-5.4,-1.8,1.8,5.4];
const PSLOTS=Array.from({length:48},(_,i)=>{const ring=Math.min(5,Math.floor(i/8)),a=(i%8)/8*Math.PI*2+ring*.4,r=2.1+ring*.55;return {x:PARENT.x+Math.cos(a)*r,z:PARENT.z+Math.sin(a)*r*.8};});
/* Các góc chơi trò dân gian trong sân trường; mỗi góc có số chỗ (cap) và dáng chơi riêng cho từng chỗ */
const GZ=[
  {id:'jump',name:'Nhảy dây',icon:'🪢',cx:-19,cz:3,cap:6},
  {id:'quan',name:'Ô ăn quan',icon:'🪨',cx:-5,cz:3,cap:6},
  {id:'cau',name:'Đá cầu',icon:'🏸',cx:10,cz:3,cap:8},
  {id:'tug',name:'Kéo co',icon:'💪',cx:-15,cz:12,cap:8},
  {id:'bao',name:'Nhảy bao bố',icon:'🦘',cx:6,cz:11,cap:6},
  {id:'rong',name:'Rồng rắn lên mây',icon:'🐉',cx:-1,cz:17,cap:10}
];
const GZ_BY=Object.fromEntries(GZ.map(z=>[z.id,z]));
function gameSlot(z,i,t){
  const cx=z.cx,cz=z.cz;
  switch(z.id){
    case 'jump':
      if(i===0)return {x:cx-1.9,z:cz,fx:cx,fz:cz,pose:'turn'};
      if(i===1)return {x:cx+1.9,z:cz,fx:cx,fz:cz,pose:'turn'};
      if(i===2)return {x:cx,z:cz,fx:cx+3,fz:cz,pose:'jump'};
      return {x:cx+2.8+(i-3)*.9,z:cz+1.6,fx:cx,fz:cz,pose:'clap'};
    case 'tug':{const side=i%2?1:-1,rank=i>>1;return {x:cx+side*(1.5+rank*1.15)+Math.sin(t*1.1)*.7,z:cz+(rank%2?.3:-.3),fx:cx,fz:cz,pose:'tug'};}
    case 'quan':
      if(i===0)return {x:cx,z:cz-1.5,fx:cx,fz:cz,pose:'sit'};
      if(i===1)return {x:cx,z:cz+1.5,fx:cx,fz:cz,pose:'sit'};
      return {x:cx+[-2.8,2.8,-2.8,2.8][(i-2)%4],z:cz+[-.9,-.9,.9,.9][(i-2)%4],fx:cx,fz:cz,pose:'clap'};
    case 'cau':{const a=i/z.cap*Math.PI*2;return {x:cx+Math.cos(a)*2.3,z:cz+Math.sin(a)*2.3,fx:cx,fz:cz,pose:'kick'};}
    case 'bao':{const u=t*.06+i*.17,f=u-Math.floor(u),tri=1-Math.abs(1-2*f);return {x:cx-6+12*tri,z:cz+(i-2.5)*1.15,yaw:f<.5?Math.PI/2:-Math.PI/2,pose:'hop'};}
    case 'rong':{const u=t*.32-i*.2,x=cx+11*Math.sin(u),zz=cz+1.8*Math.sin(2*u),u2=u+.05;return {x,z:zz,yaw:Math.atan2(cx+11*Math.sin(u2)-x,cz+1.8*Math.sin(2*u2)-zz),pose:'snake'};}
  }
  return {x:cx,z:cz,pose:'clap'};
}
const SEATS=(()=>{const a=[];
  ROOMS.forEach(cx=>{for(let r=0;r<4;r++)DESK_COLS.forEach(dx=>a.push({x:cx+dx,z:-18+r*2.4+1.2}));});      // 48 chỗ ngồi
  ROOMS.forEach(cx=>{for(let i=0;i<12;i++)a.push({x:cx-7.5+i*1.36,z:-8.9,stand:true});});                  // 36 chỗ đứng ở cuối lớp
  return a;})();
function initWorld(T){
  const host=$('#world3d');host.innerHTML='';
  const dark=matchMedia('(prefers-color-scheme: dark)').matches;
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
  host.appendChild(renderer.domElement);
  const scene=new T.Scene();
  scene.background=canvasTex(T,4,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,dark?'#0d1030':'#6ec3ff');gr.addColorStop(.55,dark?'#2a2160':'#bfe6ff');gr.addColorStop(1,dark?'#3b2a55':'#fff4d6');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  scene.fog=new T.Fog(dark?0x231b45:0xd8efff,120,300);
  const cam=new T.PerspectiveCamera(45,1,.1,500);
  scene.add(new T.HemisphereLight(dark?0x9aa6ff:0xffffff,dark?0x223322:0x7fae6f,dark?.75:.95));
  const sun=new T.DirectionalLight(0xffffff,dark?.45:.75);sun.position.set(10,25,18);scene.add(sun);
  const M=c=>new T.MeshLambertMaterial({color:c});
  const box=(w,h,d,c,x,y,z,par)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),M(c));m.position.set(x,y,z);(par||scene).add(m);return m;};
  const tree=(x,z)=>{box(.7,2.6,.7,0x7a4b24,x,1.3,z);const f=new T.Mesh(new T.SphereGeometry(2.3,14,10),M(dark?0x2c7a3f:0x3fae56));f.position.set(x,4.3,z);scene.add(f);};

  /* Sân trường: cỏ, đường chạy lớn */
  const ground=new T.Mesh(new T.PlaneGeometry(420,420),M(dark?0x2f6e3a:0x86d07c));ground.rotation.x=-Math.PI/2;scene.add(ground);
  const field=new T.Group();field.position.set(0,0,TZ);field.scale.set(TRX,1,TRZ);scene.add(field);
  const inner=new T.Mesh(new T.CircleGeometry(4.6,64),M(dark?0x3a8247:0x9be08f));inner.rotation.x=-Math.PI/2;inner.position.y=.01;field.add(inner);
  const track=new T.Mesh(new T.RingGeometry(4.6,6.6,96),new T.MeshLambertMaterial({color:dark?0x96503e:0xd9735c,side:T.DoubleSide}));track.rotation.x=-Math.PI/2;track.position.y=.02;field.add(track);
  [5.1,5.6,6.1].forEach(r=>{const l=new T.Mesh(new T.RingGeometry(r,r+.04,128),new T.MeshBasicMaterial({color:0xffffff}));l.rotation.x=-Math.PI/2;l.position.y=.03;field.add(l);});
  box(TRX*2,.03,.5,0xffffff,TRX*5.6,.04,TZ);                                          // vạch đích

  /* Toà nhà trường: 3 lớp học mở mặt trước, mỗi lớp 16 bàn học */
  const wall=dark?0xb9a98c:0xffe9b8,roofC=0xd9534f,deskTop=0xe7b66b,deskLeg=0x8a6a3a,chairC=[0x2b7fd0,0xe4508a,0x36a653,0x8763d1,0xee9124];
  const chalkTex=canvasTex(T,512,154,(g,w,h)=>{g.fillStyle='#1f5a43';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font='700 36px '+FONT;g.fillText('Hôm nay mình tập gõ phím!',w/2,48);g.font='700 44px '+FONT;g.fillText('A S D F   J K L ;',w/2,108);});
  ROOMS.forEach((cx,ri)=>{
    box(ROOM_W-.2,.3,13.4,dark?0xa08a64:0xe9d3a3,cx,.15,-14.6);                      // sàn lớp
    box(ROOM_W,5,.4,wall,cx,2.5,-21.2);box(ROOM_W+.4,.5,1.2,roofC,cx,5.25,-21.1);   // tường sau và mái hiên
    box(.4,5,13.4,wall,cx+ROOM_W/2,2.5,-14.6);if(ri===1)box(.4,5,13.4,wall,cx-ROOM_W/2,2.5,-14.6);
    box(8.4,2.8,.2,0x8b5a2b,cx,3.2,-20.9);
    const chalk=new T.Mesh(new T.PlaneGeometry(8,2.4),new T.MeshBasicMaterial({map:chalkTex}));chalk.position.set(cx,3.2,-20.78);scene.add(chalk);
    box(3,.9,1.3,0xb5651d,cx,.75,-19.4);box(.2,.9,.2,0xb5651d,cx-1.3,.45,-19.4);box(.2,.9,.2,0xb5651d,cx+1.3,.45,-19.4);   // bàn cô giáo
    for(let r=0;r<4;r++)DESK_COLS.forEach((dx,c)=>{
      const x=cx+dx,z=-18+r*2.4;
      box(2.2,.12,1.1,deskTop,x,1.05,z);box(.1,1,.1,deskLeg,x-1,.55,z-.4);box(.1,1,.1,deskLeg,x+1,.55,z-.4);box(.1,1,.1,deskLeg,x-1,.55,z+.4);box(.1,1,.1,deskLeg,x+1,.55,z+.4);
      box(.9,.04,.5,0x2d3142,x,1.13,z);box(.8,.5,.05,0x2d3142,x,1.4,z-.25).rotation.x=-.25;   // bàn phím và màn hình
      const cc=chairC[(r+c+ri)%chairC.length];box(.9,.1,.9,cc,x,.55,z+1.2);box(.9,.8,.1,cc,x,1,z+1.62);box(.08,.5,.08,deskLeg,x-.35,.28,z+1.2);box(.08,.5,.08,deskLeg,x+.35,.28,z+1.2);
    });
  });
  /* Biển điện tử lớn trên lớp giữa */
  const sign=new T.Mesh(new T.BoxGeometry(15,4.4,.4),M(0x22253d));sign.position.set(0,9,-21.2);scene.add(sign);
  const boardCanvas=document.createElement('canvas');boardCanvas.width=1024;boardCanvas.height=300;
  const boardTex=new T.CanvasTexture(boardCanvas);
  const board=new T.Mesh(new T.PlaneGeometry(14.2,4.15),new T.MeshBasicMaterial({map:boardTex}));board.position.set(0,9,-20.97);scene.add(board);
  box(.5,3.8,.5,0x22253d,-6.5,7.1,-21.1);box(.5,3.8,.5,0x22253d,6.5,7.1,-21.1);
  /* Cây, ghế đá, cột cờ */
  [[-30,-3],[-22,-6.6],[22,-6.6],[-31,9],[-31,21],[-27,31],[27,31],[-27,45],[27,45],[34,-5],[34,22]].forEach(([x,z])=>tree(x,z));
  [[-9,-6.9],[9,-6.9],[-14,-6.9],[14,-6.9]].forEach(([x,z])=>{box(2.6,.15,.7,0x9b6b3a,x,.55,z);box(.12,.5,.12,0x555555,x-.9,.28,z);box(.12,.5,.12,0x555555,x+.9,.28,z);});
  /* Cờ đỏ sao vàng: cột cờ lớn bên trái sân, cờ nhỏ trên mái mỗi lớp học */
  const flagTex=canvasTex(T,480,320,(g,w,h)=>{g.fillStyle='#da251d';g.fillRect(0,0,w,h);g.fillStyle='#ffff00';g.beginPath();
    for(let i=0;i<10;i++){const r=i%2?96*.382:96,a=-Math.PI/2+i*Math.PI/5;const x=w/2+Math.cos(a)*r,y=h/2+8+Math.sin(a)*r;if(i)g.lineTo(x,y);else g.moveTo(x,y);}g.closePath();g.fill();});
  const flagMat=new T.MeshBasicMaterial({map:flagTex,side:T.DoubleSide});
  box(.2,11.5,.2,0xdddddd,-31,5.75,-2);const knob=new T.Mesh(new T.SphereGeometry(.28,10,8),M(0xf5b700));knob.position.set(-31,11.6,-2);scene.add(knob);
  const flagGeo=new T.PlaneGeometry(5.4,3.6,18,1);flagGeo.translate(2.7,0,0);const flag=new T.Mesh(flagGeo,flagMat);flag.position.set(-30.9,9.5,-2);scene.add(flag);
  const flagBase=flagGeo.attributes.position.array.slice();
  ROOMS.forEach(cx=>{box(.07,2,.07,0xdddddd,cx,7.2,-21.1);const f=new T.Mesh(new T.PlaneGeometry(1.5,1),flagMat);f.position.set(cx+.75,7.9,-21.1);scene.add(f);});

  /* Sân đua riêng: có hàng rào trắng và cổng ở phía trường */
  for(let i=0;i<60;i++){const a=i/60*Math.PI*2,d=Math.atan2(Math.sin(a+Math.PI/2),Math.cos(a+Math.PI/2));if(Math.abs(d)<.16)continue;
    box(.18,1,.18,0xffffff,Math.cos(a)*7.4*TRX,.5,TZ+Math.sin(a)*7.4*TRZ);}
  [-3.6,3.6].forEach(dx=>box(.4,3.8,.4,0xe5484d,dx,1.9,TZ-7.4*TRZ));
  const gate=new T.Mesh(new T.PlaneGeometry(8,1.6),new T.MeshBasicMaterial({map:canvasTex(T,512,100,(g,w,h)=>{g.fillStyle='#e5484d';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font='800 56px '+FONT;g.fillText('🏁 SÂN ĐUA',w/2,h/2+3,w-30);})}));
  gate.position.set(0,3.6,TZ-7.4*TRZ);scene.add(gate);

  /* Sân trường: các góc chơi trò dân gian (bảng tên, đồ dùng và chỗ chơi) */
  const label=(txt,x,y,z)=>{const sp=new T.Sprite(new T.SpriteMaterial({map:canvasTex(T,512,128,(g,w,h)=>{g.fillStyle='rgba(255,255,255,.94)';g.beginPath();if(g.roundRect)g.roundRect(6,10,w-12,h-24,40);else g.rect(6,10,w-12,h-24);g.fill();g.lineWidth=8;g.strokeStyle='#4a2a8a';g.stroke();g.fillStyle='#4a2a8a';g.textAlign='center';g.textBaseline='middle';g.font='800 46px '+FONT;g.fillText(txt,w/2,h/2-2,w-44);}),transparent:true,depthWrite:false}));sp.scale.set(6.6,1.65,1);sp.position.set(x,y,z);scene.add(sp);};
  GZ.forEach(z=>label(z.icon+' '+z.name,z.cx,z.id==='rong'?3.4:4.2,z.cz));
  const props={flag,flagBase};
  {const z=GZ_BY.jump;                                                                // nhảy dây
    box(.16,1.5,.16,0x8b5a2b,z.cx-1.15,.75,z.cz);box(.16,1.5,.16,0x8b5a2b,z.cx+1.15,.75,z.cz);
    props.rope=new T.Mesh(new T.TorusGeometry(1.15,.035,6,24,Math.PI),M(0xe5484d));props.rope.position.set(z.cx,1.35,z.cz);scene.add(props.rope);}
  {const z=GZ_BY.tug;                                                                 // kéo co
    box(11,.02,.5,dark?0x3a8247:0xa6e49a,z.cx,.015,z.cz);box(.12,.03,3.2,0xffffff,z.cx,.03,z.cz);
    props.tug=new T.Group();props.tug.position.set(z.cx,0,z.cz);scene.add(props.tug);
    const rope=new T.Mesh(new T.BoxGeometry(11,.12,.12),M(0xb5842a));rope.position.y=.55;props.tug.add(rope);
    const mk=new T.Mesh(new T.BoxGeometry(.1,.4,.5),M(0xe5484d));mk.position.y=.55;props.tug.add(mk);}
  {const z=GZ_BY.quan;                                                                // ô ăn quan
    const tex=canvasTex(T,512,220,(g,w,h)=>{g.fillStyle='#d9b27a';g.fillRect(0,0,w,h);g.strokeStyle='#6b4a22';g.lineWidth=5;g.strokeRect(6,6,w-12,h-12);
      g.beginPath();g.moveTo(100,6);g.lineTo(100,h-6);g.moveTo(w-100,6);g.lineTo(w-100,h-6);g.moveTo(100,h/2);g.lineTo(w-100,h/2);
      for(let i=1;i<5;i++){const x=100+i*(w-200)/5;g.moveTo(x,6);g.lineTo(x,h-6);}g.stroke();
      g.fillStyle='#fff';[[60,h/2],[w-60,h/2]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,26,0,Math.PI*2);g.fill();});
      g.fillStyle='#8b5a2b';for(let i=0;i<30;i++){g.beginPath();g.arc(110+Math.random()*(w-220),14+Math.random()*(h-28),7,0,Math.PI*2);g.fill();}});
    const b=new T.Mesh(new T.PlaneGeometry(4.4,1.9),new T.MeshLambertMaterial({map:tex}));b.rotation.x=-Math.PI/2;b.position.set(z.cx,.06,z.cz);scene.add(b);}
  {const z=GZ_BY.cau;                                                                 // đá cầu
    const ring=new T.Mesh(new T.RingGeometry(2.55,2.7,48),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(z.cx,.03,z.cz);scene.add(ring);
    props.cau=new T.Group();props.cau.add(new T.Mesh(new T.SphereGeometry(.13,8,6),M(0xffd54f)));const fe=new T.Mesh(new T.ConeGeometry(.14,.3,8),M(0xffffff));fe.position.y=.22;props.cau.add(fe);
    props.cau.position.set(z.cx,2,z.cz);scene.add(props.cau);}
  {const z=GZ_BY.bao;                                                                 // nhảy bao bố: vạch xuất phát và đích
    box(.2,.02,7.2,0xffffff,z.cx-6,.03,z.cz);box(.2,.02,7.2,0xe5484d,z.cx+6,.03,z.cz);
    box(.1,1.6,.1,0xdddddd,z.cx+6,.8,z.cz-3.6);box(.7,.45,.04,0xe5484d,z.cx+6.35,1.4,z.cz-3.6);}

  /* Góc phụ huynh: nhà chờ rộng có bàn nước; các bạn đang ở Góc phụ huynh trong ứng dụng sẽ đứng ở đây */
  {const px=PARENT.x,pz=PARENT.z;
    box(10,.25,8,dark?0x8c7a62:0xe3cfa6,px,.125,pz);
    [[-4.7,-3.6],[4.7,-3.6],[-4.7,3.6],[4.7,3.6]].forEach(([dx,dz])=>box(.35,3.6,.35,0x8b5a2b,px+dx,2,pz+dz));
    const roof=new T.Mesh(new T.ConeGeometry(6.6,2.1,4),new T.MeshLambertMaterial({color:0x8763d1,transparent:true,opacity:.55}));roof.position.set(px,4.9,pz);roof.rotation.y=Math.PI/4;scene.add(roof);
    const tb=new T.Mesh(new T.CylinderGeometry(1,1,.8,16),M(0xb5651d));tb.position.set(px,.65,pz);scene.add(tb);
    box(.35,.3,.35,0xffffff,px-.3,1.2,pz+.1);box(.35,.3,.35,0xffe0e6,px+.35,1.2,pz-.2);
    const sg=new T.Mesh(new T.PlaneGeometry(6.4,1.5),new T.MeshBasicMaterial({map:canvasTex(T,512,120,(g,w,h)=>{g.fillStyle='#4a2a8a';g.fillRect(0,0,w,h);g.fillStyle='#ffe066';g.textAlign='center';g.textBaseline='middle';g.font='800 44px '+FONT;g.fillText('👪 GÓC PHỤ HUYNH',w/2,h/2+3,w-40);})}));
    sg.position.set(px,6.9,pz+4.3);scene.add(sg);}

  const kids=new T.Group();scene.add(kids);
  const shadowTex=canvasTex(T,64,64,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);gr.addColorStop(0,'rgba(0,0,0,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  W3={T,renderer,scene,cam,kids,host,props,sprites:new Map(),seatOf:new Map(),pslot:new Map(),gslot:new Map(),pops:[],angle:0,zoom:1,touched:false,drag:null,aspect:2,raf:0,t0:performance.now(),last:performance.now(),dark,shadowTex,shadowGeo:new T.PlaneGeometry(1.8,1.8),shadowMat:new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}),boardCanvas,boardTex,boardKey:'',totalOnline:0,ray:new T.Raycaster()};
  const el=renderer.domElement;el.style.touchAction='none';
  el.addEventListener('pointerdown',e=>{W3.drag={x:e.clientX,y:e.clientY,a:W3.angle,moved:false};el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointermove',e=>{const d=W3.drag;if(!d)return;if(Math.abs(e.clientX-d.x)+Math.abs(e.clientY-d.y)>6)d.moved=true;if(d.moved){W3.touched=true;W3.angle=Math.max(-1.2,Math.min(1.2,d.a-(e.clientX-d.x)*.008));}});
  el.addEventListener('pointerup',e=>{const d=W3.drag;W3.drag=null;if(d&&!d.moved)pokeKid(e);});el.addEventListener('pointercancel',()=>{W3.drag=null;});
  el.addEventListener('wheel',e=>{e.preventDefault();zoomWorld(e.deltaY>0?1.1:.9);},{passive:false});
  new ResizeObserver(sizeWorld).observe(host);sizeWorld();drawBoard();
}
function zoomWorld(f){if(W3)W3.zoom=Math.max(.45,Math.min(1.5,W3.zoom*f));}
/* ================= Nhân vật 3D tuỳ chỉnh: màu da, tóc, trang phục và phụ kiện ================= */
const LOOK_SKIN=[0xf6d2b0,0xeac09a,0xd29a6e,0xb07848,0x8d5a3b,0x5e3b26];
const LOOK_HAIRC=[0x2b1d14,0x5a3b22,0x161616,0xc9a15b,0xb5441f,0xe8d36a,0x6b4ce6,0xe4508a];
const LOOK_SHIRT=[0xe5484d,0x2b7fd0,0xf5b700,0x36a653,0x8763d1,0xee9124,0xe4508a,0x14b8a6,0xffffff,0x2d3142,0x7cc4ff,0xa3d977];
const LOOK_PANTS=[0x3b4a7a,0x2d3142,0x6b4f2a,0x4a7a52,0xc9c9d6,0x8b2c3a,0x2a6f97,0xf1c27d];
const LOOK_HAIRS=['Ngắn','Dài','Búi tóc','Xù'],LOOK_BOTTOM=['Quần','Váy'];
const LOOK_HAT=['Không','Nón lưỡi trai','Nón lá','Vương miện','Mũ phù thủy','Tai mèo','Tai nghe','Nơ tóc'];
const LOOK_GLASS=['Không','Kính tròn','Kính râm'],LOOK_BACK=['Không','Ba lô','Áo choàng','Cánh thiên thần'],LOOK_NECK=['Không','Nơ cổ','Khăn quàng','Huy chương'];
/* Thứ tự 10 số: da, kiểu tóc, màu tóc, áo, màu quần hoặc váy, quần/váy, đầu, kính, lưng, cổ. LOOK_N là số lựa chọn của từng mục. */
const LOOK_N=[6,4,8,12,8,2,8,3,4,4];
const LOOK_DEF=[
  {i:0,label:'Màu da',colors:LOOK_SKIN},{i:1,label:'Kiểu tóc',names:LOOK_HAIRS},{i:2,label:'Màu tóc',colors:LOOK_HAIRC},
  {i:3,label:'Màu áo',colors:LOOK_SHIRT},{i:5,label:'Quần hay váy',names:LOOK_BOTTOM},{i:4,label:'Màu quần, váy',colors:LOOK_PANTS},
  {i:6,label:'Đầu',names:LOOK_HAT},{i:7,label:'Kính',names:LOOK_GLASS},{i:8,label:'Sau lưng',names:LOOK_BACK},{i:9,label:'Cổ và ngực',names:LOOK_NECK}
];
const validLook=l=>Array.isArray(l)&&l.length===10&&l.every((v,i)=>Number.isInteger(v)&&v>=0&&v<LOOK_N[i]);
const defaultLook=key=>[Math.floor(hashStr(key+'k')*4),0,Math.floor(hashStr(key+'h')*4),Math.floor(hashStr(key+'s')*8),0,0,0,0,0,0];
const KGEO={},KMAT={};   // dùng chung hình dạng và màu giữa các bạn để cảnh nhẹ hơn
function makeKid(T,key,look){
  const L=validLook(look)?look:defaultLook(key);
  const geo=(k,f)=>KGEO[k]||(KGEO[k]=f()),mat=c=>KMAT[c]||(KMAT[c]=new T.MeshLambertMaterial({color:c}));
  const mesh=(gk,gf,c,x,y,z,par)=>{const m=new T.Mesh(geo(gk,gf),mat(c));m.position.set(x,y,z);par.add(m);return m;};
  const sph=(r,ws=14,hs=10,...rest)=>()=>new T.SphereGeometry(r,ws,hs,...rest);
  const g=new T.Group(),body=new T.Group();g.add(body);
  const skinC=LOOK_SKIN[L[0]],hairC=LOOK_HAIRC[L[2]],shirtC=LOOK_SHIRT[L[3]],pantsC=LOOK_PANTS[L[4]],accC=LOOK_SHIRT[(L[3]+4)%12],skirt=L[5]===1;
  mesh('torso',()=>new T.CylinderGeometry(.3,.34,.8,10),shirtC,0,1.05,0,body);
  mesh('head',sph(.38),skinC,0,1.8,0,body);
  mesh('hair',sph(.4,14,8,0,Math.PI*2,0,Math.PI*.55),hairC,0,1.84,0,body);
  if(L[1]===1)mesh('hairL',()=>new T.BoxGeometry(.62,.8,.16),hairC,0,1.5,-.3,body);
  else if(L[1]===2)mesh('bun',sph(.2),hairC,0,2.27,-.05,body);
  else if(L[1]===3)[[0,2.22],[-.3,2.1],[.3,2.1]].forEach(([x,y])=>mesh('puff',sph(.22),hairC,x,y,0,body));
  [-.14,.14].forEach(x=>mesh('eye',sph(.05,6,6),0x111111,x,1.8,.35,body));
  const hat=L[6];
  if(hat===1){mesh('cap',sph(.43,14,8,0,Math.PI*2,0,Math.PI*.5),accC,0,1.86,0,body);mesh('brim',()=>new T.BoxGeometry(.5,.04,.34),accC,0,1.88,.4,body).rotation.x=.12;}
  else if(hat===2)mesh('nonla',()=>new T.ConeGeometry(.8,.5,18),0xe8d08a,0,2.24,0,body);
  else if(hat===3){mesh('crownb',()=>new T.CylinderGeometry(.3,.34,.2,12),0xf5b700,0,2.2,0,body);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;mesh('crownp',()=>new T.ConeGeometry(.07,.22,6),0xf5b700,Math.cos(a)*.27,2.4,Math.sin(a)*.27,body);}}
  else if(hat===4){mesh('wiz',()=>new T.ConeGeometry(.42,.95,14),0x5a3ea8,0,2.62,0,body);mesh('wizb',()=>new T.CylinderGeometry(.62,.62,.04,16),0x5a3ea8,0,2.14,0,body);}
  else if(hat===5)[-1,1].forEach(sd=>{mesh('ear',()=>new T.ConeGeometry(.15,.32,4),hairC,sd*.25,2.2,0,body).rotation.z=-sd*.3;});
  else if(hat===6){mesh('hpb',()=>new T.TorusGeometry(.42,.05,8,16,Math.PI),0x333333,0,1.8,0,body);[-1,1].forEach(sd=>{mesh('hpc',()=>new T.CylinderGeometry(.12,.12,.1,12),0xe5484d,sd*.43,1.8,0,body).rotation.z=Math.PI/2;});}
  else if(hat===7){[-1,1].forEach(sd=>{mesh('bowc',()=>new T.ConeGeometry(.1,.22,8),0xe4508a,sd*.13,2.18,.28,body).rotation.z=sd*Math.PI/2;});mesh('bowm',sph(.06,8,6),0xe4508a,0,2.18,.28,body);}
  if(L[7]===1){[-.14,.14].forEach(x=>mesh('gl1',()=>new T.TorusGeometry(.1,.02,8,16),0x222222,x,1.82,.37,body));mesh('glb',()=>new T.BoxGeometry(.08,.02,.02),0x222222,0,1.83,.38,body);}
  else if(L[7]===2){[-.14,.14].forEach(x=>mesh('gl2',()=>new T.BoxGeometry(.2,.12,.04),0x111111,x,1.82,.37,body));mesh('glb',()=>new T.BoxGeometry(.08,.02,.02),0x111111,0,1.83,.38,body);}
  if(L[8]===1)mesh('bp',()=>new T.BoxGeometry(.5,.6,.2),accC,0,1.1,-.33,body);
  else if(L[8]===2)mesh('cape',()=>new T.BoxGeometry(.66,.95,.05),0xd63a3a,0,1,-.3,body).rotation.x=.1;
  else if(L[8]===3)[-1,1].forEach(sd=>{const w=mesh('wing',()=>new T.SphereGeometry(.3,10,8),0xffffff,sd*.4,1.3,-.28,body);w.scale.set(.25,1.35,.7);w.rotation.z=sd*.45;});
  if(L[9]===1){[-1,1].forEach(sd=>{mesh('bowt',()=>new T.ConeGeometry(.09,.18,8),0xe5484d,sd*.1,1.48,.3,body).rotation.z=sd*Math.PI/2;});mesh('bowtm',sph(.05,8,6),0xe5484d,0,1.48,.3,body);}
  else if(L[9]===2){mesh('scarf',()=>new T.TorusGeometry(.28,.07,8,14),0xe5484d,0,1.5,0,body).rotation.x=Math.PI/2;mesh('scarft',()=>new T.BoxGeometry(.12,.4,.05),0xe5484d,.17,1.28,.32,body);}
  else if(L[9]===3){mesh('medal',()=>new T.CylinderGeometry(.08,.08,.02,12),0xf5b700,0,1.18,.34,body).rotation.x=Math.PI/2;mesh('medalr',()=>new T.BoxGeometry(.07,.28,.02),0x2b7fd0,0,1.34,.33,body);}
  const limb=(gk,w,h,d,c,px,py,oy)=>{const p=new T.Group();p.position.set(px,py,0);const m=new T.Mesh(geo(gk,()=>new T.BoxGeometry(w,h,d)),mat(c));m.position.y=oy;p.add(m);body.add(p);return p;};
  const legC=skirt?skinC:pantsC;
  const legL=limb('leg',.2,.65,.22,legC,-.14,.65,-.325),legR=limb('leg',.2,.65,.22,legC,.14,.65,-.325);
  [legL,legR].forEach(l=>mesh('shoe',()=>new T.BoxGeometry(.22,.12,.3),0x222222,0,-.65,.04,l));
  if(skirt)mesh('skirt',()=>new T.CylinderGeometry(.27,.43,.4,14),pantsC,0,.78,0,body);
  const armL=limb('arm',.14,.6,.14,shirtC,-.43,1.4,-.3),armR=limb('arm',.14,.6,.14,shirtC,.43,1.4,-.3);
  return {g,body,legL,legR,armL,armR};
}
function setKidMesh(k,key,look){
  const T=W3.T;if(k.g)W3.kids.remove(k.g);
  const kid=makeKid(T,key,look);kid.g.userData.key=key;
  const sh=new T.Mesh(W3.shadowGeo,W3.shadowMat);sh.rotation.x=-Math.PI/2;sh.position.y=.05;kid.g.add(sh);
  if(k.sp&&k.sp.material&&k.sp.material.map)k.sp.material.map.dispose();
  Object.assign(k,{g:kid.g,body:kid.body,legL:kid.legL,legR:kid.legR,armL:kid.armL,armR:kid.armR,sp:null,sig:'',bubble:null,lookSig:validLook(look)?look.join(','):'d'});
  W3.kids.add(kid.g);
}

/* ---- Xem trước và chọn trang phục trong form hồ sơ ---- */
let npLook=null,LP=null;
const hexC=c=>'#'+c.toString(16).padStart(6,'0');
function renderLookOpts(){
  const box=$('#look-opts');box.innerHTML='';const cur=npLook||defaultLook('preview');
  LOOK_DEF.forEach(d=>{
    const row=document.createElement('div');row.className='lrow';const lab=document.createElement('span');lab.className='llab';lab.textContent=d.label;row.appendChild(lab);
    const n=d.colors?d.colors.length:d.names.length;
    for(let j=0;j<n;j++){
      const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String(cur[d.i]===j));
      if(d.colors){b.className='sw';b.style.background=hexC(d.colors[j]);b.setAttribute('aria-label',d.label+' '+(j+1));}
      else{b.className='chip';b.textContent=d.names[j];}
      b.addEventListener('click',()=>{npLook=(npLook||defaultLook('preview')).slice();npLook[d.i]=j;renderLookOpts();updateLookPreview();});
      row.appendChild(b);
    }
    box.appendChild(row);
  });
}
async function updateLookPreview(){
  try{
    const T=await loadThree();
    if(!LP){
      const cv=$('#look-canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});r.setPixelRatio(1);r.setSize(cv.width,cv.height,false);
      const sc=new T.Scene();sc.add(new T.HemisphereLight(0xffffff,0x88aa88,1.1));const sun=new T.DirectionalLight(0xffffff,.7);sun.position.set(3,6,5);sc.add(sun);
      const cam=new T.PerspectiveCamera(30,cv.width/cv.height,.1,50);cam.position.set(0,2.0,6.6);cam.lookAt(0,1.5,0);
      LP={T,r,sc,cam,kid:null,rot:.5,raf:0,key:''};
    }
    const look=validLook(npLook)?npLook:null,k=look?look.join(','):'d';
    if(LP.key!==k||!LP.kid){if(LP.kid)LP.sc.remove(LP.kid.g);LP.kid=makeKid(LP.T,'preview',look);LP.sc.add(LP.kid.g);LP.key=k;}
    if(!LP.raf)lookPreviewLoop();
  }catch(e){const cv=$('#look-canvas');if(cv)cv.style.display='none';}
}
function lookPreviewLoop(){
  if(!LP||$('#newprof').hidden||screen!=='login'){if(LP)LP.raf=0;return;}
  LP.rot+=.018;const t=performance.now()/1000;
  LP.kid.g.rotation.y=LP.rot;LP.kid.armL.rotation.x=Math.sin(t*2)*.1;LP.kid.armR.rotation.x=-Math.sin(t*2)*.1;
  LP.r.render(LP.sc,LP.cam);LP.raf=requestAnimationFrame(lookPreviewLoop);
}
function refreshLookUI(){renderLookOpts();updateLookPreview();}
$('#look-rand').addEventListener('click',()=>{npLook=LOOK_N.map(n=>Math.floor(Math.random()*n));refreshLookUI();});
$('#look-reset').addEventListener('click',()=>{npLook=null;refreshLookUI();});

function sizeWorld(){if(!W3)return;const w=W3.host.clientWidth,h=W3.host.clientHeight;W3.renderer.setSize(w,h,false);W3.renderer.domElement.style.width=w+'px';W3.renderer.domElement.style.height=h+'px';W3.aspect=w/Math.max(1,h);W3.cam.aspect=W3.aspect;W3.cam.updateProjectionMatrix();}
const actOf=p=>['race','learn','parent'].includes(p.presence.act)?p.presence.act:'yard';
const ACT_ICON={race:'🏃',learn:'⌨️',yard:'🌳',parent:'👪'};
function actCounts(){const c={race:0,learn:0,yard:0,parent:0};onlinePeople().forEach(p=>{c[actOf(p)]++;});return c;}
function syncKids(){
  if(!W3)return;const {sprites,seatOf}=W3;
  const all=onlinePeople(),mine=all.filter(p=>p.isMe&&p.sameTab),others=all.filter(p=>!(p.isMe&&p.sameTab));
  W3.totalOnline=all.length;const people=mine.concat(others).slice(0,MAX_KIDS),seen=new Set();
  if(screen==='world')$('#w-note').textContent=all.length>MAX_KIDS?'Trường đông quá! Mình chỉ vẽ '+MAX_KIDS+' bạn đầu tiên nhé.':(room?'':'Đang kết nối máy chủ…');
  people.forEach(p=>{
    const key=p.peer;seen.add(key);const z=ZONES.find(x=>x.id===p.presence.stage)||ZONES[0],act=actOf(p);
    const look=validLook(p.presence.look)?p.presence.look:null,ls=look?look.join(','):'d';
    const nick=String(p.presence.nick||'Một bạn').slice(0,12)+(p.isMe&&p.sameTab?' (em)':''),av=String(p.presence.av||'🙂').slice(0,8);
    let k=sprites.get(key);
    if(!k){const h=hashStr(key);k={key,x:-8+h*16,z:23,yaw:Math.PI,ph:h*Math.PI*2,lane:hashStr(key+'l'),wx:0,wz:-3,wt:0,jump:0,sp:null,sig:'',lookSig:'',seated:false,act};setKidMesh(k,key,look);sprites.set(key,k);}
    else if(k.lookSig!==ls)setKidMesh(k,key,look);
    k.act=act;k.z0=z;
    const sig=nick+'|'+av+'|'+z.id;
    if(k.sig!==sig){k.sig=sig;if(k.sp){k.g.remove(k.sp);if(k.sp.material.map)k.sp.material.map.dispose();}k.sp=kidSprite(W3.T,av,nick,hex(z.color),p.isMe&&p.sameTab,W3.dark);k.sp.scale.set(2.5,2.93,1);k.g.add(k.sp);}
  });
  [...sprites.keys()].forEach(key=>{if(!seen.has(key)){W3.kids.remove(sprites.get(key).g);sprites.delete(key);seatOf.delete(key);W3.pslot.delete(key);W3.gslot.delete(key);}});
  /* chia chỗ: bạn nào đang học thì có một chỗ trong lớp, bạn ở Góc phụ huynh thì có chỗ đứng quanh bàn */
  const usedP=new Set();sprites.forEach((k,key)=>{if(k.act==='parent'&&W3.pslot.has(key))usedP.add(W3.pslot.get(key));else if(k.act!=='parent')W3.pslot.delete(key);});
  sprites.forEach((k,key)=>{if(k.act==='parent'&&!W3.pslot.has(key)){let i=0;while(usedP.has(i)&&i<PSLOTS.length-1)i++;usedP.add(i);W3.pslot.set(key,i);}});
  const fill={};GZ.forEach(z=>{fill[z.id]=new Set();});
  sprites.forEach((k,key)=>{const g=W3.gslot.get(key);if(k.act==='yard'&&g)fill[g.zone].add(g.idx);else if(k.act!=='yard')W3.gslot.delete(key);});
  [...sprites.entries()].sort((a,b)=>a[0]<b[0]?-1:1).forEach(([key,k])=>{
    if(k.act!=='yard'||W3.gslot.has(key))return;
    const open=GZ.filter(z=>fill[z.id].size<z.cap).sort((a,b)=>fill[a.id].size/a.cap-fill[b.id].size/b.cap);if(!open.length)return;
    const z=open[0];let i=0;while(fill[z.id].has(i))i++;fill[z.id].add(i);W3.gslot.set(key,{zone:z.id,idx:i});});
  const used=new Set();sprites.forEach((k,key)=>{if(k.act==='learn'&&seatOf.has(key))used.add(seatOf.get(key));else if(k.act!=='learn')seatOf.delete(key);});
  sprites.forEach((k,key)=>{if(k.act==='learn'&&!seatOf.has(key)){let i=0;while(used.has(i)&&i<SEATS.length-1)i++;used.add(i);seatOf.set(key,i);}});
  drawBoard();
}
function pokeKid(e){
  if(!W3)return;const r=W3.renderer.domElement.getBoundingClientRect();
  W3.ray.setFromCamera({x:((e.clientX-r.left)/r.width)*2-1,y:-((e.clientY-r.top)/r.height)*2+1},W3.cam);
  const hit=W3.ray.intersectObjects(W3.kids.children,true)[0];if(!hit)return;
  let o=hit.object;while(o&&!(o.userData&&o.userData.key))o=o.parent;if(!o)return;
  const k=W3.sprites.get(o.userData.key);if(!k)return;k.jump=1;
  const em=['👋','⭐','💖','😄','🎉'][Math.floor(Math.random()*5)];
  const sp=new W3.T.Sprite(new W3.T.SpriteMaterial({map:canvasTex(W3.T,128,128,(g,w)=>{g.textAlign='center';g.textBaseline='middle';g.font='96px '+FONT;g.fillText(em,w/2,w/2+6);}),transparent:true,depthWrite:false}));
  sp.scale.set(1.3,1.3,1);sp.position.set(k.g.position.x,4.2,k.g.position.z);W3.scene.add(sp);W3.pops.push({sp,t:performance.now()});
}
function worldLoop(){
  if(!W3||screen!=='world'){if(W3)W3.raf=0;return;}
  const now=performance.now(),t=(now-W3.t0)/1000,dt=Math.min(.05,(now-W3.last)/1000);W3.last=now;
  const ang=W3.angle+(W3.touched?0:Math.sin(t*.15)*.3),R=40*W3.zoom*Math.max(1,2.1/W3.aspect),H=34*W3.zoom;
  W3.cam.position.set(Math.sin(ang)*R,H,12+Math.cos(ang)*R);W3.cam.lookAt(0,.5,12);
  {const P=W3.props;if(P){P.rope.rotation.x=t*5;P.tug.position.x=GZ_BY.tug.cx+Math.sin(t*1.1)*.7;P.cau.position.y=1.4+Math.abs(Math.sin(t*2.2))*2.3;P.cau.position.x=GZ_BY.cau.cx+Math.sin(t*1.3)*.5;
    const pa=P.flag.geometry.attributes.position;for(let j=0;j<pa.count;j++){const x=P.flagBase[j*3];pa.array[j*3+2]=Math.sin(x*1.3-t*3.2)*.2*(x/5.4);}pa.needsUpdate=true;}}
  W3.sprites.forEach((k,key)=>{
    let tx,tz,spd,seat=null,gz=null,gs=null;
    if(k.act==='race'){const th=k.ph+t*(.38+.08*Math.max(0,ZONES.indexOf(k.z0))),r=5.1+k.lane*1;tx=Math.cos(th)*r*TRX;tz=TZ+Math.sin(th)*r*TRZ;spd=16;}
    else if(k.act==='learn'){seat=SEATS[W3.seatOf.get(key)||0];tx=seat.x;tz=seat.z;spd=7;}
    else if(k.act==='parent'){const ps=PSLOTS[W3.pslot.get(key)||0];tx=ps.x;tz=ps.z;spd=3;}
    else if(k.act==='yard'&&W3.gslot.has(key)){gz=W3.gslot.get(key);gs=gameSlot(GZ_BY[gz.zone],gz.idx,t);tx=gs.x;tz=gs.z;spd=(gs.pose==='hop'||gs.pose==='snake')?(Math.hypot(gs.x-k.x,gs.z-k.z)>4?5:30):4;}
    else{if(now>k.wt||Math.hypot(k.wx-k.x,k.wz-k.z)<.2){k.wx=YARD.x0+Math.random()*(YARD.x1-YARD.x0);k.wz=YARD.z0+Math.random()*(YARD.z1-YARD.z0);k.wt=now+3000+Math.random()*5000;}tx=k.wx;tz=k.wz;spd=1.7;}
    const dx=tx-k.x,dz=tz-k.z,d=Math.hypot(dx,dz),step=Math.min(d,spd*dt);
    if(d>.001){k.x+=dx/d*step;k.z+=dz/d*step;}
    const moving=d>.12;
    if(moving){const ty=Math.atan2(dx,dz);let df=ty-k.yaw;df=Math.atan2(Math.sin(df),Math.cos(df));k.yaw+=df*Math.min(1,dt*10);}
    const sitting=k.act==='learn'&&!moving&&seat&&!seat.stand;
    if(sitting){let df=Math.PI-k.yaw;df=Math.atan2(Math.sin(df),Math.cos(df));k.yaw+=df*Math.min(1,dt*10);}
    else if(k.act==='learn'&&!moving&&seat&&seat.stand){let df=Math.PI-k.yaw;df=Math.atan2(Math.sin(df),Math.cos(df));k.yaw+=df*Math.min(1,dt*10);}
    if(gs&&!moving){const ty=gs.yaw!==undefined?gs.yaw:Math.atan2(gs.fx-k.x,gs.fz-k.z);let df=ty-k.yaw;df=Math.atan2(Math.sin(df),Math.cos(df));k.yaw+=df*Math.min(1,dt*9);}
    if(k.act==='parent'&&!moving){const ty=Math.atan2(PARENT.x-k.x,PARENT.z-k.z);let df=ty-k.yaw;df=Math.atan2(Math.sin(df),Math.cos(df));k.yaw+=df*Math.min(1,dt*8);}
    const w=Math.sin(t*(k.act==='race'?11:7)+k.ph);let by=0,lean=0,la=0,aa=0;
    if(sitting){by=-.1;k.legL.rotation.x=k.legR.rotation.x=-Math.PI/2;k.armL.rotation.x=-1.15+Math.sin(t*15+k.ph)*.14;k.armR.rotation.x=-1.15+Math.cos(t*13+k.ph)*.14;}
    else if(gs&&!moving){
      const p=gs.pose,ph=k.ph,ra=t*5;k.legL.rotation.x=k.legR.rotation.x=0;
      if(p==='turn'){k.armL.rotation.x=k.armR.rotation.x=-1.05+Math.sin(ra)*.5;}
      else if(p==='jump'){by=.55*Math.pow(Math.max(0,-Math.cos(ra)),2);k.armL.rotation.x=k.armR.rotation.x=-.5+Math.sin(ra)*.4;}
      else if(p==='clap'){k.armL.rotation.x=k.armR.rotation.x=-1.25+Math.sin(t*10+ph)*.3;by=Math.pow(Math.max(0,Math.sin(t*3+ph)),8)*.15;}
      else if(p==='tug'){lean=-.4;k.armL.rotation.x=k.armR.rotation.x=-1.5;k.legL.rotation.x=.3;k.legR.rotation.x=-.3;}
      else if(p==='sit'){by=-.62;k.legL.rotation.x=k.legR.rotation.x=-Math.PI/2;k.armL.rotation.x=-1+Math.sin(t*3+ph)*.25;k.armR.rotation.x=-.8+Math.cos(t*2.4+ph)*.25;}
      else if(p==='kick'){k.legR.rotation.x=-Math.max(0,Math.sin(t*3+ph))*1.3;k.armL.rotation.x=.3;k.armR.rotation.x=-.3;by=Math.max(0,Math.sin(t*3+ph+1.2))*.12;}
      else if(p==='hop'){by=Math.abs(Math.sin(t*7+ph))*.55;k.armL.rotation.x=k.armR.rotation.x=-.3;}
      else if(p==='snake'){const sw=Math.sin(t*7+ph);k.legL.rotation.x=sw*.5;k.legR.rotation.x=-sw*.5;k.armL.rotation.x=k.armR.rotation.x=-1.1;by=Math.abs(sw)*.05;}
    }
    else if(moving){const f=k.act==='race'?1:.5;la=w*f;aa=-w*f*.9;k.legL.rotation.x=la;k.legR.rotation.x=-la;k.armL.rotation.x=-aa;k.armR.rotation.x=aa;by=Math.abs(w)*(k.act==='race'?.14:.05);lean=k.act==='race'?.2:.04;}
    else if(k.act==='parent'){k.legL.rotation.x=k.legR.rotation.x=0;k.armL.rotation.x=-.5+Math.sin(t*3+k.ph)*.35;k.armR.rotation.x=Math.sin(t*1.7+k.ph*2)*.12;by=Math.max(0,Math.sin(t*2+k.ph*3))**10*.12;}
    else{k.legL.rotation.x=k.legR.rotation.x=0;k.armL.rotation.x=Math.sin(t*2+k.ph)*.08;k.armR.rotation.x=-Math.sin(t*2+k.ph)*.08;by=Math.max(0,Math.sin(t*2.5+k.ph*3))**12*.25;}
    let spin=0;if(k.jump>0){k.jump=Math.max(0,k.jump-dt*1.4);by+=Math.sin((1-k.jump)*Math.PI)*1.1;spin=(1-k.jump)*Math.PI*2;k.armL.rotation.x=k.armR.rotation.x=-2.6;}
    if(k.bubble&&now>k.bubble.until){k.g.remove(k.bubble.sp);k.bubble=null;}
    k.body.position.y=by;k.body.rotation.x=lean;k.g.position.set(k.x,0,k.z);k.g.rotation.y=k.yaw+spin;
    if(k.sp)k.sp.position.y=3.15+by*.6+(sitting?-.1:0);
  });
  for(let i=W3.pops.length-1;i>=0;i--){const p=W3.pops[i],a=(now-p.t)/1400;if(a>=1){W3.scene.remove(p.sp);W3.pops.splice(i,1);continue;}p.sp.position.y=4.2+a*2.2;p.sp.material.opacity=1-a;}
  W3.renderer.render(W3.scene,W3.cam);W3.raf=requestAnimationFrame(worldLoop);
}
function renderWorldList(){
  const people=onlinePeople();
  $('#w-total').textContent=room?(people.length+' bạn đang online'):'Chưa kết nối';
  const box=$('#w-zones');box.innerHTML='';
  ZONES.forEach(z=>{
    const ps=people.filter(p=>(p.presence.stage||'bo')===z.id);
    const d=document.createElement('div');d.className='wzone';d.style.setProperty('--zc',hex(z.color));
    const h=document.createElement('h2');h.textContent=z.icon+' '+z.name+' ('+ps.length+')';d.appendChild(h);
    const ul=document.createElement('div');ul.className='wkids';
    ps.slice(0,60).forEach(p=>{const s=document.createElement('span');s.className='wkid'+(p.isMe&&p.sameTab?' me':'');s.textContent=ACT_ICON[actOf(p)]+' '+String(p.presence.av||'🙂').slice(0,8)+' '+String(p.presence.nick||'Một bạn').slice(0,12)+(p.isMe&&p.sameTab?' (em)':'');ul.appendChild(s);});
    if(ps.length>60){const s=document.createElement('span');s.className='wnone';s.textContent='và '+(ps.length-60)+' bạn nữa';ul.appendChild(s);}
    if(!ps.length){const s=document.createElement('span');s.className='wnone';s.textContent='Chưa có ai';ul.appendChild(s);}
    d.appendChild(ul);box.appendChild(d);
  });
  syncKids();
}
function openWorld(){
  if(!curPid||screen==='login')return;
  stopAll();show('world');renderWorldList();renderChat();
  $('#w-note').textContent=room?'':'Đang kết nối máy chủ…';
  loadThree().then(T=>{if(!W3)initWorld(T);sizeWorld();syncKids();if(!W3.raf)worldLoop();})
    .catch(()=>{$('#world3d').innerHTML='<p class="note" style="padding:20px">Không tải được hình 3D. Danh sách các bạn vẫn ở bên dưới.</p>';});
}
$('#online-pill').addEventListener('click',openWorld);
$('#os-world').addEventListener('click',openWorld);
$('#w-back').addEventListener('click',()=>show('home'));
$('#w-zin').addEventListener('click',()=>zoomWorld(.85));
$('#w-zout').addEventListener('click',()=>zoomWorld(1.18));

/* ================= Keyboard shortcuts ================= */
let resultsAt=0;
function handleShortcut(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return false;
  const ae=document.activeElement;
  if(ae&&(ae.tagName==='TEXTAREA'||ae.tagName==='SELECT'||(ae.tagName==='INPUT'&&!['checkbox','radio','button'].includes(ae.type))))return false;
  if(ae&&ae.tagName==='INPUT')ae.blur();
  if(!$('#handtip').hidden){if(e.key==='Enter'||e.key==='Escape'||e.code==='Space'){e.preventDefault();closeHandTip();}return true;}
  if(!$('#rest').hidden){if(e.key==='Enter'){e.preventDefault();$('#rest-ok').click();}return true;}
  if(screen==='cert'){if(e.key==='Escape'){e.preventDefault();show('home');}return true;}
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
  $('#acct-email').textContent=user.email;$('#fb-admin').hidden=!user.admin;
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
const doLogout=async()=>{try{await api('POST','/api/auth/logout');}catch(e){}signedOut();};
$('#logout').addEventListener('click',doLogout);$('#logout-top').addEventListener('click',doLogout);
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
const AUTH_ERRS={nouser:'Gmail này chưa có tài khoản. Bấm “Đăng ký” trước nhé.',consent:'Ba mẹ hãy tick ô đồng ý trước nhé.',many:'Bạn thử quá nhiều lần. Đợi một lát rồi thử lại.',off:'Chưa dùng được Google. Bạn đăng ký bằng email nhé.',google:'Đăng nhập Google chưa được. Bạn thử lại nhé.',locked:'Tài khoản này đang bị khoá. Ba mẹ hãy liên hệ OplaKid nhé.'};
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
$$('.tg-music').forEach(b=>b.addEventListener('click',e=>{e.currentTarget.blur();state.music=!state.music;save();syncToggles();musicSync();}));
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
let imeTimer=0;
function showImeWarn(){const w=$('#ime-warn');w.hidden=false;clearTimeout(imeTimer);imeTimer=setTimeout(()=>{w.hidden=true;},12000);}
document.addEventListener('keydown',e=>{
  if(e.isComposing||e.key==='Process'||e.keyCode===229){
    const t=document.activeElement&&document.activeElement.tagName;
    if(t!=='INPUT'&&t!=='TEXTAREA')showImeWarn();
    return;
  }
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
  $('#ime-tip').hidden=false;$('#ime-tip').textContent='Trên điện thoại có thể chạm vào bàn phím trên màn hình để thử, nhưng muốn luyện ngón tay đúng thì cần máy tính có bàn phím thật.';
}
syncToggles();renderWho();bootstrap();
})();

