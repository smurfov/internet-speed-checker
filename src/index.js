#!/usr/bin/env node

const { performance } = require('node:perf_hooks')

const REQUEST_COUNT = 10
const TIMEOUT_MS = 30_000
const BYTES_IN_MB = 1_000_000

async function downloadOnce(url, requestNumber) {
	const startedAt = performance.now()

	const response = await fetch(url, {
		signal: AbortSignal.timeout(TIMEOUT_MS),
		headers: {
			'User-Agent': 'internet-speed-checker/1.0',
		},
	})

	let bytesDownloaded = 0

	if (response.body) {
		const reader = response.body.getReader()

		try {
			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				bytesDownloaded += value.byteLength
			}
		} finally {
			reader.releaseLock()
		}
	}

	const durationMs = performance.now() - startedAt

	if (!response.ok) {
		throw new Error(
			`Request ${requestNumber}: HTTP ${response.status} ${response.statusText}`,
		)
	}

	return { durationMs, bytesDownloaded }
}

function formatBytes(bytes) {
	if (bytes >= BYTES_IN_MB) {
		return `${(bytes / BYTES_IN_MB).toFixed(2)} MB`
	}

	return `${(bytes / 1_000).toFixed(2)} KB`
}

async function main() {
	const input = process.argv[2]

	if (!input) {
		console.error('Usage: node src/index.js <url>')
		process.exitCode = 1
		return
	}

	let url

	try {
		url = new URL(input)
	} catch {
		console.error('Error: please provide a valid URL.')
		process.exitCode = 1
		return
	}

	if (!['http:', 'https:'].includes(url.protocol)) {
		console.error('Error: only HTTP and HTTPS URLs are supported.')
		process.exitCode = 1
		return
	}

	console.log(`Target: ${url.href}`)
	console.log(`Running ${REQUEST_COUNT} sequential requests...\n`)

	const results = []

	try {
		for (let i = 1; i <= REQUEST_COUNT; i += 1) {
			const result = await downloadOnce(url, i)
			results.push(result)

			console.log(
				`Request ${String(i)}: ` +
					`${result.durationMs.toFixed(2)} ms, ` +
					`${formatBytes(result.bytesDownloaded)}`,
			)

			if (i < REQUEST_COUNT) {
				console.log('Waiting 1 second before the next request...')
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}
	} catch (error) {
		console.error(`\nDownload failed: ${error.message}`)

		if (error.cause) {
			console.error(`Cause: ${error.cause.message}`)
		}

		process.exitCode = 1
	}

	const totalDurationMs = results.reduce(
		(total, result) => total + result.durationMs,
		0,
	)
	const totalBytes = results.reduce(
		(total, result) => total + result.bytesDownloaded,
		0,
	)
	const averageDurationMs = totalDurationMs / results.length
	const averageSpeedMBps = totalBytes / (totalDurationMs / 1_000) / BYTES_IN_MB

	console.log('\n--- Summary ---')
	console.log(`Completed requests: ${results.length}/${REQUEST_COUNT}`)
	console.log(`Average request time: ${averageDurationMs.toFixed(2)} ms`)
	console.log(`Total downloaded: ${formatBytes(totalBytes)}`)
	console.log(`Total download time: ${(totalDurationMs / 1_000).toFixed(2)} s`)
	console.log(`Average download speed: ${averageSpeedMBps.toFixed(2)} MB/s`)
}

main()

