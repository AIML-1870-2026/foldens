/* ============================================================
   events.js — Pub/sub event bus
   No game logic lives here — pure messaging only.
   ============================================================

   API:
     Events.on(event, cb)      — subscribe
     Events.off(event, cb)     — unsubscribe
     Events.emit(event, data)  — publish
*/

const Events = (() => {
  const listeners = {};

  function on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  }

  function off(event, cb) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(fn => fn !== cb);
  }

  function emit(event, data) {
    if (!listeners[event]) return;
    listeners[event].forEach(fn => fn(data));
  }

  return { on, off, emit };
})();
