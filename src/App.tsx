import Changelog from './Changelog'
import './Changelog.css'

function App() {
  return (
    <>
      <div className="background-grid"></div>

      <div className="container">
        <header className="header">
          <h1>Changelog</h1>
          <p>Follow up on the latest improvements and updates.</p>
        </header>

        <div className="controls">
          <input type="text" placeholder="Search Entries..." className="search-input" />
          <button className="filter-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filters
          </button>
        </div>

        <Changelog />
      </div>
    </>
  )
}

export default App
