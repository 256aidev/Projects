import { useState } from 'react';

interface RejectModalProps {
  choreTitle: string;
  childName: string;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

export default function RejectModal({
  choreTitle,
  childName,
  onSubmit,
  onCancel,
}: RejectModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">
          Reject Chore
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Rejecting <span className="font-medium">{choreTitle}</span> for{' '}
          <span className="font-medium">{childName}</span>
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)"
          rows={3}
          className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason)}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
