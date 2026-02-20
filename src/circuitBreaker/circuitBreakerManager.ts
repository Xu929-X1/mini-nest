type CircuitState = "Open" | "CLOSED" | "HALF_OPEN";

interface CircuitBreakerState {
    circuitState: CircuitState;
    failures: number;
    lastFailureTimeStamp: number;
}

interface CircuitBreakerReason {
    reason?: string;
    allowed: boolean;
}

class CircuitBreakerManager {
    private state = new Map<string, CircuitBreakerState>();

    getState(key: string): CircuitBreakerState {
        let state = this.state.get(key);
        if (!state) {
            state = {
                circuitState: "CLOSED",
                failures: 0,
                lastFailureTimeStamp: 0
            }
        }
        return state;
    }

    recordSuccess(key: string): void {
        const state = this.getState(key);
        state.circuitState = "CLOSED";
        state.failures = 0;
    }

    recordFailure(key: string, threshold: number): void {
        const state = this.getState(key);
        state.failures++;
        state.lastFailureTimeStamp = Date.now();

        if (state.failures >= threshold) {
            state.circuitState = "Open";
        }

    }

    canExecute(key: string, resetTimeout: number): CircuitBreakerReason {
        const state = this.getState(key);

        if (state.circuitState === "CLOSED") {
            return {
                allowed: true
            }
        }

        if (state.circuitState === "Open") {
            const elapsedTime = Date.now() - state.lastFailureTimeStamp;
            if (elapsedTime >= resetTimeout) {
                state.circuitState = "HALF_OPEN";
                return { allowed: true }
            }

            return {
                allowed: false,
                reason: `Circuit open, retry after ${resetTimeout - elapsedTime}ms`
            }
        }

        return {
            allowed: true
        }
    }

    clear() {
        this.state.clear();
    }
}

export const circuitBreakerManager = new CircuitBreakerManager();