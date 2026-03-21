import type { Machine, Worker } from '../types';
import { tryParseJson } from '../utils';

interface MachineCardProps {
  machine: Machine;
  workers: Worker[];
}

export default function MachineCard({ machine, workers }: MachineCardProps) {
  const services = (tryParseJson(machine.servicesJson) || []) as { name: string; port: number }[];
  const workerIds = (tryParseJson(machine.workerIdsJson) || []) as string[];
  const domains = (tryParseJson(machine.domainsJson) || []) as string[];

  const machineWorkers = workers.filter((w) => workerIds.includes(w.workerId));

  return (
    <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700/50 transition-data">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{machine.displayName}</h3>
          <div className="text-sm text-slate-400">{machine.hostname}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {machine.alwaysOn && (
            <span className="w-2 h-2 rounded-full bg-green-500" title="Always On" />
          )}
          {!machine.alwaysOn && (
            <span className="w-2 h-2 rounded-full bg-gray-500" title="Not Always On" />
          )}
        </div>
      </div>

      {/* IP & Meta */}
      <div className="text-xs text-slate-500 mb-3">IP: {machine.ipAddress}</div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">
          {machine.os}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          machine.role === 'coordinator'
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        }`}>
          {machine.role}
        </span>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-1.5">Services</div>
          <div className="space-y-1">
            {services.map((s, i) => (
              <div key={i} className="text-xs flex items-center justify-between bg-slate-800/50 rounded px-2 py-1">
                <span className="text-slate-300">{s.name}</span>
                <span className="text-slate-500">:{s.port}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workers */}
      {workerIds.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-1.5">Workers ({machineWorkers.length})</div>
          <div className="space-y-1">
            {workerIds.map((wId) => {
              const w = machineWorkers.find((mw) => mw.workerId === wId);
              return (
                <div key={wId} className="text-xs flex items-center gap-2 bg-slate-800/50 rounded px-2 py-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${w?.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-slate-300 truncate">{wId}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Domains */}
      {domains.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-1.5">Domains</div>
          <div className="flex flex-wrap gap-1">
            {domains.map((d) => (
              <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
