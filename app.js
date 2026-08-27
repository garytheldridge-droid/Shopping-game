
const money=n=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(n);
const PAGE_SIZE=30;
let catalog=[],filtered=[],visibleCount=PAGE_SIZE,activeCategory="All";
let state=JSON.parse(localStorage.getItem("sgv4")||"null")||{
 balance:0,welcome:false,lastAllowance:null,basket:{},orders:[],owned:[],spent:0,notifs:[],questCash:0
};

async function loadCatalog(){
  try{
    const r=await fetch("mock-catalog.json",{cache:"no-store"});
    if(!r.ok) throw new Error("feed");
    catalog=await r.json();
  }catch(e){
    // File:// fallback so the prototype still works when opened locally.
    catalog=window.FALLBACK_CATALOG||[];
  }
  filtered=[...catalog];
  renderCategories();
  renderHome();
  renderShop();
  observeSentinel();
}
function persist(){localStorage.setItem("sgv4",JSON.stringify(state));updateChrome()}
function toast(t){const e=document.querySelector(".toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2300)}
function addNotif(title,body){
 state.notifs.unshift({title,body,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})});
 state.notifs=state.notifs.slice(0,40);localStorage.setItem("sgv4",JSON.stringify(state));
 try{if("Notification" in window&&Notification.permission==="granted")new Notification(title,{body})}catch{}
}
function requestNotifications(){
 try{if("Notification" in window&&Notification.permission==="default")Notification.requestPermission()}catch{}
}
function collectCheque(){
 const today=new Date().toISOString().slice(0,10);
 if(!state.welcome){
   state.welcome=true;state.balance+=2500;addNotif("💌 Welcome cheque","£2,500 has been added to your Shopping Game balance.");toast("+£2,500 — GO BUY SOMETHING");persist();requestNotifications();return;
 }
 if(state.lastAllowance===today){toast("Today's cheque is already open.");return}
 state.lastAllowance=today;state.balance+=100;addNotif("💌 Daily shopping money","+£100 is waiting in your balance.");toast("+£100 — WHAT ARE WE BUYING?");persist();
}
function categories(){return ["All",...Array.from(new Set(catalog.map(p=>p.category))).sort()]}
function renderCategories(){
 const box=document.getElementById("chips");
 box.innerHTML=categories().map(c=>`<button class="chip ${c===activeCategory?"active":""}" onclick="setCategory('${c.replaceAll("'","\\'")}')">${c}</button>`).join("");
}
function setCategory(c){activeCategory=c;visibleCount=PAGE_SIZE;applyFilters();renderCategories();renderShop();window.scrollTo({top:0,behavior:"smooth"})}
function applyFilters(){
 const q=(document.getElementById("shopSearch")?.value||"").trim().toLowerCase();
 filtered=catalog.filter(p=>{
   const catOk=activeCategory==="All"||p.category===activeCategory;
   if(!catOk)return false;
   if(!q)return true;
   const hay=(p.name+" "+p.category+" "+p.retailer+" "+(p.tags||[]).join(" ")).toLowerCase();
   if(q==="cheap")return p.price<50;
   if(q==="pink")return hay.includes("pink");
   if(q==="swimming")return hay.includes("fitness")||hay.includes("fashion")||hay.includes("swim");
   return hay.includes(q);
 });
}
function deliveryLabel(p){return p.delivery==="local"?"🚴 minutes":p.delivery==="today"?"📦 today":p.delivery==="tomorrow"?"📦 tomorrow":"🚚 scheduled"}
function productCard(p){
 const q=state.basket[p.id]||0;
 return `<article class="product">
   <div class="pic"><img loading="lazy" src="${p.image}" alt="${escapeHtml(p.name)}"><span class="badge">${p.source==="demo"?"DEMO":"LIVE"}</span></div>
   <div class="pb">
     <div class="pname">${escapeHtml(p.name)}</div>
     <div class="retailer">${escapeHtml(p.retailer||"Retailer")}</div>
     <div class="price">${money(p.price)}</div>
     <div class="meta">⭐ ${(4.2+(hash(p.id)%8)/10).toFixed(1)} · ${deliveryLabel(p)}</div>
     <button class="add ${q?"added":""}" onclick="addToBasket('${p.id}')">${q?`✓ IN BASKET (${q})`:"＋ ADD TO BASKET"}</button>
     ${p.affiliateUrl?`<button class="real" onclick="window.open('${p.affiliateUrl}','_blank')">VIEW REAL ITEM ↗</button>`:""}
   </div>
 </article>`;
}
function renderHome(){
 const home=document.getElementById("homeFeed");
 home.innerHTML=catalog.slice(0,8).map(productCard).join("");
 const more=document.getElementById("moreFeed"); if(more) more.innerHTML=catalog.slice(12,20).map(productCard).join("");
 document.getElementById("quests").innerHTML=`
 <div class="quest"><div class="qicon">🌸</div><div class="qbody"><div class="qtitle">Sarah wants something pink</div><div class="qtext">“No idea what. Just find me something I'd actually want.”</div><div class="qreward">Reward £75</div></div></div>
 <div class="quest"><div class="qicon">🎮</div><div class="qbody"><div class="qtitle">Jamie's gaming night</div><div class="qtext">Budget £150. Build the best night you can without wasting it.</div><div class="qreward hot">🔥 3× reward today</div></div></div>
 <div class="quest"><div class="qicon">🏊</div><div class="qbody"><div class="qtitle">Swimming trip</div><div class="qtext">Pick something useful, fun, or completely unnecessary for the pool.</div><div class="qreward">Reward £40</div></div></div>`;
}
function renderShop(){
 applyFilters();
 const shown=filtered.slice(0,visibleCount);
 document.getElementById("shopFeed").innerHTML=shown.map(productCard).join("");
 document.getElementById("shopCount").textContent=`${shown.length}${filtered.length>shown.length?"+":""} items`;
 document.getElementById("loader").textContent=filtered.length>shown.length?"Keep scrolling…":"That's everything for this search.";
}
function more(){if(visibleCount<filtered.length){visibleCount+=PAGE_SIZE;renderShop()}}
function observeSentinel(){
 const ob=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)more()},{rootMargin:"500px"});
 ob.observe(document.getElementById("sentinel"));
}
function searchHome(v){if(v.trim()){nav("shop",document.querySelectorAll(".nav button")[1]);document.getElementById("shopSearch").value=v;activeCategory="All";visibleCount=PAGE_SIZE;renderCategories();renderShop()}}
function addToBasket(id){state.basket[id]=(state.basket[id]||0)+1;toast("🛒 Added to basket");persist();renderHome();renderShop();renderBasket()}
function productById(id){return catalog.find(p=>p.id===id)}
function basketEntries(){return Object.entries(state.basket).filter(([,q])=>q>0).map(([id,q])=>({p:productById(id),q})).filter(x=>x.p)}
function renderBasket(){
 const list=document.getElementById("basketList"),totalBox=document.getElementById("basketTotal");
 const items=basketEntries();
 if(!items.length){list.innerHTML='<div class="empty"><b>Your basket is empty.</b>Go make a bad financial decision.</div>';totalBox.innerHTML="";return}
 let total=0;
 list.innerHTML=items.map(({p,q})=>{total+=p.price*q;return `<div class="basketitem"><img class="thumb" src="${p.image}"><div class="grow"><div class="bname">${escapeHtml(p.name)}</div><div class="bprice">${money(p.price*q)}</div><div class="muted" style="font-size:11px">${escapeHtml(p.retailer)}</div></div><div class="qty"><button onclick="changeQty('${p.id}',-1)">−</button><b>${q}</b><button onclick="changeQty('${p.id}',1)">+</button></div></div>`}).join("");
 const short=total-state.balance;
 totalBox.innerHTML=`<div class="totals"><div class="row"><span>Basket</span><b>${money(total)}</b></div><div class="row"><span>Balance</span><b>${money(state.balance)}</b></div><div class="row"><span>${short>0?"You're short":"Left after checkout"}</span><b>${money(Math.abs(short))}</b></div><button class="checkout" onclick="checkout()">CHECKOUT · ${money(total)}</button></div>`;
}
function changeQty(id,d){state.basket[id]=(state.basket[id]||0)+d;if(state.basket[id]<=0)delete state.basket[id];persist();renderBasket();renderHome();renderShop()}
function durationFor(items){
 if(items.some(x=>x.p.delivery==="local"))return 25000;
 if(items.some(x=>x.p.delivery==="later"))return 150000;
 if(items.some(x=>x.p.delivery==="tomorrow"))return 100000;
 return 60000;
}
function checkout(){
 const items=basketEntries();if(!items.length)return;
 const total=items.reduce((s,x)=>s+x.p.price*x.q,0);
 if(total>state.balance){toast(`You're ${money(total-state.balance)} short.`);return}
 const o={id:Math.floor(10000+Math.random()*90000),created:Date.now(),duration:durationFor(items),total,items:items.map(x=>({id:x.p.id,q:x.q})),opened:false,arrivalNotified:false};
 state.balance-=total;state.spent+=total;state.orders.unshift(o);state.basket={};addNotif("💳 Order confirmed",`Order #${o.id} is being prepared.`);toast("ORDER CONFIRMED 🎉");persist();nav("orders",document.querySelectorAll(".nav button")[3]);
}
function orderStatus(o){
 const pct=Math.min(1,(Date.now()-o.created)/o.duration);
 if(pct>=1)return ["🎁 Delivered",100];
 if(pct>.8)return ["🚚 Out for delivery",82];
 if(pct>.45)return ["📦 Dispatched",55];
 return ["🏭 Preparing",25];
}
function renderOrders(){
 const box=document.getElementById("orderList");
 if(!state.orders.length){box.innerHTML='<div class="empty"><b>No orders yet.</b>Your future parcels will appear here.</div>';return}
 box.innerHTML=state.orders.map(o=>{
   const [s,p]=orderStatus(o);
   return `<div class="order"><div class="orderhead"><span>Order #${o.id}</span><span>${money(o.total)}</span></div><div class="status">${s}</div><div class="progress"><div style="width:${p}%"></div></div><div class="muted" style="font-size:12px;margin-top:8px">${o.items.length} item${o.items.length===1?"":"s"} · ${p===100?"Ready to open":"We'll update you as it moves."}</div>${p===100&&!o.opened?`<button class="openpkg" onclick="openDelivery(${o.id})">🎁 OPEN DELIVERY</button>`:""}</div>`;
 }).join("");
}
function openDelivery(id){
 const o=state.orders.find(x=>x.id===id);if(!o||o.opened)return;
 o.opened=true;
 o.items.forEach(x=>{for(let i=0;i<x.q;i++)state.owned.push({id:x.id,added:Date.now()})});
 persist();renderOrders();renderOwned();
 document.getElementById("sheet").innerHTML=`<button class="x" onclick="closeModal()">×</button><h2>📦 YOUR DELIVERY</h2><div class="notice"><small>ORDER #${o.id}</small><h2 style="margin:5px 0">IT'S HERE.</h2><div>${money(o.total)}</div></div>${o.items.map(x=>{const p=productById(x.id);return `<div class="owneditem"><img class="thumb" src="${p.image}"><div class="grow"><div class="bname">${escapeHtml(p.name)}</div><div class="muted">×${x.q}</div></div></div>`}).join("")}<button class="primary" style="width:100%;margin-top:12px" onclick="closeModal()">KEEP SHOPPING</button>`;
 document.getElementById("modal").classList.add("show");
}
function renderOwned(){
 const box=document.getElementById("ownedList");
 if(!state.owned.length){box.innerHTML='<div class="empty"><b>Your bag is empty.</b>Delivered items will live here.</div>';return}
 const counts={};state.owned.forEach(x=>counts[x.id]=(counts[x.id]||0)+1);
 box.innerHTML=Object.entries(counts).map(([id,q])=>{const p=productById(id);if(!p)return"";return `<div class="owneditem"><img class="thumb" src="${p.image}"><div class="grow"><div class="bname">${escapeHtml(p.name)}</div><div class="bprice">${money(p.price)}</div><div class="muted" style="font-size:11px">${q>1?`Owned ×${q}`:"Owned"}</div></div><button class="chip" onclick="returnItem('${id}')">Return</button></div>`}).join("");
}
function returnItem(id){
 const idx=state.owned.findIndex(x=>x.id===id);if(idx<0)return;
 const p=productById(id);state.owned.splice(idx,1);const refund=p.price*.8;state.balance+=refund;addNotif("↩️ Return accepted",`${money(refund)} returned to your balance.`);toast(`${money(refund)} refunded`);persist();renderOwned();
}
function showNotifications(){
 document.getElementById("sheet").innerHTML=`<button class="x" onclick="closeModal()">×</button><h2>🔔 Notifications</h2>${state.notifs.length?state.notifs.map(n=>`<div class="notif"><b>${n.title}</b><div class="muted" style="font-size:13px;margin-top:3px">${n.body}</div><small class="muted">${n.time}</small></div>`).join(""):'<div class="empty">Nothing yet.</div>'}`;
 document.getElementById("modal").classList.add("show");
}
function closeModal(){document.getElementById("modal").classList.remove("show")}
function nav(id,btn){
 document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");
 document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active"));if(btn)btn.classList.add("active");
 if(id==="basket")renderBasket();if(id==="orders")renderOrders();if(id==="me"){renderOwned();updateProfile()}
 window.scrollTo({top:0,behavior:"smooth"});
}
function openShop(){nav("shop",document.querySelectorAll(".nav button")[1])}
function updateChrome(){
 document.getElementById("balance").textContent=money(state.balance);
 document.getElementById("navBasket").textContent=Object.values(state.basket).reduce((a,b)=>a+b,0)||"";
 const today=new Date().toISOString().slice(0,10);
 document.getElementById("chequeLabel").textContent=state.welcome?"DAILY SHOPPING ALLOWANCE":"WELCOME CHEQUE";
 document.getElementById("chequeAmount").textContent=state.welcome?"+£100":"£2,500";
 document.getElementById("chequeCopy").textContent=state.welcome?"Open it when you visit. Your money waits for you.":"Your first shopping fund. Spend it, save it, waste it on something brilliant.";
 document.getElementById("chequeBtn").textContent=!state.welcome?"OPEN CHEQUE":state.lastAllowance===today?"OPENED TODAY ✓":"OPEN TODAY'S £100";
 updateProfile();
}
function updateProfile(){
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
 set("profileBalance",money(state.balance));set("spent",money(state.spent));set("owned",state.owned.length);set("questCash",money(state.questCash));set("orderCount",state.orders.length);
}
function tick(){
 let changed=false;
 state.orders.forEach(o=>{if(!o.arrivalNotified && Date.now()-o.created>=o.duration){o.arrivalNotified=true;state.notifs.unshift({title:"🎁 Your package has arrived",body:`Order #${o.id} is ready to open.`,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})});changed=true;}});
 if(changed){localStorage.setItem("sgv4",JSON.stringify(state));updateChrome()}
 if(document.getElementById("orders").classList.contains("active"))renderOrders();
}
function hash(s){return [...String(s)].reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)&0x7fffffff}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function resetDemo(){if(confirm("Reset Shopping Game V4?")){localStorage.removeItem("sgv4");location.reload()}}
document.addEventListener("DOMContentLoaded",()=>{updateChrome();renderBasket();renderOrders();renderOwned();loadCatalog();setInterval(tick,3000)});
