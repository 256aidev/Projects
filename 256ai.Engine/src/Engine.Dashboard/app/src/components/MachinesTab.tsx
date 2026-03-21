import type { Machine, Worker } from '../types';
import MachineCard from './MachineCard';

interface MachinesTabProps {
  machines: Machine[];
  workers: Worker[];
}

export default function MachinesTab({ machines, workers }: MachinesTabProps) {
  if (machines.length === 0) {
    return (
      <div className="bg-[#1e293b] rounded-lg p-12 border border-slate-700/50 text-center text-slate-500">
        No machines registered
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {machines.map((m) => (
        <MachineCard key={m.machineId} machine={m} workers={workers} />
      ))}
    </div>
  );
}
