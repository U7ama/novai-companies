export type Locale = 'en' | 'nl';

export type TranslationDictionary = {
  brand: string;
  companies: string;
  companiesSubtitle: string;
  searchPlaceholder: string;
  allStatuses: string;
  status: {
    new: string;
    researching: string;
    contacted: string;
    qualified: string;
    rejected: string;
  };
  table: {
    name: string;
    domain: string;
    status: string;
    created: string;
    noDomain: string;
    emptyTitle: string;
    emptyDescription: string;
    errorTitle: string;
    errorDescription: string;
    retry: string;
    clearFilters: string;
  };
  pagination: {
    showing: string;
    to: string;
    of: string;
    previous: string;
    next: string;
  };
  drawer: {
    createTitle: string;
    createDescription: string;
    editTitle: string;
    editDescription: string;
    nameLabel: string;
    namePlaceholder: string;
    domainLabel: string;
    domainPlaceholder: string;
    statusLabel: string;
    versionLabel: string;
    createdLabel: string;
    updatedLabel: string;
    cancel: string;
    create: string;
    save: string;
    saving: string;
    notFoundTitle: string;
    notFoundDescription: string;
    errorTitle: string;
    conflictAlertTitle: string;
    conflictAlertDescription: string;
    reloadLatest: string;
    adoptServer: string;
    simulateConflict: string;
    simulateConflictSuccess: string;
    nameRequired: string;
    domainInvalid: string;
  };
  auth: {
    title: string;
    subtitle: string;
    tokenLabel: string;
    tokenPlaceholder: string;
    signInButton: string;
    quickFill: string;
    signOut: string;
    tokenRequired: string;
  };
};

