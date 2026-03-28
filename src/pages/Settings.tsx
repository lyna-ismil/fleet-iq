import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminProfile, useUpdateAdmin, useUploadAdminPhoto, useChangeAdminPassword } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { User, Camera, Lock, Palette, Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

const getPasswordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'];

const Settings = () => {
  const { adminId, setUser } = useAuth();
  const { data: admin, isLoading } = useAdminProfile(adminId);
  const updateAdmin = useUpdateAdmin();
  const uploadPhoto = useUploadAdminPhoto();
  const changePassword = useChangeAdminPassword();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (admin) {
      setName(admin.name || '');
      setEmail(admin.email || '');
      setPhone(admin.phone || '');
      setPhotoPreview(admin.photo || null);
    }
  }, [admin]);

  const handleProfileSave = async () => {
    try {
      await updateAdmin.mutateAsync({ id: adminId, name, email, phone });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Update failed');
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
    try {
      // Optimistically update the auth user context for Sidebar/Header
      setUser({ photo: objectUrl });
      await uploadPhoto.mutateAsync({ id: adminId, file });
      toast.success('Photo updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Upload failed');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await changePassword.mutateAsync({ id: adminId, currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Password change failed');
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
    toast.success(`Theme set to ${checked ? 'dark' : 'light'} mode`);
  };

  const pwStrength = getPasswordStrength(newPassword);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 font-inter">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const photoUrl = photoPreview
    ? (photoPreview.startsWith('http') || photoPreview.startsWith('blob') ? photoPreview : `http://localhost:6001${photoPreview}`)
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-inter">
      {/* Profile Section */}
      <Card className="border-dash-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-dash-text flex items-center gap-2">
            <User size={18} className="text-dash-purple" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-dash-purple/10 flex items-center justify-center overflow-hidden border-2 border-dash-border">
                {photoUrl ? (
                  <img src={photoUrl} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-dash-purple text-2xl font-bold">{name?.charAt(0)?.toUpperCase() || 'A'}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              >
                <Camera size={18} className="text-white" />
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
            </div>
            <div>
              <p className="text-lg font-semibold text-dash-text">{admin?.name || 'Admin'}</p>
              <Badge variant="outline" className="text-[10px] font-semibold border bg-dash-purple/10 text-dash-purple border-dash-purple/20">
                <Shield size={10} className="mr-1" /> {admin?.role || 'ADMIN'}
              </Badge>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-dash-text">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="border-dash-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-dash-text">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-dash-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-dash-text">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="border-dash-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-dash-text">Role</Label>
              <Input value={admin?.role || 'ADMIN'} disabled className="border-dash-border bg-dash-bg text-dash-muted" />
            </div>
          </div>

          <Button
            onClick={handleProfileSave}
            disabled={updateAdmin.isPending}
            className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer"
          >
            {updateAdmin.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card className="border-dash-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-dash-text flex items-center gap-2">
            <Lock size={18} className="text-dash-purple" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border-dash-border pr-10"
                placeholder="Enter current password"
              />
              <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted cursor-pointer">
                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-dash-border pr-10"
                placeholder="Enter new password"
              />
              <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dash-muted cursor-pointer">
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${i <= pwStrength ? strengthColors[pwStrength] : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-dash-muted font-medium">{strengthLabels[pwStrength]}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-dash-border"
              placeholder="Confirm new password"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-dash-danger">Passwords do not match</p>
            )}
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
            className="bg-dash-purple hover:bg-dash-purple/90 text-white cursor-pointer"
          >
            {changePassword.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card className="border-dash-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-dash-text flex items-center gap-2">
            <Palette size={18} className="text-dash-purple" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-dash-bg rounded-xl">
            <div>
              <p className="text-sm font-medium text-dash-text">Dark Mode</p>
              <p className="text-xs text-dash-muted">Toggle between light and dark themes</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={handleThemeToggle} className="cursor-pointer" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
