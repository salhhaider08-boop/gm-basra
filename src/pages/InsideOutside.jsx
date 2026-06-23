import React, { useState } from 'react';

export default function InsideOutside() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('gmb_transactions');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem('gmb_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const [formData, setFormData] = useState({
    type: 'وارد نقد',
    amount: ''
  });

  const [isLogOpen, setIsLogOpen] = useState(false);

  const totalCashIn = transactions.filter(t => t.type === 'وارد نقد').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalCardIn = transactions.filter(t => t.type === 'وارد ماستر').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalCashOut = transactions.filter(t => t.type === 'خارج نقد').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalCardOut = transactions.filter(t => t.type === 'خارج ماستر').reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalIn = totalCashIn + totalCardIn;
  const totalOut = totalCashOut + totalCardOut;
  const balance = totalIn - totalOut;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    
    const newTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: formData.type,
      amount: Number(formData.amount)
    };

    setTransactions([newTransaction, ...transactions]);
    setFormData({ type: 'وارد نقد', amount: '' });
  };

  const handleDelete = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>نظام داخل / خارج اليومي</h1>
        <button 
          onClick={() => setIsLogOpen(true)}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}
        >
          السجل 📋
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', width: 'fit-content' }}>
        
        {/* Total Cash In */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.9)', minWidth: '180px' }}>
            إجمالي داخل (نقد) (+)
          </span>
          <div style={{ 
            background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)', 
            border: '1px solid #333',
            borderRadius: '8px', 
            padding: '8px 20px', 
            boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.8)',
            color: '#10b981',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            direction: 'ltr',
            textAlign: 'right'
          }}>
            {totalCashIn.toLocaleString('en-US')} <span style={{fontSize: '0.9rem', color: '#666'}}>دينار</span>
          </div>
        </div>

        {/* Total Card In */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#34d399', textShadow: '0 0 15px rgba(52, 211, 153, 0.9)', minWidth: '180px' }}>
            إجمالي داخل (ماستر) (+)
          </span>
          <div style={{ 
            background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)', 
            border: '1px solid #333',
            borderRadius: '8px', 
            padding: '8px 20px', 
            boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.8)',
            color: '#34d399',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            direction: 'ltr',
            textAlign: 'right'
          }}>
            {totalCardIn.toLocaleString('en-US')} <span style={{fontSize: '0.9rem', color: '#666'}}>دينار</span>
          </div>
        </div>

        {/* Total Cash Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444', textShadow: '0 0 15px rgba(239, 68, 68, 0.9)', minWidth: '180px' }}>
            إجمالي خارج (نقد) (-)
          </span>
          <div style={{ 
            background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)', 
            border: '1px solid #333',
            borderRadius: '8px', 
            padding: '8px 20px', 
            boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.8)',
            color: '#ef4444',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            direction: 'ltr',
            textAlign: 'right'
          }}>
            {totalCashOut.toLocaleString('en-US')} <span style={{fontSize: '0.9rem', color: '#666'}}>دينار</span>
          </div>
        </div>

        {/* Total Card Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f87171', textShadow: '0 0 15px rgba(248, 113, 113, 0.9)', minWidth: '180px' }}>
            إجمالي خارج (ماستر) (-)
          </span>
          <div style={{ 
            background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)', 
            border: '1px solid #333',
            borderRadius: '8px', 
            padding: '8px 20px', 
            boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.8)',
            color: '#f87171',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            direction: 'ltr',
            textAlign: 'right'
          }}>
            {totalCardOut.toLocaleString('en-US')} <span style={{fontSize: '0.9rem', color: '#666'}}>دينار</span>
          </div>
        </div>

        {/* Net Balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6', textShadow: '0 0 15px rgba(59, 130, 246, 0.9)', minWidth: '180px' }}>
            الرصيد الصافي الكلي
          </span>
          <div style={{ 
            background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)', 
            border: '1px solid #333',
            borderRadius: '8px', 
            padding: '8px 20px', 
            boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.8)',
            color: '#3b82f6',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            direction: 'ltr',
            textAlign: 'right'
          }}>
            {balance.toLocaleString('en-US')} <span style={{fontSize: '0.9rem', color: '#666'}}>دينار</span>
          </div>
        </div>

      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Form Section */}
        <div className="form-section">
          <form className="io-form-vertical" onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px', color: '#fff', textAlign: 'center' }}>إضافة حركة جديدة</h3>
            
            <div className="form-group">
              <label>نوع الحركة</label>
              <select name="type" value={formData.type} onChange={handleInputChange} className="custom-select">
                <option value="وارد نقد">وارد نقد</option>
                <option value="وارد ماستر">وارد ماستر</option>
                <option value="خارج نقد">خارج نقد</option>
                <option value="خارج ماستر">خارج ماستر</option>
              </select>
            </div>

            <div className="form-group">
              <label>المبلغ (دينار)</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="0" required />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '15px' }}>
              + حفظ المبلغ
            </button>
          </form>
        </div>
      </div>

      {/* Modal for The Log */}
      {isLogOpen && (
        <div className="modal-overlay" onClick={() => setIsLogOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsLogOpen(false)}>×</button>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fff' }}>سجل الحركات</h2>
            
            <div className="table-section">
              <table className="io-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => {
                    const isIncome = t.type.includes('وارد');
                    return (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td>
                          <span className={`badge ${isIncome ? 'badge-in' : 'badge-out'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 'bold', color: isIncome ? '#10b981' : '#ef4444', fontSize: '1.2rem' }}>
                          {t.amount.toLocaleString('en-US')}
                        </td>
                        <td>
                          <button onClick={() => handleDelete(t.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>لا توجد حركات مسجلة حالياً</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#0a0a0a' }}>
                    <td colSpan="4" style={{ padding: '15px 20px', borderTop: '2px solid #333', fontSize: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                          <span style={{ color: '#aaa' }}>إجمالي الوارد:</span>
                          <div style={{ display: 'flex', gap: '30px' }}>
                            <span style={{ color: '#10b981' }}>نقد: {totalCashIn.toLocaleString('en-US')}</span>
                            <span style={{ color: '#34d399' }}>ماستر: {totalCardIn.toLocaleString('en-US')}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                          <span style={{ color: '#aaa' }}>إجمالي الخارج:</span>
                          <div style={{ display: 'flex', gap: '30px' }}>
                            <span style={{ color: '#ef4444' }}>نقد: {totalCashOut.toLocaleString('en-US')}</span>
                            <span style={{ color: '#f87171' }}>ماستر: {totalCardOut.toLocaleString('en-US')}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', borderTop: '1px solid #222', paddingTop: '12px' }}>
                          <span style={{ color: '#aaa' }}>الرصيد الصافي الكلي:</span>
                          <span style={{ color: '#3b82f6', fontSize: '1.3rem' }}>{balance.toLocaleString('en-US')} دينار</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
