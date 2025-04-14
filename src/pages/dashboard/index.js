import AdminDashboard from "../../dashboard/AdminDashboard";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <AdminDashboard />
        </ProtectedRoute>
    );
}