export const translations: Record<Locale, TranslationDictionary> = {
  en: {
    brand: 'Novai',
    companies: 'Companies',
    companiesSubtitle: 'Manage and track sales accounts and pipeline companies.',
    searchPlaceholder: 'Search by company name or domain...',
    allStatuses: 'All statuses',
    status: {
      new: 'New',
      researching: 'Researching',
      contacted: 'Contacted',
      qualified: 'Qualified',
      rejected: 'Rejected'
    },
    table: {
      name: 'Company Name',
      domain: 'Domain',
      status: 'Status',
      created: 'Created',
      noDomain: 'No domain',
      emptyTitle: 'No companies found',
      emptyDescription: 'Try adjusting your search query or filters, or add a new company.',
      errorTitle: 'Failed to load companies',
      errorDescription: 'There was an error communicating with the API.',
      retry: 'Retry',
      clearFilters: 'Clear all filters'
    },
    pagination: {
      showing: 'Showing',
      to: 'to',
      of: 'of',
      previous: 'Previous',
      next: 'Next'
    },
    drawer: {
      createTitle: 'Create Company',
      createDescription: 'Add a new company to your sales pipeline.',
      editTitle: 'Company Details',
      editDescription: 'Inspect and edit company record information.',
      nameLabel: 'Company Name',
      namePlaceholder: 'e.g. Acme Corporation',
      domainLabel: 'Domain',
      domainPlaceholder: 'e.g. acme.com',
      statusLabel: 'Status',
      versionLabel: 'Current Version',
      createdLabel: 'Created At',
      updatedLabel: 'Last Updated',
      cancel: 'Cancel',
      create: 'Create Company',
      save: 'Save Changes',
      saving: 'Saving...',
      notFoundTitle: 'Company Not Found',
      notFoundDescription: 'The requested company could not be found or has been removed.',
      errorTitle: 'Error Loading Details',
      conflictAlertTitle: 'Concurrent Modification Detected (409 Conflict)',
      conflictAlertDescription:
        'This company was modified by someone else since you opened it. Your draft values have been preserved in the form fields. Click "Reload latest version" to update the concurrency version without losing your changes.',
      reloadLatest: 'Reload latest version',
      adoptServer: 'Adopt server values',
      simulateConflict: 'Simulate Concurrent Edit',
      simulateConflictSuccess: 'Server version bumped! Next save will trigger a 409 conflict.',
      nameRequired: 'Company name is required and cannot be empty.',
      domainInvalid: 'Domain must be a valid domain name (e.g. domain.com).'
    },
    auth: {
      title: 'Sign in to Novai CRM',
      subtitle: 'Enter a Bearer token to access the multi-tenant organization companies API.',
      tokenLabel: 'Access Token',
      tokenPlaceholder: 'e.g. dev-token-123',
      signInButton: 'Sign In',
      quickFill: 'Quick Fill Dev Token',
      signOut: 'Sign Out',
      tokenRequired: 'Please enter a valid token.'
    }
  },
  nl: {
    brand: 'Novai',
    companies: 'Bedrijven',
    companiesSubtitle: 'Beheer en volg verkoopaccounts en pipelinebedrijven.',
    searchPlaceholder: 'Zoek op bedrijfsnaam of domein...',
    allStatuses: 'Alle statussen',
    status: {
      new: 'Nieuw',
      researching: 'Onderzoek',
      contacted: 'Benaderd',
      qualified: 'Gekwalificeerd',
      rejected: 'Afgewezen'
    },
    table: {
      name: 'Bedrijfsnaam',
      domain: 'Domein',
      status: 'Status',
      created: 'Aangemaakt',
      noDomain: 'Geen domein',
      emptyTitle: 'Geen bedrijven gevonden',
      emptyDescription: 'Pas uw zoekopdracht of filters aan, of voeg een nieuw bedrijf toe.',
      errorTitle: 'Fout bij het laden van bedrijven',
      errorDescription: 'Er is een fout opgetreden bij de communicatie met de API.',
      retry: 'Opnieuw proberen',
      clearFilters: 'Alle filters wissen'
    },
    pagination: {
      showing: 'Weergave',
      to: 'tot',
      of: 'van',
      previous: 'Vorige',
      next: 'Volgende'
    },
    drawer: {
      createTitle: 'Bedrijf aanmaken',
      createDescription: 'Voeg een nieuw bedrijf toe aan uw sales pipeline.',
      editTitle: 'Bedrijfsgegevens',
      editDescription: 'Bekijk en bewerk bedrijfsinformatie.',
      nameLabel: 'Bedrijfsnaam',
      namePlaceholder: 'bijv. Acme Corporation',
      domainLabel: 'Domein',
      domainPlaceholder: 'bijv. acme.nl',
      statusLabel: 'Status',
      versionLabel: 'Huidige versie',
      createdLabel: 'Aangemaakt op',
      updatedLabel: 'Laatst bijgewerkt',
      cancel: 'Annuleren',
      create: 'Bedrijf aanmaken',
      save: 'Wijzigingen opslaan',
      saving: 'Opslaan...',
      notFoundTitle: 'Bedrijf niet gevonden',
      notFoundDescription: 'Het opgevraagde bedrijf kon niet worden gevonden of is verwijderd.',
      errorTitle: 'Fout bij laden van gegevens',
      conflictAlertTitle: 'Gelijktijdige wijziging gedetecteerd (409 Conflict)',
      conflictAlertDescription:
        'Dit bedrijf is gewijzigd door iemand anders sinds u het opende. Uw getypte waarden zijn behouden in de formuliervelden. Klik op "Herlaad nieuwste versie" om het versienummer bij te werken zonder uw invoer te verliezen.',
      reloadLatest: 'Herlaad nieuwste versie',
      adoptServer: 'Neem serverwaarden over',
      simulateConflict: 'Simuleer gelijktijdige bewerking',
      simulateConflictSuccess: 'Serverversie verhoogd! Volgende opslag zal een 409-conflict veroorzaken.',
      nameRequired: 'Bedrijfsnaam is verplicht en mag niet leeg zijn.',
      domainInvalid: 'Domein moet een geldige domeinnaam zijn (bijv. domein.nl).'
    },
    auth: {
      title: 'Inloggen bij Novai CRM',
      subtitle: 'Voer een Bearer-token in om toegang te krijgen tot de API.',
      tokenLabel: 'Toegangstoken',
      tokenPlaceholder: 'bijv. dev-token-123',
      signInButton: 'Inloggen',
      quickFill: 'Vul demo-token in',
      signOut: 'Uitloggen',
      tokenRequired: 'Voer een geldig token in.'
    }
  }
} as const;

export function formatDate(isoString: string, locale: Locale): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return isoString;
  }
}
