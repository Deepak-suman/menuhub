import { EventEmitter } from "events";

if (!global.orderEvents) {
  global.orderEvents = new EventEmitter();
  // Allow a high number of concurrent tracking listeners
  global.orderEvents.setMaxListeners(200);
}

export const orderEvents = global.orderEvents;
