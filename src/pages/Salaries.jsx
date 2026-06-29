import React, { useState, useEffect } from 'react';
import CustomDialog from '../components/CustomDialog';
export default function Salaries() {
  // 1. Employees State
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('gmb_employees');
    return saved ? JSON.parse(saved) : [{ id: 1, name: 'حيدر', baseSalary: 500000 }];
  });

  const [newEmp, setNewEmp] = useState({ name: '', baseSalary: '' });

  // 2. Salaries State
  const [salaries, setSalaries] = useState(() => {
    const saved = localStorage.getItem('gmb_salaries');
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({
    name: '',
    selectedYear: new Date().getFullYear().toString(),
    selectedMonth: String(new Date().getMonth() + 1).padStart(2, '0'),
    daysWorked: '0',
    bonuses: '0',
    advances: '0',
    debts: '0'
  });

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // Sync employees to local storage
  useEffect(() => {
    localStorage.setItem('gmb_employees', JSON.stringify(employees));
  }, [employees]);

  // Sync salaries to local storage
  useEffect(() => {
    localStorage.setItem('gmb_salaries', JSON.stringify(salaries));
  }, [salaries]);

  // Derived Month/Year string (YYYY-MM)
  const currentMonthStr = `${formData.selectedYear}-${formData.selectedMonth}`;
  
  // Auto-calculate days in month
  const monthDays = new Date(Number(formData.selectedYear), Number(formData.selectedMonth), 0).getDate();

  // Auto-fetch base salary
  const selectedEmpObj = employees.find(e => e.name === formData.name);
  const baseSalary = selectedEmpObj ? selectedEmpObj.baseSalary : 0;

  // Auto-calculate days worked and fetch financials from Attendance if name and month change
  useEffect(() => {
    if (!formData.name) return;

    // 1. Fetch Attendance Days
    const savedAttendance = localStorage.getItem('gmb_attendance');
    let count = 0;
    if (savedAttendance) {
      const attendance = JSON.parse(savedAttendance);
      count = attendance
        .filter(a => a.name === formData.name && a.date.startsWith(currentMonthStr))
        .reduce((sum, a) => sum + (a.status === 'حاضر *2' ? 2 : 1), 0);
    }

    // 2. Fetch Financials (Advances, Debts, Bonuses)
    const savedFinancials = localStorage.getItem('gmb_financials');
    let sumAdvances = 0;
    let sumDebts = 0;
    let sumBonuses = 0;
    
    if (savedFinancials) {
      const financials = JSON.parse(savedFinancials);
      const userFins = financials.filter(f => f.name === formData.name && f.date.startsWith(currentMonthStr));
      
      sumAdvances = userFins.filter(f => f.type === 'سلفة').reduce((acc, curr) => acc + curr.amount, 0);
      sumDebts = userFins.filter(f => f.type === 'دين').reduce((acc, curr) => acc + curr.amount, 0);
      sumBonuses = userFins.filter(f => f.type === 'مكافأة').reduce((acc, curr) => acc + curr.amount, 0);
    }

    setFormData(prev => ({ 
      ...prev, 
      daysWorked: count.toString(),
      advances: sumAdvances.toString(),
      debts: sumDebts.toString(),
      bonuses: sumBonuses.toString()
    }));

  }, [formData.name, formData.selectedYear, formData.selectedMonth, currentMonthStr]);

  // Derived Calculations
  const calcSalaryDetails = () => {
    const worked = Number(formData.daysWorked) || 0;
    const bonus = Number(formData.bonuses) || 0;
    const advance = Number(formData.advances) || 0;
    const debt = Number(formData.debts) || 0;

    const dailyWage = monthDays > 0 ? baseSalary / monthDays : 0;
    const dueSalary = dailyWage * worked;
    let netSalary = dueSalary + bonus - advance - debt;
    
    let carryOverDebt = 0;
    if (netSalary < 0) {
      carryOverDebt = Math.abs(netSalary);
      netSalary = 0; // Can't pay a negative salary
    }

    return { dailyWage, dueSalary, netSalary, carryOverDebt };
  };

  const { dailyWage, dueSalary, netSalary, carryOverDebt } = calcSalaryDetails();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.baseSalary) return;
    setEmployees([...employees, { id: Date.now(), name: newEmp.name, baseSalary: Number(newEmp.baseSalary) }]);
    setNewEmp({ name: '', baseSalary: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || baseSalary === 0) return;

    const newSalary = {
      id: Date.now(),
      name: formData.name,
      month: currentMonthStr,
      baseSalary: baseSalary,
      monthDays: monthDays,
      daysWorked: Number(formData.daysWorked),
      dailyWage: dailyWage,
      dueSalary: dueSalary,
      bonuses: Number(formData.bonuses),
      advances: Number(formData.advances),
      debts: Number(formData.debts),
      netSalary: netSalary
    };

    setSalaries([newSalary, ...salaries]);

    // Handle carry-over debt
    if (carryOverDebt > 0) {
      const currentMonthDate = new Date(Number(formData.selectedYear), Number(formData.selectedMonth) - 1, 1);
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1); // next month
      
      const nextY = currentMonthDate.getFullYear();
      const nextM = String(currentMonthDate.getMonth() + 1).padStart(2, '0');
      const nextMonthFirstDay = `${nextY}-${nextM}-01`;

      const savedFin = localStorage.getItem('gmb_financials');
      const financials = savedFin ? JSON.parse(savedFin) : [];
      
      const newDebt = {
        id: Date.now() + 1,
        name: formData.name,
        type: 'دين',
        date: nextMonthFirstDay,
        amount: Math.round(carryOverDebt)
      };
      
      localStorage.setItem('gmb_financials', JSON.stringify([newDebt, ...financials]));
      setDialog({
        isOpen: true,
        type: 'alert',
        title: 'تنبيه',
        message: `تم ترحيل عجز مقداره ${Math.round(carryOverDebt).toLocaleString('en-US')} دينار كدين على الموظف للشهر القادم.`,
        onConfirm: closeDialog
      });
    }

    // Reset additions/deductions
    setFormData(prev => ({ ...prev, bonuses: '0', advances: '0', debts: '0' }));
  };

  const handleDelete = (id) => {
    setSalaries(salaries.filter(s => s.id !== id));
  };

  const handleDeleteEmployee = (id) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  return (
    <div className="page-container" style={{ paddingBottom: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>نظام احتساب الرواتب والمستحقات</h1>
        <button 
          onClick={() => setIsLogOpen(true)}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}
        >
          سجل الرواتب 📋
        </button>
      </div>

      {/* Add Employee Section */}
      <div className="form-section" style={{ marginBottom: '30px', background: '#0a0a0a' }}>
        <h3 style={{ marginBottom: '15px', color: '#10b981', borderBottom: '1px solid #222', paddingBottom: '10px' }}>إضافة موظف جديد لملف الرواتب</h3>
        <form style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }} onSubmit={handleAddEmployee}>
          <input type="text" className="custom-select" style={{ flex: 1, minWidth: '200px' }} placeholder="اسم الموظف" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} required />
          <input type="number" className="custom-select" style={{ flex: 1, minWidth: '200px' }} placeholder="الراتب الأساسي (دينار)" value={newEmp.baseSalary} onChange={e => setNewEmp({...newEmp, baseSalary: e.target.value})} required />
          <button type="submit" className="btn-primary" style={{ padding: '0 30px' }}>إضافة وحفظ</button>
        </form>
        
        {/* Simple list of current employees */}
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {employees.map(emp => (
            <div key={emp.id} style={{ background: '#111', border: '1px solid #333', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#fff' }}>{emp.name}</span>
              <span style={{ color: '#3b82f6' }}>({emp.baseSalary.toLocaleString('en-US')})</span>
              <button onClick={() => handleDeleteEmployee(emp.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
        {/* Form Section */}
        <div className="form-section">
          <form className="io-form-vertical" onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '20px', color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>حساب راتب الموظف التلقائي</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>اسم الموظف</label>
                <select name="name" value={formData.name} onChange={handleInputChange} className="custom-select" style={{ fontSize: '1.2rem', padding: '12px' }} required>
                  <option value="">-- اختر الموظف لتبدأ الحساب --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>السنة</label>
                <select name="selectedYear" value={formData.selectedYear} onChange={handleInputChange} className="custom-select">
                  {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>الشهر</label>
                <select name="selectedMonth" value={formData.selectedMonth} onChange={handleInputChange} className="custom-select">
                  {Array.from({length: 12}, (_, i) => {
                    const m = String(i + 1).padStart(2, '0');
                    return <option key={m} value={m}>{m}</option>;
                  })}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div>
                    <span style={{ display: 'block', color: '#aaa', fontSize: '0.85rem' }}>الراتب الأساسي المجلوب تلقائياً</span>
                    <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{baseSalary.toLocaleString('en-US')} <span style={{fontSize: '0.8rem', color: '#666'}}>دينار</span></strong>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block', color: '#aaa', fontSize: '0.85rem' }}>عدد أيام هذا الشهر</span>
                    <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{monthDays} <span style={{fontSize: '0.8rem', color: '#666'}}>يوم</span></strong>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#10b981' }}>أيام الحضور الفعلية (يتم سحبها تلقائياً)</label>
                <input type="number" name="daysWorked" value={formData.daysWorked} onChange={handleInputChange} style={{ border: '1px solid #10b981', fontSize: '1.2rem', padding: '15px', background: 'rgba(16, 185, 129, 0.05)' }} required />
              </div>

              {/* Additions / Deductions are manual overrides if needed */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#10b981' }}>المكافآت والبدلات (+)</label>
                <input type="number" name="bonuses" value={formData.bonuses} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label style={{ color: '#ef4444' }}>السلف المسحوبة من العهد (-)</label>
                <input type="number" name="advances" value={formData.advances} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label style={{ color: '#ef4444' }}>ديون سابقة متراكمة (-)</label>
                <input type="number" name="debts" value={formData.debts} onChange={handleInputChange} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '30px', fontSize: '1.2rem', padding: '15px', opacity: formData.name ? 1 : 0.5 }}>
              حفظ الراتب في السجل
            </button>
          </form>
        </div>

        {/* Real-time Slip Preview */}
        <div className="table-section" style={{ padding: '40px', background: 'linear-gradient(145deg, #111, #0a0a0a)', border: '1px solid #333' }}>
          <h3 style={{ marginBottom: '30px', color: '#3b82f6', textAlign: 'center', fontSize: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '15px' }}>قسيمة الراتب الحالية (Preview)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #333', paddingBottom: '15px' }}>
              <span style={{ color: '#aaa' }}>الموظف:</span>
              <strong style={{ color: '#fff' }}>{formData.name || '---'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #333', paddingBottom: '15px' }}>
              <span style={{ color: '#aaa' }}>الأجر اليومي المحتسب:</span>
              <strong style={{ color: '#888' }}>{Math.round(dailyWage).toLocaleString('en-US')} دينار</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #333', paddingBottom: '15px' }}>
              <span style={{ color: '#aaa' }}>الراتب المستحق عن ({formData.daysWorked}) أيام حضور:</span>
              <strong style={{ color: '#fff' }}>{Math.round(dueSalary).toLocaleString('en-US')} دينار</strong>
            </div>
            
            <div style={{ marginTop: '10px', padding: '25px', background: carryOverDebt > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', borderRadius: '15px', border: `1px solid ${carryOverDebt > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`, boxShadow: `0 0 20px ${carryOverDebt > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: carryOverDebt > 0 ? '#ef4444' : '#3b82f6', fontWeight: 'bold', fontSize: '1.3rem' }}>صافي الراتب للتسليم:</span>
                <strong style={{ color: carryOverDebt > 0 ? '#ef4444' : '#3b82f6', fontSize: '2.2rem', textShadow: `0 0 15px ${carryOverDebt > 0 ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.5)'}`, direction: 'ltr', display: 'inline-block' }}>
                  {Math.round(netSalary).toLocaleString('en-US')} <span style={{fontSize: '1rem', color: '#888'}}>دينار</span>
                </strong>
              </div>
              
              {carryOverDebt > 0 && (
                <div style={{ marginTop: '15px', borderTop: '1px dashed rgba(239, 68, 68, 0.3)', paddingTop: '15px', color: '#ef4444', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>⚠️</span>
                  <span>الخصومات تجاوزت المستحق. سيتم ترحيل عجز مقداره <strong>{Math.round(carryOverDebt).toLocaleString('en-US')} دينار</strong> كدين على الموظف للشهر القادم تلقائياً.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Log */}
      {isLogOpen && (
        <div className="modal-overlay" onClick={() => setIsLogOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '1000px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsLogOpen(false)}>×</button>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fff' }}>سجل الرواتب المنجزة</h2>
            
            <div className="table-section" style={{ overflowX: 'auto', maxHeight: '60vh' }}>
              <table className="io-table" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>الشهر</th>
                    <th>اسم الموظف</th>
                    <th>الراتب الأساسي</th>
                    <th>أيام العمل</th>
                    <th>الأجر اليومي</th>
                    <th>الراتب المستحق</th>
                    <th>المكافآت</th>
                    <th>السلف</th>
                    <th>الديون</th>
                    <th>صافي الراتب</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((s) => (
                    <tr key={s.id}>
                      <td style={{ color: '#888' }}>{s.month}</td>
                      <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>{s.name}</td>
                      <td>{s.baseSalary.toLocaleString('en-US')}</td>
                      <td style={{ color: '#10b981', fontWeight: 'bold' }}>{s.daysWorked}</td>
                      <td>{Math.round(s.dailyWage).toLocaleString('en-US')}</td>
                      <td>{Math.round(s.dueSalary).toLocaleString('en-US')}</td>
                      <td style={{ color: '#10b981' }}>{s.bonuses.toLocaleString('en-US')}</td>
                      <td style={{ color: '#ef4444' }}>{s.advances.toLocaleString('en-US')}</td>
                      <td style={{ color: '#ef4444' }}>{s.debts.toLocaleString('en-US')}</td>
                      <td style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#10b981' }}>{Math.round(s.netSalary).toLocaleString('en-US')}</td>
                      <td>
                        <button onClick={() => handleDelete(s.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {salaries.length === 0 && (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', color: '#888' }}>السجل فارغ</td>
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
