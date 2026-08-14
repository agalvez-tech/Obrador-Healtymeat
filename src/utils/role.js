const ROLE_KEY = 'hm-reparto-role'

export function getRole() {
  return localStorage.getItem(ROLE_KEY)
}

export function setRole(role) {
  localStorage.setItem(ROLE_KEY, role)
}

export function clearRole() {
  localStorage.removeItem(ROLE_KEY)
}
