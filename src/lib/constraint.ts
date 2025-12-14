import {
  HomeIcon,
  InfoIcon,
  PlayIcon,
  MessageCircleQuestion,
  History,
} from "lucide-react";

export const App_Info = {
  title: "Tokyo Sounds",
  title_ja: "東京の音",
  subtitle: "Tokyo Sounds is a platform for creating and sharing sounds.",
  description: "Tokyo Sounds is a platform for creating and sharing sounds.",
  image: "./images/default.png",
  logo: "./images/default.png",
  github: "https://github.com/default",
};

export const message = {
  login: {
    success: "Login successful",
    error: "Login failed",
  },
  register: {
    success: "Register successful",
    error: "Register failed",
  },
  logout: {
    success: "Logout successful",
    error: "Logout failed",
  },
  validation: {
    required: "Please fill in all required fields",
    passwordMismatch: "Passwords do not match",
    passwordLength: "Password must be at least 8 characters long",
  },
};

// Form descriptions
export const form = {
  title: {
    login: "Login",
    register: "Register",
  },
  description: {
    login: "Enter your email and password to login",
    register: "Enter your email and password to register",
  },
};

// Labels for form fields
export const labels = {
  username: "Username",
  email: "Email",
  emailVerified: "Email Verified",
  password: "Password",
  confirmPassword: "Confirm Password",
  verified: "Verified",
  notVerified: "Not Verified",
  unspecified: "Unspecified",
  name: "Name",
  firstName: "First Name",
  lastName: "Last Name",
  phone: "Phone",
  address: "Address",
  city: "City",
  country: "Country",
  bio: "Bio",
  description: "Description",
  title: "Title",
  content: "Content",
  search: "Search",
  filter: "Filter",
  sort: "Sort",
};

// Labels for buttons
export const buttons = {
  submit: "Submit",
  cancel: "Cancel",
  confirm: "Confirm",
  delete: "Delete",
  edit: "Edit",
  save: "Save",
  update: "Update",
  create: "Create",
  add: "Add",
  remove: "Remove",
  close: "Close",
  back: "Back",
  backHome: "Back to Home",
  next: "Next",
  previous: "Previous",
  login: "Login",
  logout: "Logout",
  register: "Register",
  signIn: "Sign In",
  signUp: "Sign Up",
  reset: "Reset",
  clear: "Clear",
  search: "Search",
  filter: "Filter",
  apply: "Apply",
  view: "View",
  viewMore: "View More",
  viewLess: "View Less",
  download: "Download",
  upload: "Upload",
  share: "Share",
  copy: "Copy",
  paste: "Paste",
  select: "Select",
  selectAll: "Select All",
  deselect: "Deselect",
  loading: "Loading...",
  continueWithGoogle: "Continue with Google",
  continueWithGitHub: "Continue with GitHub",
};

// Placeholders for input fields
export const placeholders = {
  username: "Enter your username",
  email: "Enter your email",
  password: "Enter your password",
  confirmPassword: "Confirm your password",
  name: "Enter your name",
  search: "Search...",
  filter: "Filter...",
  comment: "Write a comment...",
  message: "Type your message...",
  description: "Enter description...",
  title: "Enter title...",
  url: "Enter URL...",
  phone: "Enter phone number",
  address: "Enter address",
};

// Common text
export const common = {
  loading: "Loading...",
  saving: "Saving...",
  processing: "Processing...",
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Information",
  noData: "No data available",
  noResults: "No results found",
  tryAgain: "Try again",
  retry: "Retry",
  refresh: "Refresh",
  yes: "Yes",
  no: "No",
  or: "Or",
  ok: "OK",
  optional: "Optional",
  required: "Required",
  all: "All",
  none: "None",
  select: "Select",
  selected: "Selected",
  total: "Total",
  page: "Page",
  of: "of",
  items: "items",
  item: "item",
  showing: "Showing",
  to: "to",
  results: "results",
  result: "result",
};

// Navigation text
export const navigationLinks = [
  {
    label: { ja: "ホーム", en: "Home" },
    slug: "",
    icon: HomeIcon,
  },
  {
    label: { ja: "コンセプト", en: "About" },
    slug: "about",
    icon: InfoIcon,
  },
  {
    label: { ja: "開発履歴", en: "Past Versions" },
    slug: "patch",
    icon: History,
  },
  {
    label: { ja: "ヘルプ", en: "Help" },
    slug: "chat",
    icon: MessageCircleQuestion,
  },
];

