import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import PatientDashboard from './dashboards/PatientDashboard';
import PractitionerDashboard from './dashboards/PractitionerDashboard';
import HospitalDashboard from './dashboards/HospitalDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

const Dashboard = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const role = user?.role;

    // Switch case for different role-based dashboards
    switch (role) {
        case 'super_admin':
        case 'admin':
            return <AdminDashboard />;

        case 'hospital':
            return <HospitalDashboard />;

        case 'psychiatrist':
        case 'psychologist':
        case 'nurse':
        case 'social_worker':
        case 'counselor':
            return <PractitionerDashboard />;

        case 'patient':
            return <PatientDashboard />;

        default:
            // neutral loading state while role is being determined
            return (
                <div className="min-h-[80vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-muted opacity-80 font-bold text-xs uppercase tracking-widest">Synchronizing Dashboard...</p>
                    </div>
                </div>
            );
    }
};

export default Dashboard;
