document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isEmailValid = emailPattern.test(email);
    const isPasswordValid = password.trim() !== '';

    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('errorContainer').textContent = '';

    if (!isEmailValid) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address.';
    }

    if (!isPasswordValid) {
        document.getElementById('passwordError').textContent = 'Password is required.';
    }

    if (!isEmailValid || !isPasswordValid) {
        return;
    }

    const loginData = { email, password };

    fetch(`${window.API_BASE_URL}/account/login`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
        .then(response => {
            if (!response.ok) {
                const errorMessage = response.status === 400
                    ? 'Invalid email or password.'
                    : response.status === 404
                        ? 'User not found.'
                        : response.status === 500
                            ? 'Server error. Please try again later.'
                            : 'An unexpected error occurred. Please try again.';
                throw new Error(errorMessage);
            }
            return response.json();
        })
        .then(data => {
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                const successMessage = document.createElement('div');
                successMessage.textContent = 'Successfully logged in!';
                successMessage.style.color = 'green';
                successMessage.style.textAlign = 'center';
                document.getElementById('errorContainer').appendChild(successMessage);
                setTimeout(() => {
                    window.location.href = '../../index.html';
                }, 1500);
            }
        })
        .catch(error => {
            const errorMessage = document.createElement('div');
            errorMessage.textContent = error.message;
            errorMessage.style.color = 'red';
            errorMessage.style.textAlign = 'center';
            document.getElementById('errorContainer').appendChild(errorMessage);
            document.getElementById('errorContainer').style.display = 'block';
        });
});
