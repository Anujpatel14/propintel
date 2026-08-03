/**
 * PropIntel Clerk theme — matches globals.css tokens:
 * teal primary (#0f766e), sage ink text, soft borders, Outfit body font.
 */

export const clerkVariables = {
  colorPrimary: '#0f766e',
  colorDanger: '#b91c1c',
  colorSuccess: '#0f766e',
  colorWarning: '#b45309',
  colorText: '#141a17',
  colorTextSecondary: '#5f6d64',
  colorTextOnPrimaryBackground: '#f7faf7',
  colorBackground: '#ffffff',
  colorInputBackground: '#f4f6f3',
  colorInputText: '#141a17',
  colorNeutral: '#849188',
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
    '!rounded-xl !border !border-[var(--border-strong)] !bg-[var(--surface-soft)] !px-3 !py-2.5 !text-sm !text-foreground focus:!border-teal-700 focus:!ring-[3px] focus:!ring-teal-700/20',
  formFieldInputShowPasswordButton: '!text-teal-800',
  formButtonPrimary:
    '!rounded-xl !bg-teal-700 !text-sm !font-bold !shadow-none hover:!bg-teal-800 !normal-case',
  formButtonReset: '!text-teal-800 !text-xs !font-semibold',
  footerActionLink: '!text-teal-800 !font-semibold hover:!underline',
  identityPreviewEditButton: '!text-teal-800 !text-xs !font-semibold',
  identityPreviewText: '!text-sm !font-semibold !text-foreground',
  formFieldSuccessText: '!text-teal-800 !text-xs',
  formFieldErrorText: '!text-red-700 !text-xs',
  formFieldWarningText: '!text-amber-800 !text-xs',
  formFieldHintText: '!text-[var(--muted)] !text-xs',
  alertText: '!text-xs',
  badge: '!rounded-md !bg-teal-700/10 !text-teal-800 !text-[10px] !font-bold !uppercase',
  button: '!rounded-xl !text-xs !font-semibold !normal-case',
  buttonArrowIcon: '!text-teal-800',
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
    navbarButtonActive: '!bg-white !text-teal-900 !shadow-sm !font-bold',
    navbarButtonIcon: '!text-teal-700',
    pageScrollBox: '!p-4 sm:!p-6',
    profileSectionTitleText: '!text-sm !font-bold !text-foreground',
    profileSectionTitle: '!border-b !border-[var(--border)] !pb-2',
    profileSectionContent: '!gap-3',
    profileSectionPrimaryButton:
      '!rounded-xl !border !border-[var(--border)] !bg-white !text-xs !font-bold !text-teal-800 hover:!bg-[var(--surface-soft)]',
    accordionTriggerButton:
      '!rounded-xl hover:!bg-[var(--surface-soft)] !text-sm !font-semibold',
    menuButton: '!rounded-xl !text-teal-800',
    menuList: '!rounded-xl !border !border-[var(--border)] !shadow-[var(--shadow-soft)]',
    menuItem: '!text-xs !font-semibold rounded-lg',
    avatarBox: '!rounded-xl !ring-2 !ring-teal-700/15',
    avatarImageActionsUpload: '!text-teal-800 !text-xs !font-bold',
  },
};

/** Default appearance for ClerkProvider (covers modals / leftovers). */
export const clerkAppearance = {
  variables: clerkVariables,
  elements: sharedElements,
};
