import { notFound } from "next/navigation";
import { DriverDetail } from "@/components/admin/driver-detail";
import { getDriverDetails } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-6">
        <div className="max-w-md rounded-xl border border-[#E4E7EC] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-[#101828]">Database connection required</h1>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Driver detail records are available once Neon is connected to this environment.
          </p>
          <a href="/admin" className="mt-5 inline-flex rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white">
            Back to CRM
          </a>
        </div>
      </main>
    );
  }

  const data = await getDriverDetails(id);
  if (!data) notFound();

  return (
    <DriverDetail
      initialDriver={data.driver}
      trips={data.trips}
      activity={data.activity}
    />
  );
}
