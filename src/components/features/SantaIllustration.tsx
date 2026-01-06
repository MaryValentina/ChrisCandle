interface SantaIllustrationProps {
  variant?: 'present' | 'shush'
}

export default function SantaIllustration({ variant = 'present' }: SantaIllustrationProps) {
  return (
    <div className="santa-illustration">
      <div className="santa">
        <div className="santa-hat">
          <div className="hat-pom"></div>
        </div>
        <div className="hat-trim"></div>
        <div className="santa-head">
          <div className="beard"></div>
        </div>
        <div className="santa-body"></div>
        <div className="belt">
          <div className="buckle"></div>
        </div>
        {variant === 'present' && (
          <div className="present">
            <div className="ribbon-v"></div>
            <div className="ribbon-h"></div>
            <div className="bow"></div>
          </div>
        )}
        {variant === 'shush' && (
          <div className="shush-hand">
            <div className="finger"></div>
          </div>
        )}
      </div>
    </div>
  )
}


