import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Select, MenuItem,
  FormControl, TextField, InputAdornment, Alert, Snackbar,
  CircularProgress, Tooltip, IconButton, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Search, CalendarMonth, CheckCircle, PersonAdd, ContentCopy } from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User, UserStatus } from '../types';

// ── Firebase Auth REST API (create user without signing out admin) ──
const FIREBASE_API_KEY = (window as any).__FIREBASE_API_KEY__ || '';

const parseDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value?.seconds !== undefined) return new Date(value.seconds * 1000);
  if (typeof value === 'string' && value.trim() !== '') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  return null;
};

const toInputDate = (value: any): string => {
  const d = parseDate(value);
  if (!d || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value: any): string => {
  const d = parseDate(value);
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing states
  const [editingStartDate, setEditingStartDate] = useState<{ [id: string]: string }>({});
  const [editingEndDate, setEditingEndDate] = useState<{ [id: string]: string }>({});

  // Add User dialog
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserMobile, setNewUserMobile] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{ loginId: string; password: string } | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      ((user as any).mobile || (user as any).phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as User[];
      usersData.sort((a, b) => {
        const da = parseDate((a as any).createdAt);
        const db2 = parseDate((b as any).createdAt);
        if (!da && !db2) return 0;
        if (!da) return 1;
        if (!db2) return -1;
        return db2.getTime() - da.getTime();
      });
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch {
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

  const handleSaveStartDate = async (userId: string) => {
    const dateValue = editingStartDate[userId];
    if (!dateValue) return;
    try {
      const isoDate = new Date(dateValue + 'T00:00:00').toISOString();
      await updateDoc(doc(db, 'users', userId), { subscriptionStartDate: isoDate });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionStartDate: isoDate } : u));
      setEditingStartDate(prev => { const u = { ...prev }; delete u[userId]; return u; });
      showSnackbar('Subscription start date saved!', 'success');
    } catch {
      showSnackbar('Error saving start date', 'error');
    }
  };

  const handleSaveEndDate = async (userId: string) => {
    const dateValue = editingEndDate[userId];
    if (!dateValue) return;
    try {
      const isoDate = new Date(dateValue + 'T00:00:00').toISOString();
      await updateDoc(doc(db, 'users', userId), { subscriptionEndDate: isoDate });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionEndDate: isoDate } : u));
      setEditingEndDate(prev => { const u = { ...prev }; delete u[userId]; return u; });
      showSnackbar('Subscription end date saved!', 'success');
    } catch {
      showSnackbar('Error saving end date', 'error');
    }
  };

  // Days remaining: End Date - Today + 1 (end date counts as 1 day)
  const getDaysRemaining = (subscriptionEndDate?: string) => {
    if (!subscriptionEndDate) return null;
    const endDate = new Date(subscriptionEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Total days: End Date - Start Date
  const getTotalSubDays = (startDate: any, endDate?: string) => {
    if (!endDate || !startDate) return null;
    const start = parseDate(startDate);
    if (!start) return null;
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const total = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return total > 0 ? total : null;
  };

  const getDaysColor = (days: number | null): 'success' | 'warning' | 'error' | 'default' => {
    if (days === null) return 'default';
    if (days < 1) return 'error';
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

  // ── Add User ──────────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserMobile.trim()) {
      showSnackbar('Name and mobile are required', 'error');
      return;
    }
    setAddingUser(true);
    try {
      // Generate login ID and password
      const loginId = `${newUserMobile.replace(/\D/g, '')}@dhanmatrix.in`;
      const password = `DhanMatrix@${newUserMobile.slice(-4)}`;

      // Get Firebase API key from environment
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

      // Create user via Firebase Auth REST API (doesn't sign out current admin)
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginId, password, returnSecureToken: false }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      // Save user profile in Firestore
      const { setDoc, doc: firestoreDoc } = await import('firebase/firestore');
      await setDoc(firestoreDoc(db, 'users', data.localId), {
        name: newUserName.trim(),
        mobile: newUserMobile.trim(),
        email: loginId,
        status: 'FREE',
        createdAt: new Date().toISOString(),
      });

      setGeneratedCreds({ loginId, password });
      setNewUserName('');
      setNewUserMobile('');
      fetchUsers();
    } catch (err: any) {
      showSnackbar(err.message || 'Error creating user', 'error');
    } finally {
      setAddingUser(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Copied!', 'success');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" fontWeight="bold">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => { setAddUserOpen(true); setGeneratedCreds(null); }}
          sx={{ backgroundColor: '#1a237e' }}
        >
          Add User
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage user access levels and subscription dates
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
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
                  <TableCell><strong>Sub Start Date</strong></TableCell>
                  <TableCell><strong>Sub End Date</strong></TableCell>
                  <TableCell><strong>Days Remaining</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        {searchTerm ? 'No users found' : 'No users registered yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const daysLeft = getDaysRemaining(user.subscriptionEndDate);
                    const totalDays = getTotalSubDays((user as any).subscriptionStartDate, user.subscriptionEndDate);

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

                        {/* Status chip */}
                        <TableCell>
                          <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                        </TableCell>

                        {/* Registered — plain text, no picker */}
                        <TableCell>
                          <Typography variant="body2">
                            {formatDisplayDate((user as any).createdAt)}
                          </Typography>
                        </TableCell>

                        {/* Sub Start Date — editable */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              type="date"
                              size="small"
                              value={
                                editingStartDate[user.id] !== undefined
                                  ? editingStartDate[user.id]
                                  : toInputDate((user as any).subscriptionStartDate)
                              }
                              onChange={(e) =>
                                setEditingStartDate(prev => ({ ...prev, [user.id]: e.target.value }))
                              }
                              sx={{ width: 155 }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CalendarMonth fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                            {editingStartDate[user.id] !== undefined && (
                              <Tooltip title="Save start date">
                                <IconButton size="small" color="success" onClick={() => handleSaveStartDate(user.id)}>
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Sub End Date — editable */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              type="date"
                              size="small"
                              value={
                                editingEndDate[user.id] !== undefined
                                  ? editingEndDate[user.id]
                                  : toInputDate(user.subscriptionEndDate)
                              }
                              onChange={(e) =>
                                setEditingEndDate(prev => ({ ...prev, [user.id]: e.target.value }))
                              }
                              sx={{ width: 155 }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CalendarMonth fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                            {editingEndDate[user.id] !== undefined && (
                              <Tooltip title="Save end date">
                                <IconButton size="small" color="success" onClick={() => handleSaveEndDate(user.id)}>
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Days Remaining */}
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {user.status === 'ACTIVE' && daysLeft !== null ? (
                              <Chip
                                label={daysLeft < 1 ? 'Expired' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
                                color={getDaysColor(daysLeft)}
                                size="small"
                                variant={daysLeft <= 7 ? 'filled' : 'outlined'}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">—</Typography>
                            )}
                            {totalDays !== null && (
                              <Typography variant="caption" color="text.secondary">
                                Total: {totalDays} {totalDays === 1 ? 'day' : 'days'}
                              </Typography>
                            )}
                          </Box>
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

      {/* ── Add User Dialog ─────────────────────────────────── */}
      <Dialog open={addUserOpen} onClose={() => setAddUserOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>➕ Add New User</DialogTitle>
        <DialogContent>
          {!generatedCreds ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Full Name *"
                fullWidth
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
              <TextField
                label="Mobile Number *"
                fullWidth
                value={newUserMobile}
                onChange={(e) => setNewUserMobile(e.target.value)}
                placeholder="e.g. 9898989898"
              />
              <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Login ID will be: <strong>{newUserMobile ? `${newUserMobile.replace(/\D/g, '')}@dhanmatrix.in` : '9898989898@dhanmatrix.in'}</strong><br />
                  Password will be: <strong>{newUserMobile ? `DhanMatrix@${newUserMobile.slice(-4)}` : 'DhanMatrix@8989'}</strong>
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity="success">User created successfully!</Alert>
              <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom><strong>Share these credentials with the user:</strong></Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2">Login ID: <strong>{generatedCreds.loginId}</strong></Typography>
                  <IconButton size="small" onClick={() => copyToClipboard(generatedCreds.loginId)}><ContentCopy fontSize="small" /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2">Password: <strong>{generatedCreds.password}</strong></Typography>
                  <IconButton size="small" onClick={() => copyToClipboard(generatedCreds.password)}><ContentCopy fontSize="small" /></IconButton>
                </Box>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => copyToClipboard(`Login ID: ${generatedCreds.loginId}\nPassword: ${generatedCreds.password}`)}
                  startIcon={<ContentCopy />}
                >
                  Copy Both
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!generatedCreds ? (
            <>
              <Button onClick={() => setAddUserOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleAddUser}
                disabled={addingUser || !newUserName.trim() || !newUserMobile.trim()}
                sx={{ backgroundColor: '#1a237e' }}
              >
                {addingUser ? 'Creating...' : 'Create User'}
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => { setAddUserOpen(false); setGeneratedCreds(null); }} sx={{ backgroundColor: '#1a237e' }}>
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
