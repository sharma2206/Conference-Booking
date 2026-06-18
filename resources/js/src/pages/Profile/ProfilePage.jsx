import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Camera, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { fetchCurrentUser, setUser } from '../../store/authSlice';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const profileSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().optional(),
  designation: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password required'),
  password: z.string().min(8, 'Min 8 characters'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('profile');

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '', designation: user?.designation || '' },
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put(API.USER(user?.id), data).then(r => r.data.data),
    onSuccess: (data) => {
      dispatch(setUser(data));
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data) => api.post(API.USER_PASSWORD(user?.id), data).then(r => r.data),
    onSuccess: () => { toast.success('Password changed'); resetPwd(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Password change failed'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return api.post(API.USER_AVATAR(user?.id), fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data);
    },
    onSuccess: (data) => {
      dispatch(setUser(data));
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Avatar updated');
    },
    onError: () => toast.error('Avatar upload failed'),
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center py-6 gap-3">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <label className="absolute bottom-0 right-0 h-7 w-7 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50">
                  <Camera className="h-3.5 w-3.5 text-gray-500" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files[0] && avatarMutation.mutate(e.target.files[0])}
                  />
                </label>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {user?.roles?.[0]?.name || user?.roles?.[0] || ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <nav className="space-y-1">
            {[
              { id: 'profile', icon: User, label: 'Profile Info' },
              { id: 'password', icon: Lock, label: 'Change Password' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="xl:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleProfile(d => updateProfileMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Full Name" required error={profileErrors.name?.message} {...regProfile('name')} />
                    <Input label="Employee ID" value={user?.employee_id || '—'} disabled />
                    <Input label="Email" value={user?.email || ''} disabled />
                    <Input label="Phone" placeholder="+91 98765 43210" {...regProfile('phone')} />
                    <Input label="Designation" placeholder="e.g. Manager" {...regProfile('designation')} />
                    <Input label="Department" value={user?.department?.name || '—'} disabled />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" loading={updateProfileMutation.isPending}>Save Changes</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'password' && (
            <Card>
              <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handlePwd(d => updatePasswordMutation.mutate(d))} className="space-y-4 max-w-sm">
                  <Input
                    label="Current Password"
                    type="password"
                    required
                    error={pwdErrors.current_password?.message}
                    {...regPwd('current_password')}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    required
                    error={pwdErrors.password?.message}
                    hint="Minimum 8 characters"
                    {...regPwd('password')}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    required
                    error={pwdErrors.password_confirmation?.message}
                    {...regPwd('password_confirmation')}
                  />
                  <Button type="submit" loading={updatePasswordMutation.isPending}>Update Password</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
