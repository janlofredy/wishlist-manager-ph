import { writable } from 'svelte/store';

const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
const initialUser = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

export const token = writable(initialToken);
export const user = writable(initialUser);
export const wishlists = writable([]);
export const activeWishlistId = writable(null);
export const activeCategoryFilter = writable('All');
export const activeClassificationFilter = writable('All');
export const notifications = writable([]);

export function setAuth(tok, usr) {
  token.set(tok);
  user.set(usr);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(usr));
  }
}

export function logout() {
  token.set(null);
  user.set(null);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
