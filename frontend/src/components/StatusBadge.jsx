const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  'in-progress': 'bg-sky-100 text-sky-800 border-sky-300',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'needs-info': 'bg-rose-100 text-rose-800 border-rose-300',
  rejected: 'bg-red-100 text-red-800 border-red-300'
};

const formatStatusLabel = (status) => {
  if (!status) {
    return 'unbekannt';
  }
  return status
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const StatusBadge = ({ status }) => {
  const key = status ?? 'pending';
  const style = STATUS_STYLES[key] || STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
      {formatStatusLabel(key)}
    </span>
  );
};

export default StatusBadge;
