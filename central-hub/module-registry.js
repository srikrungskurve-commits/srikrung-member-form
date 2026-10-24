// SRIKRUNG CENTRAL HUB — DEMO registry (no production endpoints)
export const modules = Object.freeze([
  { id: "benefits", label: "ลงทะเบียนรับสิทธิประโยชน์", enabled: true, roles: ["customer", "member", "admin"], dataDomain: "member" },
  { id: "member-registration", label: "สมัครสมาชิก / แก้ไขข้อมูลสมาชิก", enabled: true, roles: ["customer", "member", "admin"], dataDomain: "member" },
  { id: "vehicle", label: "ข้อมูลรถยนต์", enabled: true, roles: ["member", "admin"], dataDomain: "insurance" },
  { id: "accident-insurance", label: "ประกันอุบัติเหตุ", enabled: false, roles: ["member", "admin"], dataDomain: "insurance" }
]);
export function visibleModules(role) {
  return modules.filter(item => item.enabled && item.roles.includes(role));
}
// Display filtering is only UX. A server MUST independently enforce permission checks.
