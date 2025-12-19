"use client";

import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Mail, Phone, Building2, Calendar, Shield, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchTeamMembers } from "@/app/api/v1/manager/fetch-user/users";
import { TeamMember } from "@/types/user";
import { Loader2 } from "lucide-react";

export default function UserDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
    const router = useRouter();
    const { userProfile } = useAuth();

    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<TeamMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unwrapParams = async () => {
            const resolvedParams = await params;
            setUserId(resolvedParams.userId);
        };
        unwrapParams();
    }, [params]);

    useEffect(() => {
        const loadUser = async () => {
            if (!userProfile?.user_id || !userId) return;

            try {
                setLoading(true);
                // Ideally we would fetch a single user, but reusing the existing endpoint for now
                // since we know this user is in the manager's team
                const response = await fetchTeamMembers(userProfile.user_id);
                const foundUser = response.data.users.find(u => u.user_id === userId);

                if (foundUser) {
                    setUser(foundUser);
                } else {
                    setError('User not found in your team');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load user details');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadUser();
        }
    }, [userProfile?.user_id, userId]);

    return (
        <RouteProtection allowedRoles={['manager']}>
            <ManagerLayout>
                <div className="w-full max-w-full overflow-hidden">
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="pl-0 hover:pl-2 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Team
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        </div>
                    ) : error || !user ? (
                        <div className="p-6 bg-red-50 text-red-600 rounded-lg">
                            {error || 'User not found'}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <PageHeader
                                title={user.full_name}
                                description={user.email}
                                icon={Users}
                                iconColor="text-blue-600 dark:text-blue-400"
                                iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                                actions={
                                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                                        {user.status}
                                    </Badge>
                                }
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Contact Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Mail className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Email</p>
                                                <p className="text-slate-900 dark:text-slate-100">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Phone className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Phone</p>
                                                <p className="text-slate-900 dark:text-slate-100">{user.phone_number || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Employment Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Building2 className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Department</p>
                                                <p className="text-slate-900 dark:text-slate-100">{user.department?.department_name || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Briefcase className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Company</p>
                                                <p className="text-slate-900 dark:text-slate-100">{user.company?.company_name || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Shield className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Employee Code</p>
                                                <p className="text-slate-900 dark:text-slate-100">{user.employee_code || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Joined</p>
                                                <p className="text-slate-900 dark:text-slate-100">{new Date(user.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </ManagerLayout>
        </RouteProtection>
    );
}
