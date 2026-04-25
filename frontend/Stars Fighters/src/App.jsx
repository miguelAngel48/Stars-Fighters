import { Link } from 'react-router-dom'

function App() {
  return (
    <div>
      <h1>Stars Fighters</h1>
      <Link to="/login">Entrar al juego</Link>
      <Link to="/register">Crear cuenta</Link>
    </div>
  )
}
export default App