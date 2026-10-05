export type RecoveryClient = {
  rPopLPush(source: string, destination: string): Promise<string | null>;
};

export async function recoverInFlightJobs(
  client: RecoveryClient,
  readyQueue: string,
  processingQueue: string,
  maxJobs = 1000,
): Promise<number> {
  let recovered = 0;
  while (recovered < maxJobs) {
    const raw = await client.rPopLPush(processingQueue, readyQueue);
    if (!raw) break;
    recovered += 1;
  }
  return recovered;
}
