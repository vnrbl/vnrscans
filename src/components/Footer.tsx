import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-secondary/20">
      <div className="container mx-auto px-8 md:px-12 lg:px-16 py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Link to="/home" className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-violet-600">
              <span className="text-lg font-bold text-white">0V</span>
            </div>
            <span className="text-xl font-bold text-violet-600">
              0Verse
            </span>
          </Link>
          <p className="max-w-md text-sm text-muted-foreground">
            © {new Date().getFullYear()} 0Verse does not store any files on its servers, it only links to media which is hosted on 3rd party services.
          </p>
        </div>
      </div>
    </footer>
  );
}