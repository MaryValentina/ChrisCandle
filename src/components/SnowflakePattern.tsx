const SnowflakePattern = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="snowflake-pattern"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            {/* Main snowflake */}
            <g fill="none" stroke="hsl(43, 56%, 52%)" strokeWidth="0.5" opacity="0.6">
              <path d="M50 10 L50 90" />
              <path d="M10 50 L90 50" />
              <path d="M22 22 L78 78" />
              <path d="M78 22 L22 78" />
              {/* Branches */}
              <path d="M50 25 L45 30 M50 25 L55 30" />
              <path d="M50 75 L45 70 M50 75 L55 70" />
              <path d="M25 50 L30 45 M25 50 L30 55" />
              <path d="M75 50 L70 45 M75 50 L70 55" />
            </g>
            {/* Small accent dots */}
            <circle cx="50" cy="50" r="3" fill="hsl(43, 56%, 52%)" opacity="0.3" />
            <circle cx="50" cy="20" r="1.5" fill="hsl(0, 0%, 98%)" opacity="0.4" />
            <circle cx="50" cy="80" r="1.5" fill="hsl(0, 0%, 98%)" opacity="0.4" />
            <circle cx="20" cy="50" r="1.5" fill="hsl(0, 0%, 98%)" opacity="0.4" />
            <circle cx="80" cy="50" r="1.5" fill="hsl(0, 0%, 98%)" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#snowflake-pattern)" />
      </svg>
    </div>
  );
};

export default SnowflakePattern;


