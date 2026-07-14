import { ObdAdapter } from "@/types";
import { MockObdAdapter } from "./mockAdapter";
import { Elm327BleAdapter, isBleAvailable } from "./elm327BleAdapter";

export { MockObdAdapter } from "./mockAdapter";
export { Elm327BleAdapter, isBleAvailable } from "./elm327BleAdapter";

/**
 * Returns a real BLE ELM327 adapter when native BLE support is present
 * (i.e. running from a custom dev client, not Expo Go), otherwise falls
 * back to the simulated adapter so the app remains fully demoable.
 */
export function createObdAdapter(): ObdAdapter {
  if (isBleAvailable()) {
    return new Elm327BleAdapter();
  }
  return new MockObdAdapter();
}
