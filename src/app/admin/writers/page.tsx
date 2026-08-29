import { redirect } from 'next/navigation';

/** Renamed to /admin/users; kept so old bookmarks and links still land. */
export default function WritersPage() {
  redirect('/admin/users');
}
