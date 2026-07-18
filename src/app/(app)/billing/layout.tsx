import { BillingSideNav } from "@/components/billing/BillingSideNav";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full w-full flex-col gap-8 p-6 lg:flex-row lg:gap-10 lg:p-10">
      <BillingSideNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
