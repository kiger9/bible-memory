import { Link } from 'react-router-dom'

export default function Header({ title, back, action }: { title: string; back?: string; action?: React.ReactNode }) {
  return (
    <header className="header">
      {back ? <Link to={back} className="back" aria-label="Back">‹</Link> : <span />}
      <h1 className="title">{title}</h1>
      <div className="header-action">{action}</div>
    </header>
  )
}
