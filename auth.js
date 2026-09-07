document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('loggedInRole');
    const header = document.querySelector('.header');
    
    if (role && header) {
        // Find the login/signup button
        const authBtn = header.querySelector('.btn-primary');
        if (authBtn && (authBtn.textContent.includes('Login') || authBtn.textContent.includes('Sign Up'))) {
            // Create user profile wrapper
            const userProfile = document.createElement('div');
            userProfile.style.display = 'flex';
            userProfile.style.alignItems = 'center';
            userProfile.style.gap = '15px';
            
            // Add the role name
            const roleBadge = document.createElement('span');
            roleBadge.textContent = 'Role: ' + role;
            roleBadge.style.fontWeight = 'bold';
            roleBadge.style.color = '#ff6b6b';
            roleBadge.style.fontSize = '14px';
            roleBadge.style.textTransform = 'uppercase';
            
            // Add the logout button
            const logoutBtn = document.createElement('a');
            logoutBtn.href = '#';
            logoutBtn.textContent = 'Logout';
            logoutBtn.className = 'btn-primary btn-sm';
            logoutBtn.style.backgroundColor = '#333';
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('loggedInRole');
                window.location.href = 'index.html';
            });
            
            userProfile.appendChild(roleBadge);
            userProfile.appendChild(logoutBtn);
            
            authBtn.replaceWith(userProfile);
        }
    }
});
