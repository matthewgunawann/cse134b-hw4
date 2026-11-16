const form = document.querySelector("#contact-form");

if (form) {
    const fields = [
        form.querySelector("#name"),
        form.querySelector("#email"),
        form.querySelector("#comments")
    ];

    const comments = form.querySelector("#comments");
    const feedback = document.querySelector("#form-feedback");
    const errorMessages = document.querySelector("#error-messages");
    const infoMessages = document.querySelector("#info-messages");
    const errorsInput = document.querySelector("#form-errors");

    const form_errors = [];
    const editedFields = new Set();
    const fieldErrors = new Map();
    const invalidAttempt = new Map();

    let attemptedSubmit = false;
    let attemptScheduled = false;

    const labels = {
        name: "Name",
        email: "Email",
        comments: "Comments"
    };

    feedback.hidden = false;

    function getError(field) {
        field.setCustomValidity("");

        const validity = field.validity;
        const label = labels[field.name];

        if (validity.valueMissing) {
            return `${label} is required.`;
        }

        if (validity.typeMismatch) {
            return "Please enter a valid email address.";
        }

        if (validity.tooShort) {
            return `${label} must contain at least ${field.minLength} characters.`;
        }

        if (validity.tooLong) {
            return `${label} must contain no more than ${field.maxLength} characters.`;
        }

        if (validity.patternMismatch) {
            return `${label} does not match the required format.`;
        }

        return "";
    }

    function validateField(field, showError) {
        const message = getError(field);
        const errorElement = document.getElementById(
            `${field.id}-error`
        );

        if (message) {
            field.setCustomValidity(message);
        }

        if (message && showError) {
            fieldErrors.set(field.name, message);
            field.setAttribute("aria-invalid", "true");
            errorElement.textContent = message;
            errorElement.hidden = false;
        } else {
            fieldErrors.delete(field.name);
            field.removeAttribute("aria-invalid");
            errorElement.textContent = "";
            errorElement.hidden = true;
        }

        return message;
    }

    function renderErrors() {
        errorMessages.replaceChildren();

        if (fieldErrors.size === 0) {
            return;
        }

        const heading = document.createElement("p");
        heading.textContent = "Please correct the following errors:";

        const list = document.createElement("ul");

        for (const field of fields) {
            const message = fieldErrors.get(field.name);

            if (!message) {
                continue;
            }

            const item = document.createElement("li");
            item.textContent = `${labels[field.name]}: ${message}`;
            list.appendChild(item);
        }

        errorMessages.append(heading, list);
    }

    function updateCharacterCount() {
        const remaining = comments.maxLength - comments.value.length;
        const warningThreshold = 100;

        infoMessages.classList.remove(
            "character-warning",
            "character-limit"
        );

        if (remaining === 0) {
            infoMessages.textContent =
                "Character limit reached. 0 characters remaining.";
            infoMessages.classList.add("character-limit");
        } else if (remaining <= warningThreshold) {
            infoMessages.textContent =
                `Warning: Only ${remaining} characters remaining.`;
            infoMessages.classList.add("character-warning");
        } else {
            infoMessages.textContent =
                `${remaining} characters remaining.`;
        }
    }

    for (const field of fields) {
        field.addEventListener("input", () => {
            editedFields.add(field);

            const shouldShow =
                attemptedSubmit || fieldErrors.has(field.name);

            validateField(field, shouldShow);
            renderErrors();

            if (field === comments) {
                updateCharacterCount();
            }
        });

        field.addEventListener("blur", () => {
            if (editedFields.has(field) || attemptedSubmit) {
                validateField(field, true);
                renderErrors();
            }
        });
    }

    form.addEventListener("invalid", (event) => {
        const field = event.target;

        if (!fields.includes(field)) {
            return;
        }

        attemptedSubmit = true;

        const message = validateField(field, true);

        if (message) {
            invalidAttempt.set(field.name, message);
        }

        if (!attemptScheduled) {
            attemptScheduled = true;

            queueMicrotask(() => {
                for (const field of fields) {
                    const message = invalidAttempt.get(field.name);

                    if (message) {
                        form_errors.push({
                            field: field.name,
                            error: message
                        });
                    }
                }

                invalidAttempt.clear();
                attemptScheduled = false;

                for (const field of fields) {
                    validateField(field, true);
                }

                renderErrors();
            });
        }
    }, true);

    form.addEventListener("submit", () => {
        attemptedSubmit = true;
        errorsInput.value = JSON.stringify(form_errors);
    });

    updateCharacterCount();
}