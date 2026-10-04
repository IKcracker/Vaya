import { notFound } from "next/navigation";
import { BookingDetail } from "@/components/admin/booking-detail";
import { getBookingDetails } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function BookingPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!isDatabaseConfigured())return <main className="grid min-h-screen place-items-center bg-[#F7F8FA] p-6"><a className="rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white" href="/admin">Connect Neon to view booking records</a></main>;const data=await getBookingDetails(id);if(!data)notFound();return <BookingDetail initialBooking={data.booking} passenger={data.passenger} trip={data.trip} payments={data.payments} activity={data.activity}/>;}
