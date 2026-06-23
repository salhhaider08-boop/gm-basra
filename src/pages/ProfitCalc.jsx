import React, { useState } from 'react';

export default function ProfitCalc() {
  // State for Partners
  const [partners, setPartners] = useState(() => {
    try {
      const saved = localStorage.getItem('gmb_partners');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [partnerForm, setPartnerForm] = useState({ name: '', capital: '' });


  // State for Distribution
  const [distForm, setDistForm] = useState({ 
    totalProfit: '', 
    managementPercent: '10',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [distributions, setDistributions] = useState(() => {
    try {
      const saved = localStorage.getItem('gmb_distributions');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Fetch withdrawals
  const [withdrawals, setWithdrawals] = useState([]);
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('gmb_withdrawals');
      if (saved && saved !== 'undefined') {
        setWithdrawals(JSON.parse(saved));
      }
    } catch(e) {}
  }, []);

  // Sync to local storage
  React.useEffect(() => {
    localStorage.setItem('gmb_partners', JSON.stringify(partners));
  }, [partners]);

  React.useEffect(() => {
    localStorage.setItem('gmb_distributions', JSON.stringify(distributions));
  }, [distributions]);

  // Calculations for Partners (with effective capital)
  const partnersWithEffectiveCapital = partners.map(p => {
    const pWds = withdrawals.filter(w => w.name === p.name).reduce((sum, w) => sum + Number(w.amount), 0);
    const effectiveCap = Number(p.capital) - pWds;
    return { ...p, originalCapital: p.capital, withdrawalsAmount: pWds, effectiveCapital: effectiveCap > 0 ? effectiveCap : 0 };
  });

  const totalCapital = partnersWithEffectiveCapital.reduce((sum, p) => sum + p.effectiveCapital, 0);
  
  const partnersWithPercentage = partnersWithEffectiveCapital.map(p => ({
    ...p,
    percentage: totalCapital > 0 ? (p.effectiveCapital / totalCapital) * 100 : 0
  }));

  // Total Summaries
  const sumTotalProfitsDistributed = distributions.reduce((sum, d) => sum + d.totalProfit, 0);
  const sumTotalManagement = distributions.reduce((sum, d) => sum + d.managementShare, 0);

  // Handlers
  const handleAddPartner = (e) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.capital) return;
    setPartners([...partners, { id: Date.now(), name: partnerForm.name, capital: Number(partnerForm.capital) }]);
    setPartnerForm({ name: '', capital: '' });
  };

  const handleRemovePartner = (id) => {
    setPartners(partners.filter(p => p.id !== id));
  };

  const handleDistribute = (e) => {
    e.preventDefault();
    if (!distForm.totalProfit || partners.length === 0) return;

    const profit = Number(distForm.totalProfit);
    const mngPercent = Number(distForm.managementPercent || 0);
    
    // 1. Calculate Management Share
    const managementShare = Math.round((profit * mngPercent) / 100);
    
    // 2. Calculate Net Profit to distribute
    const netProfit = profit - managementShare;

    // 3. Distribute among partners
    const partnerShares = partnersWithPercentage.map(p => ({
      partnerId: p.id,
      name: p.name,
      shareAmount: Math.round((netProfit * p.percentage) / 100)
    }));

    const newDist = {
      id: Date.now(),
      date: distForm.date || new Date().toISOString().split('T')[0],
      totalProfit: profit,
      managementPercent: mngPercent,
      managementShare,
      netProfit,
      partnerShares
    };

    setDistributions([newDist, ...distributions]);
    setDistForm({ ...distForm, totalProfit: '' });
    setIsLogOpen(true); // Open log to show result
  };

  const handleDeleteDistribution = (id) => {
    setDistributions(distributions.filter(d => d.id !== id));
  };

  return (
    <div className="page-container" style={{ paddingBottom: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>نظام التوزيع الذكي للأرباح</h1>
        <button 
          onClick={() => setIsLogOpen(true)}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}
        >
          سجل التوزيعات 📋
        </button>
      </div>

      <div className="summary" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="summary-item" style={{ borderLeft: '5px solid #3b82f6' }}>
          <span style={{ fontSize: '0.9rem' }}>إجمالي رأس المال للشركاء</span>
          <strong style={{ color: '#3b82f6', textShadow: '0 0 15px rgba(59, 130, 246, 0.4)', fontSize: '1.5rem' }}>
            {Math.round(totalCapital).toLocaleString('en-US')} دينار
          </strong>
        </div>
        <div className="summary-item" style={{ borderLeft: '5px solid #10b981' }}>
          <span style={{ fontSize: '0.9rem' }}>إجمالي الأرباح الموزعة (تاريخياً)</span>
          <strong style={{ color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.4)', fontSize: '1.5rem' }}>
            {Math.round(sumTotalProfitsDistributed).toLocaleString('en-US')} دينار
          </strong>
        </div>
        <div className="summary-item" style={{ borderLeft: '5px solid #f59e0b' }}>
          <span style={{ fontSize: '0.9rem' }}>إجمالي حصة الإدارة المستقطعة</span>
          <strong style={{ color: '#f59e0b', textShadow: '0 0 15px rgba(245, 158, 11, 0.4)', fontSize: '1.5rem' }}>
            {Math.round(sumTotalManagement).toLocaleString('en-US')} دينار
          </strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
        
        {/* Section 1: Partners & Capital */}
        <div className="form-section">
          <h3 style={{ marginBottom: '20px', color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>الشركاء ورأس المال</h3>
          
          <form style={{ display: 'flex', gap: '10px', marginBottom: '20px' }} onSubmit={handleAddPartner}>
            <input type="text" className="custom-select" style={{ flex: 1 }} placeholder="اسم الشريك" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} required />
            <input type="number" className="custom-select" style={{ flex: 1 }} placeholder="رأس المال" value={partnerForm.capital} onChange={e => setPartnerForm({...partnerForm, capital: e.target.value})} required />
            <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>إضافة</button>
          </form>

          <table className="io-table" style={{ fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th>اسم الشريك</th>
                <th>رأس المال</th>
                <th>النسبة التلقائية</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {partnersWithPercentage.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                  <td style={{ color: '#3b82f6' }}>
                    {Math.round(p.effectiveCapital).toLocaleString('en-US')}
                    {p.withdrawalsAmount > 0 && <span style={{display: 'block', fontSize: '0.8rem', color: '#ef4444'}}>- {p.withdrawalsAmount.toLocaleString('en-US')} (سحوبات)</span>}
                  </td>
                  <td style={{ color: '#10b981', fontWeight: 'bold' }}>{p.percentage.toFixed(2)}%</td>
                  <td>
                    <button onClick={() => handleRemovePartner(p.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                  </td>
                </tr>
              ))}
              {partners.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>لا يوجد شركاء مضافين</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 2: Profit Distribution Engine */}
        <div className="form-section" style={{ background: 'linear-gradient(145deg, #111, #0a0a0a)', border: '1px solid #333' }}>
          <h3 style={{ marginBottom: '20px', color: '#10b981', borderBottom: '1px solid #333', paddingBottom: '10px' }}>محرك توزيع الأرباح</h3>
          
          <form className="io-form-vertical" onSubmit={handleDistribute}>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>تاريخ التوزيع</label>
                <input type="date" value={distForm.date} onChange={e => setDistForm({...distForm, date: e.target.value})} required style={{ fontSize: '1.2rem', padding: '15px' }} />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>نسبة الإدارة المستقطعة (%)</label>
                <input type="number" value={distForm.managementPercent} onChange={e => setDistForm({...distForm, managementPercent: e.target.value})} placeholder="10" required style={{ fontSize: '1.2rem', padding: '15px' }} />
              </div>
            </div>

            <div className="form-group">
              <label>مبلغ الأرباح الكلي المراد توزيعه (دينار)</label>
              <input type="number" value={distForm.totalProfit} onChange={e => setDistForm({...distForm, totalProfit: e.target.value})} placeholder="مثال: 5000000" required style={{ fontSize: '1.2rem', padding: '15px' }} />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '10px', background: '#10b981', fontSize: '1.2rem', padding: '15px', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
              توزيع وتسجيل 💸
            </button>
          </form>
        </div>

      </div>

      {/* Modal for Distributions Log */}
      {isLogOpen && (
        <div className="modal-overlay" onClick={() => setIsLogOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsLogOpen(false)}>×</button>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fff' }}>سجل توزيع الأرباح</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {distributions.map((dist, i) => (
                <div key={dist.id} style={{ background: '#0a0a0a', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: '15px' }}>
                    <h3 style={{ color: '#10b981', margin: 0 }}>توزيعة رقم #{distributions.length - i}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ color: '#888' }}>{dist.date}</span>
                      <button 
                        onClick={() => handleDeleteDistribution(dist.id)} 
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '5px 10px', borderRadius: '5px' }}
                      >
                        مسح 🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, background: '#111', padding: '15px', borderRadius: '8px' }}>
                      <span style={{ display: 'block', color: '#aaa', fontSize: '0.85rem' }}>المبلغ الإجمالي</span>
                      <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{Math.round(dist.totalProfit).toLocaleString('en-US')}</strong>
                    </div>
                    <div style={{ flex: 1, background: '#111', padding: '15px', borderRadius: '8px' }}>
                      <span style={{ display: 'block', color: '#aaa', fontSize: '0.85rem' }}>حصة الإدارة ({Math.round(dist.managementPercent)}%)</span>
                      <strong style={{ color: '#f59e0b', fontSize: '1.2rem' }}>{Math.round(dist.managementShare).toLocaleString('en-US')}</strong>
                    </div>
                    <div style={{ flex: 1, background: '#111', padding: '15px', borderRadius: '8px' }}>
                      <span style={{ display: 'block', color: '#aaa', fontSize: '0.85rem' }}>الصافي للتوزيع</span>
                      <strong style={{ color: '#3b82f6', fontSize: '1.2rem' }}>{Math.round(dist.netProfit).toLocaleString('en-US')}</strong>
                    </div>
                  </div>

                  <table className="io-table" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>الشريك</th>
                        <th>المبلغ المستحق</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dist.partnerShares.map(ps => (
                        <tr key={ps.partnerId}>
                          <td>{ps.name}</td>
                          <td style={{ color: '#10b981', fontWeight: 'bold' }}>{Math.round(ps.shareAmount).toLocaleString('en-US')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              {distributions.length === 0 && (
                <div style={{ textAlign: 'center', color: '#888', padding: '30px' }}>لا توجد عمليات توزيع حتى الآن.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
