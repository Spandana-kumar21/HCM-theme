document.addEventListener("DOMContentLoaded", function () {

  const firstName = document.getElementById("first_name");
  const lastName = document.getElementById("last_name");
  const email = document.getElementById("email");
  const password = document.getElementById("create_password");
  const terms = document.getElementById("terms");
  const submitBtn = document.getElementById("create-account-button");

  const firstNameError = document.getElementById("first-name-error");
  const lastNameError = document.getElementById("last-name-error");
  const emailError = document.getElementById("email-error");
  const passwordWeak = document.getElementById("password-weak");
  const passwordWeakCustom = document.getElementById("password-weak-custom");
  const customErrorMessage = document.querySelector(".custom-error-message");

  const nameRegex = /^[A-Z][a-zA-Z]*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- Disable Button Initially ---------- */

  submitBtn.disabled = true;
  submitBtn.style.opacity = "0.5";
  submitBtn.style.cursor = "not-allowed";

  function show(el) {
    el.classList.remove("hide_element");
  }

  function hide(el) {
    el.classList.add("hide_element");
  }

  /* ---------- Submit Button Validation ---------- */

  function updateSubmitButton() {

    const isFirstNameValid = nameRegex.test(firstName.value.trim());
    const isLastNameValid = nameRegex.test(lastName.value.trim());
    const isEmailValid = emailRegex.test(email.value.trim());

    const isPasswordValid =
      password.value.length >= 8 &&
      /[a-z]/.test(password.value) &&
      /[A-Z]/.test(password.value) &&
      /[0-9]/.test(password.value) &&
      /[!@#$%^&*()_\-+=\[\]{};':\"\\|,.<>/?]/.test(password.value);

    const isTermsChecked = terms.checked;

    if (isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid && isTermsChecked) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
    } else {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.5";
      submitBtn.style.cursor = "not-allowed";
    }
  }
 
  /* ---------- First Name ---------- */

  function getNameErrorMessage(value, errorEl) {
    const alphaMessage = errorEl.dataset.errorAlpha || errorEl.textContent;
    const capitalMessage = errorEl.dataset.errorCapital || alphaMessage;

    if (/[^a-zA-Z]/.test(value)) {
      return alphaMessage;
    }

    if (/^[a-z]/.test(value)) {
      return capitalMessage;
    }

    return alphaMessage;
  }

  function validateFirstName() {
    const value = firstName.value.trim();

    if (value === "") {
      hide(firstNameError);
      updateSubmitButton();
      return;
    }

    if (nameRegex.test(value)) {
      hide(firstNameError);
    } else {
      firstNameError.textContent = getNameErrorMessage(value, firstNameError);
      show(firstNameError);
    }

    updateSubmitButton();
  }

  firstName.addEventListener("input", validateFirstName);
  firstName.addEventListener("blur", validateFirstName);

  /* ---------- Last Name ---------- */

  function validateLastName() {
    const value = lastName.value.trim();

    if (value === "") {
      hide(lastNameError);
      updateSubmitButton();
      return;
    }

    if (nameRegex.test(value)) {
      hide(lastNameError);
    } else {
      lastNameError.textContent = getNameErrorMessage(value, lastNameError);
      show(lastNameError);
    }

    updateSubmitButton();
  }

  lastName.addEventListener("input", validateLastName);
  lastName.addEventListener("blur", validateLastName);


  /* ---------- Email ---------- */

  function validateEmail() {

    const value = email.value.trim();

    if (value === "") {
      hide(emailError);
      email.classList.remove("error");
      updateSubmitButton();
      return;
    }

    if (emailRegex.test(value)) {
      hide(emailError);
      email.classList.remove("error");
    } else {
      show(emailError);
      email.classList.add("error");
    }

    updateSubmitButton();
  }

  email.addEventListener("input", validateEmail);
  email.addEventListener("blur", validateEmail);

  /* ---------- Password ---------- */

  function showCustomPasswordError(msg) {
    customErrorMessage.textContent = msg;
    show(passwordWeakCustom);
    hide(passwordWeak);
  }

  function hideAllPasswordErrors() {
    hide(passwordWeak);
    hide(passwordWeakCustom);
  }

  function validatePassword() {

    const val = password.value;

    if (val.length === 0) {
      show(passwordWeak);
      hide(passwordWeakCustom);
      updateSubmitButton();
      return;
    }

    if (!/[a-z]/.test(val)) {
      showCustomPasswordError("Please include at least one lowercase letter.");
      updateSubmitButton();
      return;
    }

    if (!/[A-Z]/.test(val)) {
      showCustomPasswordError("Please include at least one uppercase letter.");
      updateSubmitButton();
      return;
    }

    if (!/[0-9]/.test(val)) {
      showCustomPasswordError("Please include at least one number.");
      updateSubmitButton();
      return;
    }

    if (!/[!@#$%^&*()_\-+=\[\]{};':\"\\|,.<>/?]/.test(val)) {
      showCustomPasswordError("Please include at least one special character.");
      updateSubmitButton();
      return;
    }

    if (val.length < 8) {
      showCustomPasswordError("Password must be at least 8 characters long.");
      updateSubmitButton();
      return;
    }

    hideAllPasswordErrors();
    updateSubmitButton();
  }

  password.addEventListener("input", validatePassword);
  password.addEventListener("blur", validatePassword);

  /* ---------- Terms Checkbox ---------- */

  terms.addEventListener("change", updateSubmitButton);

});