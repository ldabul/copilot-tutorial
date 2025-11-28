document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to safely set text
  function setText(node, text) { node.textContent = text || ""; }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message / list
      activitiesList.innerHTML = "";

      // Reset dropdown (keep placeholder)
      while (activitySelect.options.length > 1) activitySelect.remove(1);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        // Header
        const title = document.createElement("h4");
        setText(title, name);
        activityCard.appendChild(title);

        // Description
        const desc = document.createElement("p");
        setText(desc, details.description);
        activityCard.appendChild(desc);

        // Schedule
        const sched = document.createElement("p");
        sched.innerHTML = `<strong>Schedule:</strong> ${details.schedule || ""}`;
        activityCard.appendChild(sched);

        // Availability
        const spotsLeft = Math.max(0, (details.max_participants || 0) - (details.participants?.length || 0));
        const avail = document.createElement("p");
        avail.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(avail);

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeader = document.createElement("h5");
        participantsHeader.innerHTML = `Participants <span class="badge">${(details.participants || []).length}</span>`;
        participantsSection.appendChild(participantsHeader);

        if (details.participants && details.participants.length) {
          const ul = document.createElement("ul");
          ul.className = "participant-list";
          details.participants.forEach(p => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // name/email text
            const span = document.createElement("span");
            setText(span, p);

            // delete / unregister button
            const btn = document.createElement("button");
            btn.className = "delete-btn";
            btn.title = `Unregister ${p}`;
            btn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
            btn.innerHTML = `<span class="delete-icon">✖</span>`;

            // call API to unregister when clicked
            btn.addEventListener("click", async () => {
              const ok = window.confirm(`Remove ${p} from ${name}?`);
              if (!ok) return;

              try {
                const resp = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, { method: "DELETE", cache: "no-store" });
                const resBody = await resp.json();

                if (resp.ok) {
                  messageDiv.textContent = resBody.message || 'Removed participant';
                  messageDiv.className = 'message success';
                } else {
                  messageDiv.textContent = resBody.detail || 'Failed to remove participant';
                  messageDiv.className = 'message error';
                }
                messageDiv.classList.remove('hidden');

                // Refresh activities list
                await fetchActivities();

                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              } catch (err) {
                console.error('Error unregistering participant:', err);
                messageDiv.textContent = 'Failed to remove participant — please try again.';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });
          participantsSection.appendChild(ul);
        } else {
          const none = document.createElement("p");
          none.className = "no-participants";
          setText(none, "No participants yet.");
          participantsSection.appendChild(none);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        await fetchActivities(); // refresh participants immediately
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
