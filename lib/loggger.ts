import { formatError } from "./error";
import { Err, Result, exhaust, filterErr } from "./utils";

export function formatErr<T>(results: Result<T>[]): string {
  return filterErr(results).map(formatError).join("\n");
}

export function formatPromisedErr<T>(
  promises: PromiseSettledResult<Result<T>>[]
): string {
  return promises
    .map((promise) => {
      switch (promise.status) {
        case "rejected":
          console.error(promise);
          return `Promise rejected: ${promise.reason}`;
        case "fulfilled": {
          const result = promise.value;

          if (!result.ok) {
            return formatError(result.error);
          }

          return null;
        }
        default:
          return exhaust(promise);
      }
    })
    .filter((value) => value != null)
    .join("\n");
}

export function logError(err: Err): void {
  console.error(formatError(err.error));
}

export function logFailedPromisedResults(
  promises: PromiseSettledResult<Result<unknown>>[]
): void {
  const err = formatPromisedErr(promises);

  if (err) {
    console.error(err);
  }
}
