'use client';

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SuccessAlert } from '@/components/feedback/success-alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const STORAGE_KEY = 'gebar-starter-preferences';

type Preferences = {
  product: boolean;
  security: boolean;
  billing: boolean;
  theme: 'light' | 'dark' | 'system';
};

const defaults: Preferences = {
  product: true,
  security: true,
  billing: true,
  theme: 'system',
};

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setPreferences({ ...defaults, ...JSON.parse(stored) });
  }, []);

  useEffect(() => {
    const dark =
      preferences.theme === 'dark' ||
      (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  }, [preferences.theme]);

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setSaved(true);
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <DashboardHeader
        title="Notifications"
        description="Persist QA-ready notification and theme preferences locally."
      />
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {(['product', 'security', 'billing'] as const).map((key) => (
            <label key={key} className="flex items-center justify-between rounded-md border p-4">
              <span className="capitalize text-sm font-medium text-gray-800">{key} emails</span>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={(event) =>
                  setPreferences((value) => ({ ...value, [key]: event.target.checked }))
                }
              />
            </label>
          ))}
          <div>
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              value={preferences.theme}
              onChange={(event) =>
                setPreferences((value) => ({
                  ...value,
                  theme: event.target.value as Preferences['theme'],
                }))
              }
              className="mt-2 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          {saved ? <SuccessAlert message="Preferences saved on this device." /> : null}
          <Button onClick={save} className="bg-orange-500 hover:bg-orange-600">
            Save preferences
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
