import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const CATEGORIES = ['All', 'Web', 'Mobile', 'AI/ML', 'CLI', 'Game', 'API', 'Data', 'DevOps'];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
  // Authentication temporarily disabled
  setUser(null);
}, []);

  const currentCategory = new URLSearchParams(location.search).get('category') || 'All';
  const isExplorePage = location.pathname === '/';

  const handleCategoryClick = (cat) => {
    const params = cat === 'All' ? '' : `?category=${cat}`;
    navigate(`/${params}`);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Idea<span className="text-primary">Forge</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">

            <Link to="/saved">
              <Button
                variant={location.pathname === '/saved' ? 'secondary' : 'ghost'}
                size="sm"
                className={`gap-2 ${location.pathname === '/saved' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <BookMarked className="w-4 h-4" />
                <span className="hidden sm:inline">My Projects</span>
              </Button>
            </Link>
            {user && (
              <span className="text-sm text-muted-foreground hidden md:block truncate max-w-[140px]">
                {user.full_name || user.email}
              </span>
            )}
            
          </div>
        </div>

        {/* Category nav row — only on explore page */}
        {isExplorePage && (
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                  currentCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
