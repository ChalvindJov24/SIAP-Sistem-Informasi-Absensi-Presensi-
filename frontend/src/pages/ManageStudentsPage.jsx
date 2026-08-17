import { useEffect, useState } from 'react';
import { listStudents, resetStudentPassword } from '../api/userApi.js';
import StudentListTable from '../components/password/StudentListTable.jsx';
import ResetPasswordConfirmModal from '../components/password/ResetPasswordConfirmModal.jsx';
import NewPasswordRevealModal from '../components/password/NewPasswordRevealModal.jsx';

export default function ManageStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmStudent, setConfirmStudent] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStudents() {
      try {
        const data = await listStudents();
        if (!cancelled) {
          setStudents(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Tidak bisa memuat daftar siswa. Coba lagi.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStudents();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConfirmReset() {
    if (!confirmStudent) return;

    setResetting(true);
    try {
      const result = await resetStudentPassword(confirmStudent.id);
      setConfirmStudent(null);
      setResetResult(result);
    } catch (err) {
      setError('Gagal reset kata sandi. Coba lagi.');
      setConfirmStudent(null);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas p-8">
      <div className="mx-auto w-full max-w-3xl">
        <p className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-ink">
          SIAK
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
          Kelola Siswa
        </h1>

        {error && (
          <p className="mt-4 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 font-mono text-sm uppercase tracking-[0.06em] text-ink/60">
            Memuat...
          </p>
        ) : (
          <div className="mt-8">
            <StudentListTable students={students} onReset={setConfirmStudent} />
          </div>
        )}
      </div>

      <ResetPasswordConfirmModal
        student={confirmStudent}
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmStudent(null)}
        loading={resetting}
      />

      <NewPasswordRevealModal result={resetResult} onClose={() => setResetResult(null)} />
    </div>
  );
}