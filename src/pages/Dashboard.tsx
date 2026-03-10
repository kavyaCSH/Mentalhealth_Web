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
            // Fallback dashboard or loading state
            return <PatientDashboard />;
    }
};

export default Dashboard;
