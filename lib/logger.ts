type LogContext = Record<string, unknown>;

function formatContext(context?: LogContext) {
  return context && Object.keys(context).length > 0 ? context : undefined;
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.info(message, formatContext(context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(message, formatContext(context));
  },
  error(message: string, context?: LogContext) {
    console.error(message, formatContext(context));
  },
};
