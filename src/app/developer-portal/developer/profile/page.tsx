'use client';

import { IconCamera, IconEdit, IconSettings } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';

interface Profile {
  id: string;
  name: string;
  email: string;
  status: string;
  completedTasks: number;
  joinedDate: string;
  profile_picture_url?: string;
}

interface UserSession {
  user: any;
}

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setSession({ user: userData });
        } else {
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/auth/signin');
      }
    }
    
    checkSession();
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/developer/profile');
        if (!response.ok) {
          throw new Error('Failed to load profile');
        }
        const data = await response.json();
        setProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/developer/profile/picture', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      setProfile(prev => prev ? { ...prev, profile_picture_url: data.url } : null);
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-32 w-32 bg-gray-700 rounded-full mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-400">{error || 'Unable to load profile.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-8">
              <div className="relative group">
                {profile.profile_picture_url ? (
                  <Image
                    src={profile.profile_picture_url}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-4xl">{profile.name[0]}</span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer group-hover:bg-indigo-700 transition-colors">
                  <IconCamera size={20} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                  />
                </label>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
                <p className="text-gray-400">{profile.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                  {profile.status}
                </span>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <IconEdit size={20} />
                Edit Profile
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                <IconSettings size={20} />
                Settings
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 block mb-1">Name</label>
                  <p className="font-medium">{profile.name}</p>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Email</label>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Status</label>
                  <p className="font-medium">{profile.status}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Statistics</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 block mb-1">Completed Tasks</label>
                  <p className="text-2xl font-bold text-indigo-400">{profile.completedTasks}</p>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Joined Date</label>
                  <p className="font-medium">
                    {new Date(profile.joinedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 