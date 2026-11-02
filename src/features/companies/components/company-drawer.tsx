'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useLanguage } from '@/features/i18n/i18n-context';
import { formatDate } from '@/features/i18n/translations';
import { companyDetailOptions, companiesKeys } from '../api/queries';
import { companiesApi, ApiError } from '../api/client';
import { createCompanySchema, validationErrors } from '../validation';
import type { Company, CompanyStatus } from '../types';

interface CompanyDrawerProps {
  companyId: string | null;
  isCreate: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: CompanyStatus[] = [
  'new',
  'researching',
  'contacted',
  'qualified',
  'rejected'
];

interface CompanyFormProps {
  company: Company | null;
  isCreate: boolean;
  onClose: () => void;
}

function CompanyForm({ company, isCreate, onClose }: CompanyFormProps) {
  const { locale, t } = useLanguage();
  const queryClient = useQueryClient();

  // Form draft state initialized from prop (remounts on key change)
  const [name, setName] = useState(company?.name ?? '');
  const [domain, setDomain] = useState(company?.domain ?? '');
  const [status, setStatus] = useState<CompanyStatus>(company?.status ?? 'new');
  const [formVersion, setFormVersion] = useState<number>(company?.version ?? 1);

  // Error & conflict state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConflict, setIsConflict] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = { name: name.trim(), domain: domain.trim() || null, status };
      if (isCreate) return companiesApi.create(body);
      if (!company) throw new Error('Missing company');
      return companiesApi.update(company.id, { ...body, if_version: formVersion });
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(companiesKeys.detail(updated.id), updated);
      await queryClient.invalidateQueries({ queryKey: companiesKeys.lists() });
      toast.success(isCreate ? t.drawer.createdSuccess : t.drawer.savedSuccess);
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setIsConflict(true);
      } else if (err instanceof ApiError && err.status === 422) {
        setErrors(err.errors ?? { name: err.message });
      } else {
        toast.error(t.drawer.saveFailed);
      }
    }
  });
  const bumpMutation = useMutation({
    mutationFn: () => companiesApi.bumpVersion(company!.id),
    onSuccess: () => toast.warning(t.drawer.simulateConflictSuccess),
    onError: () => toast.error(t.drawer.bumpFailed)
  });
  const isPending = saveMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || isReloading) return;
    const parsed = createCompanySchema.safeParse({ name, domain, status });
    if (!parsed.success) {
      const nextErrors = validationErrors(parsed.error);
      if (nextErrors.name) nextErrors.name = t.drawer.nameRequired;
      if (nextErrors.domain) nextErrors.domain = t.drawer.domainInvalid;
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    saveMutation.mutate();
  };

  const handleReloadLatest = async () => {
    if (!company) return;
    setIsReloading(true);
    try {
      const fresh = await queryClient.fetchQuery({
        ...companyDetailOptions(company.id),
        staleTime: 0
      });
      // Synchronize version without overwriting user's typed changes
      setFormVersion(fresh.version);
      setIsConflict(false);
      toast.info(t.drawer.versionReloaded);
    } catch {
      toast.error(t.drawer.reloadFailed);
    } finally {
      setIsReloading(false);
    }
  };

  const handleAdoptServerValues = async () => {
    if (!company) return;
    setIsReloading(true);
    try {
      const fresh = await queryClient.fetchQuery({
        ...companyDetailOptions(company.id),
        staleTime: 0
      });
      setName(fresh.name);
      setDomain(fresh.domain ?? '');
      setStatus(fresh.status);
      setFormVersion(fresh.version);
      setIsConflict(false);
      setErrors({});
      toast.info(t.drawer.serverAdopted);
    } catch {
      toast.error(t.drawer.reloadFailed);
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <>
      <form id='company-form' onSubmit={handleSubmit} className='p-6 space-y-5 flex-1'>
        {/* 409 Conflict Banner */}
        {isConflict && (
          <div
            role='alert'
            aria-live='assertive'
            className='rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 space-y-3'
          >
            <div className='flex items-start gap-2.5'>
              <Icons.warning className='h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
              <div>
                <h4 className='text-sm font-semibold'>{t.drawer.conflictAlertTitle}</h4>
                <p className='text-xs text-muted-foreground dark:text-amber-300/80 mt-1'>
                  {t.drawer.conflictAlertDescription}
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2 pt-1'>
              <Button
                type='button'
                size='sm'
                variant='default'
                onClick={handleReloadLatest}
                disabled={isReloading || isPending}
                className='h-8 text-xs font-medium'
              >
                <Icons.checks className='mr-1.5 h-3.5 w-3.5' />
                {t.drawer.reloadLatest}
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={handleAdoptServerValues}
                disabled={isReloading || isPending}
                className='h-8 text-xs font-medium'
              >
                {t.drawer.adoptServer}
              </Button>
            </div>
          </div>
        )}

        {/* Name Input */}
        <div className='space-y-1.5'>
          <Label htmlFor='company-name' className='text-xs font-semibold'>
            {t.drawer.nameLabel} <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='company-name'
            name='name'
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: '' }));
              }
            }}
            placeholder={t.drawer.namePlaceholder}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={errors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''}
          />
          {errors.name && (
            <p id='name-error' role='alert' className='text-xs font-medium text-destructive'>
              {errors.name}
            </p>
          )}
        </div>

        {/* Domain Input */}
        <div className='space-y-1.5'>
          <Label htmlFor='company-domain' className='text-xs font-semibold'>
            {t.drawer.domainLabel}
          </Label>
          <Input
            id='company-domain'
            name='domain'
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              if (errors.domain) {
                setErrors((prev) => ({ ...prev, domain: '' }));
              }
            }}
            placeholder={t.drawer.domainPlaceholder}
            aria-invalid={Boolean(errors.domain)}
            aria-describedby={errors.domain ? 'domain-error' : undefined}
            className={errors.domain ? 'border-destructive focus-visible:ring-destructive/30' : ''}
          />
          {errors.domain && (
            <p id='domain-error' role='alert' className='text-xs font-medium text-destructive'>
              {errors.domain}
            </p>
          )}
        </div>

        {/* Status Select */}
        <div className='space-y-1.5'>
          <Label htmlFor='company-status' className='text-xs font-semibold'>
            {t.drawer.statusLabel}
          </Label>
          <NativeSelect
            id='company-status'
            name='status'
            value={status}
            onChange={(e) => setStatus(e.target.value as CompanyStatus)}
            className='w-full'
          >
            {STATUS_OPTIONS.map((opt) => (
              <NativeSelectOption key={opt} value={opt}>
                {t.status[opt]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {/* Readonly Metadata in Edit Mode */}
        {!isCreate && company && (
          <div className='rounded-lg border bg-muted/20 p-3.5 space-y-2 text-xs text-muted-foreground'>
            <div className='flex justify-between items-center'>
              <span>{t.drawer.versionLabel}:</span>
              <span className='font-mono font-medium text-foreground'>v{formVersion}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span>{t.drawer.createdLabel}:</span>
              <span className='text-foreground'>{formatDate(company.created_at, locale)}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span>{t.drawer.updatedLabel}:</span>
              <span className='text-foreground'>{formatDate(company.updated_at, locale)}</span>
            </div>

            <div className='pt-2 border-t'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => bumpMutation.mutate()}
                disabled={bumpMutation.isPending || isPending || isReloading}
                className='w-full h-8 text-xs text-muted-foreground hover:text-foreground'
              >
                <Icons.edit className='mr-1.5 h-3.5 w-3.5' />
                {bumpMutation.isPending ? t.drawer.bumping : t.drawer.simulateConflict}
              </Button>
            </div>
          </div>
        )}
      </form>

      <SheetFooter className='p-4 sm:p-6 border-t bg-muted/10 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={onClose}
          disabled={isPending || isReloading}
        >
          {t.drawer.cancel}
        </Button>
        <Button
          type='submit'
          form='company-form'
          disabled={isPending || isReloading}
          className='font-medium'
        >
          {isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
          {isCreate ? t.drawer.create : t.drawer.save}
        </Button>
      </SheetFooter>
    </>
  );
}

export function CompanyDrawer({ companyId, isCreate, onClose }: CompanyDrawerProps) {
  const { t } = useLanguage();

  const isOpen = Boolean(isCreate || companyId);
  const isEdit = Boolean(companyId);

  // Query company details when in edit mode
  const {
    data: company,
    isLoading,
    isError,
    error: queryError,
    refetch
  } = useQuery({
    ...companyDetailOptions(companyId ?? ''),
    enabled: isEdit && !!companyId
  });

  const is404 = isError && queryError instanceof ApiError && queryError.status === 404;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side='right'
        className='data-[side=right]:w-full sm:data-[side=right]:max-w-lg p-0 flex flex-col justify-between overflow-y-auto'
        aria-modal='true'
      >
        <SheetHeader className='p-6 border-b'>
          <SheetTitle className='text-lg font-semibold'>
            {isCreate ? t.drawer.createTitle : t.drawer.editTitle}
          </SheetTitle>
          <SheetDescription className='text-xs text-muted-foreground'>
            {isCreate ? t.drawer.createDescription : t.drawer.editDescription}
          </SheetDescription>
        </SheetHeader>

        {isEdit && isError && company && (
          <div role='alert' className='px-6 text-sm text-destructive'>
            {t.drawer.reloadFailed}
            <Button variant='link' onClick={() => refetch()}>
              {t.table.retry}
            </Button>
          </div>
        )}
        {isEdit && isLoading ? (
          <div className='p-6 space-y-5 flex-1' role='status' aria-label={t.drawer.loading}>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-9 w-full' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-9 w-full' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-9 w-full' />
            </div>
          </div>
        ) : isEdit && is404 && !company ? (
          <div
            className='p-6 text-center space-y-4 flex-1 flex flex-col items-center justify-center'
            role='alert'
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
              <Icons.alertCircle className='h-6 w-6' />
            </div>
            <h3 className='text-base font-semibold'>{t.drawer.notFoundTitle}</h3>
            <p className='text-sm text-muted-foreground max-w-xs'>{t.drawer.notFoundDescription}</p>
            <Button variant='outline' onClick={onClose}>
              {t.drawer.cancel}
            </Button>
          </div>
        ) : isEdit && isError && !company ? (
          <div
            className='p-6 text-center space-y-4 flex-1 flex flex-col items-center justify-center'
            role='alert'
          >
            <Icons.alertCircle className='h-10 w-10 text-destructive' />
            <h3 className='text-base font-semibold'>{t.drawer.errorTitle}</h3>
            <p className='text-sm text-muted-foreground'>
              {queryError instanceof Error ? queryError.message : t.drawer.errorTitle}
            </p>
            <Button variant='outline' onClick={() => refetch()}>
              <Icons.toastWarning className='mr-2 h-4 w-4' />
              {t.table.retry}
            </Button>
          </div>
        ) : (
          <CompanyForm
            key={isCreate ? 'create' : (company?.id ?? 'none')}
            company={isCreate ? null : (company ?? null)}
            isCreate={isCreate}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
