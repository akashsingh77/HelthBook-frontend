export default function Home({ onNavigate }) {
  return <main className="home-page">
    <header className="home-nav">
      <button className="brand" onClick={() => onNavigate('home')}><span>✚</span><strong>HealthBook AI</strong></button>
      <nav><button className="nav-active" onClick={() => onNavigate('home')}>Home</button><button onClick={() => onNavigate('doctors')}>Doctors</button><button onClick={() => onNavigate('services')}>Services</button><button className="login-link" onClick={() => onNavigate('login')}>Login</button></nav>
    </header>
    <section className="home-hero">
      <p className="eyebrow">HEALTHCARE, MADE SIMPLE</p>
      <h1>Your Health, Our Priority <span>♥</span></h1>
      <p>Find doctors, manage appointments and get<br className="desktop-break" /> AI-powered health information.</p>
      <div className="home-actions"><button className="btn btn-primary" onClick={() => onNavigate('doctors')}>Find Doctor →</button><button className="btn btn-light ask-ai" onClick={() => onNavigate('assistant')}>✦ Ask AI</button></div>
    </section>
    <section className="home-features">
      <article><span>⚕</span><div><strong>500+ Doctors</strong><p>Trusted specialists, ready to help</p></div></article>
      <article><span>◷</span><div><strong>Easy Booking</strong><p>Schedule care in just a few clicks</p></div></article>
      <article><span>✦</span><div><strong>AI Assistant</strong><p>Helpful health information, anytime</p></div></article>
    </section>
  </main>
}
