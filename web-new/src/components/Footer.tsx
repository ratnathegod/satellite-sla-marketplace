export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2025 SatSLA. Decentralized satellite tasking marketplace.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href="https://github.com/ratnathegod/satellite-sla-marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="/events"
              className="hover:text-foreground transition-colors"
            >
              Events
            </a>
            <a
              href="/dev"
              className="hover:text-foreground transition-colors"
            >
              Dev Tools
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
