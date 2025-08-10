// Social Worker UI logic: mirror facility fields, 'Other' reveals textbox; build keyword string; call Supabase search.
(function(){
  function updateOtherVisibility(select){
    const other = select.parentElement.querySelector('.other-input');
    if(!other) return;
    other.style.display = (select.value === 'Other') ? 'block' : 'none';
  }

  function collectFilters(){
    const pane = document.querySelector('aside');
    const selects = Array.from(pane.querySelectorAll('select'));
    const data = { type:'Any', zip:'', kw:[] };
    // Special keys
    const typeSel = pane.querySelector('select[data-k="type"]');
    if(typeSel) data.type = typeSel.value || 'Any';
    const zipIn = pane.querySelector('input[data-k="zip"]');
    if(zipIn) data.zip = zipIn.value.trim();

    // Build keyword bag from all other selects (use free-text when 'Other')
    selects.forEach(sel => {
      if(sel.hasAttribute('data-k')) return;
      const val = sel.value;
      if(val === 'Other'){
        const other = sel.parentElement.querySelector('.other-input');
        if(other && other.value.trim()) data.kw.push(other.value.trim());
      }else if(val && val !== 'Any'){
        data.kw.push(val);
      }
    });
    return { type: data.type, zip: data.zip, kw: data.kw.join(' ') };
  }

  function renderResults(list){
    const out = document.getElementById('results');
    const count = document.getElementById('matchCount');
    out.innerHTML = '';
    count.textContent = list.length ? `(${list.length})` : '';
    if(!list.length){
      out.innerHTML = '<div class="muted">No facilities matched the current criteria.</div>';
      return;
    }
    list.forEach(m => {
      const el = document.createElement('div'); el.className='facility';
      el.innerHTML = '<div><strong>'+m.name+'</strong>' +
        '<div class="meta"><span class="badge">'+m.type+'</span> ZIP '+(m.zip||'')+'</div>' +
        '<div class="meta">Dialysis: '+(m.dialysis||'—')+' • Behavior: '+(m.behavior||'—')+' • Tube: '+(m.tube||'—')+' • IV: '+(m.iv||'—')+' • WoundVac: '+(m.woundVac||'—')+' • TPN: '+(m.tpn||'—')+'</div>' +
        '<div class="meta">Insurances: '+(m.insurances||'—')+'</div>' +
        '<div class="meta">Notes: '+(m.notes||'—')+'</div>' +
        '</div><div class="score">'+(m._score||0)+'</div>';
      out.appendChild(el);
    });
  }

  async function doSearch(){
    const f = collectFilters();
    let list = await DB.fetchFacilities({ zip:f.zip, type:(f.type==='Any'?'Any Type':f.type), kw:f.kw });
    const mode = document.getElementById('sortMode').value;
    if(mode === 'nearest'){
      list.sort((a,b)=> (b.zip?.slice(0,3)===f.zip.slice(0,3)) - (a.zip?.slice(0,3)===f.zip.slice(0,3)) || (b._score - a._score));
    }else if(mode === 'recent'){
      list.sort((a,b)=> (new Date(b.created_at) - new Date(a.created_at)));
    }
    renderResults(list);
    // Active filters count
    const af = document.getElementById('activeFiltersCount');
    const n = Object.values(f).filter(v => typeof v==='string' && v && v!=='Any').length;
    af.textContent = `Active filters (${n > 0 ? n : 0})`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.with-other').forEach(sel => {
      updateOtherVisibility(sel);
      sel.addEventListener('change', () => updateOtherVisibility(sel));
    });
    document.getElementById('btn-search')?.addEventListener('click', doSearch);
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      document.querySelectorAll('select').forEach(s => { s.value = 'Any'; updateOtherVisibility(s); });
      document.querySelectorAll('.other-input').forEach(i => i.value='');
      const zip = document.querySelector('input[data-k="zip"]'); if(zip) zip.value='';
      document.getElementById('results').innerHTML='';
      document.getElementById('matchCount').textContent='';
      document.getElementById('activeFiltersCount').textContent='Active filters (0)';
    });
  });
})();
