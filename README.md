# Internet Speed Checker

A small command-line tool that measures download performance by making **10 sequential HTTP GET requests** to the provided URL. Each request is considered complete only after the entire response body has been read.

## Requirements

- Node.js 18 or newer (uses the built-in `fetch` API).
- No external dependencies.

## Run

```bash
npm start -- https://example.com/large-image.jpg
```

Or run the script directly:

```bash
node src/index.js https://example.com/large-image.jpg
```

Replace the example URL with a publicly accessible file or image URL. The endpoint should return a reasonably large response to make the measurement more representative.

## Output

For each request, the tool prints the elapsed time and downloaded size. At the end, it prints:

- average request time;
- total downloaded data across all successful requests;
- total time spent downloading;
- average download speed.

**Speed unit:** MB/s (megabytes per second), where 1 MB = 1,000,000 bytes. Downloaded sizes are displayed in decimal KB/MB using the same base.

The average speed is calculated as total downloaded bytes divided by the sum of the 10 request durations. Requests are sequential, so no downloads overlap.

## Notes

- Only `http://` and `https://` URLs are accepted.
- Each request has a 30-second timeout.
- If a request fails or returns a non-2xx HTTP status, the run stops and the error is printed.
- The tool counts bytes from the response body actually read, rather than relying on the `Content-Length` header.
