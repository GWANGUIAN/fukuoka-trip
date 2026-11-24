import type { Status } from '../data/types';
import { STATUS_LABEL } from '../lib/labels';

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return <span className={`badge ${status}`}>{label ?? STATUS_LABEL[status]}</span>;
}
