import chalk from "chalk";

class Log {
    static error(msg: string, source?: string) {
        console.error(chalk.blue(`[ERROR]${source ? ' [' + source + ']' : ''}`) + chalk.red(msg));
    }

    static info(msg: string, source?: string) {
        console.log(chalk.blue(`[INFO]${source ? ' [' + source + ']' : ''}`) + chalk.green(msg));
    }

    static warn(msg: string, source?: string) {
        console.warn(chalk.blue(`[WARN]${source ? ' [' + source + ']' : ''}`) + chalk.yellow(msg));
    }
}

export { Log };