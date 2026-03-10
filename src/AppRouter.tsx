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
import NotificationsPage from './pages/patient/NotificationsPage';
import PatientDirectory from './pages/clinical/PatientDirectory';
import PatientRecord from './pages/clinical/PatientRecord';
import Health from './pages/clinical/Health';
import ChiefComplaint from './pages/clinical/ChiefComplaint';
import Teleconsult from './pages/clinical/Teleconsult';
import MessagesPortal from './pages/clinical/MessagesPortal';
import HealthRecords from './pages/clinical/HealthRecords';
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

                                {/* Patient Portal Routes */}
                                <Route element={<ProtectedRoute allowedGroup="PATIENT" />}>
                                    <Route path="schedule" element={<SchedulePage />} />
                                    <Route path="appointments" element={<Navigate to="/schedule" replace />} />
                                    <Route path="assessments" element={<AssessmentCenter />} />
                                    <Route path="assessments/:categoryId" element={<QuestionnairePage />} />
                                    <Route path="history" element={<HistoryPage />} />
                                    <Route path="history/:id" element={<AssessmentResultPage />} />
                                    <Route path="notifications" element={<NotificationsPage />} />
                                    <Route path="statistics" element={<StatisticsPage />} />
                                    <Route path="specialists" element={<SpecialistsPage />} />
                                </Route>

                                {/* Clinical Portal Routes */}
                                <Route element={<ProtectedRoute allowedGroup="CLINICAL" />}>
                                    <Route path="patients" element={<PatientDirectory />} />
                                    <Route path="patients/:id" element={<PatientRecord />} />
                                    <Route path="patients" element={<PatientDirectory />} />
                                    <Route path="patients/:id" element={<PatientRecord />} />
                                    <Route path="messages" element={<MessagesPortal />} />
                                    <Route path="records" element={<HealthRecords />} />
                                    {/* Clinical roles might also need access to assessments for reference or conducting them */}
                                    <Route path="assessments" element={<AssessmentCenter />} />
                                    <Route path="clinical/assessments" element={<ClinicalAssessmentCenter />} />
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

                                {/* Shared Shared/Teleconsult Routes */}
                                <Route path="teleconsult/:id?" element={<Teleconsult />} />
                                <Route path="patients/:id/health" element={<Health />} />
                                <Route path="patients/:id/chief-complaint" element={<ChiefComplaint />} />
                                <Route path="transactions" element={<Transactions />} />
                                <Route path="users/:id/edit" element={<UserManagement />} />

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
