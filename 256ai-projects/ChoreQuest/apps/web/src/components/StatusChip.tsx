const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  completed: 'bg-blue-100 text-blue-800',
  awaiting_approval: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  overdue: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  completed: 'Completed',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  overdue: 'Overdue',
};

interface StatusChipProps {
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
