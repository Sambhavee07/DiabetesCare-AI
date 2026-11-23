/**
 * DiabetesCare AI - Main JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {
    // Mobile navigation toggle
    const navToggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("navMenu");

    if (navToggle && navMenu) {
        navToggle.addEventListener("click", function () {
            navMenu.classList.toggle("show");
        });

        // Close nav when clicking outside
        document.addEventListener("click", function (e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove("show");
            }
        });
    }

    // Smooth scroll for in-page anchors (e.g. About sidebar)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (targetId.length > 1) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                    // Update active sidebar link
                    document.querySelectorAll('.about-nav-link').forEach(link => link.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });
});
