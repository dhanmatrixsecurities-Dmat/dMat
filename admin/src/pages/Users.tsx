import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Select, MenuItem,
  FormControl, TextField, InputAdornment, Alert, Snackbar,
  CircularProgress, Tooltip, IconButton,
} from '@mui/material';
import { Search, CalendarMonth, CheckCircle } from '@mui/icons-material';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User, UserStatus } from '../types';

const parseDate = (value: any): Date | null => {
  if (!value) return null;
  // Firestore Timestamp object with toDate() method
  if (typeof value?.toDate === 'function') return value.toDate();
  // Firestore Timestamp-like plain object {seconds, nanoseconds}
  if (value?.seconds !== undefined) return new Date(value.seconds * 1000);
  // ISO string or any parseable string
  if (typeof value === 'string' && value.trim() !== '') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  // Already a Date
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  return null;
};

const toInputDate = (value: any): string => {
  const d = parseDate(value);
  if (!d || isNaN(d.getTime())) return '';
  // Format as YYYY-MM-DD in local time (not UTC) to avoid off-by-one
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDate, setEditingDate] = useState<{ [userId: string]: string }>({});
  const [editingRegDate, setEditingRegDate] = useState<{ [userId: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      (user.mobile || (user as any).phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as User[];
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      showSnackbar('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      showSnackbar(`Status updated to ${newStatus}`, 'success');
    } catch {
      showSnackbar('Error updating status', 'error');
    }
  };

  const handleSaveDate = async (userId: string) => {
    const dateValue = editingDate[userId];
    if (!dateValue) return;
    try {
      // Store as ISO string — safe and consistent
      const isoDate = new Date(dateValue + 'T00:00:00').toISOString();
      await updateDoc(doc(db, 'users', userId), { subscriptionEndDate: isoDate });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionEndDate: isoDate } : u));
      setEditingDate(prev => { const u = { ...prev }; delete u[userId]; return u; });
      showSnackbar('Subscription date updated!', 'success');
    } catch (err) {
      console.error('Save sub date error:', err);
      showSnackbar('Error updating subscription date', 'error');
    }
  };

  const handleSaveRegDate = async (userId: string) => {
    const dateValue = editingRegDate[userId];
    if (!dateValue) return;
    try {
      // Store as ISO string — overwrites Firestore Timestamp with a plain string
      const isoDate = new Date(dateValue + 'T00:00:00').toISOString();
      await updateDoc(doc(db, 'users', userId), { createdAt: isoDate });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, createdAt: isoDate } : u));
      setEditingRegDate(prev => { const u = { ...prev }; delete u[userId]; return u; });
      showSnackbar('Registered date updated!', 'success');
    } catch (err) {
      console.error('Save reg date error:', err);
      showSnackbar('Error updating registered date', 'error');
    }
  };

  const getDaysRemaining = (subscriptionEndDate?: string) => {
    if (!subscriptionEndDate) return null;
    const endDate = new Date(subscriptionEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Total days from registration → subscription end date
  const getTotalSubDays = (createdAt: any, subscriptionEndDate?: string) => {
    if (!subscriptionEndDate) return null;
    const regDate = parseDate(createdAt);
    if (!regDate) return null;
    const endDate = new Date(subscriptionEndDate);
    regDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const total = Math.ceil((endDate.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
    return total > 0 ? total : null;
  };

  const getDaysColor = (days: number | null): 'success' | 'warning' | 'error' | 'default' => {
    if (days === null) return 'default';
    if (days <= 7) return 'error';
    if (days <= 15) return 'warning';
    return 'success';
  };

  const getStatusColor = (status: UserStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'FREE': return 'warning';
      case 'BLOCKED': return 'error';
      default: return 'default';
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>User Management</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage user access levels and subscription dates
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField fullWidth placeholder="Search by phone number or name..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Phone / Name / Email</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Registered</strong></TableCell>
                  <TableCell><strong>Subscription End Date</strong></TableCell>
                  <TableCell><strong>Days Remaining</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        {searchTerm ? 'No users found' : 'No users registered yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const daysLeft = getDaysRemaining(user.subscriptionEndDate);

                    return (
                      <TableRow key={user.id} hover>

                        {/* Phone / Name / Email */}
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {(user as any).mobile || (user as any).phone || '—'}
                          </Typography>
                          {user.name && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {user.name}
                            </Typography>
                          )}
                          {(user as any).email && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {(user as any).email}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                        </TableCell>

                        {/* Registered — always editable date picker */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              type="date"
                              size="small"
                              value={
                                editingRegDate[user.id] !== undefined
                                  ? editingRegDate[user.id]
                                  : toInputDate((user as any).createdAt) ?? ''
                              }
                              onChange={(e) =>
                                setEditingRegDate(prev => ({ ...prev, [user.id]: e.target.value }))
                              }
                              sx={{ width: 160 }}
                              inputProps={{ placeholder: 'dd-mm-yyyy' }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CalendarMonth fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                            {editingRegDate[user.id] !== undefined && editingRegDate[user.id] !== '' && (
                              <Tooltip title="Save registered date">
                                <IconButton size="small" color="success" onClick={() => handleSaveRegDate(user.id)}>
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Subscription End Date */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              type="date"
                              size="small"
                              value={
                                editingDate[user.id] !== undefined
                                  ? editingDate[user.id]
                                  : toInputDate(user.subscriptionEndDate)
                              }
                              onChange={(e) =>
                                setEditingDate(prev => ({ ...prev, [user.id]: e.target.value }))
                              }
                              sx={{ width: 160 }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CalendarMonth fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                            {editingDate[user.id] !== undefined && (
                              <Tooltip title="Save subscription date">
                                <IconButton size="small" color="success" onClick={() => handleSaveDate(user.id)}>
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Days Remaining */}
                        <TableCell>
                          {(() => {
                            const totalDays = getTotalSubDays((user as any).createdAt, user.subscriptionEndDate);
                            return (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {user.status === 'ACTIVE' && daysLeft !== null ? (
                                  <Chip
                                    label={daysLeft <= 0 ? 'Expired' : `${daysLeft} days left`}
                                    color={getDaysColor(daysLeft)}
                                    size="small"
                                    variant={daysLeft <= 7 ? 'filled' : 'outlined'}
                                  />
                                ) : (
                                  <Typography variant="caption" color="text.secondary">—</Typography>
                                )}
                                {totalDays !== null && (
                                  <Typography variant="caption" color="text.secondary">
                                    Total: {totalDays}d
                                  </Typography>
                                )}
                              </Box>
                            );
                          })()}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={user.status}
                              onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)}
                            >
                              <MenuItem value="FREE">FREE</MenuItem>
                              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                              <MenuItem value="BLOCKED">BLOCKED</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>

                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
