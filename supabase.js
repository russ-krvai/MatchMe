
// Minimal DB helper using supabase-js v2 (loaded via <script>)
const DB = (() => {
  const url = window.STEPDOWNMATCH?.SUPABASE_URL;
  const key = window.STEPDOWNMATCH?.SUPABASE_ANON_KEY;
  if(!url || !key){ console.warn('Supabase keys missing. Create config.js from config.example.js'); }
  const client = window.supabase.createClient(url, key);

  const TABLE = 'facilities';

  function normalize(x){
    return {
      id: x.id,
      created_at: x.created_at,
      name: x.name || '',
      type: x.type || '',
      city: x.city || '',
      zip: x.zip || '',
      dialysis: x.dialysis || '',
      behavior: x.behavior || '',
      tube: x.tube || '',
      iv: x.iv || '',
      woundVac: x.wound_vac || '',
      tpn: x.tpn || '',
      insurances: x.insurances || '',
      notes: x.notes || ''
    };
  }

  async function insertFacility(rec){
    const { error } = await client.from(TABLE).insert(rec);
    if(error) throw error;
    return true;
  }

  async function latestFacilities(){
    const { data, error } = await client.from(TABLE).select('*').order('created_at',{ascending:false}).limit(10);
    if(error) throw error;
    return data.map(normalize);
  }

  async function allFacilities(){
    const { data, error } = await client.from(TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error;
    return data.map(normalize);
  }

  async function deleteAll(){
    const { error } = await client.from(TABLE).delete().neq('id', -1);
    if(error) throw error;
  }

  async function insertSamples(){
    const samples = [
      { name:'Encompass (UI Health Network) — Coralville, IA', type:'Acute Rehab', city:'Coralville, IA', zip:'52241',
        dialysis:'Hemodialysis (HD)', behavior:'None', tube:'NG/DHT', iv:'q12h', wound_vac:'Yes', tpn:'Yes',
        insurances:'Medicare, Iowa Medicaid', notes:'wound vac, TPN, IV q12h' },
      { name:'Select Specialty Hospital — Des Moines, IA', type:'LTACH', city:'Des Moines, IA', zip:'50314',
        dialysis:'HD & PD', behavior:'None', tube:'NG/DHT', iv:'Continuous', wound_vac:'Yes', tpn:'Yes',
        insurances:'Medicare, Iowa Medicaid', notes:'HD/PD, continuous antibiotics' },
      { name:'Genesis West — Davenport, IA', type:'Acute Rehab', city:'Davenport, IA', zip:'52804',
        dialysis:'Hemodialysis (HD)', behavior:'VMU/1:1 sitter', tube:'PEG only', iv:'q24h', wound_vac:'Yes', tpn:'No',
        insurances:'Iowa Medicaid, Illinois Medicaid', notes:'VMU, HD, wound vac' }
    ];
    const { error } = await client.from(TABLE).insert(samples);
    if(error) throw error;
  }

  // Search: filter server-side where possible, score client-side
  async function fetchFacilities({ zip, type, kw }){
    let query = client.from(TABLE).select('*');

    if (type && type !== 'Any Type') query = query.eq('type', type);
    if (zip && zip.length >= 3) query = query.like('zip', zip.slice(0,3) + '%');
    if (kw){
      const K = '%' + kw + '%';
      // OR across multiple columns
      query = query.or('notes.ilike.'+K+',dialysis.ilike.'+K+',behavior.ilike.'+K+',tube.ilike.'+K+',iv.ilike.'+K);
    }

    const { data, error } = await query.limit(200);
    if(error) throw error;

    const list = (data||[]).map(normalize);
    // score
    return list.map(f => {
      let score = 0;
      if (type && type !== 'Any Type' && f.type === type) score += 20;
      if (zip && f.zip && f.zip.startsWith(zip.slice(0,3))) score += 10;
      if (kw){
        const hay = [f.notes, f.dialysis, f.behavior, f.tube, f.iv].join(' ').toLowerCase();
        if (hay.includes(kw.toLowerCase())) score += 20;
      }
      return Object.assign({}, f, {'_score': score});
    }).sort((a,b)=>b._score - a._score);
  }

  // Renderer
  function renderFacilityList(container, list){
    container.innerHTML = '';
    if(!list.length){ container.innerHTML = '<div class="muted">No facilities yet.</div>'; return; }
    list.forEach(x => {
      const el = document.createElement('div'); el.className='facility';
      el.innerHTML = '<div><strong>'+x.name+'</strong>' +
        '<div class="meta">'+x.type+' • '+(x.city||'')+' • ZIP '+(x.zip||'')+'</div>' +
        '<div class="meta">Dialysis: '+(x.dialysis||'—')+' • Behavior: '+(x.behavior||'—')+' • Tube: '+(x.tube||'—')+' • IV: '+(x.iv||'—')+' • WoundVac: '+(x.woundVac||'—')+' • TPN: '+(x.tpn||'—')+'</div>' +
        '<div class="meta">Insurances: '+(x.insurances||'—')+'</div>' +
        '<div class="meta">Notes: '+(x.notes||'—')+'</div>' +
        '</div><div class="score">'+(x._score||'Reg')+'</div>';
      container.appendChild(el);
    });
  }

  return { insertFacility, latestFacilities, allFacilities, deleteAll, insertSamples, fetchFacilities, renderFacilityList };
})();
