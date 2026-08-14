'use client';

import {
  Database,
  HardDrive,
  Mail,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server,
  Layers,
  Cpu,
} from 'lucide-react';

interface ActuatorHealthViewProps {
  rawDetails: string | null;
}

interface ComponentDetail {
  status: string;
  details?: Record<string, any>;
}

interface ActuatorResponse {
  status?: string;
  components?: Record<string, ComponentDetail>;
  groups?: string[];
}

export default function ActuatorHealthView({ rawDetails }: ActuatorHealthViewProps) {
  if (!rawDetails) return null;

  let parsed: ActuatorResponse | null = null;
  try {
    if (rawDetails.trim().startsWith('{')) {
      parsed = JSON.parse(rawDetails);
    }
  } catch {
    return null;
  }

  if (!parsed || !parsed.components) {
    return null;
  }

  const components = Object.entries(parsed.components);

  if (components.length === 0) return null;

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const getComponentIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('db') || lower.includes('database') || lower.includes('datasource')) {
      return <Database className="w-4 h-4 text-blue-600" />;
    }
    if (lower.includes('disk') || lower.includes('space') || lower.includes('storage')) {
      return <HardDrive className="w-4 h-4 text-amber-600" />;
    }
    if (lower.includes('mail') || lower.includes('smtp') || lower.includes('email')) {
      return <Mail className="w-4 h-4 text-rose-600" />;
    }
    if (lower.includes('ssl') || lower.includes('cert') || lower.includes('tls')) {
      return <Shield className="w-4 h-4 text-emerald-600" />;
    }
    if (lower.includes('live') || lower.includes('ready') || lower.includes('state')) {
      return <Layers className="w-4 h-4 text-indigo-600" />;
    }
    return <Server className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="pro-card p-6 sm:p-7 mb-8 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Spring Boot Actuator Subsystem Health</h3>
            <p className="text-xs text-slate-500">Live breakdown of individual backend services from <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px]">/actuator/health</code></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Overall State:</span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              parsed.status === 'UP'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {parsed.status || 'UNKNOWN'}
          </span>
        </div>
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {components.map(([name, comp]) => {
          const isUp = comp.status === 'UP';
          const isDown = comp.status === 'DOWN';
          const details = comp.details || {};

          return (
            <div
              key={name}
              className={`p-4 rounded-2xl border transition-all ${
                isDown
                  ? 'bg-rose-50/50 border-rose-200 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                    {getComponentIcon(name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 capitalize">{name}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">Component</span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    isUp
                      ? 'bg-emerald-100 text-emerald-800'
                      : isDown
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isUp ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                  {comp.status}
                </span>
              </div>

              {/* Component Specific Details */}
              <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-200/60 font-mono">
                {name === 'db' && details.database && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Engine:</span>
                      <span className="font-semibold text-slate-800">{details.database}</span>
                    </div>
                    {details.validationQuery && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Query:</span>
                        <span className="text-slate-700">{details.validationQuery}</span>
                      </div>
                    )}
                  </>
                )}

                {name === 'diskSpace' && details.total && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Free Space:</span>
                      <span className="font-semibold text-slate-800">
                        {formatBytes(details.free)} / {formatBytes(details.total)}
                      </span>
                    </div>
                    {/* Disk Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, ((details.total - details.free) / details.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </>
                )}

                {name === 'mail' && details.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Host:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{details.location}</span>
                  </div>
                )}

                {/* Error message display */}
                {details.error && (
                  <div className="p-2 rounded-lg bg-rose-100/80 border border-rose-200 text-rose-800 text-[11px] font-sans leading-tight mt-2 break-words">
                    <strong className="block font-semibold mb-0.5">Failure Diagnostic:</strong>
                    {details.error}
                  </div>
                )}

                {/* Generic details if other properties exist */}
                {Object.keys(details).length === 0 && (
                  <div className="text-[11px] text-slate-400 font-sans">
                    Subsystem reporting healthy status without diagnostic errors.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
