import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo = ({ size = 'md', showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Link href="/" className="flex items-center space-x-2 group">
      {/* Profile Image */}
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-600 group-hover:border-blue-500 transition-all duration-200`}>
        <Image
          src="/profile-logo.png"
          alt="Juelzs Profile"
          width={48}
          height={48}
          className="w-full h-full object-cover object-center scale-125"
        />
      </div>
      
            {/* Brand Name */}
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-white group-hover:text-blue-400 transition-colors duration-200`}>
          Juelzs
        </span>
      )}
    </Link>
  );
};

export default Logo; 