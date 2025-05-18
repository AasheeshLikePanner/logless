// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "./components/ui/sonner"

import LogManagementSystem from './components/LogManagementSystem/LogManagementSystem';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <main className="container mx-auto py-4">
          <Routes>
            <Route path="/" element={<LogManagementSystem />} />
          </Routes>
        </main>
        
        {/* Toast notifications */}
        <Toaster />
      </div>
    </Router>
  );
}

export default App;