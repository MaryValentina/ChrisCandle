import { useState, useEffect } from 'react'

export default function ReindeerMascot() {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Using Unsplash Source API (no authentication needed for basic usage)
    // Search for reindeer images
    const fetchReindeerImage = async () => {
      try {
        setIsLoading(true)
        setError(false)
        
        // Using Unsplash Source API with a curated reindeer image
        // You can also use: https://source.unsplash.com/featured/?reindeer
        // Or use a direct free image URL
        const url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&q=80'
        
        // Test if image loads
        const img = new Image()
        img.onload = () => {
          setImageUrl(url)
          setIsLoading(false)
        }
        img.onerror = () => {
          // Fallback to a placeholder or emoji
          setError(true)
          setIsLoading(false)
        }
        img.src = url
      } catch (err) {
        setError(true)
        setIsLoading(false)
      }
    }

    fetchReindeerImage()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-6xl">🦌</span>
        </div>
      </div>
    )
  }

  if (error || !imageUrl) {
    // Fallback to emoji reindeer
    return (
      <div className="flex items-center justify-center">
        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
          <span className="text-8xl animate-bounce">🦌</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
        <img
          src={imageUrl}
          alt="Reindeer Mascot"
          className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-2xl relative z-10 transform hover:scale-110 transition-transform duration-300"
          onError={() => {
            setError(true)
            setImageUrl('')
          }}
        />
        {/* Decorative sparkles */}
        <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
        <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse delay-300">⭐</div>
      </div>
    </div>
  )
}

