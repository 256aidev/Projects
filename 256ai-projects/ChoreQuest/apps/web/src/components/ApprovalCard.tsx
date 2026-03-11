import { useState } from 'react';
import type { PendingApproval } from '../api/dashboard';
import RejectModal from './RejectModal';

interface ApprovalCardProps {
  approval: PendingApproval;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export default function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      await onApprove(approval.id);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(reason: string) {
    setLoading(true);
    try {
      await onReject(approval.id, reason);
    } finally {
      setLoading(false);
      setShowRejectModal(false);
    }
  }

  const completedTime = new Date(approval.completed_at).toLocaleTimeString(
    [],
    { hour: '2-digit', minute: '2-digit' },
  );

  return (
    <>
      <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900">
            {approval.chore_title}
          </p>
          <p className="text-sm text-gray-500">
            {approval.child_name} &middot; completed {completedTime}
          </p>
          {approval.completion_note && (
            <p className="mt-1 truncate text-sm text-gray-400 italic">
              &ldquo;{approval.completion_note}&rdquo;
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700 transition hover:bg-green-200 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
            className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>

      {showRejectModal && (
        <RejectModal
          choreTitle={approval.chore_title}
          childName={approval.child_name}
          onSubmit={handleReject}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}
