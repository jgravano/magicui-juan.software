export function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-border">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Juan Gravano
        </p>
        <p className="text-xs text-muted-foreground">
          Built with care and attention to detail.
        </p>
      </div>
    </footer>
  )
}
