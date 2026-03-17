import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProfilePage from './pages/shared/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { getCurrentUser } from './features/auth/store/authSlice';
import type { AppDispatch, RootState } from './store';
import SchedulePage from './pages/patient/SchedulePage';
import AssessmentCenter from './pages/patient/AssessmentCenter';
import QuestionnairePage from './pages/patient/QuestionnairePage';
import HistoryPage from './pages/patient/HistoryPage';
import AssessmentResultPage from './pages/patient/AssessmentResultPage';
import SharedNotificationsPage from './pages/shared/NotificationsPage';
import PatientHealthRecords from './pages/patient/PatientHealthRecords';
import PatientTreatmentView from './pages/patient/PatientTreatmentView';
import HelpCenter from './pages/patient/HelpCenter';
import HelpArticle from './pages/patient/HelpArticle';
import EditProfilePage from './pages/shared/EditProfilePage';
import PatientDirectory from './pages/clinical/PatientDirectory';
import PatientRecord from './pages/clinical/PatientRecord';
import Health from './pages/clinical/Health';
import ChiefComplaint from './pages/clinical/chief-complaint/ChiefComplaint';
import AddChiefComplaint from './pages/clinical/chief-complaint/AddChiefComplaint';
import EditChiefComplaint from './pages/clinical/chief-complaint/EditChiefComplaint';
import ChiefComplaintDetail from './pages/clinical/chief-complaint/ChiefComplaintDetail';
import HPIPage from './pages/clinical/hpi/HPIHistory'; // Renamed from HPIHistory
import HPIDetail from './pages/clinical/hpi/HPIDetail';
import AddHPI from './pages/clinical/hpi/AddHPI';
import EditHPI from './pages/clinical/hpi/EditHPI';
import MseAssessmentPage from './pages/clinical/mse/MSEPage'; // Renamed from MSEPage
import PastHistoryPage from './pages/clinical/past-history/PastHistoryPage';
import RosAssessmentPage from './pages/clinical/ros/ROSList'; // Renamed from ROSList
import AddROS from './pages/clinical/ros/AddROS';
import ROSDetail from './pages/clinical/ros/ROSDetail';
import EditROS from './pages/clinical/ros/EditROS';
import Teleconsult from './pages/clinical/Teleconsult';
import MessagesPortal from './pages/clinical/MessagesPortal';
import ClinicalAssessmentCenter from './pages/clinical/ClinicalAssessmentCenter';
import UserList from './pages/admin/UserList';
import CreateUser from './pages/admin/CreateUser';
import CreateConsultation from './pages/hospital/CreateConsultation';
import StatisticsPage from './pages/patient/StatisticsPage';
import SpecialistsPage from './pages/patient/SpecialistsPage';
import StaffDirectory from './pages/hospital/StaffDirectory';
import FacilityStatus from './pages/hospital/FacilityStatus';
import BillingCentral from './pages/hospital/BillingCentral';
import TaxCodeManagement from './pages/hospital/TaxCodeManagement';
import Transactions from './pages/shared/Transactions';
import UserManagement from './pages/shared/UserManagement';
import TreatmentPlanPage from './pages/clinical/treatment/TreatmentPlanPage';
import InitializeTreatmentPage from './pages/clinical/treatment/InitializeTreatmentPage';
import ClinicalRecordsHub from './pages/clinical/ClinicalRecordsHub';
import ClinicalSchedulePage from './pages/clinical/ClinicalSchedulePage';

