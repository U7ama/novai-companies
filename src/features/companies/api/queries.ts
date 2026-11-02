import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import { ApiError, companiesApi, type ListCompaniesParams } from './client';

const retryQuery = (failureCount: number, error: Error) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2;

export const companiesKeys = {
  all: ['companies'] as const,
  lists: () => [...companiesKeys.all, 'list'] as const,
  list: (params: ListCompaniesParams) => [...companiesKeys.lists(), params] as const,
  details: () => [...companiesKeys.all, 'detail'] as const,
  detail: (id: string) => [...companiesKeys.details(), id] as const
};

export function listCompaniesOptions(params: ListCompaniesParams) {
  return queryOptions({
    queryKey: companiesKeys.list(params),
    queryFn: () => companiesApi.list(params),
    placeholderData: keepPreviousData,
    retry: retryQuery
  });
}

export function companyDetailOptions(id: string) {
  return queryOptions({
    queryKey: companiesKeys.detail(id),
    queryFn: () => companiesApi.getById(id),
    retry: retryQuery
  });
}
