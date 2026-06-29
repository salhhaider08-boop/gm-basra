import React, { useState, useEffect } from 'react';
import CustomDialog from '../components/CustomDialog';

export default function AccountClear() {
  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // 1. Grid State (4 columns, 10 rows)
  const [gridData, setGridData] = useState(() => {
    try {
      const saved = localStorage.getItem('gmb_daily_scratchpad');
      return saved ? JSON.parse(saved) : Array(10).fill({ cashIn: '', cardIn: '', cashOut: '', cardOut: '' });
    } catch(e) {
      return Array(10).fill({ cashIn: '', cardIn: '', cashOut: '', cardOut: '' });
    }
  });

  useEffect(() => {
    localStorage.setItem('gmb_daily_scratchpad', JSON.stringify(gridData));
  }, [gridData]);

  const handleGridChange = (index, field, value) => {
    const newData = [...gridData];
    newData[index] = { ...newData[index], [field]: value };
    setGridData(newData);
  };

  const handleClearGrid = () => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'تصفير المسودة',
      message: 'هل أنت متأكد من مسح جميع أرقام المسودة؟',
      onConfirm: () => {
        setGridData(Array(10).fill({ cashIn: '', cardIn: '', cashOut: '', cardOut: '' }));
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  // Sums
  const sumCashIn = gridData.reduce((acc, row) => acc + (Number(row.cashIn) || 0), 0);
  const sumCardIn = gridData.reduce((acc, row) => acc + (Number(row.cardIn) || 0), 0);
  const sumCashOut = gridData.reduce((acc, row) => acc + (Number(row.cashOut) || 0), 0);
  const sumCardOut = gridData.reduce((acc, row) => acc + (Number(row.cardOut) || 0), 0);
  const netBalance = (sumCashIn + sumCardIn) - (sumCashOut + sumCardOut);

  // 2. Safe Input
  const [safeInput, setSafeInput] = useState('');
  const handleAddToSafe = (e) => {
    e.preventDefault();
    const amount = Number(safeInput);
    if (!amount || amount <= 0) return;
    
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'تأكيد الترحيل للقاصة',
      message: `هل أنت متأكد من إيداع مبلغ ${amount.toLocaleString('en-US')} دينار في القاصة الرئيسية كـ (وارد نقد)؟`,
      onConfirm: () => {
        try {
          const savedTx = localStorage.getItem('gmb_transactions');
          const tx = savedTx && savedTx !== 'undefined' ? JSON.parse(savedTx) : [];
          
          const newTx = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: 'وارد نقد',
            amount: amount
          };
          
          localStorage.setItem('gmb_transactions', JSON.stringify([newTx, ...tx]));
          
          setSafeInput('');
          setDialog({
            isOpen: true, type: 'alert', title: 'نجاح', message: 'تم تحويل وإضافة المبلغ للقاصة الرئيسية بنجاح!', onConfirm: closeDialog
          });
        } catch(e) {
          setDialog({ isOpen: true, type: 'alert', title: 'خطأ', message: 'حدث خطأ أثناء الإضافة.', onConfirm: closeDialog });
        }
      },
      onCancel: closeDialog
    });
  };

  // 3. Calculator State
  const [calcInput, setCalcInput] = useState('0');
  const handleCalcPress = (btn) => {
    if (btn === 'C') {
      setCalcInput('0');
      return;
    }
    if (btn === '=') {
      try {
        // Safe evaluation
        const exp = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
        // eslint-disable-next-line
        const res = new Function('return ' + exp)();
        setCalcInput(String(res));
      } catch(e) {
        setCalcInput('Error');
      }
      return;
    }
    
    if (calcInput === '0' || calcInput === 'Error') {
      if (['+', '-', '×', '÷'].includes(btn)) {
        setCalcInput('0' + btn);
      } else {
        setCalcInput(btn);
      }
    } else {
      setCalcInput(prev => prev + btn);
    }
  };

  const calcBtns = [
    '7', '8', '9', '÷',
    '4', '5', '6', '×',
    '1', '2', '3', '-',
    'C', '0', '=', '+'
  ];

  // Styles
  const inputStyle = {
    background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', 
    width: '100%', textAlign: 'center', outline: 'none'
  };
  const thStyle = { padding: '15px 5px', textAlign: 'center', borderBottom: '2px solid #333', fontSize: '1.1rem' };
  const tdStyle = { padding: '5px', border: '1px solid #333', background: '#111' };

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>تصفية حساب اليوم (مسودة) 🧾</h1>
          <p style={{ color: '#aaa', margin: '5px 0 0 0', fontSize: '1rem' }}>
            تاريخ اليوم: {new Date().toISOString().split('T')[0]}
          </p>
        </div>
        <button 
          onClick={handleClearGrid}
          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}
        >
          تصفير ومسح الجدول 🧹
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Side: Grid & Net Balance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Glowing Net Balance */}
          <div style={{ 
            background: 'linear-gradient(145deg, #111, #0a0a0a)', 
            border: '2px solid #3b82f6', 
            borderRadius: '15px', 
            padding: '30px', 
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#3b82f6', fontSize: '1.6rem' }}>الصافي اليومي الكلي للمسودة</h3>
            <strong style={{ 
              fontSize: '3.5rem', 
              color: netBalance >= 0 ? '#10b981' : '#ef4444', 
              textShadow: netBalance >= 0 ? '0 0 20px rgba(16,185,129,0.5)' : '0 0 20px rgba(239,68,68,0.5)',
              display: 'block',
              direction: 'ltr'
            }}>
              {netBalance.toLocaleString('en-US')} <span style={{fontSize: '1.2rem', color: '#888'}}>دينار</span>
            </strong>
          </div>

          {/* 4x10 Grid */}
          <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: '1px solid #222' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{...thStyle, color: '#10b981'}}>إجمالي داخل (نقد)</th>
                  <th style={{...thStyle, color: '#34d399'}}>إجمالي داخل (ماستر)</th>
                  <th style={{...thStyle, color: '#ef4444'}}>إجمالي خارج (نقد)</th>
                  <th style={{...thStyle, color: '#f87171'}}>إجمالي خارج (ماستر)</th>
                </tr>
                {/* SUM ROW */}
                <tr style={{ background: '#1a1a1a' }}>
                  <th style={{...thStyle, color: '#10b981', fontSize: '1.3rem'}}>{sumCashIn.toLocaleString()}</th>
                  <th style={{...thStyle, color: '#34d399', fontSize: '1.3rem'}}>{sumCardIn.toLocaleString()}</th>
                  <th style={{...thStyle, color: '#ef4444', fontSize: '1.3rem'}}>{sumCashOut.toLocaleString()}</th>
                  <th style={{...thStyle, color: '#f87171', fontSize: '1.3rem'}}>{sumCardOut.toLocaleString()}</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((row, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>
                      <input type="number" style={inputStyle} value={row.cashIn} onChange={e => handleGridChange(index, 'cashIn', e.target.value)} />
                    </td>
                    <td style={tdStyle}>
                      <input type="number" style={inputStyle} value={row.cardIn} onChange={e => handleGridChange(index, 'cardIn', e.target.value)} />
                    </td>
                    <td style={tdStyle}>
                      <input type="number" style={inputStyle} value={row.cashOut} onChange={e => handleGridChange(index, 'cashOut', e.target.value)} />
                    </td>
                    <td style={tdStyle}>
                      <input type="number" style={inputStyle} value={row.cardOut} onChange={e => handleGridChange(index, 'cardOut', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Side: Safe Linkage & Calculator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Safe Linkage */}
          <div style={{ background: '#0a0a0a', padding: '25px', borderRadius: '15px', border: '1px solid #10b981', boxShadow: '0 0 20px rgba(16,185,129,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#10b981', textAlign: 'center', fontSize: '1.3rem' }}>🏦 إيداع في القاصة الرئيسية</h3>
            <p style={{ color: '#888', fontSize: '0.9rem', textAlign: 'center', marginBottom: '20px' }}>
              أي رقم يُضاف هنا سيزيد من النقد الموجود في الميزانية العامة تلقائياً.
            </p>
            <form onSubmit={handleAddToSafe} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="number" 
                className="custom-select" 
                placeholder="أدخل المبلغ (دينار)" 
                value={safeInput} 
                onChange={e => setSafeInput(e.target.value)} 
                style={{ fontSize: '1.3rem', padding: '15px', textAlign: 'center' }} 
              />
              <button type="submit" className="btn-primary" style={{ background: '#10b981', fontSize: '1.2rem', padding: '15px' }}>
                + ترحيل للقاصة
              </button>
            </form>
          </div>

          {/* Calculator */}
          <div style={{ background: '#111', padding: '25px', borderRadius: '15px', border: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', textAlign: 'center' }}>🧮 حاسبة رقمية</h3>
            
            <div style={{ 
              background: '#000', border: '1px solid #444', borderRadius: '10px', 
              padding: '15px', marginBottom: '20px', fontSize: '2rem', textAlign: 'left', 
              color: '#3b82f6', overflow: 'hidden', whiteSpace: 'nowrap', direction: 'ltr' 
            }}>
              {calcInput}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', direction: 'ltr' }}>
              {calcBtns.map(btn => (
                <button 
                  key={btn}
                  onClick={() => handleCalcPress(btn)}
                  style={{
                    background: ['C', '=', '+', '-', '×', '÷'].includes(btn) ? '#222' : '#1a1a1a',
                    color: btn === 'C' ? '#ef4444' : btn === '=' ? '#10b981' : '#fff',
                    border: '1px solid #333',
                    borderRadius: '10px',
                    padding: '15px 0',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={e => e.target.style.background = '#333'}
                  onMouseOut={e => e.target.style.background = ['C', '=', '+', '-', '×', '÷'].includes(btn) ? '#222' : '#1a1a1a'}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      <CustomDialog {...dialog} />
    </div>
  );
}
