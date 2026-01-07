import { Link } from 'react-router-dom'
import Snowflakes from '../components/features/Snowflakes'
import Navigation from '../components/features/Navigation'
import santaImage from '../assets/Gemini_Generated_Image_3kcsmi3kcsmi3kcs-removebg-preview.png'

export default function LandingPage() {
  return (
    <div className="landing-container">
      <Navigation />
      <Snowflakes />
      
      <div className="landing-content">
        {/* Left Section: Image */}
        <div className="landing-image-section">
          <img 
            src={santaImage} 
            alt="ChrisCandle" 
            className="landing-image"
          />
        </div>

        {/* Right Section: Title and Description */}
        <div className="landing-text-section">
          <h1 className="logo-title">ChrisCandle</h1>
          <p className="tagline">A festive Secret Santa app</p>
          <div className="cta-buttons">
            <Link to="/join" className="cta-button">
              🎁 Join Event
            </Link>
            <Link to="/signup" className="cta-button">
              ✨ Organize Event
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .landing-container {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #8B0000 0%, #A52A2A 50%, #8B0000 100%);
          overflow-x: hidden;
        }

        .landing-container > nav {
          position: relative;
          z-index: 100;
        }

        .snowflakes {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0.15;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.4) 2px, transparent 2px),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.4) 2px, transparent 2px),
            radial-gradient(circle at 40% 60%, rgba(255, 215, 0, 0.3) 3px, transparent 3px),
            radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.3) 2px, transparent 2px),
            radial-gradient(circle at 15% 80%, rgba(255, 215, 0, 0.4) 2px, transparent 2px),
            radial-gradient(circle at 90% 50%, rgba(255, 255, 255, 0.4) 3px, transparent 3px);
          background-size: 200px 200px, 250px 250px, 180px 180px, 220px 220px, 190px 190px, 210px 210px;
          background-position: 0 0, 40px 60px, 130px 270px, 70px 100px, 150px 50px, 90px 180px;
          animation: snowfall 20s linear infinite;
        }

        @keyframes snowfall {
          0% {
            background-position: 0 0, 40px 60px, 130px 270px, 70px 100px, 150px 50px, 90px 180px;
          }
          100% {
            background-position: 0 600px, 40px 660px, 130px 870px, 70px 700px, 150px 650px, 90px 780px;
          }
        }

        .snowflake-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .snowflake {
          position: absolute;
          top: -10px;
          font-size: 4em;
          opacity: 1 !important;
          animation: fall linear infinite;
          filter: brightness(0) invert(1) drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.8)) !important;
          color: transparent !important;
          font-weight: bold !important;
        }

        .snowflake.gold {
          filter: brightness(0) saturate(100%) invert(77%) sepia(100%) saturate(10000%) hue-rotate(0deg) drop-shadow(0 0 8px rgba(255, 215, 0, 1)) drop-shadow(0 0 12px rgba(255, 215, 0, 0.8)) !important;
          color: transparent !important;
          font-weight: bold !important;
        }

        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }

        .landing-content {
          display: flex;
          align-items: center;
          justify-content: center;
          max-width: 1400px;
          width: 90%;
          gap: 60px;
          position: relative;
          z-index: 10;
          padding: 40px;
          margin: auto;
          flex: 1;
        }

        .landing-image-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .landing-image {
          max-width: 100%;
          height: auto;
          max-height: 600px;
          object-fit: contain;
          position: relative;
          z-index: 1;
          border-radius: 50% 20% 50% 20%;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(255, 215, 0, 0.3),
            inset 0 0 20px rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          padding: 20px;
          transform: perspective(1000px) rotateY(-5deg);
          transition: transform 0.3s ease;
        }

        .landing-image:hover {
          transform: perspective(1000px) rotateY(0deg) scale(1.02);
        }

        .landing-text-section {
          flex: 1;
          text-align: left;
          padding: 40px;
        }

        .logo-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 5em;
          font-weight: bold;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
          filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.4));
          letter-spacing: 2px;
        }

        .tagline {
          font-size: 1.5em;
          color: #FFFFFF;
          font-weight: 300;
          letter-spacing: 1px;
          text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5);
          margin-bottom: 30px;
        }

        .cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
          margin-top: 20px;
        }

        .cta-button {
          display: inline-block;
          padding: 16px 48px;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #8B0000;
          text-decoration: none;
          font-size: 1.2em;
          font-weight: bold;
          border-radius: 50px;
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
          transition: all 0.3s ease;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 215, 0, 0.6);
        }


        @media (max-width: 1024px) {
          .landing-content {
            flex-direction: column;
            gap: 40px;
            margin-top: 40px;
          }

          .landing-text-section {
            text-align: center;
          }

          .logo-title {
            font-size: 3.5em;
          }

          .landing-image {
            max-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .logo-title {
            font-size: 2.5em;
          }

          .tagline {
            font-size: 1.2em;
          }

          .landing-image {
            max-height: 300px;
          }

          .cta-buttons {
            flex-direction: column;
            width: 100%;
            align-items: stretch;
          }

          .cta-button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}
