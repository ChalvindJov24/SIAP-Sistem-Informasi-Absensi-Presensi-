import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, KeyRound, CalendarCheck } from 'lucide-react';

// Pemetaan string `icon` (dari menuConfig) -> komponen lucide-react.
const iconMap = {
  LayoutDashboard,
  Users,
  Wallet,
  KeyRound,
  CalendarCheck,
};

/**
 * Satu item menu sidebar. Menggunakan NavLink dari react-router-dom.
 * State aktif dihitung lewat callback className ({ isActive }), bukan perbandingan location manual.
 */
export default function SidebarNavItem({ item, onClick }) {
  const Icon = iconMap[item.icon] || LayoutDashboard;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        isActive
          ? 'flex items-center gap-3 rounded-sm bg-block-sage/30 px-3 py-2.5 text-sm font-medium text-ink'
          : 'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-ink/70 transition-colors hover:bg-surface-soft hover:text-ink'
      }
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="flex-1 whitespace-nowrap">{item.label}</span>
      {item.badge && (
        <span className="rounded-pill bg-block-sage px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-block-sage-ink">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}