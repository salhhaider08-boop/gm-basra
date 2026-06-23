import React, { useState, useEffect } from 'react';
import CustomDialog from '../components/CustomDialog';

export default function AccountClear() {
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gmb_transactions');
      const allTransactions = saved && saved !== 'undefined' ? JSON.parse(saved) : [];
      const today = new Date().toISOString().split('T')[0];
      setTodayTransactions(allTransactions.filter(t => t.date === today));
    } catch (e) {
      setTodayTransactions([]);
    }
  }, []);

  const totalCashIn = todayTransactions.filter(t => t.type === 'وارد نقد').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalCardIn = todayTransactions.filter(t => t.type === 'وارد ماستر').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalCashOut = todayTransactions.filter(t => t.type === 'خارج نقد').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalCardOut = todayTransactions.filter(t => t.type === 'خارج ماستر').reduce((acc, curr) => acc + Number(curr.amount), 0);

  const balance = (totalCashIn + totalCardIn) - (totalCashOut + totalCardOut);

  const handleClearToday = () => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من تصفير ومسح حركات هذا اليوم؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: () => {
        try {
          const saved = localStorage.getItem('gmb_transactions');
          let allTransactions = saved && saved !== 'undefined' ? JSON.parse(saved) : [];
          const today = new Date().toISOString().split('T')[0];
          
          allTransactions = allTransactions.filter(t => t.date !== today);
          localStorage.setItem('gmb_transactions', JSON.stringify(allTransactions));
          
          setTodayTransactions([]);
          setDialog({
            isOpen: true,
            type: 'alert',
            title: 'نجاح',
            message: 'تم تصفير حساب اليوم بنجاح!',
            onConfirm: closeDialog
          });
        } catch(e) {
          setDialog({
            isOpen: true,
            type: 'alert',
            title: 'خطأ',
            message: 'حدث خطأ أثناء التصفير.',
            onConfirm: closeDialog
          });
        }
      },
      onCancel: closeDialog
    });
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>تصفية حساب اليوم 🧾</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0 0', fontSize: '1rem' }}>
            تاريخ اليوم: {new Date().toISOString().split('T')[0]}
          </p>
        </div>
        <button 
          onClick={handleClearToday}
          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}
        >
          تصفير ومسح اليوم 🧹
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: 'fit-content', margin: '50px auto 0 auto' }}>
        
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#3b82f6', textShadow: '0 0 15px rgba(59, 130, 246, 0.9)', minWidth: '180px' }}>
            الصافي اليومي الكلي
          </span>
          <div style={{ 
            background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)', 
            border: '1px solid #333',
            borderRadius: '8px', 
            padding: '10px 25px', 
            boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.8)',
            color: '#3b82f6',
            fontSize: '1.6rem',
            fontWeight: 'bold',
            direction: 'ltr',
            textAlign: 'right'
          }}>
            {balance.toLocaleString('en-US')} <span style={{fontSize: '0.9rem', color: '#666'}}>دينار</span>
          </div>
        </div>

      </div>
      <CustomDialog {...dialog} />
    </div>
  );
}
