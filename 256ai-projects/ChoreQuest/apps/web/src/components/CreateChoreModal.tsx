import { useState, useEffect } from 'react';
import type { CreateChoreDto, UpdateChoreDto, Chore } from '../api/chores';
import type { HouseholdMember } from '../api/household';
import { getMembers } from '../api/household';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CreateChoreModalProps {
  onClose: () => void;
  onSave: (dto: CreateChoreDto | UpdateChoreDto, rotationChildIds?: string[]) => Promise<void>;
  chore?: Chore | null;
}

export default function CreateChoreModal({
  onClose,
  onSave,
  chore,
}: CreateChoreModalProps) {
  const isEditing = !!chore;

  const [title, setTitle] = useState(chore?.title ?? '');
  const [description, setDescription] = useState(chore?.description ?? '');
  const [points, setPoints] = useState(chore?.points ?? 10);
  const [recurrenceType, setRecurrenceType] = useState<
    'daily' | 'weekly' | 'custom' | 'once'
  >(chore?.recurrence_type ?? 'daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(
    chore?.recurrence_days ?? [],
  );
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'rotation'>(
    chore?.assignment_mode ?? 'single',
  );
  const [assignedChildId, setAssignedChildId] = useState(
    chore?.assigned_child_id ?? '',
  );
  const [rotationChildIds, setRotationChildIds] = useState<string[]>([]);
  const [approvalRequired, setApprovalRequired] = useState(
    chore?.approval_required ?? true,
  );

  const [children, setChildren] = useState<HouseholdMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMembers()
      .then((members) =>
        setChildren(members.filter((m) => m.role === 'child' && m.is_active)),
      )
      .catch(() => setError('Failed to load children'));
  }, []);

  function toggleDay(day: number) {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function toggleRotationChild(childId: string) {
    setRotationChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    const dto: CreateChoreDto = {
      title: title.trim(),
      description: description.trim() || undefined,
      points,
      recurrence_type: recurrenceType,
      recurrence_days:
        recurrenceType === 'weekly' || recurrenceType === 'custom'
          ? recurrenceDays
          : undefined,
      assignment_mode: assignmentMode,
      assigned_child_id:
        assignmentMode === 'single' && assignedChildId
          ? assignedChildId
          : undefined,
      approval_required: approvalRequired,
    };

    try {
      await onSave(dto, assignmentMode === 'rotation' ? rotationChildIds : undefined);
      onClose();
    } catch {
      setError('Failed to save chore');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Edit Chore' : 'New Chore'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              placeholder="e.g. Take out the trash"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              placeholder="Optional details..."
            />
          </div>

          {/* Points */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Points
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              min={0}
              className="w-32 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>

          {/* Recurrence */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Recurrence
            </label>
            <select
              value={recurrenceType}
              onChange={(e) =>
                setRecurrenceType(
                  e.target.value as 'daily' | 'weekly' | 'custom' | 'once',
                )
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
              <option value="once">One-time</option>
            </select>
          </div>

          {/* Day picker for weekly */}
          {recurrenceType === 'weekly' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Day of week
              </label>
              <div className="flex gap-1">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRecurrenceDays([i])}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      recurrenceDays.includes(i)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Multi-day picker for custom */}
          {recurrenceType === 'custom' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Days
              </label>
              <div className="flex gap-1">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      recurrenceDays.includes(i)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Mode */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Assignment
            </label>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setAssignmentMode('single')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  assignmentMode === 'single'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => setAssignmentMode('rotation')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  assignmentMode === 'rotation'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Rotation
              </button>
            </div>
          </div>

          {/* Child selector (Single mode) */}
          {assignmentMode === 'single' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Assigned to
              </label>
              <select
                value={assignedChildId}
                onChange={(e) => setAssignedChildId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              >
                <option value="">Select child...</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Child multi-select (Rotation mode) */}
          {assignmentMode === 'rotation' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Rotation group
              </label>
              <div className="space-y-2">
                {children.map((child) => (
                  <label
                    key={child.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 transition hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={rotationChildIds.includes(child.id)}
                      onChange={() => toggleRotationChild(child.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-900">
                      {child.display_name}
                    </span>
                  </label>
                ))}
                {children.length === 0 && (
                  <p className="text-sm text-gray-500">No children found</p>
                )}
              </div>
            </div>
          )}

          {/* Approval Required */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Approval required
            </label>
            <button
              type="button"
              onClick={() => setApprovalRequired(!approvalRequired)}
              className={`relative h-6 w-11 rounded-full transition ${
                approvalRequired ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  approvalRequired ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
