interface UserSearchProps {
  searchQuery: string;
  authProvider: string;
  onSearchChange: (value: string) => void;
  onAuthProviderChange: (value: string) => void;
}

export function UserSearch({
  searchQuery,
  authProvider,
  onSearchChange,
  onAuthProviderChange,
}: UserSearchProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <select
        value={authProvider}
        onChange={(e) => onAuthProviderChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All Providers</option>
        <option value="email">Email</option>
        <option value="google">Google</option>
        <option value="apple">Apple</option>
      </select>
    </div>
  );
}
