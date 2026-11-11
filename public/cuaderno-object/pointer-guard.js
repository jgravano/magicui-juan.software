// Keep gesture arbitration independent from rendering and browser capture APIs.
// Rejected contacts remain rejected until lifted, even after Pencil leaves.
export function createPointerGuard({ cooldown = 350 } = {}) {
  const active = new Map();
  const ignored = new Set();
  const palmCooldown = Number.isFinite(cooldown) ? Math.max(0, cooldown) : 350;
  let penId = null, touchBlockedUntil = -Infinity;
  const typeOf = event => event.pointerType || 'mouse';
  const result = (accepted, penTookOver = false) => ({ accepted, penTookOver });

  function down(event, now) {
    const id = event.pointerId, type = typeOf(event);
    if (ignored.has(id)) return result(false);
    if (penId !== null && id !== penId) {
      ignored.add(id);
      return result(false);
    }
    if (type === 'touch' && now < touchBlockedUntil) {
      ignored.add(id);
      return result(false);
    }
    if (type === 'pen') {
      let penTookOver = false;
      for (const otherId of active.keys()) {
        if (otherId === id) continue;
        ignored.add(otherId);
        active.delete(otherId);
        penTookOver = true;
      }
      penId = id;
      active.set(id, type);
      return result(true, penTookOver);
    }
    active.set(id, type);
    return result(true);
  }

  function move(event, now) {
    const id = event.pointerId, type = typeOf(event);
    if (ignored.has(id)) return false;
    if (penId !== null) return id === penId;
    if (type === 'touch') return active.get(id) === 'touch' && now >= touchBlockedUntil;
    // Hover feedback is useful before the next Pencil or mouse stroke begins.
    return true;
  }

  function end(event, now) {
    const id = event.pointerId;
    if (ignored.delete(id)) {
      active.delete(id);
      return false;
    }
    if (!active.has(id)) return false;
    active.delete(id);
    if (id === penId) {
      penId = null;
      touchBlockedUntil = now + palmCooldown;
      return true;
    }
    // An unrelated pointer cannot finish an active Pencil stroke.
    return penId === null;
  }

  function reset() {
    active.clear();
    ignored.clear();
    penId = null;
    touchBlockedUntil = -Infinity;
  }

  return { down, move, end, isPenActive: () => penId !== null, reset };
}
