async function initializeProfile() {

    while (!document.getElementById('logout-button')) {
        await new Promise(r => setTimeout(r, 50));
    }

    const API = `${window.API_BASE_URL}/account/profile`;
    const token = localStorage.getItem("authToken");
    if (!token) return window.location.href = '/';

    // Form & elements
    const form = document.getElementById("profileForm");
    const errBox = document.getElementById("errorContainer");
    const nameIn = document.getElementById("name");
    const birthIn = document.getElementById("birthdate");
    const addrIn = document.getElementById("address");
    const phoneIn = document.getElementById("phone");
    const emailIn = document.getElementById("email");
    const genderIn = document.getElementById("gender");
    const logoutBtn = document.getElementById("logout-button");

    function showError(msg) {
        errBox.textContent = msg;
        errBox.style.display = "block";
    }
    function clearError() {
        errBox.style.display = "none";
    }
    async function fetchProfile() {
        try {
            const res = await fetch(API, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });
            if (!res.ok) {
                throw new Error(await res.text() || "Failed to fetch profile");
            }
            const data = await res.json();
            nameIn.value = data.fullName || "";
            emailIn.value = data.email || "";
            genderIn.value = data.gender || "Not specified";
            addrIn.value = data.address || "";
            phoneIn.value = data.phoneNumber || "";
            birthIn.value = data.birthDate
                ? data.birthDate.split("T")[0]
                : "";
        } catch (e) {
            showError(e.message);
        }
    }
    form.addEventListener("submit", async e => {
        e.preventDefault();
        clearError();
        const birthPayload = birthIn.value
            ? new Date(birthIn.value).toISOString()
            : null;

        try {
            const res = await fetch(API, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: nameIn.value.trim(),
                    birthDate: birthPayload,
                    gender: genderIn.value,
                    address: addrIn.value.trim(),
                    phoneNumber: phoneIn.value.trim()
                })
            });
            if (!res.ok) {
                throw new Error(await res.text() || "Update failed");
            }
            Swal.fire("Profile updated successfully!");
            await fetchProfile();
        } catch (e) {
            showError(e.message);
        }
    });

    await fetchProfile();
}

initializeProfile();
