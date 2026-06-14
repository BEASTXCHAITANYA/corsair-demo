import { instance } from "@/server/corsair";

export function getTenant() {
  const tenantId = process.env.TENANT_ID ?? "dev";
  return instance.tenant(tenantId);
}