import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<Editor />} />
        <Route path="/edit/:id" element={<Editor />} />
      </Routes>
    </HashRouter>
  );
}
