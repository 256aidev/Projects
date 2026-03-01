import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/client';
import { UserTable, UserSearch, Pagination } from '../components/Users';

export function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [authProvider, setAuthProvider] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Update debounced search after a delay
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch, authProvider, page, perPage],
    queryFn: () =>
      usersApi.list({
        query: debouncedSearch || undefined,
        auth_provider: authProvider || undefined,
        page,
        per_page: perPage,
      }),
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Debounce the actual search
    setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const handleAuthProviderChange = (value: string) => {
    setAuthProvider(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <span className="text-sm text-gray-500">
          {data?.total.toLocaleString() ?? 0} total users
        </span>
      </div>

      <UserSearch
        searchQuery={searchQuery}
        authProvider={authProvider}
        onSearchChange={handleSearchChange}
        onAuthProviderChange={handleAuthProviderChange}
      />

      <UserTable users={data?.users ?? []} isLoading={isLoading} />

      {data && data.total_pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.total_pages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
