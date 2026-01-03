import { Link } from 'react-router-dom'

export default function LandingPage() {
  console.log('🎄 LandingPage component is rendering!')
  
  return (
    <div 
      id="landing-page-root"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#990000',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontSize: '2rem',
        textAlign: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        boxSizing: 'border-box',
        zIndex: 1,
        overflow: 'auto'
      }}
    >
      <h1 style={{ 
        fontSize: '4rem', 
        marginBottom: '1rem', 
        margin: '0 0 1rem 0',
        color: '#ffd700',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        fontWeight: 'bold'
      }}>
        🎄 ChrisCandle
      </h1>
      <p style={{ 
        fontSize: '1.5rem', 
        marginBottom: '2rem', 
        margin: '0 0 2rem 0',
        color: 'white',
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
      }}>
        Secret Santa Organizer
      </p>
      <p style={{ 
        fontSize: '1rem', 
        marginBottom: '2rem', 
        margin: '0 0 2rem 0',
        color: 'rgba(255,255,255,0.9)'
      }}>
        If you can see this, React is working!
      </p>
      <Link 
        to="/create"
        style={{
          padding: '1rem 2rem',
          backgroundColor: '#ffd700',
          color: '#990000',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          display: 'inline-block',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        Create Event
      </Link>
    </div>
  )
}
