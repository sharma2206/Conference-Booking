import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { API } from '../api/endpoints';

export function useBookings(params = {}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => api.get(API.BOOKINGS, { params }).then(r => r.data),
    staleTime: 30000,
  });
}

export function useBooking(id, options = {}) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => api.get(API.BOOKING(id)).then(r => r.data.data),
    enabled: !!id,
    ...options,
  });
}

export function useCalendarBookings(params = {}) {
  return useQuery({
    queryKey: ['bookings-calendar', params],
    queryFn: () => api.get(API.BOOKING_CALENDAR, { params }).then(r => r.data.data || r.data),
    enabled: !!(params.start && params.end),
    staleTime: 60000,
  });
}

export function useCreateBooking(callbacks = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(API.BOOKINGS, data).then(r => r.data.data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      callbacks.onSuccess?.(...args);
    },
    onError: (...args) => callbacks.onError?.(...args),
  });
}

export function useUpdateBooking(callbacks = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(API.BOOKING(id), data).then(r => r.data.data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      callbacks.onSuccess?.(...args);
    },
    onError: (...args) => callbacks.onError?.(...args),
  });
}

export function useCancelBooking(callbacks = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(API.BOOKING(id)).then(r => r.data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      callbacks.onSuccess?.(...args);
    },
    onError: (...args) => callbacks.onError?.(...args),
  });
}

export function useApproveBooking(callbacks = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.post(API.BOOKING_APPROVE(id), data).then(r => r.data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      callbacks.onSuccess?.(...args);
    },
    onError: (...args) => callbacks.onError?.(...args),
  });
}

export function useRejectBooking(callbacks = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.post(API.BOOKING_REJECT(id), data).then(r => r.data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      callbacks.onSuccess?.(...args);
    },
    onError: (...args) => callbacks.onError?.(...args),
  });
}

export function usePendingApprovals(params = {}) {
  return useQuery({
    queryKey: ['pending-approvals', params],
    queryFn: () => api.get(API.PENDING_APPROVALS, { params }).then(r => r.data),
    staleTime: 30000,
  });
}
