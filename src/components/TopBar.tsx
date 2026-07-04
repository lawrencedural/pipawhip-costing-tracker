export type Section = 'costing' | 'inventory';

interface TopBarProps {
  active: Section;
  onChange: (section: Section) => void;
}

export default function TopBar({ active, onChange }: TopBarProps) {
  return (
    <div className="topbar">
      <span className="logo-text">Pipa Whip</span>
      <div className="nav-tabs">
        <button
          className={`nav-tab ${active === 'costing' ? 'active' : ''}`}
          onClick={() => onChange('costing')}
        >
          Costing
        </button>
        <button
          className={`nav-tab ${active === 'inventory' ? 'active' : ''}`}
          onClick={() => onChange('inventory')}
        >
          Inventory
        </button>
      </div>
    </div>
  );
}
