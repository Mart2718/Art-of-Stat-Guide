(() => {
  'use strict';
  const { content, chooser } = window.HUB_DATA;
  const byId = new Map(content.tools.map(t => [t.id, t]));
  const q = s => document.querySelector(s);
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
  const root = q('#chooser');
  let history = [], nodeId = chooser.start, category = 'all';
  function renderChooser(focus = false) {
    const node = chooser.nodes[nodeId]; root.replaceChildren();
    q('#restart').hidden = history.length === 0;
    if (history.length) root.append(el('p', history.map(x => x.label).join(' → '), 'trail'));
    const heading = el('h3', node.question || (node.tools.length ? 'A good starting point' : 'Let’s check with your instructor'), 'chooser-question');
    heading.tabIndex = -1; root.append(heading);
    if (node.options) {
      root.append(el('p', node.hint, 'chooser-hint'));
      const options = el('div', '', 'options');
      for (const option of node.options) {
        const button = el('button', '', 'option'); button.type = 'button';
        button.append(el('span', option.label)); const arrow = el('span', '→'); arrow.setAttribute('aria-hidden','true'); button.append(arrow);
        button.addEventListener('click', () => { history.push({ id: nodeId, label: option.label }); nodeId = option.next; renderChooser(true); });
        options.append(button);
      }
      root.append(options);
    } else {
      const panel = el('div', '', 'recommendation'); panel.append(el('p', node.explanation));
      const ids = node.tools.length ? node.tools : (node.related || []);
      for (const id of ids) {
        const tool = byId.get(id), link = el('a', (node.tools.length ? 'See ' : 'Related: ') + tool.title, 'button primary'); link.href = '#' + id;
        link.addEventListener('click', () => {
          q('#search').value = ''; category = 'all'; filterCards();
          const card = document.getElementById(id); card.querySelector('details').open = true; card.tabIndex = -1;
          requestAnimationFrame(() => { card.scrollIntoView({behavior:'auto',block:'start'}); card.focus({preventScroll:true}); });
        });
        panel.append(link);
      }
      root.append(panel);
    }
    if (history.length) { const back = el('button', '← Back one question', 'back'); back.type = 'button'; back.addEventListener('click', () => { nodeId = history.pop().id; renderChooser(true); }); root.append(back); }
    if (focus) heading.focus({preventScroll:true});
  }
  q('#restart').addEventListener('click', () => { history = []; nodeId = chooser.start; renderChooser(true); });
  q('#controls').hidden = false;
  const labels = [['all','All tools'], ...content.categories.map(c => [c.id,c.title])];
  for (const [id,label] of labels) {
    const button = el('button', label, 'filter'); button.type = 'button'; button.dataset.category = id; button.setAttribute('aria-pressed', String(id === 'all'));
    button.addEventListener('click', () => { category = id; filterCards(); }); q('#filters').append(button);
  }
  function filterCards() {
    const query = q('#search').value.trim().toLocaleLowerCase(); let count = 0;
    for (const tool of content.tools) {
      const haystack = [tool.title, tool.useWhen, tool.appName, tool.keywords, tool.courseNote, ...tool.objectiveCodes].join(' ').toLocaleLowerCase();
      const visible = (category === 'all' || tool.category === category) && query.split(/\s+/).every(word => haystack.includes(word));
      document.getElementById(tool.id).hidden = !visible; if (visible) count++;
    }
    document.querySelectorAll('.category').forEach(section => { section.hidden = ![...section.querySelectorAll('.card')].some(card => !card.hidden); });
    document.querySelectorAll('.filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
    q('#count').textContent = `${count} of ${content.tools.length} tools`; q('#empty').hidden = count !== 0;
  }
  q('#search').addEventListener('input', filterCards);
  q('#clear').addEventListener('click', () => { q('#search').value = ''; category = 'all'; filterCards(); q('#search').focus(); });
  renderChooser(); filterCards();
})();
