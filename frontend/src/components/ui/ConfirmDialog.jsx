import Modal from './Modal';

export default function ConfirmDialog({ open, title, message, confirmText = 'Confirm', danger, loading, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
          {loading ? 'Please wait...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
