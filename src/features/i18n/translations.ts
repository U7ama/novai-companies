export type Locale = 'en' | 'nl';

export type TranslationDictionary = {
  brand: string;
  dismissNotification: string;
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
    loading: string;
    updating: string;
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
    createdSuccess: string;
    savedSuccess: string;
    saveFailed: string;
    versionReloaded: string;
    reloadFailed: string;
    serverAdopted: string;
    bumpFailed: string;
    bumping: string;
    loading: string;
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
    management: string;
  };
};

export const translations: Record<Locale, TranslationDictionary> = {
  en: {
    brand: 'Novai',
    dismissNotification: 'Dismiss notification',
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
      clearFilters: 'Clear all filters',
      loading: 'Loading companies',
      updating: 'Updating company data'
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
      domainInvalid: 'Domain must be a valid domain name (e.g. domain.com).',
      createdSuccess: 'Company created.',
      savedSuccess: 'Changes saved.',
      saveFailed: 'Could not save changes. Please try again.',
      versionReloaded: 'Latest version loaded. Your draft is preserved.',
      reloadFailed: 'Could not load the latest version. Your draft is preserved.',
      serverAdopted: 'Server values loaded.',
      bumpFailed: 'Could not simulate a concurrent edit.',
      bumping: 'Updating...',
      loading: 'Loading company details'
    },
    auth: {
      title: 'Sign in to Novai CRM',
      subtitle: 'Enter any non-empty token to try the Companies demo.',
      tokenLabel: 'Access Token',
      tokenPlaceholder: 'e.g. dev-token-123',
      signInButton: 'Sign In',
      quickFill: 'Quick Fill Dev Token',
      signOut: 'Sign Out',
      tokenRequired: 'Please enter a valid token.',
      management: 'B2B Companies Management'
    }
  },
  nl: {
    brand: 'Novai',
    dismissNotification: 'Melding sluiten',
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
      clearFilters: 'Alle filters wissen',
      loading: 'Bedrijven laden',
      updating: 'Bedrijfsgegevens bijwerken'
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
      simulateConflictSuccess:
        'Serverversie verhoogd! Volgende opslag zal een 409-conflict veroorzaken.',
      nameRequired: 'Bedrijfsnaam is verplicht en mag niet leeg zijn.',
      domainInvalid: 'Domein moet een geldige domeinnaam zijn (bijv. domein.nl).',
      createdSuccess: 'Bedrijf aangemaakt.',
      savedSuccess: 'Wijzigingen opgeslagen.',
      saveFailed: 'Opslaan mislukt. Probeer het opnieuw.',
      versionReloaded: 'Nieuwste versie geladen. Uw invoer is behouden.',
      reloadFailed: 'Laden van de nieuwste versie mislukt. Uw invoer is behouden.',
      serverAdopted: 'Serverwaarden geladen.',
      bumpFailed: 'Gelijktijdige bewerking simuleren mislukt.',
      bumping: 'Bijwerken...',
      loading: 'Bedrijfsgegevens laden'
    },
    auth: {
      title: 'Inloggen bij Novai CRM',
      subtitle: 'Voer een token in om de bedrijvendemo te proberen.',
      tokenLabel: 'Toegangstoken',
      tokenPlaceholder: 'bijv. dev-token-123',
      signInButton: 'Inloggen',
      quickFill: 'Vul demo-token in',
      signOut: 'Uitloggen',
      tokenRequired: 'Voer een geldig token in.',
      management: 'Beheer van B2B-bedrijven'
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
