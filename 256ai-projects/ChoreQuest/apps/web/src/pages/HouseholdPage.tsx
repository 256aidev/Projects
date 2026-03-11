import { useState, useEffect, useCallback } from 'react';
import {
  getHousehold,
  updateSettings,
  getMembers,
  type Household,
  type HouseholdMember,
} from '../api/household';
import { addChild, updateChild, deactivateChild } from '../api/children';
import Avatar from '../components/Avatar';

interface ChildModalState {
  open: boolean;
  editing: HouseholdMember | null;
}

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6',
];

export default function HouseholdPage() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Settings form state
  const [defaultApproval, setDefaultApproval] = useState(false);
  const [pointsEnabled, setPointsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Child modal
  const [childModal, setChildModal] = useState<ChildModalState>({
    open: false,
    editing: null,
  });
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(8);
  const [childColor, setChildColor] = useState(AVATAR_COLORS[0]);
  const [childSaving, setChildSaving] = useState(false);

  // Deactivate confirm
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [h, m] = await Promise.all([getHousehold(), getMembers()]);
      setHousehold(h);
      setMembers(m);
      setDefaultApproval(h.settings.default_approval_required);
      setPointsEnabled(h.settings.points_enabled);
      setRemindersEnabled(h.settings.reminders_enabled);
      setError('');
    } catch {
      setError('Failed to load household data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const childMembers = members.filter((m) => m.role === 'child');

  async function handleSaveSettings() {
    setSettingsSaving(true);
    setSettingsMsg('');
    try {
      const updated = await updateSettings({
        default_approval_required: defaultApproval,
        points_enabled: pointsEnabled,
        reminders_enabled: remindersEnabled,
      });
      setHousehold(updated);
      setSettingsMsg('Settings saved');
      setTimeout(() => setSettingsMsg(''), 2000);
    } catch {
      setSettingsMsg('Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  }

  function openAddChild() {
    setChildName('');
    setChildAge(8);
    setChildColor(AVATAR_COLORS[0]);
    setChildModal({ open: true, editing: null });
  }

  function openEditChild(member: HouseholdMember) {
    setChildName(member.display_name);
    setChildAge(member.age ?? 8);
    setChildColor(member.avatar_color ?? AVATAR_COLORS[0]);
    setChildModal({ open: true, editing: member });
  }

  async function handleSaveChild(e: React.FormEvent) {
    e.preventDefault();
    if (!childName.trim()) return;
    setChildSaving(true);
    try {
      if (childModal.editing) {
        await updateChild(childModal.editing.id, {
          name: childName.trim(),
          avatar_color: childColor,
          age: childAge,
        });
      } else {
        await addChild({
          name: childName.trim(),
          avatar_color: childColor,
          age: childAge,
        });
      }
      setChildModal({ open: false, editing: null });
      await fetchData();
    } catch {
      setError('Failed to save child');
    } finally {
      setChildSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateChild(id);
      setDeactivatingId(null);
      await fetchData();
    } catch {
      setError('Failed to deactivate child');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl bg-gray-200"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Household</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Household Info */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          {household?.name}
        </h2>
        <p className="text-sm text-gray-500">
          Timezone: {household?.timezone}
        </p>
      </div>

      {/* Children Section */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Children</h2>
          <button
            onClick={openAddChild}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Add Child
          </button>
        </div>

        {childMembers.length === 0 ? (
          <p className="text-sm text-gray-500">
            No children added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {childMembers.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={child.display_name}
                    color={child.avatar_color}
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {child.display_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Age {child.age ?? '—'}
                      {!child.is_active && (
                        <span className="ml-2 text-red-500">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditChild(child)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  {child.is_active && (
                    <>
                      {deactivatingId === child.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-600">
                            Confirm?
                          </span>
                          <button
                            onClick={() => handleDeactivate(child.id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeactivatingId(null)}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeactivatingId(child.id)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Deactivate
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Settings
        </h2>

        <div className="space-y-4">
          <ToggleRow
            label="Default approval required"
            value={defaultApproval}
            onChange={setDefaultApproval}
          />
          <ToggleRow
            label="Points system enabled"
            value={pointsEnabled}
            onChange={setPointsEnabled}
          />
          <ToggleRow
            label="Reminders enabled"
            value={remindersEnabled}
            onChange={setRemindersEnabled}
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSaveSettings}
            disabled={settingsSaving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {settingsSaving ? 'Saving...' : 'Save Settings'}
          </button>
          {settingsMsg && (
            <span
              className={`text-sm ${settingsMsg.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}
            >
              {settingsMsg}
            </span>
          )}
        </div>
      </div>

      {/* Add/Edit Child Modal */}
      {childModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              {childModal.editing ? 'Edit Child' : 'Add Child'}
            </h2>
            <form onSubmit={handleSaveChild} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  placeholder="Child's name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  type="number"
                  value={childAge}
                  onChange={(e) => setChildAge(Number(e.target.value))}
                  min={1}
                  max={18}
                  className="w-24 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Avatar Color
                </label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setChildColor(color)}
                      className={`h-8 w-8 rounded-full transition ${
                        childColor === color
                          ? 'ring-2 ring-indigo-500 ring-offset-2'
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setChildModal({ open: false, editing: null })
                  }
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={childSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {childSaving
                    ? 'Saving...'
                    : childModal.editing
                      ? 'Update'
                      : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${
          value ? 'bg-indigo-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
