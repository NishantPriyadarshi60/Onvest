"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function InvestorTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Skeleton className="h-10 max-w-xs flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="ml-auto h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fund</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Accreditation</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 font-mono" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
