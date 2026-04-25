import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './Styles/App.css'
import { Link } from 'react-router-dom'
import Register from './Pages/Register'
import Login from './Pages/Login'

function App() {
  const [count, setCount] = useState(0)

  return (<>
    <Link to="/Login" id='StartMenu'>Press to start  </Link>
  </>)

}

export default App
