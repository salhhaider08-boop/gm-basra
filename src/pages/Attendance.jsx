import React, { useState, useEffect } from 'react';
import CustomDialog from '../components/CustomDialog';
export default function Attendance() {
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('gmb_employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem('gmb_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [financials, setFinancials] = useState(() => {
    const saved = localStorage.getItem('gmb_financials');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedName, setSelectedName] = useState(employees.length > 0 ? employees[0].name : '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [isLogOpen, setIsLogOpen] = useState(false);

  const [finForm, setFinForm] = useState({ 
    type: 'سلفة', 
    date: new Date().toISOString().split('T')[0], 
    amount: '' 
  });

  useEffect(() => {
    localStorage.setItem('gmb_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('gmb_financials', JSON.stringify(financials));
  }, [financials]);

  // Generate days array for the selected month
  const getDaysInMonth = (monthStr) => {
    if (!monthStr) return [];
    const [year, month] = monthStr.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = String(i).padStart(2, '0');
      days.push(`${monthStr}-${dayStr}`);
    }
    return days;
  };

  const daysList = getDaysInMonth(selectedMonth);

  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // Check if a specific date is attended by the selected employee
  const isAttended = (dateStr) => {
    return attendance.some(a => a.name === selectedName && a.date === dateStr);
  };

  // Toggle attendance for a specific date
  const toggleAttendance = (dateStr) => {
    if (!selectedName) {
      setDialog({
        isOpen: true,
        type: 'alert',
        title: 'تنبيه',
        message: 'يرجى اختيار اسم الموظف أولاً من القائمة',
        onConfirm: closeDialog
      });
      return;
    }

    if (isAttended(dateStr)) {
      setAttendance(attendance.filter(a => !(a.name === selectedName && a.date === dateStr)));
    } else {
      const newRecord = {
        id: Date.now() + Math.random(),
        date: dateStr,
        name: selectedName,
        status: 'حاضر'
      };
      setAttendance([...attendance, newRecord]);
    }
  };

  // Handle adding Financials
  const handleAddFinancial = (e) => {
    e.preventDefault();
    if (!selectedName || !finForm.amount) return;
    
    const newRecord = {
      id: Date.now(),
      name: selectedName,
      type: finForm.type,
      date: finForm.date,
      amount: Number(finForm.amount)
    };
    setFinancials([newRecord, ...financials]);
    setFinForm({ ...finForm, amount: '' });
  };

  const handleDeleteFinancial = (id) => {
    setFinancials(financials.filter(f => f.id !== id));
  };

  const handleDeleteMonthSummary = (month, name) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من مسح جميع سجلات حضور الموظف (${name}) لشهر ${month}؟`,
      onConfirm: () => {
        setAttendance(attendance.filter(a => !(a.name === name && a.date.startsWith(month))));
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  // Group by month and name for summary
  const getSummary = () => {
    const summary = {};
    attendance.forEach(a => {
      const month = a.date.substring(0, 7); // YYYY-MM
      const key = `${month}_${a.name}`;
      if (!summary[key]) summary[key] = { month, name: a.name, count: 0 };
      summary[key].count += 1;
    });
    return Object.values(summary).sort((a, b) => b.month.localeCompare(a.month));
  };

  const summaryData = getSummary();
  const currentMonthCount = attendance.filter(a => a.name === selectedName && a.date.startsWith(selectedMonth)).length;

  // Current month financials for selected employee
  const currentMonthFinancials = financials.filter(f => f.name === selectedName && f.date.startsWith(selectedMonth));

  return (
    <div className="page-container" style={{ paddingBottom: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>نظام الحضور والعهد التفاعلي</h1>
        <button 
          onClick={() => setIsLogOpen(true)}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}
        >
          سجل الحضور 📋
        </button>
      </div>

      {employees.length === 0 && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          يرجى إضافة الموظفين أولاً من صفحة "الرواتب" لتتمكن من تسجيل حضورهم هنا.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Registration Form & Calendar */}
        <div className="form-section" style={{ background: 'linear-gradient(145deg, #111, #0a0a0a)', border: '1px solid #333', padding: '30px' }}>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '1.1rem', color: '#fff' }}>اسم الموظف</label>
              <select 
                value={selectedName} 
                onChange={(e) => setSelectedName(e.target.value)} 
                className="custom-select"
                style={{ fontSize: '1.2rem', padding: '15px' }}
              >
                <option value="">-- اختر الموظف --</option>
                {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '1.1rem', color: '#fff' }}>الشهر والسنة</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                style={{ fontSize: '1.2rem', padding: '15px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
            <h3 style={{ color: '#3b82f6', margin: 0 }}>تقويم الحضور</h3>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 20px', borderRadius: '8px' }}>
              <strong style={{ color: '#fff', marginLeft: '10px' }}>إجمالي الأيام المحددة:</strong>
              <span style={{ color: '#10b981', fontSize: '1.4rem', fontWeight: 'bold', textShadow: '0 0 10px rgba(16,185,129,0.5)' }}>{currentMonthCount}</span>
            </div>
          </div>

          {/* Interactive Calendar Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
            gap: '15px',
            marginTop: '20px'
          }}>
            {daysList.map((dateStr) => {
              const dayNum = parseInt(dateStr.split('-')[2], 10);
              const attended = isAttended(dateStr);
              return (
                <button
                  key={dateStr}
                  onClick={() => toggleAttendance(dateStr)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: attended ? '2px solid #10b981' : '1px solid #333',
                    background: attended ? 'rgba(16, 185, 129, 0.15)' : '#1a1a1a',
                    color: attended ? '#10b981' : '#888',
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: attended ? '0 0 15px rgba(16, 185, 129, 0.3) inset' : 'none'
                  }}
                >
                  {dayNum}
                  {attended && <span style={{ fontSize: '0.8rem', marginTop: '5px' }}>✔️</span>}
                </button>
              );
            })}
          </div>

          {/* Financials (Advances/Debts/Bonuses) */}
          <div style={{ marginTop: '40px', background: '#0d0d0d', border: '1px solid #222', borderRadius: '10px', padding: '25px' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              تسجيل السلف، الديون، والمكافآت 💰
              <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>({selectedName || '---'})</span>
            </h3>
            
            <form style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }} onSubmit={handleAddFinancial}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '0.9rem' }}>النوع</label>
                <select className="custom-select" value={finForm.type} onChange={e => setFinForm({...finForm, type: e.target.value})}>
                  <option value="سلفة">سلفة</option>
                  <option value="دين">دين</option>
                  <option value="مكافأة">مكافأة</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '0.9rem' }}>التاريخ</label>
                <input type="date" className="custom-select" value={finForm.date} onChange={e => setFinForm({...finForm, date: e.target.value})} required />
              </div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '0.9rem' }}>المبلغ (دينار)</label>
                <input type="number" className="custom-select" placeholder="مثال: 50000" value={finForm.amount} onChange={e => setFinForm({...finForm, amount: e.target.value})} required />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0 25px', height: '48px', background: finForm.type === 'مكافأة' ? '#10b981' : '#ef4444' }}>
                حفظ
              </button>
            </form>

            {/* List of current month's financials */}
            {currentMonthFinancials.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#aaa', marginBottom: '10px', fontSize: '1rem' }}>سجل السلف والديون لهذا الشهر:</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {currentMonthFinancials.map(f => (
                    <div key={f.id} style={{ 
                      background: '#1a1a1a', border: `1px solid ${f.type === 'مكافأة' ? '#10b981' : '#ef4444'}`, 
                      padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' 
                    }}>
                      <span style={{ color: f.type === 'مكافأة' ? '#10b981' : '#ef4444' }}>{f.type}</span>
                      <strong style={{ color: '#fff' }}>{Math.round(f.amount).toLocaleString('en-US')}</strong>
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>{f.date.substring(8,10)}</span>
                      <button onClick={() => handleDeleteFinancial(f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal for Full Log */}
      {isLogOpen && (
        <div className="modal-overlay" onClick={() => setIsLogOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsLogOpen(false)}>×</button>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fff' }}>السجل التفصيلي للإجماليات</h2>
            
            <h3 style={{ color: '#3b82f6', marginBottom: '15px' }}>الإجماليات الشهرية للحضور</h3>
            <table className="io-table" style={{ fontSize: '0.9rem', marginBottom: '40px' }}>
              <thead>
                <tr>
                  <th>الشهر</th>
                  <th>اسم الموظف</th>
                  <th>إجمالي أيام الحضور</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: '#888' }}>{s.month}</td>
                    <td style={{ fontWeight: 'bold', color: '#fff' }}>{s.name}</td>
                    <td style={{ color: '#10b981', fontWeight: 'bold' }}>{s.count} أيام</td>
                    <td>
                      <button onClick={() => handleDeleteMonthSummary(s.month, s.name)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
                {summaryData.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>لا توجد بيانات حضور</td></tr>
                )}
              </tbody>
            </table>

            <h3 style={{ color: '#ef4444', marginBottom: '15px' }}>كل السلف والديون والمكافآت</h3>
            <div style={{ maxHeight: '30vh', overflowY: 'auto' }}>
              <table className="io-table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الاسم</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {financials.map((f) => (
                    <tr key={f.id}>
                      <td>{f.date}</td>
                      <td style={{ fontWeight: 'bold' }}>{f.name}</td>
                      <td><span style={{ color: f.type === 'مكافأة' ? '#10b981' : '#ef4444' }}>{f.type}</span></td>
                      <td style={{ fontWeight: 'bold' }}>{Math.round(f.amount).toLocaleString('en-US')}</td>
                      <td>
                        <button onClick={() => handleDeleteFinancial(f.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {financials.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>السجل فارغ</td>
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
