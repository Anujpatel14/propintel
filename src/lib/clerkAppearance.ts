/**
 * PropIntel Clerk theme — matches landing + dashboard cobalt/ice system.
 */

export const clerkVariables = {
  colorPrimary: '#1d4ed8',
  colorDanger: '#b91c1c',
  colorSuccess: '#1d4ed8',
  colorWarning: '#b45309',
  colorText: '#0b1220',
  colorTextSecondary: '#5b6578',
  colorTextOnPrimaryBackground: '#f8fafc',
  colorBackground: '#ffffff',
  colorInputBackground: '#f3f6fb',
  colorInputText: '#0b1220',
  colorNeutral: '#94a3b8',
  borderRadius: '0.85rem',
  fontFamily: 'var(--font-body), Outfit, system-ui, sans-serif',
  fontFamilyButtons: 'var(--font-body), Outfit, system-ui, sans-serif',
  fontSize: '0.875rem',
  fontWeight: {
    normal: 400,
    medium: 500,
    bold: 650,
  },
} as const;

const sharedElements = {
  rootBox: 'w-full font-sans',
  cardBox: 'w-full shadow-none',
  card: 'w-full !rounded-2xl !border !border-[var(--border)] !bg-white !shadow-none',
  headerTitle: '!text-base !font-bold !text-foreground !tracking-tight',
  headerSubtitle: '!text-xs !text-[var(--muted)]',
  socialButtonsBlockButton:
    '!rounded-xl !border !border-[var(--border)] !bg-white !text-sm !font-semibold !text-foreground hover:!bg-[var(--surface-soft)]',
  socialButtonsBlockButtonText: '!font-semibold',
  dividerLine: '!bg-[var(--border)]',
  dividerText: '!text-[10px] !font-bold !uppercase !tracking-wider !text-[var(--muted)]',
  formFieldLabel:
    '!text-[10px] !font-bold !uppercase !tracking-wider !text-[var(--muted)]',
  formFieldInput:
    '!rounded-xl !border !border-[var(--border-strong)] !bg-[var(--surface-soft)] !px-3 !py-2.5 !text-sm !text-foreground focus:!border-[#1d4ed8] focus:!ring-[3px] focus:!ring-[#1d4ed8]/20',
  formFieldInputShowPasswordButton: '!text-[#1d4ed8]',
  formButtonPrimary:
    '!rounded-xl !bg-[#1d4ed8] !text-sm !font-bold !shadow-none hover:!bg-[#1639a8] !normal-case',
  formButtonReset: '!text-[#1d4ed8] !text-xs !font-semibold',
  footerActionLink: '!text-[#1d4ed8] !font-semibold hover:!underline',
  identityPreviewEditButton: '!text-[#1d4ed8] !text-xs !font-semibold',
  identityPreviewText: '!text-sm !font-semibold !text-foreground',
  formFieldSuccessText: '!text-[#1d4ed8] !text-xs',
  formFieldErrorText: '!text-red-700 !text-xs',
  formFieldWarningText: '!text-amber-800 !text-xs',
  formFieldHintText: '!text-[var(--muted)] !text-xs',
  alertText: '!text-xs',
  badge: '!rounded-md !bg-[#1d4ed8]/10 !text-[#1639a8] !text-[10px] !font-bold !uppercase',
  button: '!rounded-xl !text-xs !font-semibold !normal-case',
  buttonArrowIcon: '!text-[#1d4ed8]',
} as const;

/** Sign-in / Sign-up — compact auth cards (headers hidden; page supplies brand). */
export const clerkAuthAppearance = {
  variables: clerkVariables,
  elements: {
    ...sharedElements,
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    footerAction: 'hidden',
    footer: 'hidden',
  },
};

/** UserProfile / account manager inside dashboard settings. */
export const clerkUserProfileAppearance = {
  variables: clerkVariables,
  elements: {
    ...sharedElements,
    rootBox: 'w-full max-w-none font-sans',
    cardBox: 'w-full !shadow-none',
    card: 'w-full !rounded-2xl !border-0 !bg-transparent !shadow-none',
    scrollBox: '!rounded-2xl !bg-white !border !border-[var(--border)]',
    navbar:
      '!rounded-2xl !border !border-[var(--border)] !bg-[var(--surface-soft)] !p-2 !shadow-none',
    navbarButton:
      '!rounded-xl !text-xs !font-semibold !text-[var(--muted)] hover:!bg-white hover:!text-foreground',
    navbarButtonActive: '!bg-white !text-[#0b1220] !shadow-sm !font-bold',
    navbarButtonIcon: '!text-[#1d4ed8]',
    pageScrollBox: '!p-4 sm:!p-6',
    profileSectionTitleText: '!text-sm !font-bold !text-foreground',
    profileSectionTitle: '!border-b !border-[var(--border)] !pb-2',
    profileSectionContent: '!gap-3',
    profileSectionPrimaryButton:
      '!rounded-xl !border !border-[var(--border)] !bg-white !text-xs !font-bold !text-[#1d4ed8] hover:!bg-[var(--surface-soft)]',
    accordionTriggerButton:
      '!rounded-xl hover:!bg-[var(--surface-soft)] !text-sm !font-semibold',
    menuButton: '!rounded-xl !text-[#1d4ed8]',
    menuList: '!rounded-xl !border !border-[var(--border)] !shadow-[var(--shadow-soft)]',
    menuItem: '!text-xs !font-semibold rounded-lg',
    avatarBox: '!rounded-xl !ring-2 !ring-[#1d4ed8]/15',
    avatarImageActionsUpload: '!text-[#1d4ed8] !text-xs !font-bold',
  },
};

/** Default appearance for ClerkProvider (covers modals / leftovers). */
export const clerkAppearance = {
  variables: clerkVariables,
  elements: sharedElements,
};
