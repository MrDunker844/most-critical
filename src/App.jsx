import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>Most Critical</h1>
      <p>Vite + React, served by nginx.</p>
      <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
    </main>
  )
}
