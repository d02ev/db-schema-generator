import winston, { format } from "winston";
import { Console } from "winston/lib/winston/transports";

const { combine, timestamp, colorize, printf } = format;
const logger = winston.createLogger({
  format: combine(
    colorize({
      all: true,
    }),
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss A",
    }),
    printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [new Console()],
});

export default logger;