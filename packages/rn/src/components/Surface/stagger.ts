/**
 * How far apart two regions changing at once are pulled.
 *
 * Two surfaces committing in the same tick are not perceived as two
 * changes, they are perceived as the app blinking. A tenth of a second
 * between them makes them two legible events, and is short enough that
 * nobody waits for it.
 */
export const STAGGER_MS = 100;

const batch = new Map<symbol, number>();
let scheduled = false;

/**
 * Take a place in the current batch, and get back how long to wait.
 *
 * Module level and not a context, because the batch is a moment rather
 * than a place: two surfaces that commit in the same tick are staggered
 * whether or not they share a parent, and one that commits alone waits
 * for nothing.
 *
 * **Keyed by the surface, not by the call.** A region that changes three
 * times in a tick is one region and keeps one slot; otherwise the delay
 * accumulates and the third change arrives a third of a second late for
 * no reason. The stagger separates regions from each other, not a region
 * from its own past.
 *
 * The batch clears on the next microtask, which is the end of the tick
 * as far as React is concerned: everything that reacted to the same
 * state change has already asked by then.
 *
 * @internal
 */
export function claimStaggerSlot(surface: symbol): number {
  const held = batch.get(surface);
  if (held !== undefined) return held * STAGGER_MS;

  const slot = batch.size;
  batch.set(surface, slot);

  if (!scheduled) {
    scheduled = true;
    void Promise.resolve().then(() => {
      batch.clear();
      scheduled = false;
    });
  }

  return slot * STAGGER_MS;
}

/** Test seam: forget the current batch. @internal */
export function resetStagger(): void {
  batch.clear();
  scheduled = false;
}
