function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err) {
  if (!err) return true;
  const status = err.status;
  if (status == null) return true;
  return status >= 500 || status === 429;
}

/**
 * Retry transient API failures while the UI stays in a loading state.
 */
export async function fetchWithRetry(
  fn,
  {
    retries = 4,
    initialDelayMs = 800,
    backoff = 1.4,
  } = {}
) {
  let lastError;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= retries || !isRetryableError(err)) {
        throw err;
      }
      await sleep(delay);
      delay = Math.round(delay * backoff);
    }
  }

  throw lastError;
}