const AppRouter = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !user) {
            dispatch(getCurrentUser());
        }
    }, [dispatch, user]);

    if (isLoading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FBFA]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Hydrating Clinical Session...</p>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route
                    path="/login"
                    element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/register"
                    element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/forgot-password"
                    element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/reset-password/:token"
                    element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/" replace />}
                />

                {/* Protected Routes */}
                <Route path="/*" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Routes>
                                <Route index element={<Dashboard />} />
                                <Route path="profile" element={<ProfilePage />} />
                                <Route path="profile/edit" element={<EditProfilePage />} />
                                <Route path="notifications" element={<SharedNotificationsPage />} />

                                {/* Patient Portal Routes */}
                                <Route element={<ProtectedRoute allowedGroup="PATIENT" />}>
                                    <Route path="schedule" element={<SchedulePage />} />
                                    <Route path="appointments" element={<Navigate to="/schedule" replace />} />
                                    <Route path="history" element={<HistoryPage />} />
                                    <Route path="history/:id" element={<AssessmentResultPage />} />
                                    <Route path="statistics" element={<StatisticsPage />} />
                                    <Route path="specialists" element={<SpecialistsPage />} />
                                    <Route path="records" element={<PatientHealthRecords />} />
                                    <Route path="records/chief-complaint" element={<ChiefComplaint />} />
                                    <Route path="records/chief-complaint/new" element={<AddChiefComplaint />} />
                                    <Route path="records/chief-complaint/:ccId" element={<ChiefComplaintDetail />} />
                                    <Route path="records/chief-complaint/edit/:ccId" element={<EditChiefComplaint />} />
                                    <Route path="treatment" element={<PatientTreatmentView />} />
                                    <Route path="help" element={<HelpCenter />} />
                                    <Route path="help/article/:slug" element={<HelpArticle />} />
                                </Route>

                                {/* Shared Clinical/Teleconsult Routes */}
                                <Route path="teleconsult/:id?" element={<Teleconsult />} />
                                <Route path="assessments" element={<AssessmentCenter />} />
                                <Route path="assessments/:categoryId" element={<QuestionnairePage />} />
                                <Route path="patients/:patientId" element={<PatientRecord />} />
                                <Route path="patients/:patientId/health" element={<Health />} />
                                <Route path="patients/:patientId/chief-complaint" element={<ChiefComplaint />} />
                                <Route path="patients/:patientId/chief-complaint/new" element={<AddChiefComplaint />} />
                                <Route path="patients/:patientId/chief-complaint/:ccId" element={<ChiefComplaintDetail />} />
                                <Route path="patients/:patientId/chief-complaint/edit/:ccId" element={<EditChiefComplaint />} />
                                <Route path="patients/:patientId/hpi/new" element={<AddHPI />} />
                                <Route path="patients/:patientId/hpi/edit/:hpiId" element={<EditHPI />} />
                                <Route path="patients/:patientId/hpi/:hpiId" element={<HPIDetail />} />
                                <Route path="patients/:patientId/hpi" element={<HPIPage />} />
                                <Route path="patients/:patientId/mse/:mseId?" element={<MseAssessmentPage />} />
                                <Route path="patients/:patientId/past-history/:historyId?" element={<PastHistoryPage />} />
                                <Route path="patients/:patientId/ros" element={<RosAssessmentPage />} />
                                <Route path="patients/:patientId/ros/new" element={<AddROS />} />
                                <Route path="patients/:patientId/ros/:rosId" element={<ROSDetail />} />
                                <Route path="patients/:patientId/ros/edit/:rosId" element={<EditROS />} />
                                <Route path="patients/:patientId/treatment" element={<TreatmentPlanPage />} />
                                <Route path="patients/:patientId/treatment/new" element={<InitializeTreatmentPage />} />
                                <Route path="clinical/assessments" element={<ClinicalAssessmentCenter />} />
                                <Route path="transactions" element={<Transactions />} />
                                <Route path="users/:id/edit" element={<UserManagement />} />

                                {/* Secure Clinical Portal Routes */}
                                <Route element={<ProtectedRoute allowedGroup="CLINICAL" />}>
                                    <Route path="patients" element={<PatientDirectory />} />
                                    <Route path="clinical-schedule" element={<ClinicalSchedulePage />} />
                                    <Route path="patients/:patientId/clinical-hub" element={<ClinicalRecordsHub />} />
                                    <Route path="messages" element={<MessagesPortal />} />
                                </Route>


                                {/* Hospital Portal Routes */}
                                <Route element={<ProtectedRoute allowedGroup="HOSPITAL" />}>
                                    <Route path="facility" element={<FacilityStatus />} />
                                    <Route path="staff" element={<StaffDirectory />} />
                                    <Route path="staff/new" element={<UserManagement />} />
                                    <Route path="billing" element={<BillingCentral />} />
                                    <Route path="tax" element={<TaxCodeManagement />} />
                                    <Route path="consultations/new" element={<CreateConsultation />} />
                                </Route>

                                {/* Admin Portal Routes */}
                                <Route path="admin" element={<ProtectedRoute allowedGroup="ADMIN" />}>
                                    <Route path="users" element={<UserList />} />
                                    <Route path="users/new" element={<CreateUser />} />
                                    <Route path="consultations/new" element={<CreateConsultation />} />
                                </Route>

                                {/* 404 handler within layout */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </MainLayout>
                    </ProtectedRoute>
                } />

                {/* Global Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter; 
