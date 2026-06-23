import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import './index.css';

// Page components
import InsideOutside from './pages/InsideOutside';
import Purchases from './pages/Purchases';
import ProfitCalc from './pages/ProfitCalc';
import Attendance from './pages/Attendance';
import Salaries from './pages/Salaries';
import AccountClear from './pages/AccountClear';
import Debts from './pages/Debts';
import Reconciliation from './pages/Reconciliation';

function Sidebar() {
  const links = [
    { to: '/', label: 'الرئيسية', icon: '🏠' },
    { to: '/inside-outside', label: 'داخل / خارج', icon: '↔️' },
    { to: '/purchases', label: 'المشتريات', icon: '🛒' },
    { to: '/profit', label: 'احتساب الأرباح', icon: '💰' },
    { to: '/attendance', label: 'تسجيل حضور', icon: '⏱️' },
    { to: '/salaries', label: 'الرواتب', icon: '💵' },
    { to: '/debts', label: 'سجل الديون', icon: '📒' },
    { to: '/clear', label: 'تصفية اليومية', icon: '🧾' },
    { to: '/reconciliation', label: 'الميزانية العمومية', icon: '⚖️' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="gmc-logo">GMC</div>
      </div>
      <nav className="nav-menu">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => (isActive && l.to !== '/' || (isActive && l.to === '/' && window.location.pathname === '/') ? 'nav-item active' : 'nav-item')}
          >
            <span className="nav-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function TopHeader() {
  const [time, setTime] = React.useState(new Date());
  const [attendanceMissing, setAttendanceMissing] = React.useState(false);
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'لوحة القيادة الرئيسية';
      case '/inside-outside': return 'نظام التوريد والإخراج';
      case '/purchases': return 'إدارة المشتريات';
      case '/profit': return 'مركز الأرباح';
      case '/attendance': return 'سجل الحضور والانصراف';
      case '/salaries': return 'كشف الرواتب';
      case '/debts': return 'سجل الديون والسوق';
      case '/clear': return 'تصفية الحسابات اليومية';
      case '/reconciliation': return 'المطابقة والميزانية العمومية';
      default: return 'GM Basra System';
    }
  };

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    // Check attendance for today
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedAtt = localStorage.getItem('gmb_attendance');
      const attendance = savedAtt ? JSON.parse(savedAtt) : [];
      const savedEmp = localStorage.getItem('gmb_employees');
      const employees = savedEmp ? JSON.parse(savedEmp) : [];
      
      // If there are employees but nobody is registered for today
      if (employees.length > 0) {
        const anyoneRegisteredToday = attendance.some(a => a.date === today);
        setAttendanceMissing(!anyoneRegisteredToday);
      } else {
        setAttendanceMissing(false);
      }
    } catch (e) {
      setAttendanceMissing(false);
    }
  }, [location.pathname]);

  return (
    <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', borderBottom: 'none', paddingBottom: 0 }}>
      
      <div className="header-title" style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
        {getTitle()}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {attendanceMissing && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid rgba(239, 68, 68, 0.4)', 
            color: '#ef4444', 
            padding: '10px 25px', 
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)'
          }}>
            ⚠️ تنبيه: لم يتم تسجيل حضور الموظفين لهذا اليوم!
          </div>
        )}
        
        <div style={{ 
          background: 'linear-gradient(145deg, #111, #050505)', 
          border: '1px solid #333', 
          padding: '12px 25px', 
          borderRadius: '10px',
          color: '#3b82f6',
          fontFamily: 'monospace',
          fontSize: '1.6rem',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(59, 130, 246, 0.6)',
          boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.8)',
          letterSpacing: '2px',
          direction: 'ltr'
        }}>
          {time.toLocaleTimeString('en-US', { hour12: true })}
        </div>
      </div>
    </header>
  );
}

function Home() {
  return (
    <div className="home-dashboard">
      <div className="abstract-gmc-container">
        <div className="abstract-headlight abstract-left"></div>
        <div className="abstract-gmc-logo">GMC</div>
        <div className="abstract-headlight abstract-right"></div>
      </div>
      <div className="welcome-text">
        <h2 className="welcome-title">GM BASRA</h2>
        <p className="welcome-subtitle">النظام جاهز. اختر من القائمة للبدء.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <TopHeader />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inside-outside" element={<InsideOutside />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/profit" element={<ProfitCalc />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/salaries" element={<Salaries />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/clear" element={<AccountClear />} />
            <Route path="/reconciliation" element={<Reconciliation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
