import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function UserList({ users, selectedUser, onSelectUser }) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Search Box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Search Results
          </h3>
          {searching ? (
            <p className="text-sm text-gray-500">Searching...</p>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    onSelectUser(user);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                >
                  <p className="font-medium text-gray-800">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No users found</p>
          )}
        </div>
      )}

      {/* Online Users */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          🟢 Online ({users.length})
        </h3>
        <div className="space-y-2">
          {users.length > 0 ? (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  selectedUser?.id === user.id
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="font-medium">{user.username}</p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">No users online</p>
          )}
        </div>
      </div>
    </div>
  );
}
