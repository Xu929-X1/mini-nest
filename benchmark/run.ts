import autocannon from 'autocannon';
import { exec, ChildProcess, execSync } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const sleep = promisify(setTimeout);

// ============================================
// Configuration
// ============================================

interface ServerConfig {
    name: string;
    script: string;
    port: number;
}

interface BenchmarkResult {
    server: string;
    route: string;
    requests: number;
    throughput: number;
    latencyAvg: number;
    latencyP50: number;
    latencyP99: number;
    errors: number;
}

// 使用绝对路径
const ROOT = resolve(__dirname, '..');

const SERVERS: ServerConfig[] = [
    { name: 'mini-nest-express', script: resolve(ROOT, 'benchmark/servers/mini-nest-express.ts'), port: 3000 },
    { name: 'mini-nest-fastify', script: resolve(ROOT, 'benchmark/servers/mini-nest-fastify.ts'), port: 3001 },
    { name: 'express', script: resolve(ROOT, 'benchmark/servers/express.ts'), port: 3002 },
    { name: 'fastify', script: resolve(ROOT, 'benchmark/servers/fastify.ts'), port: 3003 },

];

const ROUTES = [
    { path: '/', name: 'Hello World' },
    { path: '/json', name: 'JSON' },
    { path: '/users/123', name: 'Route Params' },
    { path: '/users/123/profile', name: 'DI + Service' },
];

const DURATION = 10; // seconds
const CONNECTIONS = 100;
const PIPELINING = 10;

// ============================================
// Server Management
// ============================================

async function startServer(config: ServerConfig): Promise<ChildProcess> {
    const command = `npx ts-node "${config.script}"`;

    const proc = exec(command, {
        env: { ...process.env, PORT: String(config.port) },
        cwd: ROOT,
    });

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            stopServer(proc);
            reject(new Error(`Server ${config.name} failed to start within 10s`));
        }, 10000);

        proc.stdout?.on('data', (data) => {
            const msg = data.toString();
            console.log(`   [${config.name}] ${msg.trim()}`);
            if (msg.includes('running on') || msg.includes('listening')) {
                clearTimeout(timeout);
                resolve(proc);
            }
        });

        proc.stderr?.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg && !msg.includes('ExperimentalWarning') && !msg.includes('DeprecationWarning')) {
                console.error(`   [${config.name}] ERROR: ${msg}`);
            }
        });

        proc.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        proc.on('exit', (code) => {
            if (code !== null && code !== 0) {
                clearTimeout(timeout);
                reject(new Error(`Server ${config.name} exited with code ${code}`));
            }
        });
    });
}

function stopServer(proc: ChildProcess): void {
    if (process.platform === 'win32') {
        if (proc.pid) {
            try {
                execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
            } catch {
                proc.kill();
            }
        }
    } else {
        proc.kill('SIGTERM');
    }
}

// ============================================
// Benchmark
// ============================================

async function runBenchmark(
    url: string,
    duration: number = DURATION
): Promise<autocannon.Result> {
    return new Promise((resolve, reject) => {
        const instance = autocannon({
            url,
            duration,
            connections: CONNECTIONS,
            pipelining: PIPELINING,
        }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });

        autocannon.track(instance, { renderProgressBar: false });
    });
}

// ============================================
// Results Formatting
// ============================================

function formatResults(results: BenchmarkResult[]): void {
    console.log('\n' + '='.repeat(100));
    console.log('BENCHMARK RESULTS');
    console.log('='.repeat(100));

    const routes = [...new Set(results.map(r => r.route))];

    for (const route of routes) {
        console.log(`\n📊 ${route}`);
        console.log('-'.repeat(90));
        console.log(
            '| Server      | Req/sec    | Throughput  | Avg (ms) | P50 (ms) | P99 (ms) | Errors |'
        );
        console.log('-'.repeat(90));

        const routeResults = results
            .filter(r => r.route === route)
            .sort((a, b) => b.requests - a.requests);

        for (const r of routeResults) {
            const reqSec = r.requests.toLocaleString().padStart(10);
            const throughput = `${(r.throughput / 1024 / 1024).toFixed(2)} MB/s`.padStart(11);
            const avg = r.latencyAvg.toFixed(2).padStart(8);
            const p50 = r.latencyP50.toFixed(2).padStart(8);
            const p99 = r.latencyP99.toFixed(2).padStart(8);
            const errors = String(r.errors).padStart(6);
            const name = r.server.padEnd(11);

            console.log(`| ${name} | ${reqSec} | ${throughput} | ${avg} | ${p50} | ${p99} | ${errors} |`);
        }
        console.log('-'.repeat(90));
    }

    console.log('\n📈 SUMMARY (by total requests)');
    console.log('-'.repeat(50));

    const serverTotals = SERVERS.map(s => ({
        name: s.name,
        total: results.filter(r => r.server === s.name).reduce((sum, r) => sum + r.requests, 0),
    })).sort((a, b) => b.total - a.total);

    const maxTotal = serverTotals[0]?.total || 1;

    for (const s of serverTotals) {
        const bar = '█'.repeat(Math.round((s.total / maxTotal) * 30));
        const pct = ((s.total / maxTotal) * 100).toFixed(1);
        console.log(`${s.name.padEnd(12)} ${bar} ${s.total.toLocaleString()} (${pct}%)`);
    }

    console.log('\n');
}

// ============================================
// Main
// ============================================

async function main() {
    console.log('🚀 Mini-Nest Benchmark Suite');
    console.log(`   Duration: ${DURATION}s | Connections: ${CONNECTIONS} | Pipelining: ${PIPELINING}`);
    console.log(`   Platform: ${process.platform}`);
    console.log('');

    const results: BenchmarkResult[] = [];

    for (const server of SERVERS) {
        console.log(`\n🔧 Starting ${server.name}...`);

        let proc: ChildProcess | null = null;

        try {
            proc = await startServer(server);
            await sleep(1500);

            for (const route of ROUTES) {
                const url = `http://localhost:${server.port}${route.path}`;
                console.log(`   ⏱️  Testing ${route.name} (${route.path})...`);

                const result = await runBenchmark(url);

                results.push({
                    server: server.name,
                    route: route.name,
                    requests: result.requests.total,
                    throughput: result.throughput.total,
                    latencyAvg: result.latency.average,
                    latencyP50: result.latency.p50,
                    latencyP99: result.latency.p99,
                    errors: result.errors,
                });

                await sleep(500);
            }

            console.log(`   ✅ ${server.name} completed`);
        } catch (err) {
            console.error(`   ❌ Error with ${server.name}:`, err);
        } finally {
            if (proc) {
                stopServer(proc);
                await sleep(1000);
            }
        }
    }

    if (results.length > 0) {
        formatResults(results);
    } else {
        console.log('\n❌ No results collected. Check server startup errors above.');
    }
}

main().catch(console.error);