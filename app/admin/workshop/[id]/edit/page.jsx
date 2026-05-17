'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../src/lib/supabaseClient';
import WorkshopForm from '../../../../../src/components/admin/WorkshopForm';

export default function Page() {
  const params = useParams();
  const id = params?.id;
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) setError(error.message);
      else setWorkshop(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading…</div>;
  if (error || !workshop) {
    return (
      <div className="p-8">
        <Link href="/admin/workshop" className="text-sm text-gray-500 hover:text-gray-800">
          ← Back
        </Link>
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || 'Workshop not found.'}
        </p>
      </div>
    );
  }

  return <WorkshopForm mode="edit" workshop={workshop} />;
}
