import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Alert, Snackbar, TextField, InputAdornment, Tabs, Tab,
  Select, MenuItem, FormControl,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type FeedbackStatus = 'new' | 'in_progress' | 'closed';

interface Feedback {
  id: string;
  type: 'complaint' | 'suggestion';
  message: string;
  userName: string;
  userMobile: string;
  userEmail: string;
  createdAt: any;
  status: FeedbackStatus;
}

const formatDate = (value: any): string => {
  if (!value) return '—';
  const d = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatusColor = (status: FeedbackStatus): 'warning' | 'info' | 'success' | 'default' => {
  switch (status) {
    case 'new':         return 'warning';
    case 'in_progress': return 'info';
    case 'closed':      return 'success';
    default:            return 'default';
  }
};

const getStatusLabel = (status: FeedbackStatus): string => {
  switch (status) {
    case 'new':         return 'New';
    case 'in_progress': return 'In Progress';
    case 'closed':      return 'Closed';
    default:            return status;
  }
};

const FeedbackPage: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filtered, setFiltered] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
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
      const data = snap.docs.map(d => {
        const raw = d.data();
        // migrate old 'unread'/'read' values to new status system
        let status: FeedbackStatus = 'new';
        if (raw.status === 'read' || raw.status === 'closed') status = 'closed';
        else if (raw.status === 'in_progress') status = 'in_progress';
        else status = 'new';
        return { id: d.id, ...raw, status } as Feedback;
      });
      setFeedbackList(data);
      setFiltered(data);
    } catch {
      setSnackbar({ open: true, message: 'Error fetching feedback', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    try {
      await updateDoc(doc(db, 'feedback', id), { status: newStatus });
      setFeedbackList(prev =>
        prev.map(f => f.id === id ? { ...f, status: newStatus } : f)
      );
      setSnackbar({ open: true, message: `Status updated to "${getStatusLabel(newStatus)}"`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
    }
  };

  const newCount = feedbackList.filter(f => f.status === 'new').length;
  const complaintCount = feedbackList.filter(f => f.type === 'complaint').length;
  const suggestionCount = feedbackList.filter(f => f.type === 'suggestion').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" fontWeight="bold">
          Complaints & Suggestions
          {newCount > 0 && (
            <Chip label={`${newCount} new`} color="error" size="small" sx={{ ml: 2, fontWeight: 'bold' }} />
          )}
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        View all user complaints and suggestions submitted from the app
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip label={`Total: ${feedbackList.length}`} variant="outlined" />
        <Chip label={`Complaints: ${complaintCount}`} color="error" variant="outlined" />
        <Chip label={`Suggestions: ${suggestionCount}`} color="success" variant="outlined" />
        <Chip label={`New: ${newCount}`} color="warning" variant="outlined" />
      </Box>

      <Paper sx={{ p: 3 }}>
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
                  <TableCell><strong>Update Status</strong></TableCell>
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
                      sx={{ backgroundColor: item.status === 'new' ? '#fffde7' : 'inherit' }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{item.userName || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{item.userMobile || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{item.userEmail || '—'}</Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={item.type === 'complaint' ? 'Complaint' : 'Suggestion'}
                          color={item.type === 'complaint' ? 'error' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                          {item.message}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{formatDate(item.createdAt)}</Typography>
                      </TableCell>

                      {/* Status badge */}
                      <TableCell>
                        <Chip
                          label={getStatusLabel(item.status)}
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                      </TableCell>

                      {/* Status dropdown */}
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <Select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                          >
                            <MenuItem value="new">🆕 New</MenuItem>
                            <MenuItem value="in_progress">🔄 In Progress</MenuItem>
                            <MenuItem value="closed">✅ Closed</MenuItem>
                          </Select>
                        </FormControl>
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

export default FeedbackPage;
