import './App.css';
import logoImage from '/logo.png';
import { useTranslation } from '../locales';
import { useEffect } from 'react';

export default function App() {
  const { t, locale } = useTranslation();

  // HTML lang 속성 업데이트
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="app">
      <div className="app-main">
        <div className="logo-container">
          <img src={logoImage} alt={t('ui.popup.logo_alt')} className="logo" />
        </div>
        <div className="status">
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>{t('ui.popup.extension_active')}</span>
          </div>
        </div>
        <div className="language-info" style={{ 
          marginTop: '16px', 
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '16px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          🌍 {locale === 'ko' ? '한국어' : 'English'} (자동 감지)
        </div>
      </div>
    </div>
  );
}
