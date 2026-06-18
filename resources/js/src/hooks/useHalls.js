import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { API } from '../api/endpoints';

export function useHalls(params = {}) {
  return useQuery({
    queryKey: ['halls', params],
    queryFn: () => api.get(API.HALLS, { params }).then(r => r.data),
    staleTime: 60000,
  });
}

export function useHall(id, options = {}) {
  return useQuery({
    queryKey: ['halls', id],
    queryFn: () => api.get(API.HALL(id)).then(r => r.data.data),
    enabled: !!id,
    ...options,
  });
}

export function useHallAvailability(id, params) {
  return useQuery({
    queryKey: ['hall-availability', id, params],
    queryFn: () => api.get(API.HALL_AVAILABILITY(id), { params }).then(r => r.data),
    enabled: !!id && !!params?.date && !!params?.start_time && !!params?.end_time,
  });
}

export function useCreateHall(callbacks = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(API.HALLS, data).then(r => r.data.data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['halls'] });
      callbacks.onSuccess?.(...args);
    },
    onError: (...args) => callbacks.onError?.(...args),
  });
}

export function useUpdateHall(callbacks = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(API.HALL(id), data).then(r => r.data.data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['halls'] });
      callbacks.onSuccess?.(...args);
    },
    onError: (...args) => callbacks.onError?.(...args),
  });
}

export function useDeleteHall(callbacks = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(API.HALL(id)).then(r => r.data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['halls'] });
      callbacks.onSuccess?.(...args);
    },
    onError: (...args) => callbacks.onError?.(...args),
  });
}
