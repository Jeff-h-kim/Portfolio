import { useState } from 'react'
import './App.css'
import HomePage from './components/pages/HomePage.jsx'
import AllProjectsPage from './components/pages/AllProjectsPage.jsx'

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'all-projects':
        return <AllProjectsPage setCurrentPage={setCurrentPage} />;
      case 'home':
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderPage()}
    </div>
  );
};

export default App