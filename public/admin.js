'use strict';
(function(){
const $=s=>document.querySelector(s);
const fmt=t=>t?new Date(t).toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'}):'—';
const ago=t=>{if(!t)return '—';const s=(Date.now()-t)/1000;return s<3600?Math.max(1,Math.round(s/60))+' phút trước':s<86400?Math.round(s/3600)+' giờ trước':Math.round(s/86400)+' ngày trước';};
const dur=s=>{const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return (d?d+' ngày ':'')+(h||d?h+' giờ ':'')+m+' phút';};
async function api(method,url,body){
  const r=await fetch(url,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  let data=null;try{data=await r.json();}catch(e){}
  if(!r.ok){const err=new Error((data&&data.error)||'Có lỗi xảy ra.');err.status=r.status;throw err;}
  return data;
}
function card(v,l,sub){const d=document.createElement('div');d.className='box acard';const b=document.createElement('div');b.className='big';b.textContent=v;const s=document.createElement('span');s.textContent=l;d.append(b,s);if(sub){const n=document.createElement('p');n.className='note';n.textContent=sub;d.appendChild(n);}return d;}
function row(label,val,warn){const d=document.createElement('div');d.className='arow';const a=document.createElement('span');a.textContent=label;const b=document.createElement('b');b.textContent=val;if(warn)b.style.color='var(--bad)';d.append(a,b);return d;}

async function loadStats(){
  const s=await api('GET','/api/admin/stats'),u=s.users;
  const c=$('#a-cards');c.innerHTML='';
  c.append(card(u.total,'tài khoản ba mẹ','Khoá: '+u.disabled),card(u.kids,'hồ sơ bé'),
    card(u.new24h,'đăng ký trong 24 giờ','7 ngày: '+u.new7d+' · 30 ngày: '+u.new30d),
    card(u.active24h,'ba mẹ có bé học trong 24 giờ','7 ngày: '+u.active7d+' · đăng nhập 7 ngày: '+u.login7d),
    card(s.online.users,'đang online','Kết nối: '+s.online.sockets+' · cuộc đua đang có: '+s.online.races),
    card(s.feedback.total,'góp ý','7 ngày qua: '+s.feedback.new7d));
  const max=Math.max(1,...s.signups.map(x=>x.n)),bars=$('#a-bars');bars.innerHTML='';
  s.signups.forEach(x=>{const w=document.createElement('div');w.className='bar';const i=document.createElement('i');i.style.height=Math.round(x.n/max*100)+'%';i.title=x.day+': '+x.n;const t=document.createElement('span');t.textContent=x.day.slice(8)+'/'+x.day.slice(5,7);const n=document.createElement('em');n.textContent=x.n;w.append(n,i,t);bars.appendChild(w);});
  $('#a-bars-note').textContent='Tổng 14 ngày: '+s.signups.reduce((a,x)=>a+x.n,0)+' tài khoản mới.';
  const sv=s.server,box=$('#a-server');box.innerHTML='';
  box.append(row('Chạy liên tục',dur(sv.uptimeSec)),row('Bộ nhớ (RSS / heap)',sv.rssMB+' / '+sv.heapMB+' MB'),row('Dung lượng cơ sở dữ liệu',sv.dbMB+' MB'),
    row('Yêu cầu API',String(sv.reqs)),row('Lỗi máy chủ (5xx)',String(sv.err5xx),sv.err5xx>0),
    row('Thời gian xử lý trung bình / p95 / lớn nhất',sv.avgMs+' / '+sv.p95Ms+' / '+sv.maxMs+' ms',sv.p95Ms>500),
    row('Độ trễ vòng lặp (p99)',sv.loopP99Ms+' ms',sv.loopP99Ms>100),row('Phiên bản Node',sv.node));
  const log=$('#a-log');log.innerHTML='';
  if(!s.log.length){log.textContent='Chưa có thao tác nào.';}
  s.log.forEach(x=>{const d=document.createElement('div');d.className='fbitem';d.textContent=fmt(x.at)+' · '+x.admin+' · '+x.action+' · '+x.target;log.appendChild(d);});
}

let page=0,query='',total=0,size=25;
async function loadUsers(){
  const r=await api('GET','/api/admin/users?q='+encodeURIComponent(query)+'&page='+page);
  total=r.total;size=r.size;const tb=$('#a-users');tb.innerHTML='';
  $('#a-total').textContent=total+' tài khoản'+(query?' khớp “'+query+'”':'');
  const pages=Math.max(1,Math.ceil(total/size));$('#a-page').textContent='Trang '+(page+1)+'/'+pages;$('#a-prev').disabled=page<=0;$('#a-next').disabled=page+1>=pages;
  r.items.forEach(u=>{
    const tr=document.createElement('tr');
    const cells=[u.email+(u.admin?' (quản trị)':''),fmt(u.createdAt),ago(u.lastLogin),ago(u.lastActive),String(u.kids),String(u.feedback),u.disabled?'🔒 Đã khoá':'Đang dùng'];
    cells.forEach((t,i)=>{const td=document.createElement('td');td.textContent=t;if(i===6&&u.disabled)td.style.color='var(--bad)';if(i===0)td.style.overflowWrap='anywhere';tr.appendChild(td);});
    const td=document.createElement('td');td.className='aact';
    if(u.admin){td.textContent='—';}
    else{
      const btn=(t,fn,cls)=>{const b=document.createElement('button');b.type='button';b.className='chip'+(cls?' '+cls:'');b.textContent=t;b.addEventListener('click',async()=>{b.disabled=true;try{await fn();}catch(e){alert(e.message);}b.disabled=false;});td.appendChild(b);};
      btn(u.disabled?'Mở khoá':'Khoá',async()=>{if(!u.disabled&&!confirm('Khoá tài khoản '+u.email+'? Người này sẽ bị đăng xuất và không đăng nhập được.'))return;await api('POST','/api/admin/users/'+u.id+'/disable',{disabled:!u.disabled});await refresh();});
      btn('Đăng xuất mọi máy',async()=>{if(!confirm('Đăng xuất '+u.email+' khỏi mọi thiết bị?'))return;await api('POST','/api/admin/users/'+u.id+'/logout');await refresh();});
      btn('Link đặt mật khẩu',async()=>{const r2=await api('POST','/api/admin/users/'+u.id+'/reset-link');$('#a-link-who').textContent=u.email;$('#a-link').value=r2.link;$('#a-link-box').hidden=false;$('#a-link').focus();$('#a-link').select();await loadStats();});
      btn('Xoá',async()=>{const t=prompt('Xoá vĩnh viễn tài khoản này cùng hồ sơ của '+u.kids+' bé? Gõ lại email để xác nhận:\n'+u.email);if(t===null)return;await api('DELETE','/api/admin/users/'+u.id,{confirm:t});await refresh();},'danger');
    }
    tr.appendChild(td);tb.appendChild(tr);
  });
}
async function refresh(){await Promise.all([loadStats(),loadUsers()]);}
$('#a-search').addEventListener('submit',e=>{e.preventDefault();query=e.currentTarget.q.value.trim();page=0;loadUsers().catch(err=>{$('#a-msg').textContent=err.message;});});
$('#a-prev').addEventListener('click',()=>{if(page>0){page--;loadUsers();}});
$('#a-next').addEventListener('click',()=>{page++;loadUsers();});
$('#a-reload').addEventListener('click',()=>refresh().catch(e=>{$('#a-msg').textContent=e.message;}));
$('#a-copy').addEventListener('click',async e=>{const b=e.currentTarget;try{await navigator.clipboard.writeText($('#a-link').value);b.textContent='Đã sao chép';}catch(_){$('#a-link').select();}setTimeout(()=>{b.textContent='Sao chép link';},2000);});

(async function init(){
  const msg=$('#a-msg');
  try{
    const me=await api('GET','/api/auth/me');
    if(!me.user.admin){msg.textContent='Tài khoản '+me.user.email+' không phải quản trị viên.';return;}
    msg.textContent='Đăng nhập với '+me.user.email;
    $('#a-main').hidden=false;$('#a-reload').hidden=false;
    await refresh();
  }catch(e){
    if(e.status===401){msg.innerHTML='';const a=document.createElement('a');a.href='/';a.textContent='Bạn cần đăng nhập OplaKid bằng tài khoản quản trị trước. Bấm vào đây để đăng nhập.';msg.appendChild(a);}
    else msg.textContent=e.message;
  }
})();
})();
