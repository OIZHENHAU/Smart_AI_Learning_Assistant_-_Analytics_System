//Where the login lives in the browser. sessionStorage is per tab, so each tab can be logged in as a different
//account and logging out in one tab doesn't affect the others. (It ends when the tab is closed.)
const store = window.sessionStorage;

//Logins used to be kept in localStorage (shared by every tab); remove any left over from before.
window.localStorage.removeItem('token');
window.localStorage.removeItem('user');

export const getToken = () => store.getItem('token');

export const getStoredUser = () => {
    const raw = store.getItem('user');
    return raw ? JSON.parse(raw) : null;
};

export const saveSession = (token, user) => {
    store.setItem('token', token);
    store.setItem('user', JSON.stringify(user));
};

export const saveUser = (user) => store.setItem('user', JSON.stringify(user));

//Only the token, for the register page's temporary token.
export const saveToken = (token) => store.setItem('token', token);

export const clearSession = () => {
    store.removeItem('token');
    store.removeItem('user');
};
