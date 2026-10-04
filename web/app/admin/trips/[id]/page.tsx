import { notFound } from "next/navigation";
import { TripDetail } from "@/components/admin/trip-detail";
import { getTripDetails } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function TripPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!isDatabaseConfigured())return <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-6"><a className="rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white" href="/admin">Connect Neon to view trip records</a></main>;const data=await getTripDetails(id);if(!data)notFound();return <TripDetail initialTrip={data.trip} bookings={data.bookings} safetyCases={data.safetyCases} activity={data.activity}/>;}
