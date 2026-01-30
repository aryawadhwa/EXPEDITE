interface GeneratingLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function GeneratingLoader({ text = "Generating", size = "md" }: GeneratingLoaderProps) {
  const sizeClasses = {
    sm: "w-32 h-32 text-sm",
    md: "w-44 h-44 text-lg",
    lg: "w-56 h-56 text-xl"
  };

  return (
    <div className={`loader-wrapper ${sizeClasses[size]}`}>
      {text.split('').map((letter, index) => (
        <span 
          key={index} 
          className="loader-letter"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {letter}
        </span>
      ))}
      <div className="loader" />
    </div>
  );
}
