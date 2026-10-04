import { notFound } from "next/navigation";
import { PassengerDetail } from "@/components/admin/passenger-detail";
import { getPassengerDetails } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function PassengerPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!isDatabaseConfigured())return <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-6"><a className="rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white" href="/admin">Connect Neon to view passenger records</a></main>;const data=await getPassengerDetails(id);if(!data)notFound();return <PassengerDetail initialPassenger={data.passenger} bookings={data.bookings} payments={data.payments} activity={data.activity}/>;}
