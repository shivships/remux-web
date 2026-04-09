import { InstallCommand } from "@/components/install-command"

const LOGO = `
██████╗ ███████╗███╗   ███╗██╗   ██╗██╗  ██╗
██╔══██╗██╔════╝████╗ ████║██║   ██║╚██╗██╔╝
██████╔╝█████╗  ██╔████╔██║██║   ██║ ╚███╔╝
██╔══██╗██╔══╝  ██║╚██╔╝██║██║   ██║ ██╔██╗
██║  ██║███████╗██║ ╚═╝ ██║╚██████╔╝██╔╝ ██╗
╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝
`

export default function Page() {
  return (
    <div className="h-full overflow-y-auto bg-background font-mono text-foreground">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-6 py-16">
        <main className="flex-1">
          <header>
            <pre
              aria-label="remux"
              role="img"
              style={{
                fontFamily:
                  'ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace',
              }}
              className="w-fit text-[10px] leading-none text-foreground sm:text-sm md:text-base lg:text-lg"
            >
              {LOGO}
            </pre>
          </header>

          <section id="install" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight">
              Easy install anywhere
            </h2>
            <div className="mt-4">
              <InstallCommand />
            </div>
          </section>

          <p className="mt-6 text-sm leading-relaxed">
            Run{" "}
            <kbd className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[0.85em] font-medium">
              remux
            </kbd>
            to stream your terminal to any browser. Access from your phone with a mobile optimized interface with full control for apps like claude code. No accounts, no ports, no setup.
          </p>

          <div className="mt-8 aspect-[16/10] w-full rounded-md border border-border bg-muted" />

          <section className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight">Features</h2>
            <ul className="mt-4 ml-5 list-disc space-y-1 text-sm leading-relaxed">
              <li>Free and open source</li>
              <li>Real PTY &mdash; vim, htop, Claude Code, everything works</li>
              <li>Full fidelity &mdash; true color, Unicode, mouse, resize</li>
              <li>Any device &mdash; any modern browser, desktop or phone</li>
              <li>Fast &mdash; low latency, even on cellular</li>
              <li>Tiny &mdash; single static Rust binary</li>
            </ul>
          </section>
        </main>

        <footer className="mt-16 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} remux</span>
          <nav className="flex items-center gap-2">
            <a href="#" className="hover:text-foreground">
              Home
            </a>
            <span>|</span>
            <span>github</span>
          </nav>
        </footer>
      </div>
    </div>
  )
}
