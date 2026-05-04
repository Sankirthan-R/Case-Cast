import { motion } from "framer-motion";
import { Database } from "lucide-react";

/**
 * LogsPage — Audit history of all past predictions.
 */
export default function LogsPage({ historyItems, onRefresh }) {
  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8"
    >
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Search Logs</h2>
          <p className="text-slate-400 mt-2">Historical inference data and prediction payloads.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-mono">Total Records: {historyItems.length}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 rounded-full hover:bg-cyan-900/20 transition-all"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!historyItems.length ? (
        <div className="text-center p-16 glass-card border-dashed flex flex-col items-center gap-4">
          <Database className="w-16 h-16 text-slate-700" />
          <p className="text-slate-400 text-lg">No audit records found.</p>
          <p className="text-slate-600 text-sm">Run a prediction to see it logged here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {historyItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] ${item.outcome?.includes("High") ? "bg-rose-500" :
                      item.outcome?.includes("Moderate") ? "bg-amber-500" :
                        "bg-emerald-500"
                      }`}
                  />
                  <span className="font-display font-semibold text-lg text-white">{item.outcome}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                  <span><b className="text-slate-200">{item.age}</b> yrs</span>
                  <span><b className="text-slate-200">{item.sex}</b></span>
                  <span><b className="text-slate-200">{item.priorOffenses}</b> Priors</span>
                  <span>Jail: <b className="text-slate-200">{item.jailDurationDays}</b>d</span>
                  <span className="text-slate-600 capitalize">[{item.source}]</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-mono text-cyan-400">{Math.round(item.confidence || 0)}%</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Confidence</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
