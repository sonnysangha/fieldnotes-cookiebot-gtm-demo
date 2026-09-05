import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
const code = readFileSync('public/app.js', 'utf8');
function boot(config = {}, search = "") {
 const nodes = new Map(), loads = [], listeners = {};
 function node() { return { textContent:'', dataset:{}, children:[], hidden:true, disabled:false, setAttribute(){}, append(...v){this.children.push(...v);}, prepend(v){this.children.unshift(v);}, querySelector(){return null;}, replaceChildren(){this.children=[];}, scrollIntoView(){}, remove(){} }; }
 const document = { getElementById(id) { if (!nodes.has(id)) nodes.set(id,node());return nodes.get(id);}, createElement:node, createTextNode:t=>t, head:{append:s=>loads.push(s.src)} };
 const window = { testReloads:0,testCookieWrites:[], DEMO_CONFIG:config, addEventListener:(k,f)=>listeners[k]=f };
 Object.defineProperty(document,'cookie',{get:()=>'',set:v=>window.testCookieWrites.push(v)});
 vm.runInNewContext(code,{window,document,location:{hostname:'localhost',search,reload(){window.testReloads++;}},URLSearchParams,crypto:webcrypto,Date});
 return {nodes,loads,window,listeners};
}
test('unconfigured demo makes no external script requests',()=>assert.deepEqual(boot().loads,[]));
test('unapproved hostname prevents loading even with identifiers',()=>assert.deepEqual(boot({gtmId:'GTM-DEMO123',cookiebotId:'11111111-1111-4111-8111-111111111111',allowedHosts:['example.com']}).loads,[]));
test('each completed cart has one purchase and a distinct transaction ID',()=>{
 const {nodes,window}=boot(); nodes.get('purchase').onclick(); assert.equal(window.dataLayer.length,0);
 nodes.get('add').onclick(); nodes.get('add').onclick(); nodes.get('purchase').onclick(); nodes.get('purchase').onclick();
 assert.equal(nodes.get('order-total').textContent,'£36.00');
 assert.equal(nodes.get('order-confirmation').hidden,false);
 assert.equal(nodes.get('bag-contents').hidden,true);
 let purchases=window.dataLayer.filter(e=>e.event==='purchase'); assert.equal(purchases.length,1);assert.equal(purchases[0].ecommerce.value,36); assert.equal(purchases[0].ecommerce.items[0].quantity,2);
 nodes.get('add').onclick();nodes.get('purchase').onclick();purchases=window.dataLayer.filter(e=>e.event==='purchase');assert.equal(purchases.length,2);assert.notEqual(purchases[0].ecommerce.transaction_id,purchases[1].ecommerce.transaction_id);
});
test('import has no production destinations or catch-all event triggers',()=>{
 const text=readFileSync('gtm/demo-basic-consent.import.json','utf8'), c=JSON.parse(text).containerVersion;
 assert.ok(c.tag.every(t=>t.type==='html' || t.name==='Cookiebot - Demo CMP'));
 const shopTrigger=c.trigger.find(t=>t.name==='Demo - Shop Events');
 assert.ok(JSON.stringify(shopTrigger).includes('^(add_to_cart|purchase)$'));
 assert.equal(c.tag.length,5);assert.equal(c.tag.filter(t=>t.consentSettings.consentStatus==='NEEDED').length,4);
});

test('all URLs load exactly one consent-controlled container, including old mode links',()=>{
 const config={gtmId:'GTM-DEMO123',cookiebotId:'11111111-1111-4111-8111-111111111111',allowedHosts:['localhost']};
 for (const search of ['', '?mode=before', '?mode=after', '?mode=anything']) {
  assert.deepEqual(boot(config,search).loads,['https://www.googletagmanager.com/gtm.js?id=GTM-DEMO123']);
 }
 assert.deepEqual(boot({...config,gtmId:''}).loads,[]);
 assert.deepEqual(boot({...config,cookiebotId:''}).loads,[]);
});

test('consent retry tags allow later events but execute only once per page',()=>{
 const tags=JSON.parse(readFileSync('gtm/demo-basic-consent.import.json','utf8')).containerVersion.tag.filter(t=>/Demo - (Statistics|Marketing|Preferences) receipt/.test(t.name));
 for(const tag of tags){
  assert.equal(tag.tagFiringOption,'ONCE_PER_EVENT');
  const html=tag.parameter.find(p=>p.key==='html').value;
  const runs=[],writes=[];
  const context={window:{dispatchEvent:e=>runs.push(e)},document:{set cookie(v){writes.push(v)}},CustomEvent:function(name,detail){this.name=name;this.detail=detail}};
  const script=html.slice(8,-9);vm.runInNewContext(script,context);vm.runInNewContext(script,context);
  assert.equal(runs.length,1);assert.equal(writes.length,1);
 }
});

test('visual shop tracking count requires a real receipt rather than a shop action or category initialization',()=>{
 const {nodes,listeners}=boot();
 nodes.get('add').onclick(); nodes.get('purchase').onclick();
 assert.equal(nodes.get('action-count').textContent,2);
 assert.equal(nodes.has('shop-tag-count'),false);
 listeners['demo-tag-fired']({detail:'Statistics demo tag'});
 assert.equal(nodes.has('shop-tag-count'),false);
 listeners['demo-tag-fired']({detail:'Consented shop event'});
 assert.equal(nodes.get('shop-tag-count').textContent,1);
 assert.equal(nodes.get('action-count').textContent,2);
});

test('withdrawing a granted category clears demo cookies and reloads the page',()=>{
 const {window,listeners,nodes}=boot();
 window.Cookiebot={consent:{statistics:true,marketing:false,preferences:false}};
 listeners.CookiebotOnAccept();
 assert.equal(nodes.get('tracking-gate').dataset.state,'allowed');
 window.Cookiebot.consent.statistics=false;
 listeners.CookiebotOnDecline();
 assert.equal(nodes.get('tracking-gate').dataset.state,'denied');
 assert.equal(window.testReloads,1);
 assert.equal(window.testCookieWrites.length,3);
 assert.ok(window.testCookieWrites.every(v=>v.includes('Max-Age=0')));
});
