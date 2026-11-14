import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkOrder } from "./fieldservice_key_rotation.ts";

test("a dispatched work order must carry a photo and technician follow-up", () => {
  const order = validateWorkOrder({
    workOrderId: "WO-1042",
    dispatchStatus: "assigned",
    photoUrls: ["https://example.com/photo.jpg"],
    technicianFollowUp: "Call the site manager tomorrow"
  });
  assert.equal(order.dispatchStatus, "assigned");
  assert.equal(order.photoUrls.length, 1);
  assert.throws(() => validateWorkOrder({ ...order, technicianFollowUp: "" }));
});
