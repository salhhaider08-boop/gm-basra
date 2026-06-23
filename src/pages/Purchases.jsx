import React, { useState, useEffect } from 'react';
import CustomDialog from '../components/CustomDialog';
export default function Purchases() {
  const [purchases, setPurchases] = useState(() => {
    try {
      const saved = localStorage.getItem('gmb_purchases');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('gmb_purchases', JSON.stringify(purchases));
  }, [purchases]);

  const [formData, setFormData] = useState({
    code: '',
    details: '',
    amountUSD: '',
    commissionRate: '3',
    paidUSD: '',
    shippingType: 'بحري',
    exchangeRate: '1390'
  });

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', inputPlaceholder: '', onConfirm: () => {}, onCancel: () => {} });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // Calculations
  const calcRow = (p) => {
    const commRate = Number(p.commissionRate || 3);
    const amountUSD = Number(p.amountUSD);
    const paidUSD = Number(p.paidUSD);
    
    // Commission is calculated from the PAID amount
    const commissionUSD = paidUSD * (commRate / 100);
    
    const totalInvoiceUSD = amountUSD + commissionUSD - Number(p.discountUSD || 0);
    const remainingUSD = amountUSD - paidUSD;
    
    const amountIQD = amountUSD * Number(p.exchangeRate);
    const totalInvoiceIQD = (totalInvoiceUSD * Number(p.exchangeRate)) + Number(p.shippingCostIQD || 0);
    const totalInvoiceIQDNoShipping = totalInvoiceUSD * Number(p.exchangeRate);

    return { ...p, commissionRate: commRate, commissionUSD, totalInvoiceUSD, remainingUSD, amountIQD, totalInvoiceIQD, totalInvoiceIQDNoShipping };
  };

  const processedPurchases = purchases.map(calcRow);

  const sumAmountIQD = processedPurchases.reduce((acc, curr) => acc + curr.amountIQD, 0);
  const sumTotalIQDNoShipping = processedPurchases.reduce((acc, curr) => acc + curr.totalInvoiceIQDNoShipping, 0);
  const sumTotalIQD = processedPurchases.reduce((acc, curr) => acc + curr.totalInvoiceIQD, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.amountUSD) return;
    
    const amountUSD = Number(formData.amountUSD);
    const commRate = Number(formData.commissionRate || 3);
    const paidUSD = formData.paidUSD === '' ? amountUSD : Number(formData.paidUSD);

    const newPurchase = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      code: formData.code,
      details: formData.details,
      amountUSD: amountUSD,
      commissionRate: commRate,
      discountUSD: 0,
      paidUSD: paidUSD,
      shippingType: formData.shippingType,
      shippingCostIQD: 0, // Initially 0 as requested
      exchangeRate: Number(formData.exchangeRate),
      status: 'قيد الشحن' // Initial status
    };

    setPurchases([...purchases, newPurchase]);
    setFormData({
      code: '', details: '', amountUSD: '', commissionRate: '3', 
      paidUSD: '', shippingType: 'بحري',
      exchangeRate: formData.exchangeRate
    });
  };

  const handleAddPayment = (id, remaining) => {
    setDialog({
      isOpen: true,
      type: 'prompt',
      title: 'تسديد المتبقي',
      message: `المتبقي: $${remaining.toLocaleString()}`,
      inputPlaceholder: 'أدخل المبلغ المراد تسديده',
      onConfirm: (amount) => {
        if (amount !== null && amount.trim() !== '') {
          const payment = Number(amount);
          if (!isNaN(payment) && payment > 0) {
            setPurchases(purchases.map(p => {
              if (p.id === id) {
                const newPaid = Number(p.paidUSD) + payment;
                const finalPaid = newPaid > Number(p.amountUSD) ? Number(p.amountUSD) : newPaid;
                return { ...p, paidUSD: finalPaid };
              }
              return p;
            }));
          }
        }
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  const handleReceiveShipment = (id) => {
    setDialog({
      isOpen: true,
      type: 'prompt',
      title: 'استلام الشحنة 📦',
      message: 'الرجاء إدخال كلفة الشحن بالدينار العراقي التي تم دفعها الآن:',
      inputPlaceholder: 'كلفة الشحن (دينار)',
      onConfirm: (cost) => {
        if (cost !== null && cost.trim() !== '') {
          const shippingIQD = Number(cost);
          if (!isNaN(shippingIQD) && shippingIQD >= 0) {
            setPurchases(purchases.map(p => {
              if (p.id === id) {
                return { ...p, status: 'واصل', shippingCostIQD: shippingIQD };
              }
              return p;
            }));
          }
        }
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  const handleDelete = (id) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذه الفاتورة بالكامل؟',
      onConfirm: () => {
        setPurchases(purchases.filter(p => p.id !== id));
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>نظام المشتريات الخارجي</h1>
        <button 
          onClick={() => setIsLogOpen(true)}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}
        >
          السجل الكامل 📋
        </button>
      </div>

      <div className="summary" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="summary-item" style={{ borderLeft: '5px solid #10b981' }}>
          <span style={{ fontSize: '0.9rem' }}>مجموع الفواتير بالدينار (بدون عمولة)</span>
          <strong style={{ color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.4)', fontSize: '1.4rem' }}>
            {sumAmountIQD.toLocaleString('en-US')}
          </strong>
        </div>
        <div className="summary-item" style={{ borderLeft: '5px solid #f59e0b' }}>
          <span style={{ fontSize: '0.9rem' }}>مجموع الفواتير بالدينار (مع العمولة للمسدد فقط)</span>
          <strong style={{ color: '#f59e0b', textShadow: '0 0 15px rgba(245, 158, 11, 0.4)', fontSize: '1.4rem' }}>
            {sumTotalIQDNoShipping.toLocaleString('en-US')}
          </strong>
        </div>
        <div className="summary-item" style={{ borderLeft: '5px solid #ef4444' }}>
          <span style={{ fontSize: '0.9rem' }}>الإجمالي الكلي بالدينار (شامل الشحن الواصل)</span>
          <strong style={{ color: '#ef4444', textShadow: '0 0 15px rgba(239, 68, 68, 0.4)', fontSize: '1.4rem' }}>
            {sumTotalIQD.toLocaleString('en-US')}
          </strong>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Form Section */}
        <div className="form-section">
          <form className="io-form-vertical" onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px', color: '#fff', textAlign: 'center' }}>إضافة فاتورة مشتريات جديدة</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>رمز الفاتورة</label>
                <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="F 04" required />
              </div>
              <div className="form-group">
                <label>التفاصيل</label>
                <input type="text" name="details" value={formData.details} onChange={handleInputChange} placeholder="أجزاء، قطع..." />
              </div>
              <div className="form-group">
                <label>مبلغ الفاتورة الكلي ($)</label>
                <input type="number" step="0.01" name="amountUSD" value={formData.amountUSD} onChange={handleInputChange} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label>نسبة العمولة (%)</label>
                <input type="number" step="0.1" name="commissionRate" value={formData.commissionRate} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>سعر الصرف (دينار)</label>
                <input type="number" name="exchangeRate" value={formData.exchangeRate} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>المسدد من المبلغ ($)</label>
                <input type="number" step="0.01" name="paidUSD" value={formData.paidUSD} onChange={handleInputChange} placeholder="يساوي المبلغ افتراضياً" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>نوع النقل</label>
                <select name="shippingType" value={formData.shippingType} onChange={handleInputChange} className="custom-select">
                  <option value="بحري">بحري</option>
                  <option value="جوي">جوي</option>
                  <option value="جوي, بحري">جوي، بحري</option>
                </select>
                <small style={{ color: '#aaa', display: 'block', marginTop: '10px', textAlign: 'center' }}>
                  * سيتم تسجيل حالة البضاعة كـ "قيد الشحن" تلقائياً، وتُسجل كلفة الشحن لاحقاً عند الاستلام.
                </small>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>
              + تسجيل الفاتورة
            </button>
          </form>
        </div>
      </div>

      {/* Modal for The Log */}
      {isLogOpen && (
        <div className="modal-overlay" onClick={() => setIsLogOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '95vw', padding: '20px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsLogOpen(false)}>×</button>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fff' }}>سجل المشتريات الشامل</h2>
            
            <div className="table-section" style={{ overflowX: 'auto', maxHeight: '70vh' }}>
              <table className="io-table" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#111' }}>
                  <tr>
                    <th>ت</th>
                    <th>التاريخ</th>
                    <th>الرمز</th>
                    <th>التفاصيل</th>
                    <th>الفاتورة $</th>
                    <th>عمولة $</th>
                    <th>إجمالي $</th>
                    <th>المسدد $</th>
                    <th>المتبقي $</th>
                    <th>تسديد</th>
                    <th>الصرف</th>
                    <th>شحن (د.ع)</th>
                    <th>الكلي (د.ع)</th>
                    <th>الموقف والشحن</th>
                    <th>حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {processedPurchases.map((p, index) => (
                    <tr key={p.id}>
                      <td>{index + 1}</td>
                      <td>{p.date}</td>
                      <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>{p.code}</td>
                      <td>{p.details}</td>
                      <td style={{ color: '#10b981' }}>{p.amountUSD.toLocaleString('en-US')}</td>
                      <td style={{ color: '#f59e0b' }}>{p.commissionUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: 'bold' }}>{p.totalInvoiceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{p.paidUSD.toLocaleString('en-US')}</td>
                      <td style={{ color: p.remainingUSD > 0 ? '#ef4444' : '#888', fontWeight: p.remainingUSD > 0 ? 'bold' : 'normal' }}>
                        {p.remainingUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>
                        {p.remainingUSD > 0 ? (
                          <button 
                            onClick={() => handleAddPayment(p.id, p.remainingUSD)} 
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            تسديد 💵
                          </button>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '0.9rem' }}>مكتمل ✓</span>
                        )}
                      </td>
                      <td>{p.exchangeRate.toLocaleString('en-US')}</td>
                      <td style={{ color: '#ef4444' }}>{p.shippingCostIQD ? p.shippingCostIQD.toLocaleString('en-US') : '0'}</td>
                      <td style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#10b981' }}>{p.totalInvoiceIQD.toLocaleString('en-US')}</td>
                      <td>
                        {p.status === 'قيد الشحن' ? (
                          <button 
                            onClick={() => handleReceiveShipment(p.id)}
                            style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                          >
                            استلام الشحنة 🚚
                          </button>
                        ) : (
                          <span className="badge badge-in" style={{ padding: '3px 8px', fontSize: '0.8rem' }}>
                            واصل ✓
                          </span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => handleDelete(p.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {processedPurchases.length === 0 && (
                    <tr>
                      <td colSpan="15" style={{ textAlign: 'center', color: '#888' }}>لا توجد فواتير مسجلة حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <CustomDialog {...dialog} />
    </div>
  );
}

