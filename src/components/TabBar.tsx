import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Today' },
  { to: '/verses', label: 'Verses' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/logbook', label: 'Logbook' },
]

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Primary">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
