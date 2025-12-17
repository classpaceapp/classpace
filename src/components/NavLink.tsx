import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

/**
 * SEO-friendly navigation link component
 * Uses real <a> tags for crawlability while maintaining SPA navigation
 */
export const NavLink = ({ to, children, className, external }: NavLinkProps) => {
  if (external) {
    return (
      <a 
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
};

/**
 * Footer navigation link with consistent styling
 */
export const FooterLink = ({ to, children, className }: NavLinkProps) => (
  <Link 
    to={to} 
    className={cn(
      "text-sm md:text-lg font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 block",
      className
    )}
  >
    {children}
  </Link>
);

export default NavLink;
