export default function Navigation({ tabs, tab, onChange }) {
  return (
    <nav className="navigation">
      {tabs.map(([id, label]) => (
        <button
          type="button"
          key={id}
          className={tab === id ? "active" : ""}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
