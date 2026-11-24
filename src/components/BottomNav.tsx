import { NavLink } from 'react-router-dom';
import { CalendarDays, Home, Info, ListChecks, Map } from 'lucide-react';

const TABS = [
  { to: '/', label: '홈', Icon: Home },
  { to: '/schedule', label: '일정', Icon: CalendarDays },
  { to: '/map', label: '지도', Icon: Map },
  { to: '/checklist', label: '체크', Icon: ListChecks },
  { to: '/info', label: '정보', Icon: Info },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="메인 메뉴">
      <ul>
        {TABS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={22} strokeWidth={2} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
