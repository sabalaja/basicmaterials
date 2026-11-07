const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = contactForm.querySelector('button[type="submit"]');

  submitButton.disabled = true;
  submitButton.textContent = "SENDING...";
  formStatus.textContent = "";
  delete formStatus.dataset.state;

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      body: new FormData(contactForm),
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Form submission failed");
    }

    formStatus.textContent = "Message sent successfully. Thank you!";
    formStatus.dataset.state = "success";

    contactForm.reset();
  } catch (error) {
    console.error("Contact form error:", error);

    formStatus.textContent =
      "Something went wrong. Please try again or email us directly.";
    formStatus.dataset.state = "error";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "SEND MESSAGE ↗";
  }
});
