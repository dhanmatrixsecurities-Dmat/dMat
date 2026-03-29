import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Alert, Snackbar, TextField, InputAdornment, Tabs, Tab,
  IconButton, Tooltip,
} from '@mui/material';
import { Search, CheckCircle } from '@mui/icons-material';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Feedback {
  id: string;
  type: 'complaint' | 'suggestion';
  message: string;
  userName: string;
  userMobile: string;
  userEmail: string;
  createdAt: any;
  status: 'unread' | 'read';
}

const formatDate = (value: any): string => {
  if (!value) return '—';
  const d = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Feedback: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filtered, setFiltered] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0=All, 1=Complaints, 2=Suggestions
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => { fetchFeedback(); }, []);

  useEffect(() => {
    let list = feedbackList;
    if (tab === 1) list = list.filter(f => f.type === 'complaint');
    if (tab === 2) list = list.filter(f => f.type === 'suggestion');
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(f =>
        f.userName?.toLowerCase().includes(s) ||
        f.userMobile?.includes(s) ||
        f.userEmail?.toLowerCase().includes(s) ||
        f.message?.toLowerCase().includes(s)
      );
    }
    setFiltered(list);
  }, [tab, search, feedbackList]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Feedback[];
      setFeedbackList(data);
      setFiltered(data);
    } catch {
      setSnackbar({ open: true, message: 'Error fetching feedback', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'feedback', id), { status: 'read' });
      setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: 'read' } : f));
      setSnackbar({ open: true, message: 'Marked as read', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
    }
  };

  const unreadCount = feedbackList.filter(f => f.status === 'unread').length;
  const complaintCount = feedbackList.filter(f => f.type === 'complaint').length;
  const suggestionCount = feedbackList.filter(f => f.type === 'suggestion').length;

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" fontWeight="bold">
          Complaints & Suggestions
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} new`}
              color="error"
              size="small"
              sx={{ ml: 2, fontWeight: 'bold' }}
            />
          )}
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        View all user complaints and suggestions submitted from the app
      </Typography>

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip label={`Total: ${feedbackList.length}`} variant="outlined" />
        <Chip label={`Complaints: ${complaintCount}`} color="error" variant="outlined" />
        <Chip label={`Suggestions: ${suggestionCount}`} color="success" variant="outlined" />
      </Box>

      <Paper sx={{ p: 3 }}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search by name, mobile, email or message..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
          }}
        />

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Tab label={`All (${feedbackList.length})`} />
          <Tab label={`Complaints (${complaintCount})`} />
          <Tab label={`Suggestions (${suggestionCount})`} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Message</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">No feedback found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(item => (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{ backgroundColor: item.status === 'unread' ? '#fffde7' : 'inherit' }}
                    >
                      {/* User info */}
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{item.userName || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {item.userMobile || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {item.userEmail || '—'}
                        </Typography>
                      </TableCell>

                      {/* Type chip */}
                      <TableCell>
                        <Chip
                          label={item.type === 'complaint' ? 'Complaint' : 'Suggestion'}
                          color={item.type === 'complaint' ? 'error' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      {/* Message */}
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                          {item.message}
                        </Typography>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Typography variant="body2">{formatDate(item.createdAt)}</Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={item.status === 'unread' ? 'New' : 'Read'}
                          color={item.status === 'unread' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>

                      {/* Mark as read */}
                      <TableCell>
                        {item.status === 'unread' && (
                          <Tooltip title="Mark as read">
                            <IconButton size="small" color="success" onClick={() => markAsRead(item.id)}>
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Feedback;
