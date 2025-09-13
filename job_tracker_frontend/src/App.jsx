import { Routes, Route, Link } from 'react-router-dom'; // <-- Import Routes, Route, and Link
import JobApplicationList from './JobApplicationList';
import JobApplicationPosting from './JobApplicationPosting';
import JobApplicationEdit from './JobApplicationEdit';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Job Application Tracker</h1>
        <nav>
          <Link to="/" style={{ marginRight: '1rem' }}>View Applications</Link>
          <Link to="/post" style={{ marginRight: '1rem' }}>Post New Application</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<JobApplicationList />} />
          <Route path="/post" element={<JobApplicationPosting />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;