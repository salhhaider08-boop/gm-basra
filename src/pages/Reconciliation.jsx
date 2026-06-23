import React, { useState, useEffect } from 'react';
import CustomDialog from '../components/CustomDialog';

export default function Reconciliation() {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // Auto-fetched Data States
  const [cashOnHand, setCashOnHand] = useState(0);
  const [transitGoods, setTransitGoods] = useState(0);
  const [totalDebts, setTotalDebts] = useState(0);
  const [partners, setPartners] = useState([]);
  
  // Manual Input States (Current Reconciliation)
  const [inventoryUSD_IQD, setInventoryUSD_IQD] = useState('');
  const [inventoryIQD, setInventoryIQD] = useState('');
  const [fixedAssets, setFixedAssets] = useState('');
  const [fixedDifference, setFixedDifference] = useState('');
  const [errorsAmount, setErrorsAmount] = useState('');

  // Withdrawals State
  const [withdrawals, setWithdrawals] = useState(() => {
    try {
      const saved = localStorage.getItem('gmb_withdrawals');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  const [wdForm, setWdForm] = useState({ name: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // Snapshot State (Left Column)
  const [snapshot, setSnapshot] = useState(() => {
    try {
      const saved = localStorage.getItem('gmb_reconciliation_snapshot');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch(e) {
      return null;
    }
  });

  // Fetch all auto data on mount
  useEffect(() => {
    try {
      // 1. Cash from Inside/Outside (gmb_transactions)
      const savedTx = localStorage.getItem('gmb_transactions');
      const tx = savedTx ? JSON.parse(savedTx) : [];
      let totalIn = 0;
      let totalOut = 0;
      tx.forEach(t => {
        if (t.type.includes('وارد')) totalIn += Number(t.amount);
        if (t.type.includes('خارج')) totalOut += Number(t.amount);
      });
      setCashOnHand(totalIn - totalOut);

      // 2. Transit Goods from Purchases (gmb_purchases) -> (paidUSD + commissionUSD) * exchangeRate
      const savedPurch = localStorage.getItem('gmb_purchases');
      const purchases = savedPurch ? JSON.parse(savedPurch) : [];
      let transit = 0;
      purchases.forEach(p => {
        if (p.status === 'قيد الشحن' || !p.shippingCostIQD) {
          const paidUSD = Number(p.paidUSD || 0);
          const commRate = Number(p.commissionRate || 3);
          const commissionUSD = paidUSD * (commRate / 100);
          transit += (paidUSD + commissionUSD) * Number(p.exchangeRate || 1300);
        }
      });
      setTransitGoods(transit);

      // 3. Debts from Debts page (gmb_debts)
      const savedDebts = localStorage.getItem('gmb_debts');
      const debts = savedDebts ? JSON.parse(savedDebts) : [];
      let debtsTotal = 0;
      debts.forEach(d => {
        debtsTotal += (Number(d.amount) - Number(d.paid));
      });
      setTotalDebts(debtsTotal);

      // 4. Partners & Distributions from ProfitCalc
      const savedParts = localStorage.getItem('gmb_partners');
      const rawPartners = savedParts ? JSON.parse(savedParts) : [];
      
      const savedDist = localStorage.getItem('gmb_distributions');
      const dists = savedDist ? JSON.parse(savedDist) : [];
      
      const partsWithProfits = rawPartners.map(p => {
        let totalProfitForPartner = 0;
        dists.forEach(d => {
          const pd = d.partnerDistributions?.find(x => x.name === p.name);
          if (pd) totalProfitForPartner += Number(pd.amount);
        });
        return { ...p, accumulatedProfit: totalProfitForPartner };
      });
      setPartners(partsWithProfits);

    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save Withdrawals
  useEffect(() => {
    localStorage.setItem('gmb_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  // Handle Withdrawals
  const handleAddWithdrawal = (e) => {
    e.preventDefault();
    if (!wdForm.name || !wdForm.amount) return;
    setWithdrawals([{ id: Date.now(), ...wdForm, amount: Number(wdForm.amount) }, ...withdrawals]);
    setWdForm({ ...wdForm, amount: '' });
  };
  const handleDeleteWithdrawal = (id) => {
    setWithdrawals(withdrawals.filter(w => w.id !== id));
  };

  // -------------------------------------------------------------
  // Calculations for Current (Right Column)
  // -------------------------------------------------------------
  
  // A. Theoretical Capital Calculation
  const partnersShares = partners.map(p => {
    const pWds = withdrawals.filter(w => w.name === p.name).reduce((sum, w) => sum + Number(w.amount), 0);
    const netShare = Number(p.capital) + Number(p.accumulatedProfit || 0) - pWds;
    return { name: p.name, share: netShare };
  });

  const theoreticalCapital = partnersShares.reduce((sum, p) => sum + p.share, 0);

  // B. Physical Assets Calculation
  const invUSDIQD = Number(inventoryUSD_IQD) || 0;
  const invIQD = Number(inventoryIQD) || 0;
  const totalInventory = invUSDIQD + invIQD;
  
  const totalFixedAssets = Number(fixedAssets) || 0;
  const totalFixedDiff = Number(fixedDifference) || 0;
  const totalErrors = Number(errorsAmount) || 0;

  const physicalAssetsSub1 = totalInventory; 
  const physicalAssetsSub2 = totalFixedDiff + cashOnHand + totalDebts + totalFixedAssets;
  const physicalAssetsSub3 = transitGoods + totalErrors;

  const totalPhysicalAssets = physicalAssetsSub1 + physicalAssetsSub2 + physicalAssetsSub3;

  // C. Difference
  const discrepancy = theoreticalCapital - totalPhysicalAssets;
  const isCompatible = Math.abs(discrepancy) < 1; // allow small rounding errors

  // Save Snapshot
  const handleSaveSnapshot = () => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'حفظ المطابقة',
      message: 'هل أنت متأكد من حفظ هذه المطابقة واعتمادها كنسخة مرجعية سابقة؟ سيؤدي هذا لظهورها في العمود الأيسر.',
      onConfirm: () => {
        const newSnapshot = {
          date: new Date().toISOString().split('T')[0],
          theoreticalCapital,
          physicalAssets: totalPhysicalAssets,
          discrepancy,
          isCompatible,
          partnersShares,
          inventoryUSD_IQD: invUSDIQD,
          inventoryIQD: invIQD,
          fixedAssets: totalFixedAssets,
          fixedDifference: totalFixedDiff,
          errorsAmount: totalErrors,
          cashOnHand,
          transitGoods,
          totalDebts,
          withdrawals: [...withdrawals]
        };
        localStorage.setItem('gmb_reconciliation_snapshot', JSON.stringify(newSnapshot));
        setSnapshot(newSnapshot);
        setDialog({
          isOpen: true,
          type: 'alert',
          title: 'نجاح',
          message: 'تم حفظ المطابقة بنجاح!',
          onConfirm: closeDialog
        });
      },
      onCancel: closeDialog
    });
  };

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>الميزانية العمومية والمطابقة ⚖️</h1>
        <button 
          onClick={handleSaveSnapshot}
          style={{ background: isCompatible ? '#10b981' : '#f59e0b', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 0 15px ${isCompatible ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}` }}
        >
          حفظ هذه المطابقة 💾
        </button>
      </div>

      <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #222' }}>
        <h3 style={{ color: '#3b82f6', marginBottom: '15px' }}>سحوبات الشركاء (تُخصم من حصصهم)</h3>
        <form style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }} onSubmit={handleAddWithdrawal}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label>الشريك</label>
            <select className="custom-select" value={wdForm.name} onChange={e => setWdForm({...wdForm, name: e.target.value})} required>
              <option value="">-- اختر --</option>
              {partners.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label>المبلغ (دينار)</label>
            <input type="number" className="custom-select" value={wdForm.amount} onChange={e => setWdForm({...wdForm, amount: e.target.value})} required />
          </div>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label>التاريخ</label>
            <input type="date" className="custom-select" value={wdForm.date} onChange={e => setWdForm({...wdForm, date: e.target.value})} required />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0 25px', height: '48px' }}>إضافة السحب</button>
        </form>

        {withdrawals.length > 0 && (
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {withdrawals.map(w => (
              <div key={w.id} style={{ background: '#111', border: '1px solid #ef4444', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#fff' }}>{w.name}</span>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{w.amount.toLocaleString('en-US')}</span>
                <span style={{ color: '#666' }}>{w.date}</span>
                <button onClick={() => handleDeleteWithdrawal(w.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Comparison Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        {/* LEFT COLUMN: PREVIOUS SNAPSHOT */}
        <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '15px', border: '1px solid #222', opacity: 0.8 }}>
          <h2 style={{ textAlign: 'center', color: '#888', borderBottom: '1px dashed #333', paddingBottom: '15px', marginBottom: '30px' }}>
            المطابقة السابقة 
            <br/><span style={{ fontSize: '1rem', color: '#666' }}>({snapshot ? snapshot.date : 'لا توجد بيانات سابقة'})</span>
          </h2>

          {snapshot ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', pointerEvents: 'none' }}>
              {/* Snapshot Capital */}
              <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                <h4 style={{ color: '#aaa', margin: '0 0 15px 0', textAlign: 'center' }}>رأس المال النظري</h4>
                {snapshot.partnersShares.map(p => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#f59e0b' }}>{p.name}</span>
                    <strong style={{ color: '#fff' }}>IQD {p.share.toLocaleString('en-US')}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>رأس المال الكلي</span>
                  <strong style={{ color: '#ef4444' }}>IQD {snapshot.theoreticalCapital.toLocaleString('en-US')}</strong>
                </div>
              </div>

              {/* Snapshot Assets */}
              <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                <h4 style={{ color: '#aaa', margin: '0 0 15px 0', textAlign: 'center' }}>الموجودات (الأصول)</h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#10b981' }}>المواد الموجودة (دولار+دينار)</span>
                  <strong style={{ color: '#fff' }}>IQD {(snapshot.inventoryUSD_IQD + snapshot.inventoryIQD).toLocaleString('en-US')}</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#10b981' }}>النقد الموجود</span>
                  <strong style={{ color: '#fff' }}>IQD {snapshot.cashOnHand.toLocaleString('en-US')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#10b981' }}>الديون</span>
                  <strong style={{ color: '#fff' }}>IQD {snapshot.totalDebts.toLocaleString('en-US')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#10b981' }}>الأصول (محل الصناعية)</span>
                  <strong style={{ color: '#fff' }}>IQD {snapshot.fixedAssets.toLocaleString('en-US')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#10b981' }}>البضاعة قيد الشحن</span>
                  <strong style={{ color: '#fff' }}>IQD {snapshot.transitGoods.toLocaleString('en-US')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>إجمالي الموجودات</span>
                  <strong style={{ color: '#ef4444' }}>IQD {snapshot.physicalAssets.toLocaleString('en-US')}</strong>
                </div>
              </div>

              {/* Snapshot Result */}
              <div style={{ 
                background: snapshot.isCompatible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                padding: '15px', borderRadius: '8px', border: `1px solid ${snapshot.isCompatible ? '#10b981' : '#ef4444'}`, textAlign: 'center' 
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: snapshot.isCompatible ? '#10b981' : '#ef4444' }}>
                  {snapshot.isCompatible ? 'Compatible' : 'Incompatible'}
                </h4>
                <strong style={{ fontSize: '1.4rem', color: '#fff' }}>
                  IQD {Math.abs(snapshot.discrepancy).toLocaleString('en-US')}
                </strong>
                {!snapshot.isCompatible && <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '0.9rem' }}>عجز / نقص</p>}
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#555', marginTop: '50px' }}>لا توجد نسخة سابقة محفوظة</div>
          )}
        </div>

        {/* RIGHT COLUMN: CURRENT RECONCILIATION */}
        <div style={{ background: 'linear-gradient(145deg, #111, #0a0a0a)', padding: '30px', borderRadius: '15px', border: '1px solid #333', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
          <h2 style={{ textAlign: 'center', color: '#fff', borderBottom: '1px dashed #333', paddingBottom: '15px', marginBottom: '30px' }}>
            المطابقة الحالية
            <br/><span style={{ fontSize: '1rem', color: '#3b82f6' }}>({new Date().toISOString().split('T')[0]})</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* 1. Current Capital */}
            <div style={{ background: '#0d0d0d', padding: '20px', borderRadius: '10px', border: '1px solid #222' }}>
              <h4 style={{ color: '#3b82f6', margin: '0 0 20px 0', textAlign: 'center' }}>رأس المال النظري (الحصص)</h4>
              {partnersShares.map(p => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                  <span style={{ color: '#f59e0b', fontSize: '1.1rem', fontWeight: 'bold' }}>{p.name}</span>
                  <div style={{ background: '#1a1a1a', padding: '5px 15px', borderRadius: '5px', border: '1px solid #333' }}>
                    <strong style={{ color: '#fff' }}>IQD {p.share.toLocaleString('en-US')}</strong>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px', alignItems: 'center' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.2rem' }}>رأس المال الكلي</span>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '5px 15px', borderRadius: '5px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                  <strong style={{ color: '#ef4444', fontSize: '1.2rem' }}>IQD {theoreticalCapital.toLocaleString('en-US')}</strong>
                </div>
              </div>
            </div>

            {/* 2. Current Assets */}
            <div style={{ background: '#0d0d0d', padding: '20px', borderRadius: '10px', border: '1px solid #222' }}>
              <h4 style={{ color: '#10b981', margin: '0 0 20px 0', textAlign: 'center' }}>الموجودات الفعلية (الأصول)</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: '1rem' }}>قيمة المواد بالدولار (مقوم بالدينار)</span>
                <input type="number" className="custom-select" style={{ width: '200px', textAlign: 'right', padding: '5px 10px' }} value={inventoryUSD_IQD} onChange={e => setInventoryUSD_IQD(e.target.value)} placeholder="0" />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: '1rem' }}>قيمة المواد بالدينار</span>
                <input type="number" className="custom-select" style={{ width: '200px', textAlign: 'right', padding: '5px 10px' }} value={inventoryIQD} onChange={e => setInventoryIQD(e.target.value)} placeholder="0" />
              </div>

              {/* Auto Fetched */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', background: '#111', padding: '10px', borderRadius: '5px' }}>
                <span style={{ color: '#aaa', fontSize: '1rem' }}>النقد الموجود (تلقائي من الد/خ)</span>
                <strong style={{ color: '#fff', fontSize: '1.1rem' }}>IQD {cashOnHand.toLocaleString('en-US')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', background: '#111', padding: '10px', borderRadius: '5px' }}>
                <span style={{ color: '#aaa', fontSize: '1rem' }}>الديون (تلقائي من السجل)</span>
                <strong style={{ color: '#fff', fontSize: '1.1rem' }}>IQD {totalDebts.toLocaleString('en-US')}</strong>
              </div>

              {/* Manual */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: '1rem' }}>فرق القاصة المثبت</span>
                <input type="number" className="custom-select" style={{ width: '200px', textAlign: 'right', padding: '5px 10px' }} value={fixedDifference} onChange={e => setFixedDifference(e.target.value)} placeholder="0" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: '1rem' }}>الأصول (محل الصناعية)</span>
                <input type="number" className="custom-select" style={{ width: '200px', textAlign: 'right', padding: '5px 10px' }} value={fixedAssets} onChange={e => setFixedAssets(e.target.value)} placeholder="0" />
              </div>

              {/* Auto Fetched */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', background: '#111', padding: '10px', borderRadius: '5px' }}>
                <span style={{ color: '#aaa', fontSize: '1rem' }}>قيد الشحن (تلقائي من المشتريات)</span>
                <strong style={{ color: '#fff', fontSize: '1.1rem' }}>IQD {transitGoods.toLocaleString('en-US')}</strong>
              </div>

              {/* Manual */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: '1rem' }}>أخطاء في حسابات الفروقات</span>
                <input type="number" className="custom-select" style={{ width: '200px', textAlign: 'right', padding: '5px 10px' }} value={errorsAmount} onChange={e => setErrorsAmount(e.target.value)} placeholder="0" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px', alignItems: 'center' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.2rem' }}>إجمالي الموجودات</span>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '5px 15px', borderRadius: '5px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                  <strong style={{ color: '#ef4444', fontSize: '1.2rem' }}>IQD {totalPhysicalAssets.toLocaleString('en-US')}</strong>
                </div>
              </div>
            </div>

            {/* 3. The Result */}
            <div style={{ 
              background: isCompatible ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))' : 'linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))', 
              padding: '30px', 
              borderRadius: '10px', 
              border: `1px solid ${isCompatible ? '#10b981' : '#ef4444'}`, 
              textAlign: 'center',
              boxShadow: `0 0 20px ${isCompatible ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
            }}>
              <h2 style={{ margin: '0 0 15px 0', color: isCompatible ? '#10b981' : '#ef4444', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {isCompatible ? 'Compatible متطابق' : 'Incompatible غير متطابق'}
              </h2>
              <div style={{ 
                display: 'inline-block',
                background: '#000', 
                padding: '10px 30px', 
                borderRadius: '8px', 
                border: `1px solid ${isCompatible ? '#10b981' : '#f59e0b'}` 
              }}>
                <strong style={{ fontSize: '2.5rem', color: isCompatible ? '#10b981' : '#f59e0b' }}>
                  IQD {Math.abs(discrepancy).toLocaleString('en-US')}
                </strong>
              </div>
              {!isCompatible && <p style={{ margin: '15px 0 0 0', color: '#aaa', fontSize: '1.2rem' }}>هذا هو العجز المفقود (النقص) في حسابات المؤسسة</p>}
            </div>

          </div>
        </div>

      </div>

      <CustomDialog {...dialog} />
    </div>
  );
}
