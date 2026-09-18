import { redirect } from "next/navigation";

/** 访客统计已合并到概览 */
export default function StatsRedirectPage() {
  redirect("/admin");
}
