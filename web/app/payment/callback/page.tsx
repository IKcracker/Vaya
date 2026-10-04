import Link from "next/link";

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-6 text-[#101828]">
      <div className="w-full max-w-md rounded-2xl border border-[#E4E7EC] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#ECFDF3] text-xl font-black text-[#12B76A]">
          ✓
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-[-.03em]">
          Payment submitted
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          Return to the Vaya app and tap “Check payment status”. Vaya confirms
          the transaction with Paystack before marking your booking as paid.
        </p>
        {reference ? (
          <div className="mt-5 rounded-lg bg-[#F2F4F7] px-3 py-2 text-xs font-semibold text-[#475467]">
            {reference}
          </div>
        ) : null}
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#1877F2] px-4 text-sm font-semibold text-white">
          Vaya home
        </Link>
      </div>
    </main>
  );
}