// Common error messages
export const errors = {
  generic: "An error occurred. Please try again.",
  network: "Network error. Please check your connection.",
  notFound: "The requested resource was not found.",
  unauthorized: "You are not authorized to perform this action.",
  forbidden: "Access forbidden.",
  serverError: "Server error. Please try again later.",
  validationError: "Validation error. Please check your input.",
  invalidInput: "Invalid input. Please check your data.",
  timeout: "Request timeout. Please try again.",
  unknown: "An unknown error occurred.",
  logoutFailed: "Failed to logout. Please try again.",
};

export const pages = {
  profile: {
    title: "Profile",
    description: "View and manage your account information",
  },
  login: {
    title: "Login",
    description: "Login to your account",
  },
  register: {
    title: "Register",
    description: "Create a new account",
  },
  forgotPassword: {
    title: "Forgot Password",
    description: "Reset your password",
  },
  resetPassword: {
    title: "Reset Password",
    description: "Reset your password",
  },
  verifyEmail: {
    title: "Verify Email",
    description: "Verify your email address",
  },
  resendVerificationEmail: {
    title: "Resend Verification Email",
    description: "Resend verification email",
  },
  changePassword: {
    title: "Change Password",
    description: "Change your password",
  },
  updateProfile: {
    title: "Update Profile",
    description: "Update your profile information",
  },
  deleteAccount: {
    title: "Delete Account",
    description: "Delete your account",
  },
  logout: {
    title: "Logout",
    description: "Logout from your account",
  },
  settings: {
    title: "Settings",
    description: "Manage your account settings",
  },
  dashboard: {
    title: "Dashboard",
    description: "View your dashboard",
  },
  admin: {
    title: "Admin",
    description: "Manage your admin account",
  },
  help: {
    title: "Help",
    description: "Get help with your account",
  },
};

export const chatbot = {
  initial: {
    title: "Tokyo Sounds",
    subtitle: "AI チャットボット",
    description:
      "ようこそ。私はTokyo Soundsに関する疑問にお答えする、少し気の利くチャットボットです。ご質問があれば、どうぞお書きください。",
  },
  placeholder: "ご用件は何でしょうか？どうぞご遠慮なく。",
};

export const dataLabels = {
  name: "Name",
  email: "Email",
  emailVerified: "Email Verified",
  verified: "Verified",
  notVerified: "Not Verified",
  phone: "Phone",
  address: "Address",
  city: "City",
  country: "Country",
  bio: "Bio",
  unspecified: "Unspecified",
};

// Confirmation dialog messages
export const confirmations = {
  delete: "Are you sure you want to delete this item?",
  deleteSelected: "Are you sure you want to delete selected items?",
  logout: "Are you sure you want to logout?",
  discardChanges: "Are you sure you want to discard your changes?",
  cancel: "Are you sure you want to cancel?",
  remove: "Are you sure you want to remove this item?",
  reset: "Are you sure you want to reset? All changes will be lost.",
  clear: "Are you sure you want to clear all?",
};

// Member list used in About page
export const MEMBER_LIST = [
  {
    name: "default",
    slug: "default",
    hiragana: "ああああ",
    role: "user",
    email: "default@example.com",
    description: "Default constraint",
    image: "./images/default.png",
    portfolio: "./images/default.png",
    github: "https://github.com/default",
  },
  {
    name: "default",
    slug: "default",
    hiragana: "ああああ",
    role: "user",
    email: "default@example.com",
    description: "Default constraint",
    image: "./images/default.png",
    portfolio: "./images/default.png",
    github: "https://github.com/default",
  },
  {
    name: "default",
    slug: "default",
    hiragana: "ああああ",
    role: "user",
    email: "default@example.com",
    description: "Default constraint",
    image: "./images/default.png",
    portfolio: "./images/default.png",
    github: "https://github.com/default",
  },
  {
    name: "default",
    slug: "default",
    hiragana: "ああああ",
    role: "user",
    email: "default@example.com",
    description: "Default constraint",
    image: "./images/default.png",
    portfolio: "./images/default.png",
    github: "https://github.com/default",
  },
  {
    name: "default",
    slug: "default",
    hiragana: "ああああ",
    role: "user",
    email: "default@example.com",
    description: "Default constraint",
    image: "./images/default.png",
    portfolio: "./images/default.png",
    github: "https://github.com/default",
  },
  {
    name: "default",
    slug: "default",
    hiragana: "ああああ",
    role: "user",
    email: "default@example.com",
    description: "Default constraint",
    image: "./images/default.png",
    portfolio: "./images/default.png",
    github: "https://github.com/default",
  },
];
