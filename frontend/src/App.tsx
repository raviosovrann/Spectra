import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-primary-500">Spectra Crypto Dashboard</h1>
          <p className="mt-4 text-dark-300">AI-powered cryptocurrency trading dashboard</p>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
