(() => {
 const $ = id => document.getElementById(id);
 const show = id => $(id).showModal();
 const activeMode = document.querySelector('.mode-links [aria-current="page"]');
 const modeName = link => link.id === 'before-link' ? 'Before banner' : 'With Cookiebot';
 $('mode-feedback').textContent = modeName(activeMode) + ' is selected';
 document.querySelectorAll('.mode-links a').forEach(link => link.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.getAttribute('aria-current') === 'page') {
   event.preventDefault();
   $('mode-feedback').textContent = modeName(link) + ' is already selected';
   return;
  }
  link.classList.add('is-switching');
  link.setAttribute('aria-busy', 'true');
  $('mode-feedback').textContent = 'Switching to ' + modeName(link) + '…';
 }));
 $('open-bag').onclick = () => show('bag-dialog');
 function dock(open) { document.body.classList.toggle('inspector-open', open); $('demo-dialog').hidden = !open; $('open-demo').setAttribute('aria-expanded', String(open)); }
 $('open-demo').onclick = () => dock(true);
 $('close-demo').onclick = () => { dock(false); $('open-demo').focus({preventScroll:true}); };
 $('demo-cookie-settings').onclick = () => $('settings').click();
 document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => button.closest('dialog').close());
 document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if(e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close(); } }));
 const articles = {
  morning: {title:'Five minutes, a blank page, and a fresh start.', paragraphs:['Before the inbox. Before the day becomes a list of things you owe to everyone else. Give yourself five minutes with a notebook.','Write down what is on your mind. A sentence is enough. It could be something you are looking forward to, something you want to make, or simply what you can see from the window.','There is no right way to fill a page. Cross something out. Leave a space. Begin again tomorrow. The point is the small moment you made for yourself.']},
  ideas: {title:'You don’t need a perfect idea. Just a place to put it.', paragraphs:['Most ideas arrive unfinished. A half sentence on the train. A question while making coffee. A possibility that doesn’t yet have a shape.','A notebook gives those thoughts somewhere to wait. You don’t need a system, a beautiful handwriting style, or a plan for what comes next. You just need to catch the thought before it goes.','A week later, turn back a few pages. One of those fragments might be the beginning of something. And if it isn’t, there is always another blank page.']},
  about: {title:'A small shop, made for a demonstration.', paragraphs:['Fieldnotes is a fictional stationery storefront created by PAPAFAM to demonstrate how a real cookie banner works with Google Tag Manager. Product imagery and product descriptions are illustrative.','The shopping bag works, but every order is a sample: no payment, delivery address or personal information is collected. No physical goods are sold.','Cookie settings use the real Cookiebot banner. For the before-and-after comparison, event receipts and technical diagnostics, open Demo controls in the footer.']}
 };
 function article(key){ const a=articles[key];$('article-title').textContent=a.title;$('article-content').replaceChildren(...a.paragraphs.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));show('article-dialog'); }
 document.querySelectorAll('[data-article]').forEach(button=>button.onclick=()=>article(button.dataset.article));
 $('about-demo').onclick=()=>article('about');
 // Cookiebot must remain interactive above the browser's modal top layer.
 ['settings','withdraw','declaration-toggle'].forEach(id=>$(id).addEventListener('click',()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());}));
})();
