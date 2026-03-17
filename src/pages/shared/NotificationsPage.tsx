import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import PatientNotificationsPage from '../patient/NotificationsPage';
import ClinicalNotificationsPage from '../clinical/NotificationsPage';

const NotificationsPage = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const role = user?.role;

    // Check if user is clinical (multiple roles possible)
    const isClinical = [
        'psychiatrist',
        'psychologist',
        'nurse',
        'social_worker',
        'counselor'
    ].includes(role || '');

    if (isClinical) {
        return <ClinicalNotificationsPage />;
    }

    // Default to patient view for patients (and potentially other roles if they have notifications)
    return <PatientNotificationsPage />;
};

export default NotificationsPage;
