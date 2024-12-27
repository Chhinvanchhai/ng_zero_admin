/* Define constants */

// Prefix for the token in the request header
export const TokenPre = 'Bearer ';
// Key for the token
export const TokenKey = 'Authorization';
// Key for theme settings
export const ThemeOptionsKey = 'ThemeOptionsKey';
// Key for theme style modes, including Aliyun, Compact, Default, and Dark
export const StyleThemeModelKey = 'StyleThemeModelKey';
// Key to record whether it's the first login
export const IsFirstLogin = 'IsFirstLogin';
// Key for screen lock
export const LockedKey = 'LockedKey';
// Salt for encryption
export const salt = 'EIpWsyfiy@R@X#qn17!StJNdZK1fFF8iV6ffN!goZkqt#JxO';

// Code for login timeout, prompts a login dialog
export const loginTimeOutCode = 1012;
// Code for token error, prompts re-login
export const tokenErrorCode = 1010;

// Maximum width for the left menu to switch to "over" mode
export const SideCollapsedMaxWidth = 700;
// Maximum width for the top menu to switch to "over" mode
export const TopCollapsedMaxWidth = 1247;

// Width of the left menu
export const SideNavWidth = 208; // If modified, synchronize with @left-nav-width
// Width of the left menu in collapsed state
export const CollapsedNavWidth = 48; // If modified, synchronize with @collapsed-nav-width
