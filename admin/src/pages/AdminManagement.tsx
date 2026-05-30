import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField,
  Button, IconButton, Alert, Snackbar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Grid, Tooltip, InputAdornment,
} from '@mui/material';
import {
  Add, Delete, Refresh, Visibility, VisibilityOff,
  AdminPanelSettings, Person, Lock, Email,
  CheckCircle, Cancel,
} from '@mui/icons-material';

interface AdminUser {
  id: string;
  email: string;
  password: string;
  role: 'master' | 'admin';
  name?: string;
  createdAt: any;
  lastLogin?: any;
  active?: boolean;
  tradeCount?: number;
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
};

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [tradeCounts, setTradeCounts] = useState<{ [uid: string]: number }>({});
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [id: string]: boolean }>({});
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Fetch admin users
  useEffect(() => {
    const q = query(collection(db, 'adminUsers'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser));
      setAdmins(list.sort((a, b) => {
        if (a.role === 'master') return -1;
        if (b.role === 'master') return 1;
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      }));
    });
    return () => unsub();
  }, []);

  // Count trades per admin from activeTrades collection
  useEffect(() => {
    const q = query(collection(db, 'activeTrades'));
    const unsub = onSnapshot(q, (snap) => {
      const counts: { [uid: string]: number } = {};
      snap.docs.forEach(d => {
        const uid = d.data().postedBy;
        if (uid) counts[uid] = (counts[uid] || 0) + 1;
      });
      setTradeCounts(counts);
    });
    return () => unsub();
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setForm(prev => ({ ...prev, password: pwd }));
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'adminUsers'), {
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
        name:      form.name.trim() || form.email.split('@')[0],
        role:      'admin',
        active:    true,
        createdAt: serverTimestamp(),
      });
      showSnackbar('Admin added successfully!', 'success');
      setForm(emptyForm);
      setModalOpen(false);
    } catch (err) {
      showSnackbar('Error adding admin', 'error');
    }
    setLoading(false);
  };

  const handleToggleActive = async (admin: AdminUser) => {
    await updateDoc(doc(db, 'adminUsers', admin.id), { active: !admin.active });
    showSnackbar(admin.active ? 'Admin disabled' : 'Admin enabled', 'success');
  };

  const handleOpenDelete = (admin: AdminUser) => {
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'adminUsers', adminToDelete.id));
      showSnackbar('Admin removed successfully', 'success');
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
    } catch (err) {
      showSnackbar('Error removing admin', 'error');
    }
    setLoading(false);
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const masterCount = admins.filter(a => a.role === 'master').length;
  const adminCount  = admins.filter(a => a.role === 'admin').length;
  const activeCount = admins.filter(a => a.role === 'admin' && a.active !== false).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Admin Management</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage sub-admin accounts — only you (master) can access this page
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setModalOpen(true); }}
          sx={{ backgroundColor: '#1a237e', mt: 1, borderRadius: 2, px: 3 }}>
          ADD ADMIN
        </Button>
      </Box>

      {/* Stats cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AdminPanelSettings sx={{ fontSize: 40, color: '#1a237e' }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">{adminCount}</Typography>
                <Typography variant="body2" color="text.secondary">Total Sub-Admins</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle sx={{ fontSize: 40, color: '#2e7d32' }} />
              <Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">{activeCount}</Typography>
                <Typography variant="body2" color="text.secondary">Active Admins</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Person sx={{ fontSize: 40, color: '#ed6c02' }} />
              <Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {adminCount - activeCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">Disabled Admins</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Admins table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>All Admin Accounts</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Name', 'Email', 'Password', 'Role', 'Active Trades', 'Status', 'Added On', 'Actions'].map(h => (
                  <TableCell key={h}><strong>{h}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id} hover sx={{ opacity: admin.active === false ? 0.6 : 1 }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <strong>{admin.name || admin.email.split('@')[0]}</strong>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">{admin.email}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {admin.role === 'master' ? (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">Hidden</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Lock fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: showPasswords[admin.id] ? 0 : 2 }}>
                          {showPasswords[admin.id] ? admin.password : '••••••••••'}
                        </Typography>
                        <Tooltip title={showPasswords[admin.id] ? 'Hide password' : 'Show password'}>
                          <IconButton size="small" onClick={() => toggleShowPassword(admin.id)}>
                            {showPasswords[admin.id]
                              ? <VisibilityOff fontSize="small" />
                              : <Visibility fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={admin.role === 'master' ? 'MASTER' : 'ADMIN'}
                      sx={{
                        backgroundColor: admin.role === 'master' ? '#1a237e' : '#2e7d32',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 11,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={tradeCounts[admin.id] || 0}
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    {admin.role === 'master' ? (
                      <Chip size="small" label="MASTER" sx={{ backgroundColor: '#1a237e', color: '#fff', fontSize: 10 }} />
                    ) : (
                      <Chip
                        size="small"
                        label={admin.active !== false ? 'ACTIVE' : 'DISABLED'}
                        sx={{
                          backgroundColor: admin.active !== false ? '#e8f5e9' : '#fce4ec',
                          color: admin.active !== false ? '#2e7d32' : '#c62828',
                          fontWeight: 'bold',
                          fontSize: 11,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(admin.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {admin.role !== 'master' && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title={admin.active !== false ? 'Disable admin' : 'Enable admin'}>
                          <IconButton size="small" onClick={() => handleToggleActive(admin)}
                            sx={{ color: admin.active !== false ? '#ed6c02' : '#2e7d32' }}>
                            {admin.active !== false ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove admin permanently">
                          <IconButton size="small" onClick={() => handleOpenDelete(admin)}
                            sx={{ color: '#d32f2f' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>No admins found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ADD ADMIN MODAL */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: 20 }}>
          <AdminPanelSettings sx={{ mr: 1, verticalAlign: 'middle', color: '#1a237e' }} />
          Add New Admin
        </DialogTitle>
        <Box component="form" onSubmit={handleAddAdmin}>
          <DialogContent sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
              This admin will only see trades they post themselves. They cannot see other admins' trades.
            </Alert>

            <TextField
              fullWidth label="Full Name" placeholder="e.g. Rahul Sharma"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth label="Email Address" type="email" required
              placeholder="admin@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email fontSize="small" color="action" /></InputAdornment>,
              }}
            />

            <TextField
              fullWidth label="Password" required
              type={showFormPassword ? 'text' : 'password'}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock fontSize="small" color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowFormPassword(!showFormPassword)}>
                      {showFormPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              size="small" startIcon={<Refresh fontSize="small" />}
              onClick={generatePassword}
              sx={{ mb: 2, textTransform: 'none', color: '#1a237e' }}
            >
              Generate strong password
            </Button>

            {form.password && (
              <Alert severity="warning" sx={{ mb: 1, fontSize: 12 }}>
                Save this password safely — it will be visible in the admin table later.
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setModalOpen(false)} variant="outlined">CANCEL</Button>
            <Button type="submit" variant="contained" disabled={loading}
              sx={{ backgroundColor: '#1a237e', px: 3 }}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'ADD ADMIN'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold" color="error">Remove Admin</DialogTitle>
        <DialogContent>
          {adminToDelete && (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                This will permanently remove <strong>{adminToDelete.name || adminToDelete.email}</strong> from the admin panel.
                Their posted trades will remain but they will lose access.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Email: <strong>{adminToDelete.email}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active trades: <strong>{tradeCounts[adminToDelete.id] || 0}</strong>
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">CANCEL</Button>
          <Button onClick={handleDeleteAdmin} variant="contained" color="error" disabled={loading}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'REMOVE ADMIN'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
