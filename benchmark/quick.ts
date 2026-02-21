#!/usr/bin/env node

/**
 * Quick benchmark script - run individual servers manually
 * 
 * Usage:
 *   1. Start a server in one terminal:
 *      npx tsx benchmark/servers/mini-nest.ts
 *      npx tsx benchmark/servers/express.ts  
 *      npx tsx benchmark/servers/fastify.ts
 * 
 *   2. Run benchmark in another terminal:
 *      npx tsx benchmark/quick.ts 3000
 *      npx tsx benchmark/quick.ts 3001
 *      npx tsx benchmark/quick.ts 3002
 */

import autocannon from 'autocannon';

const PORT = process.argv[2] || '3000';
const DURATION = parseInt(process.argv[3] || '10');

const ROUTES = [
    '/',
    '/json',
    '/users/123',
    '/users/123/profile',
];

async function benchmark(url: string): Promise<autocannon.Result> {
    return new Promise((resolve, reject) => {
        const instance = autocannon({
            url,
            duration: DURATION,
            connections: 100,
            pipelining: 10,
        }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });

        autocannon.track(instance, { renderProgressBar: true });
    });
}

async function main() {
    console.log(`\n🎯 Benchmarking localhost:${PORT}`);
    console.log(`   Duration: ${DURATION}s\n`);

    for (const route of ROUTES) {
        const url = `http://localhost:${PORT}${route}`;
        console.log(`\n📊 ${route}`);
        console.log('-'.repeat(50));

        try {
            const result = await benchmark(url);
            
            console.log(`   Requests/sec: ${result.requests.average.toLocaleString()}`);
            console.log(`   Latency avg:  ${result.latency.average.toFixed(2)}ms`);
            console.log(`   Latency p99:  ${result.latency.p99.toFixed(2)}ms`);
            console.log(`   Throughput:   ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
            console.log(`   Errors:       ${result.errors}`);
        } catch (err) {
            console.error(`   ❌ Error:`, err);
        }
    }

    console.log('\n✅ Done!\n');
}

main();