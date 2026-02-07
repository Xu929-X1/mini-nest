import chalk from "chalk";

class Log {
    static error(msg: string, source?: string) {
        console.error(chalk.red(`[ERROR]${source ? ' [' + source + ']' : ''}\n`) + chalk.red(msg));
    }

    static info(msg: string, source?: string) {
        console.log(chalk.green(`[INFO]${source ? ' [' + source + ']' : ''}`) + chalk.white(msg));
    }

    static warn(msg: string, source?: string) {
        console.warn(chalk.yellow(`[WARN]${source ? ' [' + source + ']' : ''}\n`) + chalk.yellow(msg));
    }
}

export { Log };