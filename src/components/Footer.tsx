import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50 bg-card/30">
      <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-accent">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-gradient">ShadowShelf</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            A reader platform for licensed, original, and creator-submitted manga, manhwa, manhua, and novels.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/browse" className="hover:text-foreground">Browse</Link></li>
            <li><Link to="/search" className="hover:text-foreground">Search</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">About</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/dmca" className="hover:text-foreground">DMCA / Copyright</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/50">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ShadowShelf. Original & licensed content only.
        </div>
      </div>
    </footer>
  );
}