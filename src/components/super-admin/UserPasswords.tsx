import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function UserPasswords() {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-user-passwords'],
    queryFn: async () => {
      const res = await api.get('/super-admin/users/passwords');
      return res.data.data;
    }
  });

  const togglePassword = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Matches on org name OR user name/email/phone. An org-name match keeps every
  // user in that org visible; a user-level match narrows down to just the
  // matching users within whichever orgs have one, so searching "Edufolio" and
  // searching "9496" behave the way an admin would expect either way.
  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term || !Array.isArray(data)) return data;

    return data
      .map((orgGroup: any) => {
        const orgMatches = orgGroup.organisationName?.toLowerCase().includes(term);
        if (orgMatches) return orgGroup;

        const matchingUsers = orgGroup.users.filter((u: any) =>
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.phone?.toLowerCase().includes(term)
        );
        return matchingUsers.length > 0 ? { ...orgGroup, users: matchingUsers } : null;
      })
      .filter(Boolean);
  }, [data, search]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Passwords</h2>
          <p className="text-muted-foreground text-sm">
            View stored plain text passwords for all users across organisations.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by org, name, email, phone..."
            className="pl-9"
          />
        </div>
      </div>

      {filteredData?.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No organisations or users match "{search}".</p>
      )}

      {filteredData?.map((orgGroup: any) => (
        <Card key={orgGroup.organisationName} className="bg-card">
          <CardHeader>
            <CardTitle>{orgGroup.organisationName}</CardTitle>
            <CardDescription>{orgGroup.users.length} users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Password</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgGroup.users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.password ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                            {showPasswords[user.id] ? user.password : '••••••••'}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => togglePassword(user.id)}
                          >
                            {showPasswords[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">Not stored</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
