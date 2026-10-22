const CATEGORIES = {
  expense: [
    {name:"Ăn uống",icon:"🍜"},{name:"Đi lại",icon:"🚌"},{name:"Học tập",icon:"📚"},
    {name:"Mua sắm",icon:"🛍️"},{name:"Nhà ở & hóa đơn",icon:"🏠"},{name:"Sức khỏe",icon:"💊"},
    {name:"Giải trí",icon:"🎮"},{name:"Gia đình",icon:"👨‍👩‍👧"},{name:"Khác",icon:"📦"}
  ],
  income: [
    {name:"Lương",icon:"💼"},{name:"Làm thêm",icon:"🧑‍💻"},{name:"Thưởng",icon:"🎁"},
    {name:"Trợ cấp",icon:"🤝"},{name:"Đầu tư",icon:"📈"},{name:"Thu nhập khác",icon:"💰"}
  ]
};
const COLORS = ["#0f766e","#5b8def","#e7a33e","#a58be8","#e66e83","#55b99b","#8a9bb5","#e79b69","#7b91d4"];
const STORAGE_KEY = "finmate_v1";
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(Number(n)||0);
const todayISO = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const currentMonth = () => todayISO().slice(0,7);
const esc = (s) => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const allCategories = () => [...CATEGORIES.expense,...CATEGORIES.income];
const categoryInfo = (name) => allCategories().find(c=>c.name===name)||{name,icon:"📌"};
const defaultState = () => ({
  transactions:[
    {id:"demo1",type:"income",amount:12000000,date:todayISO().slice(0,8)+"01",category:"Lương",note:"Lương tháng",method:"Chuyển khoản"},
    {id:"demo2",type:"expense",amount:650000,date:todayISO().slice(0,8)+"02",category:"Ăn uống",note:"Ăn uống tuần đầu",method:"Tiền mặt"},
    {id:"demo3",type:"expense",amount:320000,date:todayISO().slice(0,8)+"04",category:"Đi lại",note:"Xăng xe và xe buýt",method:"Tiền mặt"},
    {id:"demo4",type:"expense",amount:450000,date:todayISO().slice(0,8)+"06",category:"Học tập",note:"Sách và tài liệu",method:"Chuyển khoản"},
    {id:"demo5",type:"expense",amount:280000,date:todayISO().slice(0,8)+"08",category:"Giải trí",note:"Xem phim",method:"Ví điện tử"}
  ],
  budgets:{"Ăn uống":2000000,"Đi lại":800000,"Học tập":1000000,"Mua sắm":1000000,"Nhà ở & hóa đơn":2500000,"Giải trí":500000},
  goals:[{id:"goal-demo",name:"Quỹ dự phòng",target:10000000,saved:2500000,deadline:""}]
});
function loadState(){
  try { const raw=localStorage.getItem(STORAGE_KEY); if(raw){const parsed=JSON.parse(raw);if(parsed&&Array.isArray(parsed.transactions))return {...defaultState(),...parsed};} } catch(e){console.warn("Không đọc được dữ liệu lưu:",e);}
  return defaultState();
}
let state=loadState(), dailyChart=null, categoryChart=null, monthlyChart=null, toastTimer;
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function selectedMonth(){return $("globalMonth").value||currentMonth();}
function monthTransactions(month=selectedMonth()){return state.transactions.filter(t=>t.date.startsWith(month));}
function sumType(transactions,type){return transactions.filter(t=>t.type===type).reduce((s,t)=>s+Number(t.amount),0);}
function monthlyBudget(){return Object.values(state.budgets).reduce((a,b)=>a+Number(b),0);}
function monthExpensesByCategory(month=selectedMonth()){const out={};monthTransactions(month).filter(t=>t.type==="expense").forEach(t=>out[t.category]=(out[t.category]||0)+Number(t.amount));return out;}
function sortedTransactions(transactions){return [...transactions].sort((a,b)=>b.date.localeCompare(a.date));}
function toast(message){$("toast").textContent=message;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2800);}
function openModal(id){$(id).classList.add("open");$(id).setAttribute("aria-hidden","false");}
function closeModal(id){$(id).classList.remove("open");$(id).setAttribute("aria-hidden","true");}
function populateCategorySelects(){
  $("category").innerHTML=CATEGORIES.expense.map(c=>`<option value="${esc(c.name)}">${c.icon} ${esc(c.name)}</option>`).join("");
  $("budgetCategory").innerHTML=CATEGORIES.expense.map(c=>`<option value="${esc(c.name)}">${c.icon} ${esc(c.name)}</option>`).join("");
  $("categoryFilter").innerHTML='<option value="all">Tất cả danh mục</option>'+allCategories().map(c=>`<option value="${esc(c.name)}">${c.icon} ${esc(c.name)}</option>`).join("");
}
function setTransactionType(type){const sel=$("category");sel.innerHTML=CATEGORIES[type].map(c=>`<option value="${esc(c.name)}">${c.icon} ${esc(c.name)}</option>`).join("");}
function resetTransactionForm(){
  $("transactionForm").reset();$("editId").value="";$("transactionModalTitle").textContent="Thêm giao dịch";$("date").value=todayISO();setTransactionType(document.querySelector('input[name="type"]:checked')?.value||"expense");
}
function openTransaction(id=null){
  resetTransactionForm();
  if(id){const t=state.transactions.find(x=>x.id===id);if(!t)return;$("editId").value=t.id;$("transactionModalTitle").textContent="Chỉnh sửa giao dịch";document.querySelector(`input[name="type"][value="${t.type}"]`).checked=true;setTransactionType(t.type);$("amount").value=t.amount;$("date").value=t.date;$("category").value=t.category;$("paymentMethod").value=t.method||"Tiền mặt";$("note").value=t.note;}
  openModal("transactionModal");
}
function transactionRows(transactions,limit=null){
  const list=sortedTransactions(transactions);const shown=limit?list.slice(0,limit):list;
  if(!shown.length)return '<div class="empty-state">Chưa có giao dịch phù hợp. Hãy thêm giao dịch đầu tiên của bạn.</div>';
  return `<div class="table-scroll"><table class="transaction-table"><thead><tr><th>GIAO DỊCH</th><th>NGÀY</th><th>PHƯƠNG THỨC</th><th>SỐ TIỀN</th><th>THAO TÁC</th></tr></thead><tbody>${shown.map(t=>{const c=categoryInfo(t.category);return `<tr><td><div class="transaction-name"><span class="transaction-symbol">${c.icon}</span><div><strong>${esc(t.note)}</strong><small>${esc(t.category)}</small></div></div></td><td>${esc(t.date)}</td><td>${esc(t.method||"Tiền mặt")}</td><td class="${t.type==="income"?"amount-income":"amount-expense"}">${t.type==="income"?"+":"−"}${money(t.amount)}</td><td><div class="table-actions"><button class="small-action" data-edit="${esc(t.id)}" aria-label="Sửa giao dịch">Sửa</button><button class="small-action delete" data-delete="${esc(t.id)}" aria-label="Xóa giao dịch">Xóa</button></div></td></tr>`;}).join("")}</tbody></table></div>`;
}
function renderDashboard(){
  const tx=monthTransactions(),inc=sumType(tx,"income"),exp=sumType(tx,"expense"),budget=monthlyBudget();
  $("balanceValue").textContent=money(inc-exp);$("incomeValue").textContent=money(inc);$("expenseValue").textContent=money(exp);$("remainingValue").textContent=money(budget-exp);
  $("recentTransactions").innerHTML=transactionRows(state.transactions,5);
  renderDailyChart();renderCategoryChart();
}
function renderDailyChart(){
  const month=selectedMonth(),[y,m]=month.split("-").map(Number),days=new Date(y,m,0).getDate(),tx=monthTransactions(month);
  const income=Array(days).fill(0),expense=Array(days).fill(0);
  tx.forEach(t=>{const day=Number(t.date.slice(8,10))-1;if(day>=0&&day<days)(t.type==="income"?income:expense)[day]+=Number(t.amount);});
  if(dailyChart)dailyChart.destroy();
  dailyChart=new Chart($("dailyChart"),{type:"line",data:{labels:Array.from({length:days},(_,i)=>i+1),datasets:[{label:"Thu nhập",data:income,borderColor:"#15966a",backgroundColor:"#15966a18",fill:true,tension:.35,pointRadius:2},{label:"Chi tiêu",data:expense,borderColor:"#d84a58",backgroundColor:"#d84a5812",fill:true,tension:.35,pointRadius:2}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{position:"bottom",labels:{usePointStyle:true,boxWidth:7,font:{size:10}}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:10,font:{size:10}}},y:{beginAtZero:true,grid:{color:"#eef1f5"},ticks:{font:{size:10},callback:v=>v>=1000000?(v/1000000)+"tr":v>=1000?(v/1000)+"k":v}}}}});
}
function renderCategoryChart(){
  const data=monthExpensesByCategory(),entries=Object.entries(data).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  if(categoryChart)categoryChart.destroy();
  categoryChart=new Chart($("categoryChart"),{type:"doughnut",data:{labels:entries.map(([k])=>k),datasets:[{data:entries.map(([,v])=>v),backgroundColor:entries.map((_,i)=>COLORS[i%COLORS.length]),borderWidth:3,borderColor:"#fff",hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:"68%",plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${money(ctx.raw)}`}}}}});
  $("categoryLegend").innerHTML=entries.length?entries.slice(0,6).map(([name,val],i)=>`<div class="legend-item"><span class="legend-dot" style="background:${COLORS[i%COLORS.length]}"></span><span>${esc(name)}</span><strong class="legend-value">${money(val)}</strong></div>`).join(""):'<div class="empty-state" style="grid-column:1/-1">Chưa có dữ liệu chi tiêu trong tháng.</div>';
}
function renderTransactions(){
  const q=$("searchTransaction").value.trim().toLowerCase(),type=$("typeFilter").value,cat=$("categoryFilter").value,month=$("transactionMonth").value;
  const filtered=state.transactions.filter(t=>(!q||(t.note+" "+t.category).toLowerCase().includes(q))&&(type==="all"||t.type===type)&&(cat==="all"||t.category===cat)&&(!month||t.date.startsWith(month)));
  $("allTransactions").innerHTML=transactionRows(filtered);
}
function renderBudgets(){
  const expenses=monthExpensesByCategory(),total=monthlyBudget(),spent=Object.values(expenses).reduce((a,b)=>a+b,0);
  $("budgetTotal").textContent=money(total);$("budgetSpent").textContent=money(spent);$("budgetLeft").textContent=money(total-spent);
  const categories=[...new Set([...Object.keys(state.budgets),...Object.keys(expenses)])];
  $("budgetList").innerHTML=categories.length?categories.map((name,i)=>{const limit=Number(state.budgets[name]||0),used=Number(expenses[name]||0),pct=limit?Math.round(used/limit*100):0,bar=pct>=100?"danger":pct>=80?"warning":"",status=!limit?"Chưa đặt hạn mức":pct>=100?"Đã vượt ngân sách":pct>=80?"Sắp đạt hạn mức":"Đang trong hạn mức";return `<article class="budget-card"><div class="budget-card-head"><div class="budget-cat"><span class="cat-icon">${categoryInfo(name).icon}</span><span>${esc(name)}</span></div><button class="small-action" data-budget-edit="${esc(name)}">Chỉnh sửa</button></div><div class="budget-numbers"><span>Đã chi <strong>${money(used)}</strong></span><span>Hạn mức <strong>${money(limit)}</strong></span></div><div class="progress"><span class="${bar}" style="width:${Math.min(pct,100)}%"></span></div><div class="budget-status ${pct>=100?"over":""}">${status} · ${limit?pct+"%":"—"}</div></article>`;}).join(""):'<div class="panel empty-state">Chưa có ngân sách.</div>';
}
function renderReports(){
  const tx=monthTransactions(),inc=sumType(tx,"income"),exp=sumType(tx,"expense");$("reportIncome").textContent=money(inc);$("reportExpense").textContent=money(exp);$("expenseRatio").textContent=inc?Math.round(exp/inc*100)+"%":"—";
  const months=[];const now=new Date(selectedMonth()+"-01T12:00:00");
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}
  const labels=months.map(m=>m.slice(5,7)+"/"+m.slice(0,4)),income=months.map(m=>sumType(monthTransactions(m),"income")),expense=months.map(m=>sumType(monthTransactions(m),"expense"));
  if(monthlyChart)monthlyChart.destroy();
  monthlyChart=new Chart($("monthlyChart"),{type:"bar",data:{labels,datasets:[{label:"Thu nhập",data:income,backgroundColor:"#15966a",borderRadius:5},{label:"Chi tiêu",data:expense,backgroundColor:"#e66e83",borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{usePointStyle:true,boxWidth:7,font:{size:10}}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:"#eef1f5"},ticks:{callback:v=>v>=1000000?(v/1000000)+"tr":v>=1000?(v/1000)+"k":v}}}}});
  const byCat=Object.entries(monthExpensesByCategory()).sort((a,b)=>b[1]-a[1]),top=byCat[0];
  const insights=[inc?`Bạn đã ghi nhận ${money(inc)} thu nhập trong tháng.`:"Chưa có khoản thu nhập nào được ghi nhận trong tháng.",exp?`Tổng chi tiêu tháng này là ${money(exp)}.`:"Chưa có chi tiêu nào được ghi nhận trong tháng.",top?`Danh mục chi tiêu lớn nhất là ${top[0]} (${money(top[1])}).`:"Hãy thêm giao dịch để xem danh mục chi tiêu nổi bật.",inc&&exp?`Tỷ lệ chi tiêu trên thu nhập hiện là ${Math.round(exp/inc*100)}%.`:"Thêm dữ liệu thu và chi để tính tỷ lệ chi tiêu."];
  $("reportInsights").innerHTML=insights.map((s,i)=>`<div class="insight"><span class="insight-icon">${["💡","📊","🔎","🎯"][i]}</span><span>${esc(s)}</span></div>`).join("");
}
function renderGoals(){
  $("goalsList").innerHTML=state.goals.length?state.goals.map(g=>{const pct=Math.min(100,Math.round(Number(g.saved)/Number(g.target)*100)),done=pct>=100;return `<article class="goal-card"><div class="goal-card-head"><div class="budget-cat"><span class="cat-icon">🎯</span><span>${esc(g.name)}</span></div><span class="mini-tag">${done?"Hoàn thành":pct+"%"}</span></div><div class="budget-numbers"><span>Đã tiết kiệm <strong>${money(g.saved)}</strong></span><span>Mục tiêu <strong>${money(g.target)}</strong></span></div><div class="progress"><span style="width:${pct}%"></span></div><div class="goal-meta"><span>${done?"Bạn đã đạt mục tiêu!":"Còn "+money(Math.max(0,g.target-g.saved))}</span><span>${g.deadline?"Hạn: "+esc(g.deadline):"Chưa đặt hạn"}</span></div><div class="goal-actions"><button class="small-action" data-goal-add="${esc(g.id)}">＋ Cập nhật tiết kiệm</button><button class="small-action delete" data-goal-delete="${esc(g.id)}">Xóa</button></div></article>`;}).join(""):'<article class="panel empty-state">Bạn chưa tạo mục tiêu nào. Hãy tạo mục tiêu đầu tiên.</article>';
}
function analyzeFinances(){
  const tx=monthTransactions(),inc=sumType(tx,"income"),exp=sumType(tx,"expense"),byCat=monthExpensesByCategory(),entries=Object.entries(byCat).sort((a,b)=>b[1]-a[1]),top=entries[0],budget=monthlyBudget(),over=Object.entries(state.budgets).map(([name,limit])=>({name,limit:Number(limit),spent:byCat[name]||0})).filter(x=>x.limit&&x.spent>x.limit);
  const insights=[];
  if(!tx.length)insights.push(["📝","Chưa có giao dịch trong tháng được chọn. Hãy thêm các khoản thu và chi để trợ lý phân tích chính xác hơn."]);
  if(inc>0){const ratio=exp/inc*100;insights.push([ratio>80?"⚠️":"✅",`Bạn đã sử dụng ${Math.round(ratio)}% thu nhập cho chi tiêu trong tháng này.${ratio>80?" Tỷ lệ này khá cao; hãy xem lại các khoản chưa thật sự cần thiết.":" Hãy tiếp tục theo dõi để duy trì cân đối thu chi."}`]);}
  else if(exp>0)insights.push(["💡","Bạn có chi tiêu nhưng chưa ghi nhận thu nhập trong tháng. Hãy cập nhật đầy đủ nguồn thu để báo cáo cân đối hơn."]);
  if(top){const share=exp?Math.round(top[1]/exp*100):0;insights.push(["🔎",`Danh mục chi tiêu lớn nhất là “${top[0]}”, chiếm khoảng ${share}% tổng chi tháng này (${money(top[1])}). Bạn có thể đặt hạn mức riêng cho danh mục này.`]);}
  if(over.length)insights.push(["🚨",`Bạn đã vượt ngân sách ở: ${over.map(x=>`${x.name} (${money(x.spent-x.limit)})`).join(", ")}. Cân nhắc tạm dừng chi tiêu không thiết yếu ở các danh mục này.`]);
  else if(budget>0)insights.push(["🎯",`Tổng ngân sách đã thiết lập là ${money(budget)}. Tổng chi tháng này bằng ${Math.round(exp/budget*100)}% tổng hạn mức.`]);
  if(entries.length>=2){const low=entries[entries.length-1];insights.push(["🌱",`Danh mục “${low[0]}” hiện là khoản chi thấp nhất trong các danh mục đã phát sinh. Hãy so sánh thêm qua nhiều tháng trước khi kết luận xu hướng.`]);}
  insights.push(["🔐","Phân tích này chạy bằng các quy tắc trên dữ liệu lưu trong trình duyệt, không gửi dữ liệu giao dịch đến dịch vụ AI bên ngoài."]);
  $("aiResults").innerHTML=`<article class="panel"><h3 class="ai-card-title">📌 Tóm tắt tháng ${esc(selectedMonth())}</h3><div class="stats-grid" style="grid-template-columns:1fr 1fr;gap:9px;margin:0"><div class="stat-card"><div class="stat-foot">Thu nhập</div><div class="stat-value" style="font-size:17px">${money(inc)}</div></div><div class="stat-card"><div class="stat-foot">Chi tiêu</div><div class="stat-value" style="font-size:17px">${money(exp)}</div></div></div></article><article class="panel"><h3 class="ai-card-title">✨ Nhận xét và gợi ý</h3><div class="insight-list">${insights.map(([icon,msg])=>`<div class="insight"><span class="insight-icon">${icon}</span><span>${esc(msg)}</span></div>`).join("")}</div></article>`;
}
function renderAll(){renderDashboard();renderTransactions();renderBudgets();renderReports();renderGoals();}
function navigate(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const titles={dashboard:"Tổng quan",transactions:"Giao dịch",budgets:"Ngân sách",reports:"Báo cáo",goals:"Mục tiêu tiết kiệm",assistant:"Trợ lý tài chính"};
  $("pageTitle").textContent=titles[page]||"Tổng quan";$("sidebar").classList.remove("open");
  if(page==="dashboard")renderDashboard();if(page==="reports")renderReports();
}
function exportCSV(){
  const rows=[["Loại","Số tiền","Ngày","Danh mục","Nội dung","Phương thức"],...sortedTransactions(state.transactions).map(t=>[t.type==="income"?"Thu nhập":"Chi tiêu",t.amount,t.date,t.category,t.note,t.method||"Tiền mặt"])];
  const csv="\uFEFF"+rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"})),a=document.createElement("a");a.href=url;a.download="bao-cao-chi-tieu.csv";a.click();URL.revokeObjectURL(url);toast("Đã xuất báo cáo CSV.");
}
function bindEvents(){
  document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
  document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
  $("quickAdd").addEventListener("click",()=>openTransaction());$("addTransactionBtn").addEventListener("click",()=>openTransaction());
  $("globalMonth").addEventListener("change",()=>{renderDashboard();renderBudgets();renderReports();});
  $("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
  document.querySelectorAll(".modal-backdrop").forEach(back=>back.addEventListener("click",e=>{if(e.target===back)closeModal(back.id);}));
  document.querySelectorAll('input[name="type"]').forEach(r=>r.addEventListener("change",()=>setTransactionType(r.value)));
  $("transactionForm").addEventListener("submit",e=>{
    e.preventDefault();const id=$("editId").value,type=document.querySelector('input[name="type"]:checked').value;
    const item={id:id||crypto.randomUUID?.()||String(Date.now()),type,amount:Number($("amount").value),date:$("date").value,category:$("category").value,note:$("note").value.trim(),method:$("paymentMethod").value};
    if(!item.amount||item.amount<=0||!item.date||!item.note){toast("Vui lòng kiểm tra lại thông tin.");return;}
    if(id){state.transactions=state.transactions.map(t=>t.id===id?item:t);toast("Đã cập nhật giao dịch.");}else{state.transactions.push(item);toast("Đã thêm giao dịch.");}
    saveState();closeModal("transactionModal");renderAll();
  });
  ["searchTransaction","typeFilter","categoryFilter","transactionMonth"].forEach(id=>$(id).addEventListener(id==="searchTransaction"?"input":"change",renderTransactions));
  document.body.addEventListener("click",e=>{
    const edit=e.target.closest("[data-edit]");if(edit)openTransaction(edit.dataset.edit);
    const del=e.target.closest("[data-delete]");if(del){const t=state.transactions.find(x=>x.id===del.dataset.delete);if(t&&confirm(`Xóa giao dịch “${t.note}” (${money(t.amount)})?`)){state.transactions=state.transactions.filter(x=>x.id!==t.id);saveState();renderAll();toast("Đã xóa giao dịch.");}}
    const be=e.target.closest("[data-budget-edit]");if(be){$("budgetCategory").value=be.dataset.budgetEdit;$("budgetAmount").value=state.budgets[be.dataset.budgetEdit]||"";openModal("budgetModal");}
    const ga=e.target.closest("[data-goal-add]");if(ga){const goal=state.goals.find(g=>g.id===ga.dataset.goalAdd);if(!goal)return;const value=prompt(`Nhập số tiền muốn cộng vào mục tiêu “${goal.name}” (VNĐ):`,"100000");if(value===null)return;const n=Number(value);if(!Number.isFinite(n)||n<=0){toast("Số tiền không hợp lệ.");return;}goal.saved+=n;saveState();renderGoals();toast("Đã cập nhật tiến độ tiết kiệm.");}
    const gd=e.target.closest("[data-goal-delete]");if(gd&&confirm("Bạn có chắc muốn xóa mục tiêu này?")){state.goals=state.goals.filter(g=>g.id!==gd.dataset.goalDelete);saveState();renderGoals();toast("Đã xóa mục tiêu.");}
  });
  $("setBudgetBtn").addEventListener("click",()=>{$("budgetAmount").value="";openModal("budgetModal");});
  $("budgetForm").addEventListener("submit",e=>{e.preventDefault();const cat=$("budgetCategory").value,amount=Number($("budgetAmount").value);if(amount<=0)return;state.budgets[cat]=amount;saveState();closeModal("budgetModal");renderBudgets();renderDashboard();toast("Đã lưu ngân sách.");});
  $("addGoalBtn").addEventListener("click",()=>{$("goalForm").reset();$("goalSaved").value=0;openModal("goalModal");});
  $("goalForm").addEventListener("submit",e=>{e.preventDefault();const target=Number($("goalTarget").value),saved=Number($("goalSaved").value);if(target<=0||saved<0){toast("Vui lòng nhập số tiền hợp lệ.");return;}state.goals.push({id:crypto.randomUUID?.()||String(Date.now()),name:$("goalName").value.trim(),target,saved,deadline:$("goalDeadline").value});saveState();closeModal("goalModal");renderGoals();toast("Đã tạo mục tiêu tiết kiệm.");});
  $("runAnalysis").addEventListener("click",analyzeFinances);$("exportCsv").addEventListener("click",exportCSV);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal-backdrop.open").forEach(m=>closeModal(m.id));});
}
function init(){
  populateCategorySelects();$("globalMonth").value=currentMonth();$("transactionMonth").value=currentMonth();$("date").value=todayISO();
  $("todayLabel").textContent=new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"long",year:"numeric"}).format(new Date());
  bindEvents();renderAll();
}
document.addEventListener("DOMContentLoaded",init);
