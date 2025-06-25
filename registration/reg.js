document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const errorContainer = document.getElementById('errorContainer');
    const phoneInput = document.getElementById('phone');

    phoneInput.addEventListener('input', function () {
        let value = phoneInput.value.replace(/\D/g, '');
        if (value.startsWith('7')) {
            value = '+' + value;
        } else {
            value = '+7' + value.substring(1);
        }
        if (value.length > 12) {
            value = value.substring(0, 12);
        }
        phoneInput.value = value;
    });

    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors();
        const fullName = document.getElementById('name').value.trim();
        const password = document.getElementById('password').value;
        const gender = document.getElementById('gender').value;
        const phoneNumber = document.getElementById('phone').value.trim();
        const birthDate = document.getElementById('birthdate').value;
        const address = document.getElementById('address').value.trim();
        const email = document.getElementById('email').value.trim();
        if (validateForm(fullName, password, email, address, birthDate, phoneNumber)) {
            submitForm(fullName, password, email, address, birthDate, gender, phoneNumber);
        }
    });

    function clearErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(el => el.innerText = '');
        const errorInputs = document.querySelectorAll('.input-group.error');
        errorInputs.forEach(el => el.classList.remove('error'));
        errorContainer.style.display = 'none';
        errorContainer.innerText = '';
    }

    function validateForm(fullName, password, email, address, birthDate, phoneNumber) {
        let isValid = true;
        if (!fullName) {
            document.getElementById('nameError').innerText = 'Name is required';
            document.getElementById('name').parentElement.classList.add('error');
            isValid = false;
        }
        const passwordRegex = /^(?=.*\d)\S{6,}$/;
        if (!passwordRegex.test(password)) {
            document.getElementById('passwordError').innerText = 'Password must be at least 6 characters long and include at least one number';
            document.getElementById('password').parentElement.classList.add('error');
            isValid = false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            document.getElementById('emailError').innerText = 'Please enter a valid email address';
            document.getElementById('email').parentElement.classList.add('error');
            isValid = false;
        }
        if (!address) {
            document.getElementById('addressError').innerText = 'Address is required';
            document.getElementById('address').parentElement.classList.add('error');
            isValid = false;
        }
        if (!birthDate) {
            document.getElementById('birthdateError').innerText = 'Date of birth is required';
            document.getElementById('birthdate').parentElement.classList.add('error');
            isValid = false;
        }
        if (phoneNumber && !/^\+?[\d\s\-\(\)]{7,}$/.test(phoneNumber)) {
            document.getElementById('phoneError').innerText = 'Please enter a valid phone number';
            document.getElementById('phone').parentElement.classList.add('error');
            isValid = false;
        }
        return isValid;
    }

    function submitForm(fullName, password, email, address, birthDate, gender, phoneNumber) {
        const formData = {
            fullName: fullName,
            password: password,
            email: email,
            address: address,
            birthDate: birthDate + 'T00:00:00.000Z',
            gender: gender,
            phoneNumber: phoneNumber || null
        };

        fetch(`${window.API_BASE_URL}/account/register`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (response.ok) {
                    Swal.fire({
                        title: 'Registration successful!',
                        icon: 'success',
                        timer: 2000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        allowOutsideClick: false
                    }).then(() => {
                        window.location.href = '../login/';
                    });
                }
                else {
                    return response.json().then(errors => {
                        displayServerErrors(errors);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                errorContainer.style.display = 'block';
                errorContainer.innerText = 'An error occurred during registration. Please try again.';
            });
    }

    function displayServerErrors(errors) {
        errorContainer.style.display = 'block';
        if (errors.errors) {
            let errorMessages = [];
            for (const [key, value] of Object.entries(errors.errors)) {
                const errorMessage = Array.isArray(value) ? value.join(' ') : value;
                errorMessages.push(errorMessage);
                const errorElement = document.getElementById(`${key}Error`);
                if (errorElement) {
                    errorElement.innerText = errorMessage;
                    document.getElementById(key).parentElement.classList.add('error');
                }
            }
            errorContainer.innerText = errorMessages.join('\n');
        } else if (errors.message) {
            errorContainer.innerText = errors.message;
        } else {
            errorContainer.innerText = 'Registration failed. Please check your information.';
        }
    }
});
