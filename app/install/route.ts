const INSTALL_SCRIPT_URL =
  "https://raw.githubusercontent.com/shivships/remux-cli/main/install.sh";

export async function GET() {
  const res = await fetch(INSTALL_SCRIPT_URL);
  const script = await res.text();

  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, max-age=300",
    },
  });
}
