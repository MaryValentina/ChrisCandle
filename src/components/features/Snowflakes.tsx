import { useEffect, useRef } from 'react'

export default function Snowflakes() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create animated snowflakes
    function createSnowflake() {
      if (!container) return
      
      const snowflake = document.createElement('div')
      snowflake.classList.add('snowflake')
      snowflake.innerHTML = '❄'
      
      const isGold = Math.random() > 0.6
      if (isGold) {
        snowflake.classList.add('gold')
        snowflake.style.color = '#FFD700'
        snowflake.style.filter = 'drop-shadow(0 0 3px #FFD700)'
      } else {
        snowflake.style.color = '#FFFFFF'
        snowflake.style.filter = 'drop-shadow(0 0 3px #FFFFFF) brightness(1.2)'
      }
      
      snowflake.style.left = Math.random() * 100 + '%'
      snowflake.style.animationDuration = Math.random() * 3 + 5 + 's'
      snowflake.style.opacity = (Math.random() * 0.3 + 0.7).toString()
      snowflake.style.fontSize = (Math.random() * 2 + 3) + 'em'
      snowflake.style.textShadow = 'none'
      snowflake.style.fontWeight = 'bold'
      
      container.appendChild(snowflake)
      
      setTimeout(() => {
        snowflake.remove()
      }, 8000)
    }

    const interval = setInterval(createSnowflake, 300)

    // Create initial snowflakes
    for (let i = 0; i < 15; i++) {
      setTimeout(createSnowflake, i * 200)
    }

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      <div className="snowflakes"></div>
      <div ref={containerRef} className="snowflake-container"></div>
    </>
  )
}
