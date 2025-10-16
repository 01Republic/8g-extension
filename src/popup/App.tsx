import './App.css';
import logoImage from '/logo.png';

export default function App() {
  return (
    <div className="app">
      <div className="app-main">
        <div className="logo-container">
          <img src={logoImage} alt="scordi logo" className="logo" />
        </div>
        <div className="status">
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>Extension 활성화됨</span>
          </div>
        </div>
      </div>
    </div>
  );
}
