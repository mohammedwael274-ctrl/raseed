const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE='raseed_finance_v1';
const today=new Date(), monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, fmt=n=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:0}).format(Math.round(n||0))+' ج.م', dateISO=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
let data=JSON.parse(localStorage.getItem(STORE)||'null')||{transactions:[],budgets:[{name:'أكل وشرب',limit:2000},{name:'مواصلات',limit:1000},{name:'خروجات',limit:1000},{name:'ملابس',limit:1500},{name:'إنترنت وموبايل',limit:500},{name:'مصاريف شخصية',limit:1000},{name:'طوارئ',limit:1000}],tasks:{'urgent-important':[],'not-urgent-not-important':[],'important-not-urgent':[],'urgent-not-important':[]},jars:[{id:1,name:'الخطوبة',emoji:'💍',target:50000,saved:0},{id:2,name:'المواسم والأعياد',emoji:'🎁',target:10000,saved:0},{id:3,name:'الطوارئ',emoji:'🛟',target:20000,saved:0}]};
let currentMonth=monthKey(today);
function save(){localStorage.setItem(STORE,JSON.stringify(data));render()}
function monthTx(){return data.transactions.filter(t=>t.date.startsWith(currentMonth))}
function sum(arr,type){return arr.filter(t=>t.type===type).reduce((s,t)=>s+Number(t.amount),0)}
function monthName(){let [y,m]=currentMonth.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('ar-EG',{month:'long',year:'numeric'})}
$('#monthPicker').value=currentMonth;$('#todayLabel').textContent=today.toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long'});
$('#monthPicker').addEventListener('change',e=>{currentMonth=e.target.value||monthKey(today);render()});
function render(){let tx=monthTx(),inc=sum(tx,'income'),out=sum(tx,'expense'),net=inc-out,rate=inc?Math.max(0,Math.round(net/inc*100)):0;
$('#balanceValue').textContent=fmt(net);$('#incomeValue').textContent=fmt(inc);$('#expenseValue').textContent=fmt(out);$('#savingRate').textContent=rate+'%';$('#rateBar').style.width=Math.min(rate,100)+'%';$('#chartMonth').textContent=monthName();
let rating=inc===0?'—':net<0?25:rate>=40?95:rate>=20?82:rate>=5?68:48;
$('#ratingScore').textContent=inc===0?'—':rating+'/100';$('#ratingTitle').textContent=inc===0?'ابدأ تسجيل حركاتك':rating>=85?'ممتاز! إدارتك قوية 👏':rating>=65?'كويس جدًا.. كمل':rating>=45?'محتاج توازن أكتر':'خلي بالك من المصروفات';
$('#ratingText').textContent=inc===0?'كل ما تسجل دخلك ومصروفاتك، هنعرف نقيم إدارتك للفلوس.':net<0?'مصروفاتك أعلى من دخلك؛ راجع البنود وحاول تقلل الصرف.':`وفرت ${fmt(net)} من دخلك خلال الشهر. استمر على نفس النظام.`;
$('#ratingPercent').textContent=rating+'%';$('#ratingBar').style.width=rating+'%';
renderDaily(tx,net);renderBudget(tx);renderTasks();renderJars();drawChart(tx);
}
function renderDaily(tx,net){let [y,m]=currentMonth.split('-').map(Number),days=new Date(y,m,0).getDate(),rows='';for(let d=1;d<=days;d++){let date=`${currentMonth}-${String(d).padStart(2,'0')}`,list=tx.filter(t=>t.date===date),i=sum(list,'income'),o=sum(list,'expense');if(!list.length)continue;let notes=list.map(t=>t.note||t.category).filter(Boolean).join('، ');rows+=`<tr><td><b>${new Date(y,m-1,d).toLocaleDateString('ar-EG',{weekday:'long'})}</b></td><td>${d} / ${m}</td><td class="amount-in">${i?fmt(i):'—'}</td><td class="amount-out">${o?fmt(o):'—'}</td><td class="${i-o>=0?'net-positive':'net-negative'}">${fmt(i-o)}</td><td>${escapeHtml(notes||'—')}</td></tr>`}
$('#dailyRows').innerHTML=rows||'<tr><td colspan="6" style="text-align:center;padding:28px;color:#a0a9b8">لسه مفيش حركات في الشهر ده. اضغط «حركة جديدة» وابدأ التسجيل.</td></tr>';$('#daysCount').textContent=new Set(tx.map(t=>t.date)).size+' يوم مسجل';$('#monthNet').textContent='صافي الشهر: '+fmt(net)}
function renderBudget(tx){let total=data.budgets.reduce((s,b)=>s+Number(b.limit),0),spent=0;let html=data.budgets.map((b,i)=>{let used=tx.filter(t=>t.type==='expense'&&t.category===b.name).reduce((s,t)=>s+Number(t.amount),0);spent+=used;let p=b.limit?Math.min(used/b.limit*100,100):0;return `<div class="budget-item"><div class="budget-item-top"><span>${escapeHtml(b.name)}</span><b>${fmt(used)} <small style="color:#a0a9b8;font-weight:500">/ ${fmt(b.limit)}</small></b></div><div class="budget-track"><span style="width:${p}%;background:${p>=100?'#ed7480':p>=80?'#e7b44e':''}"></span></div><div class="budget-meta"><span>${p>=100?'تخطيت الميزانية':`استخدمت ${Math.round(p)}%`}</span><button data-delete-budget="${i}" style="border:0;background:none;color:#d77a82;cursor:pointer;font:inherit">حذف</button></div></div>`}).join('');$('#budgetList').innerHTML=html||'<p class="muted">أضف أول بند لميزانيتك.</p>';$('#budgetTotal').textContent=fmt(total);$('#budgetSpent').textContent=fmt(spent);$('#budgetRemaining').textContent=fmt(total-spent);$$('[data-delete-budget]').forEach(b=>b.onclick=()=>{data.budgets.splice(+b.dataset.deleteBudget,1);save()})}
const taskNames={'urgent-important':'هام وعاجل','not-urgent-not-important':'غير هام وغير عاجل','important-not-urgent':'هام وغير عاجل','urgent-not-important':'عاجل وغير هام'};
function renderTasks(){Object.keys(taskNames).forEach(k=>{$('#tasks-'+k).innerHTML=(data.tasks[k]||[]).map((t,i)=>`<li>${escapeHtml(t)}<button data-task="${k}:${i}" title="حذف">×</button></li>`).join('')||'<li style="color:#b0b7c4">مفيش مهام مضافة لسه</li>'});$$('[data-task]').forEach(b=>b.onclick=()=>{let [k,i]=b.dataset.task.split(':');data.tasks[k].splice(+i,1);save()})}
function jarPlan(j){
  const target=Math.max(0,Number(j.target)||0), saved=Math.max(0,Number(j.saved)||0);
  const remaining=Math.max(0,target-saved);
  if(!j.deadline) return {remaining,days:null,daily:null,weekly:null,monthly:null,status:'no-date'};
  const now=new Date(); now.setHours(0,0,0,0);
  const due=new Date(j.deadline+'T00:00:00');
  const days=Math.ceil((due-now)/86400000)+1;
  if(remaining===0) return {remaining,days:Math.max(0,days),daily:0,weekly:0,monthly:0,status:'done'};
  if(days<=0) return {remaining,days:0,daily:null,weekly:null,monthly:null,status:'late'};
  const daily=remaining/days;
  return {remaining,days,daily,weekly:daily*7,monthly:daily*30,status:'active'};
}
function renderJars(){$('#jarsGrid').innerHTML=data.jars.map(j=>{let p=j.target?Math.min(j.saved/j.target*100,100):0;let plan=jarPlan(j);let planHtml=plan.status==='no-date'?'<div class="jar-plan muted">حدد ميعاد الوصول للهدف عشان نحسب خطة الادخار.</div>':plan.status==='late'?`<div class="jar-plan jar-late">⚠️ الموعد عدى، ولسه متبقي ${fmt(plan.remaining)}.</div>`:plan.status==='done'?'<div class="jar-plan jar-done">🎉 مبروك! حققت هدف الحصالة.</div>':`<div class="jar-plan"><div class="jar-plan-head"><b>خطة الوصول للهدف</b><span>${plan.days} يوم متبقي</span></div><div class="jar-plan-grid"><div><small>يوميًا</small><b>${fmt(plan.daily)}</b></div><div><small>أسبوعيًا</small><b>${fmt(plan.weekly)}</b></div><div><small>شهريًا تقريبًا</small><b>${fmt(plan.monthly)}</b></div></div><small class="jar-plan-note">الحساب على أساس ${plan.days} يوم متبقي، والشهري = اليومي × 30.</small></div>`;return `<article class="jar-card"><div class="jar-top"><span class="jar-emoji">${j.emoji||'🐷'}</span><div><b>${escapeHtml(j.name)}</b><small>هدفك المالي</small></div></div><div class="jar-amount">${fmt(j.saved)} <small>من ${fmt(j.target)}</small></div><div class="jar-track"><span style="width:${p}%"></span></div><div class="jar-foot"><span>${Math.round(p)}% من الهدف</span><span>متبقي ${fmt(Math.max(0,j.target-j.saved))}</span></div>${planHtml}<div class="jar-actions"><button data-deposit="${j.id}">＋ إيداع</button><button data-withdraw="${j.id}">－ سحب</button><button data-editjar="${j.id}">تعديل الموعد</button><button data-removejar="${j.id}">حذف</button></div></article>`}).join('')||'<p class="muted">لسه مفيش حصالات. أنشئ أول حصالة ليك.</p>';$$('[data-deposit]').forEach(b=>b.onclick=()=>jarMove(+b.dataset.deposit,1));$$('[data-withdraw]').forEach(b=>b.onclick=()=>jarMove(+b.dataset.withdraw,-1));$$('[data-editjar]').forEach(b=>b.onclick=()=>{let j=data.jars.find(x=>x.id===+b.dataset.editjar);if(!j)return;let v=prompt('اكتب تاريخ الوصول بالشكل YYYY-MM-DD',j.deadline||'');if(v===null)return;if(v && !/^\\d{4}-\\d{2}-\\d{2}$/.test(v)){alert('صيغة التاريخ غير صحيحة.');return;}j.deadline=v;save()});$$('[data-removejar]').forEach(b=>b.onclick=()=>{if(confirm('متأكد من حذف الحصالة؟')){data.jars=data.jars.filter(j=>j.id!==+b.dataset.removejar);save()}})}
function jarMove(id,sign){let j=data.jars.find(x=>x.id===id),v=Number(prompt(sign>0?'عايز تضيف كام للحصالة؟':'عايز تسحب كام من الحصالة؟'));if(!v||v<0)return;j.saved=Math.max(0,j.saved+sign*v);save()}
function drawChart(tx){let c=$('#moneyChart'),ctx=c.getContext('2d'),w=c.clientWidth,h=c.clientHeight,dpr=window.devicePixelRatio||1;c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);let [y,m]=currentMonth.split('-').map(Number),days=new Date(y,m,0).getDate(),step=Math.ceil(days/7),vals=[];for(let start=1;start<=days;start+=step){let end=Math.min(days,start+step-1),part=tx.filter(t=>{let d=+t.date.slice(-2);return d>=start&&d<=end});vals.push({label:`${start}-${end}`,i:sum(part,'income'),o:sum(part,'expense')})}let max=Math.max(1,...vals.flatMap(v=>[v.i,v.o]))*1.2,left=8,right=8,top=12,bottom=28,chartH=h-top-bottom,groupW=(w-left-right)/vals.length;ctx.font='10px Cairo';ctx.textAlign='center';vals.forEach((v,i)=>{let x=left+i*groupW+groupW/2,bw=Math.min(16,groupW*.25),hi=v.i/max*chartH,ho=v.o/max*chartH;ctx.fillStyle='#22b58a';roundRect(ctx,x-bw-2,top+chartH-hi,bw,hi,5);ctx.fill();ctx.fillStyle='#ef7985';roundRect(ctx,x+2,top+chartH-ho,bw,ho,5);ctx.fill();ctx.fillStyle='#9aa4b4';ctx.fillText(v.label,x,h-7)});ctx.strokeStyle='#edf0f5';ctx.beginPath();ctx.moveTo(left,top+chartH);ctx.lineTo(w-right,top+chartH);ctx.stroke()}
function roundRect(c,x,y,w,h,r){if(h<1)return;c.beginPath();c.roundRect(x,y,w,Math.max(h,2),[r,r,0,0])}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const txDialog=$('#transactionDialog');function openTx(){ $('#txDate').value=dateISO(today);$('#txAmount').value='';$('#txNote').value='';txDialog.showModal()}
$('#quickAdd').onclick=openTx;$('#addDayBtn').onclick=openTx;
$('#transactionForm').addEventListener('submit',e=>{e.preventDefault();let amount=Number($('#txAmount').value),date=$('#txDate').value;if(!amount||amount<=0||!date)return;data.transactions.push({id:Date.now(),type:$('input[name="type"]:checked').value,amount,date,category:$('#txCategory').value,note:$('#txNote').value.trim()});txDialog.close();save()});
let simpleAction=null;function simpleModal(title,fields,action){$('#simpleTitle').textContent=title;$('#simpleEyebrow').textContent='إضافة جديدة';$('#simpleFields').innerHTML=fields.map(f=>`<div class="simple-field"><label>${f.label}</label>${f.type==='select'?`<select name="${f.name}">${f.options.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`:`<input name="${f.name}" type="${f.type||'text'}" ${f.min!==undefined?`min="${f.min}"`:''} placeholder="${f.placeholder||''}" required>`}</div>`).join('');simpleAction=action;$('#simpleDialog').showModal()}
$('#simpleForm').addEventListener('submit',e=>{e.preventDefault();let obj=Object.fromEntries(new FormData(e.target));simpleAction(obj);$('#simpleDialog').close();save()});
$('#addBudgetBtn').onclick=()=>simpleModal('إضافة بند للميزانية',[{name:'name',label:'اسم البند',placeholder:'مثلاً تعليم أو بنزين'},{name:'limit',label:'الميزانية المحددة بالجنيه',type:'number',min:1}],v=>data.budgets.push({name:v.name,limit:+v.limit}));
$('#addJarBtn').onclick=()=>simpleModal('حصالة جديدة',[{name:'name',label:'اسم الحصالة',placeholder:'مثلاً شراء لابتوب'},{name:'target',label:'المبلغ المستهدف بالجنيه',type:'number',min:1},{name:'deadline',label:'ميعاد الوصول للهدف',type:'date'},{name:'emoji',label:'رمز الحصالة',placeholder:'🐷'}],v=>data.jars.push({id:Date.now(),name:v.name,target:+v.target,saved:0,deadline:v.deadline||'',emoji:v.emoji||'🐷'}));
$$('[data-add-task]').forEach(b=>b.onclick=()=>{let k=b.dataset.addTask;simpleModal('إضافة مهمة – '+taskNames[k],[{name:'task',label:'المهمة',placeholder:'اكتب المهمة اللي عايز تنجزها'}],v=>data.tasks[k].push(v.task))});
$('#exportBtn').onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='raseed-backup.json';a.click();URL.revokeObjectURL(url)};
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');$$('.nav-link').forEach(a=>a.addEventListener('click',()=>$('#sidebar').classList.remove('open')));
window.addEventListener('resize',()=>drawChart(monthTx()));render();

// تنقل بين صفحات مستقلة داخل التطبيق
function showPage(page, updateHash=true){
  const valid=['overview','daily','budget','future','savings'];
  if(!valid.includes(page)) page='overview';
  document.querySelectorAll('[data-page-view]').forEach(v=>v.classList.toggle('active',v.dataset.pageView===page));
  document.querySelectorAll('.nav-link[data-page]').forEach(a=>a.classList.toggle('active',a.dataset.page===page));
  if(updateHash && location.hash !== '#'+page) history.replaceState(null,'','#'+page);
  if(page==='overview') drawChart(monthTx());
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.nav-link[data-page]').forEach(a=>{
  a.addEventListener('click',e=>{e.preventDefault();showPage(a.dataset.page);$('#sidebar').classList.remove('open')});
});
window.addEventListener('hashchange',()=>showPage(location.hash.slice(1),false));
const initialPage=location.hash.slice(1)||'overview';
showPage(initialPage,false);
