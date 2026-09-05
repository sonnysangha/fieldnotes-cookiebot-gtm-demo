(() => {
  const $ = id => document.getElementById(id);
  const config = window.DEMO_CONFIG || {};
  const before = new URLSearchParams(location.search).get('mode') === 'before';
  const containerId = before ? config.baselineGtmId : config.gtmId;
  $('before-link').setAttribute('aria-current', before ? 'page' : 'false');
  $('after-link').setAttribute('aria-current', before ? 'false' : 'page');
  $('mode-description').textContent = before ? 'Before: demo tags run without asking for consent.' : 'After: tags wait for your Cookiebot consent.';
  if (before) { $('state-description').textContent = 'No CMP is installed in this view. The receipts below show the real baseline GTM tags running.'; $('first-step').textContent = '1. Observe the page load'; $('first-step-detail').textContent = 'The three demo tags run without asking. Their cookies appear below.'; }
  $('settings').disabled = true; $('withdraw').disabled = true; $('declaration-toggle').disabled = before;
  const valid = /^GTM-[A-Z0-9]+$/.test(containerId || '') && (before || /^[a-f0-9-]{36}$/i.test(config.cookiebotId || '')) && (config.allowedHosts || []).includes(location.hostname);
  window.dataLayer = window.dataLayer || [];
  let quantity = 0, receipts = 0, actions = 0, shopReceipts = 0, previous, activeShopEvent;
  const item = { item_id: 'DEMO-NOTEBOOK', item_name: 'Everyday Notebook', price: 18 };
  function log(label, tagFired = false) {
    $('events').querySelector('.empty')?.remove();
    const li = document.createElement('li'), time = document.createElement('time');
    time.textContent = new Date().toLocaleTimeString(); li.append(time);
    if (tagFired) {
      li.dataset.kind = 'tag-fired';
      const badge = document.createElement('span');
      badge.className = 'tag-fired-badge'; badge.textContent = '✓ Tag fired';
      li.append(badge);
    }
    li.append(document.createTextNode(label)); $('events').prepend(li);
    while ($('events').children.length > 30) $('events').lastChild.remove();
  }
  function pulse(id) {
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      $(id).animate?.([{ transform: 'scale(1)', backgroundColor: '#d7ddc6' }, { transform: 'scale(1.16)', backgroundColor: '#d7ddc6' }, { transform: 'scale(1)', backgroundColor: 'transparent' }], { duration: 550 });
    }
  }
  function updateGate() {
    const c = window.Cookiebot?.consent;
    $('tracking-gate').dataset.state = before ? 'baseline' : !c ? 'waiting' : c.statistics ? 'allowed' : 'denied';
    $('tracking-gate').textContent = before ? 'Tracking allowed — no banner' : !c ? 'Waiting for Cookiebot' : c.statistics ? '✓ Tracking allowed' : '✕ Tracking blocked';
  }
  function emit(event, ecommerce) {
    if (event === 'add_to_cart' || event === 'purchase') {
      actions++;
      $('action-count').textContent = actions;
      $('last-action').textContent = event === 'purchase' ? 'Latest shop action: sample order placed.' : 'Latest shop action: notebook added to bag.';
      pulse('action-count');
    }
    window.dataLayer.push({ ecommerce: null });
    activeShopEvent = event;
    window.dataLayer.push({ event, demo_mode: true, ecommerce });
    activeShopEvent = undefined;
    log(event + ' → dataLayer');
  }
  const cookieNames = ['demo_statistics', 'demo_marketing', 'demo_preferences'];
  function readCookies() {
    const present = (document.cookie || '').split(';').map(c => c.trim().split('=')[0]).filter(k => cookieNames.includes(k));
    $('demo-cookies').textContent = present.length ? present.join(' · ') : 'None detected.';
  }
  function clearCookies() {
    cookieNames.forEach(k => { document.cookie = k + '=; Max-Age=0; Path=/; SameSite=Lax'; });
    readCookies();
  }
  $('clear-demo-cookies').onclick = () => { clearCookies(); log('Demo cookies cleared; consent unchanged. Reload to repeat page-load tags.'); };
  function consent() {
    const c = window.Cookiebot?.consent;
    for (const k of ['necessary', 'preferences', 'statistics', 'marketing']) {
      const v = c ? (k === 'necessary' ? true : !!c[k]) : undefined;
      $(k).textContent = v === undefined ? (before ? 'Not collected' : 'Unknown') : v ? 'Allowed' : 'Denied'; $(k).dataset.value = String(v);
    }
    updateGate();
    if (!before && c && !c.statistics) $('last-tracking').textContent = 'Shopping still works. Analytics tracking is blocked.';
    if (c?.statistics && !shopReceipts) $('last-tracking').textContent = 'No shop actions tracked yet. Try Add to bag.';
    if (!c) return;
    $('settings').disabled = before; $('withdraw').disabled = before; $('demo-cookie-settings').disabled = before;
    $('connection').textContent = 'Cookiebot connected. Consent shown below comes from the banner.';
    const next = { preferences: !!c.preferences, statistics: !!c.statistics, marketing: !!c.marketing };
    log('Consent state updated');
    if (previous && Object.keys(next).some(k => previous[k] && !next[k])) { clearCookies(); location.reload(); return; }
    previous = next;
  }
  ['CookiebotOnConsentReady', 'CookiebotOnAccept', 'CookiebotOnDecline'].forEach(e => window.addEventListener(e, consent));
  window.addEventListener('demo-tag-fired', e => {
    let receiptLabel = before ? String(e.detail).replace('Consented', 'Unrestricted') : e.detail;
    if (String(e.detail).toLowerCase().includes('shop event')) {
      if (activeShopEvent) receiptLabel = activeShopEvent + ' tracking';
      if (activeShopEvent === 'purchase') $('order-tracking').textContent = '✓ Purchase tracking tag fired.';
      shopReceipts++;
      $('shop-tag-count').textContent = shopReceipts;
      $('last-tracking').textContent = '✓ Shop action tracked.';
      pulse('shop-tag-count');
    }
    readCookies(); receipts++; log(receiptLabel, true); $('receipt').textContent = `Local tag receipts: ${receipts}. Demo receipts are not proof of Analytics delivery.`; });
  $('settings').onclick = () => window.Cookiebot ? Cookiebot.renew() : log('Connect Cookiebot to open the real banner');
  $('withdraw').onclick = () => window.Cookiebot ? Cookiebot.withdraw() : log('No Cookiebot consent to withdraw');
  $('add').onclick = () => { $('bag-contents').hidden = false; $('order-confirmation').hidden = true; $('bag-heading').textContent = 'Your bag'; quantity++; $('cart').textContent = `${quantity} notebook${quantity > 1 ? 's' : ''} · £${quantity * 18}.00`; $('bag-count').textContent = quantity; $('bag-total').textContent = `£${quantity * 18}.00`; $('added-notice').textContent = 'Added to your bag. A little possibility, ready to go.'; $('purchase').disabled = false; $('remove-item').disabled = false; emit('add_to_cart', { currency: 'GBP', value: 18, items: [{ ...item, quantity: 1 }] }); };
  $('remove-item').onclick = () => { if (!quantity) return; quantity--; $('cart').textContent = quantity ? `${quantity} notebook${quantity > 1 ? 's' : ''} · £${quantity * 18}.00` : 'Your bag is empty.'; $('bag-count').textContent = quantity; $('bag-total').textContent = `£${quantity * 18}.00`; $('purchase').disabled = !quantity; $('remove-item').disabled = !quantity; emit('remove_from_cart', { currency: 'GBP', value: 18, items: [{ ...item, quantity: 1 }] }); };
  $('purchase').onclick = () => {
    if (!quantity) return;
    const count = quantity, transactionId = 'DEMO-' + crypto.randomUUID();
    quantity = 0;
    $('purchase').disabled = true; $('remove-item').disabled = true;
    $('cart').textContent = 'Your bag is empty.';
    $('bag-count').textContent = 0; $('bag-total').textContent = '£0.00';
    $('order-items').textContent = `${count} Everyday Notebook${count > 1 ? 's' : ''} · Sage · £18 each`;
    $('order-total').textContent = `£${count * 18}.00`;
    $('order-reference').textContent = 'Order reference: ' + transactionId;
    $('order-tracking').textContent = before || window.Cookiebot?.consent.statistics ? 'Order complete. Waiting for a tracking receipt.' : 'Order complete. Purchase tracking is blocked by your consent choice.';
    $('bag-contents').hidden = true; $('order-confirmation').hidden = false;
    $('bag-heading').textContent = 'Order confirmed';
    emit('purchase', { transaction_id: transactionId, currency: 'GBP', value: count * 18, items: [{ ...item, quantity: count }] });
    $('order-thanks').focus?.();
  };
  $('clear').onclick = () => { $('events').replaceChildren(); };
  $('declaration-toggle').onclick = () => {
    $('declaration').hidden = !$('declaration').hidden;
    if (!$('declaration').hidden && valid && !document.getElementById('CookieDeclaration')) {
      $('declaration-status').textContent = 'Loading the Cookiebot declaration…';
      const s = document.createElement('script'); s.id = 'CookieDeclaration'; s.src = `https://consent.cookiebot.com/${config.cookiebotId}/cd.js`; s.async = true;
      s.onload = () => $('declaration-status').remove(); s.onerror = () => $('declaration-status').textContent = 'The declaration could not be loaded. Check the domain registration and network.';
      $('declaration').append(s);
    }
    if (!$('declaration').hidden) $('declaration').scrollIntoView({ block: 'start' });
  };
  if (valid) {
    $('connection').textContent = before ? 'Loading baseline GTM. No banner or consent gates in this experiment.' : 'Loading the dedicated demo GTM container…';
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + containerId + (!before && config.gtmRevision ? '&demo_revision=' + encodeURIComponent(config.gtmRevision) : ''); document.head.append(s);
    s.onload = () => { if (before) $('connection').textContent = 'Baseline GTM loaded. Demo tags have no consent gates. Check the receipts below.'; };
    s.onerror = () => $('connection').textContent = 'GTM was blocked or could not load. Check your connection or extension settings.';
  }
  $('refresh-diagnostics').onclick = () => {
    const events = window.dataLayer.map(e => e.event || (e[0] === 'consent' ? { command: e[1], state: e[2] } : null)).filter(Boolean);
    const cookies = (document.cookie || '').split(';').map(c => c.trim().split('=')[0]).filter(Boolean);
    const resources = performance.getEntriesByType('resource').map(r => { const u = new URL(r.name); return u.hostname + u.pathname + (u.pathname.endsWith('/gtm.js') ? '?id=' + u.searchParams.get('id') : ''); });
    $('diagnostics').textContent = JSON.stringify({ containerId, events, cookies, resources: [...new Set(resources)] }, null, 2);
  };
  readCookies();
  consent();
})();
