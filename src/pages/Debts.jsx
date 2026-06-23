import React, { useState, useEffect } from 'react';
import CustomDialog from '../components/CustomDialog';

export default function Debts() {
  const [debts, setDebts] = useState(() => {
    try {
      const saved = localStorage.getItem('gmb_debts');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    paid: ''
  });

  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', inputPlaceholder: '', onConfirm: () => {}, onCancel: () => {} });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    localStorage.setItem('gmb_debts', JSON.stringify(debts));
  }, [debts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDebt = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    const newDebt = {
      id: Date.now(),
      name: formData.name,
      amount: Number(formData.amount),
      paid: Number(formData.paid) || 0
    };

    setDebts([newDebt, ...debts]);
    setFormData({ name: '', amount: '', paid: '' });
  };

  const handleAddPayment = (id, remaining) => {
    setDialog({
      isOpen: true,
      type: 'prompt',
      title: 'تسديد دفعة',
      message: `المتبقي: ${remaining.toLocaleString('en-US')} دينار`,
      inputPlaceholder: 'أدخل المبلغ المسدد',
      onConfirm: (amount) => {
        if (amount !== null && amount.trim() !== '') {
          const payment = Number(amount);
          if (!isNaN(payment) && payment > 0) {
            setDebts(debts.map(d => {
              if (d.id === id) {
                const newPaid = Number(d.paid) + payment;
                const finalPaid = newPaid > Number(d.amount) ? Number(d.amount) : newPaid;
                return { ...d, paid: finalPaid };
              }
              return d;
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
      message: 'هل أنت متأكد من مسح هذا الدين؟',
      onConfirm: () => {
        setDebts(debts.filter(d => d.id !== id));
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  const totalDebtsAmount = debts.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPaid = debts.reduce((acc, curr) => acc + Number(curr.paid), 0);
  const totalRemaining = totalDebtsAmount - totalPaid;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>سجل الديون والسوق 📒</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="stat-card">
          <h3>إجمالي الديون</h3>
          <p style={{ color: '#ef4444' }}>{totalDebtsAmount.toLocaleString('en-US')}</p>
        </div>
        <div className="stat-card">
          <h3>إجمالي الواصل</h3>
          <p style={{ color: '#10b981' }}>{totalPaid.toLocaleString('en-US')}</p>
        </div>
        <div className="stat-card">
          <h3>إجمالي الباقي</h3>
          <p style={{ color: '#f59e0b' }}>{totalRemaining.toLocaleString('en-US')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', alignItems: 'start' }}>
        
        {/* Form */}
        <div className="form-section">
          <form className="io-form-vertical" onSubmit={handleAddDebt}>
            <h3 style={{ marginBottom: '20px', color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>إضافة دين جديد</h3>
            
            <div className="form-group">
              <label>الاسم / الجهة</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="custom-select" required />
            </div>

            <div className="form-group">
              <label>المبلغ الكلي (دينار)</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="custom-select" required />
            </div>

            <div className="form-group">
              <label>الواصل (دينار) - إن وجد</label>
              <input type="number" name="paid" value={formData.paid} onChange={handleInputChange} className="custom-select" />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>
              تسجيل الدين
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="table-section">
          <table className="io-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>المبلغ</th>
                <th>الواصل</th>
                <th>الباقي</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => {
                const remaining = Number(d.amount) - Number(d.paid);
                const isPaid = remaining <= 0;
                return (
                  <tr key={d.id} style={{ opacity: isPaid ? 0.5 : 1 }}>
                    <td style={{ fontWeight: 'bold' }}>{d.name}</td>
                    <td style={{ color: '#ef4444' }}>{d.amount.toLocaleString('en-US')}</td>
                    <td style={{ color: '#10b981' }}>{d.paid.toLocaleString('en-US')}</td>
                    <td style={{ color: isPaid ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                      {remaining.toLocaleString('en-US')}
                    </td>
                    <td>
                      {!isPaid && (
                        <button 
                          onClick={() => handleAddPayment(d.id, remaining)}
                          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px', fontSize: '0.9rem' }}
                        >
                          تسديد
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(d.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                        title="حذف الدين"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {debts.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>لا توجد ديون مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
      <CustomDialog {...dialog} />
    </div>
  );
}
