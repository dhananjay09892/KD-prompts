
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen


DEFAULT_URLS = [
	"https://massive.com/docs/websocket/stocks/overview.md",
	"https://massive.com/docs/websocket/stocks/aggregates-per-minute.md",
	"https://massive.com/docs/websocket/stocks/aggregates-per-second.md",
	"https://massive.com/docs/websocket/stocks/trades.md",
	"https://massive.com/docs/websocket/stocks/quotes.md",
	"https://massive.com/docs/websocket/stocks/luld.md",
	"https://massive.com/docs/websocket/stocks/imbalances.md",
	"https://massive.com/docs/websocket/stocks/fair-market-value.md",
	"https://massive.com/docs/websocket/options/overview.md",
	"https://massive.com/docs/websocket/options/aggregates-per-minute.md",
	"https://massive.com/docs/websocket/options/aggregates-per-second.md",
	"https://massive.com/docs/websocket/options/trades.md",
	"https://massive.com/docs/websocket/options/quotes.md",
	"https://massive.com/docs/websocket/options/fair-market-value.md",
	"https://massive.com/docs/websocket/futures/overview.md",
	"https://massive.com/docs/websocket/futures/aggregates-per-minute.md",
	"https://massive.com/docs/websocket/futures/aggregates-per-second.md",
	"https://massive.com/docs/websocket/futures/trades.md",
	"https://massive.com/docs/websocket/futures/quotes.md",
	"https://massive.com/docs/websocket/indices/overview.md",
	"https://massive.com/docs/websocket/indices/aggregates-per-minute.md",
	"https://massive.com/docs/websocket/indices/aggregates-per-second.md",
	"https://massive.com/docs/websocket/indices/value.md",
	"https://massive.com/docs/websocket/forex/overview.md",
	"https://massive.com/docs/websocket/forex/aggregates-per-minute.md",
	"https://massive.com/docs/websocket/forex/aggregates-per-second.md",
	"https://massive.com/docs/websocket/forex/quotes.md",
	"https://massive.com/docs/websocket/forex/fair-market-value.md",
	"https://massive.com/docs/websocket/crypto/overview.md",
	"https://massive.com/docs/websocket/crypto/aggregates-per-minute.md",
	"https://massive.com/docs/websocket/crypto/aggregates-per-second.md",
	"https://massive.com/docs/websocket/crypto/trades.md",
	"https://massive.com/docs/websocket/crypto/quotes.md",
	"https://massive.com/docs/websocket/crypto/fair-market-value.md",
]


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(
		description="Download Markdown files and preserve their folder structure locally.",
	)
	parser.add_argument(
		"--input",
		type=Path,
		help="Text file containing Markdown URLs. Lines can be plain URLs or commented with '#'.",
	)
	parser.add_argument(
		"--output",
		type=Path,
		default=Path("downloads"),
		help="Directory where files will be saved.",
	)
	parser.add_argument(
		"--overwrite",
		action="store_true",
		help="Overwrite files if they already exist.",
	)
	parser.add_argument(
		"--timeout",
		type=int,
		default=30,
		help="HTTP timeout in seconds.",
	)
	return parser.parse_args()


def read_urls(input_file: Path | None) -> list[str]:
	if input_file is None:
		return DEFAULT_URLS.copy()

	urls: list[str] = []
	for raw_line in input_file.read_text(encoding="utf-8").splitlines():
		line = raw_line.strip()
		if not line:
			continue
		if line.startswith("#"):
			line = line[1:].strip()
		if line.startswith("http://") or line.startswith("https://"):
			urls.append(line)

	return urls


def build_output_path(url: str, output_root: Path) -> Path:
	parsed = urlparse(url)
	if not parsed.scheme or not parsed.netloc:
		raise ValueError(f"Invalid URL: {url}")
	if not parsed.path.endswith(".md"):
		raise ValueError(f"URL is not a Markdown file: {url}")

	relative_path = Path(parsed.netloc) / Path(unquote(parsed.path.lstrip("/")))
	return output_root / relative_path


def download_markdown(url: str, destination: Path, timeout: int, overwrite: bool) -> str:
	if destination.exists() and not overwrite:
		return f"skip  {destination}"

	destination.parent.mkdir(parents=True, exist_ok=True)
	request = Request(url, headers={"User-Agent": "markdown-downloader/1.0"})

	with urlopen(request, timeout=timeout) as response:
		content = response.read()

	destination.write_bytes(content)
	return f"saved {destination}"


def main() -> int:
	args = parse_args()
	try:
		urls = read_urls(args.input)
	except OSError as exc:
		print(f"Failed to read input file: {exc}", file=sys.stderr)
		return 1

	if not urls:
		print("No Markdown URLs found.", file=sys.stderr)
		return 1

	failures = 0
	for url in urls:
		try:
			destination = build_output_path(url, args.output)
			result = download_markdown(url, destination, args.timeout, args.overwrite)
			print(result)
		except (ValueError, HTTPError, URLError, OSError) as exc:
			failures += 1
			print(f"error {url} -> {exc}", file=sys.stderr)

	if failures:
		print(f"Completed with {failures} failure(s).", file=sys.stderr)
		return 1

	print(f"Downloaded {len(urls)} Markdown file(s) into {args.output}.")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())