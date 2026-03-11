import { useState, useEffect, useCallback } from 'react';
import {
  getChores,
  createChore,
  updateChore,
  archiveChore,
  restoreChore,
  type Chore,
  type CreateChoreDto,
  type UpdateChoreDto,
} from '../api/chores';
import { setRotation } from '../api/rotation';
import CreateChoreModal from '../components/CreateChoreModal';

const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  custom: 'Custom',
  once: 'One-time',
};

export default function ChoresPage() {
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  const fetchChores = useCallback(async () => {
    try {
      const params =
        tab === 'active' ? { active: true } : { archived: true };
      const data = await getChores(params);
      setChores(data);
      setError('');
    } catch {
      setError('Failed to load chores');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    fetchChores();
  }, [fetchChores]);

  async function handleSave(
    dto: CreateChoreDto | UpdateChoreDto,
    rotationChildIds?: string[],
  ) {
    if (editingChore) {
      const updated = await updateChore(editingChore.id, dto);
      if (rotationChildIds?.length) {
        await setRotation(updated.id, rotationChildIds);
      }
    } else {
      const created = await createChore(dto as CreateChoreDto);
      if (rotationChildIds?.length) {
        await setRotation(created.id, rotationChildIds);
      }
    }
    await fetchChores();
  }

  async function handleArchive(id: string) {
    try {
      await archiveChore(id);
      await fetchChores();
    } catch {
      setError('Failed to archive chore');
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreChore(id);
      await fetchChores();
    } catch {
      setError('Failed to restore chore');
    }
  }

  function openCreate() {
    setEditingChore(null);
    setShowModal(true);
  }

  function openEdit(chore: Chore) {
    setEditingChore(chore);
    setShowModal(true);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Chores</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + New Chore
        </button>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'active'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setTab('archived')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'archived'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Archived
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>
      ) : chores.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">
            {tab === 'active'
              ? 'No active chores yet. Create one to get started!'
              : 'No archived chores.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chores.map((chore) => (
            <div
              key={chore.id}
              className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => openEdit(chore)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {chore.title}
                    </h3>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {RECURRENCE_LABELS[chore.recurrence_type] ??
                        chore.recurrence_type}
                    </span>
                    {chore.approval_required && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        Approval
                      </span>
                    )}
                  </div>
                  {chore.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {chore.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-indigo-600">
                      {chore.points} pts
                    </span>
                    {chore.assigned_child_name && (
                      <span>Assigned to {chore.assigned_child_name}</span>
                    )}
                    {chore.assignment_mode === 'rotation' && (
                      <span className="text-purple-600">Rotation</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {tab === 'active' ? (
                    <button
                      onClick={() => handleArchive(chore.id)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      Archive
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(chore.id)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateChoreModal
          onClose={() => {
            setShowModal(false);
            setEditingChore(null);
          }}
          onSave={handleSave}
          chore={editingChore}
        />
      )}
    </div>
  );
}
