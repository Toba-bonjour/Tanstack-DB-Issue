import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TodoExample from './TodoExample.jsx'

createRoot(document.getElementById('root')).render(
  //<StrictMode>
    <TodoExample />
  //</StrictMode>,
)
