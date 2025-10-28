import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { RoleSelector } from "@/components/documentation/RoleSelector";
import { StudentDocumentation } from "@/components/documentation/StudentDocumentation";
import { TeacherDocumentation } from "@/components/documentation/TeacherDocumentation";

const Documentation = () => {
  const { profile } = useAuth();
  const userRole = profile?.role === 'teacher' ? 'teacher' : 'learner';
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  
  const handleRoleSelect = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
  };
  
  const handleBack = () => {
    setSelectedRole(null);
  };
  
  return (
    <DashboardLayout userRole={userRole}>
      <div className="min-h-screen">
        {!selectedRole && <RoleSelector onSelectRole={handleRoleSelect} />}
        {selectedRole === 'student' && <StudentDocumentation onBack={handleBack} />}
        {selectedRole === 'teacher' && <TeacherDocumentation onBack={handleBack} />}
      </div>
    </DashboardLayout>
  );
};

export default Documentation;