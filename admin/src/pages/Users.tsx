import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Search, CalendarMonth, CheckCircle } from '@mui/icons-material';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User, UserStatus } from '../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDate, setEditingDate] = useState<{ [userId: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUsers(prev =>
        prev.map(user => user.id === userId ? { ...user, status: newStatus } : user)
      );
      showSnackbar(`User status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating user status:', error);
      showSnackbar('Error updating user status', 'error');
    }
  };

  const handleDateChange = (userId: string, dateValue: string) => {
    setEditingDate(prev => ({ ...prev, [userId]: dateValue }));
  };

  const handleSaveDate = async (userId: string) => {
    const dateValue = editingDate[userId];
    if (!dateValue) return;
    try {
      const isoDate = new Date(dateValue).toISOString();
      await updateDoc(doc(db, 'users', userId), { subscriptionEndDate: isoDate });
      setUsers(prev =>
        prev.map(user => user.id === userId ? { ...user, subscriptionEndDate: isoDate } : user)
      );
      setEditingDate(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      showSnackbar('Subscription date updated!', 'success');
    } catch (error) {
      console.error('Error updating subscription date:', error);
      showSnackbar('Error updating subscription date', 'error');
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (subscriptionEndDate?: string) => {
    if (!subscriptionEndDate) return null;
    const endDate = new Date(subscriptionEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysColor = (days: number | null): 'success' | 'warning' | 'error' | 'default' => {
    if (days === null) return 'default';
    if (days <= 0) return 'error';
    if (days <= 7) return 'error';
    if (days <= 15) return 'warning';
    return 'success';
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: UserStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'FREE': return 'warning';
      case 'BLOCKED': return 'error';
      default: return 'default';
    }
  };

  // Format date to input value (yyyy-mm-dd)
  const toInputDate = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().split('T')[0];
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        User Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage user access levels and subscription dates
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by phone number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Phone / Name</strong></TableCell>
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
                        {searchTerm ? 'No users found matching your search' : 'No users registered yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const daysLeft = getDaysRemaining(user.subscriptionEndDate);
                    const currentDateInput = editingDate[user.id] !== undefined
                      ? editingDate[user.id]
                      : toInputDate(user.subscriptionEndDate);

                    return (
                      <TableRow key={user.id} hover>
                        {/* Phone / Name */}
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {user.phone || '—'}
                          </Typography>
                          {user.name && (
                            <Typography variant="caption" color="text.secondary">
                              {user.name}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={user.status}
                            color={getStatusColor(user.status)}
                            size="small"
                          />
                        </TableCell>

                        {/* Registered */}
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>

                        {/* Subscription End Date */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              type="date"
                              size="small"
                              value={currentDateInput}
                              onChange={(e) => handleDateChange(user.id, e.target.value)}
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
                              <Tooltip title="Save date">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleSaveDate(user.id)}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Days Remaining */}
                        <TableCell>
                          {user.status === 'ACTIVE' && daysLeft !== null ? (
                            <Chip
                              label={
                                daysLeft <= 0
                                  ? 'Expired'
                                  : `${daysLeft} days`
                              }
                              color={getDaysColor(daysLeft)}
                              size="small"
                              variant={daysLeft <= 7 ? 'filled' : 'outlined'}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
